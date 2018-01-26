/* global assert, setup, suite, test */
var renderer = require('../../src/renderer');

var lineGeoJson = {type: 'LineString', coordinates: [[0, 0], [100, 100]]};
var squareGeoJson = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [0, 0],
      [0, 100],
      [100, 100],
      [100, 0],
      [0, 0]
    ]]
  }
};

suite('renderer', function () {
  suite('#renderGeoJson', function () {
    test('returns an Object3D', function () {
      var result = renderer.renderGeoJson(lineGeoJson);
      assert.instanceOf(result, THREE.Object3D, 'result is an instance of Object3D');
    });
    test('renders the output as LineSegments', function () {
      var result = renderer.renderGeoJson(lineGeoJson);
      assert.instanceOf(result, THREE.LineSegments, 'result is an instance of LineSegments');
    });
    test('the output should have a BufferGeometry', function () {
      var result = renderer.renderGeoJson(lineGeoJson);
      assert.instanceOf(result.geometry, THREE.BufferGeometry, 'result has a BufferGeometry set');
    });
    test('the output should have a Material', function () {
      var result = renderer.renderGeoJson(lineGeoJson);
      assert.instanceOf(result.material, THREE.Material, 'result has a Material set');
    });
    suite('the BufferGeometry in the output should have vertices based on the input geoJson', function () {
      suite('a diagonal line', function () {
        test('has two vertices', function () {
          var geometry = renderer.renderGeoJson(lineGeoJson).geometry;
          var position = geometry.getAttribute('position');
          assert.equal(position.count, 2, 'a line should have 2 vertices');
        });
      });
      suite('a square', function () {
        test('has four vertices', function () {
          var geometry = renderer.renderGeoJson(squareGeoJson).geometry;
          var position = geometry.getAttribute('position');
          assert.equal(position.count, 4, 'a square should have 4 vertices');
        });
      });
    });
  });
  suite('ThreeJSRenderContext', function () {
    test('implements the d3-geo required subset of the CanvasRenderingContext2D API', function () {
      var context = new renderer.ThreeJSRenderContext();
      assert.property(context, 'beginPath');
      assert.property(context, 'moveTo');
      assert.property(context, 'lineTo');
      assert.property(context, 'arc');
      assert.property(context, 'closePath');
    });
    suite('delegates to the given THREE.ShapePath functions', function () {
      test('beginPath is a no-op', function () {
        var mockShapePath = { beginPath: sinon.spy() };
        var context = new renderer.ThreeJSRenderContext(mockShapePath);
        context.beginPath();
        sinon.assert.notCalled(mockShapePath.beginPath);
      });

      test('moveTo', function () {
        var mockShapePath = { moveTo: sinon.spy() };
        var context = new renderer.ThreeJSRenderContext(mockShapePath);
        context.moveTo(1, 2);
        sinon.assert.calledWith(mockShapePath.moveTo, 1, 2);
      });

      test('lineTo', function () {
        var mockShapePath = { lineTo: sinon.spy() };
        var context = new renderer.ThreeJSRenderContext(mockShapePath);
        context.lineTo(1, 2);
        sinon.assert.calledWith(mockShapePath.lineTo, 1, 2);
      });

      test('arc', function () {
        var mockShapePath = { currentPath: { arc: sinon.spy() } };
        var context = new renderer.ThreeJSRenderContext(mockShapePath);
        context.arc(1, 2, 3, 4, 5);
        sinon.assert.calledWith(mockShapePath.currentPath.arc, 1, 2, 3, 4, 5);
      });

      test('closePath', function () {
        var mockShapePath = { currentPath: { closePath: sinon.spy() } };
        var context = new renderer.ThreeJSRenderContext(mockShapePath);
        context.closePath();
        sinon.assert.calledOnce(mockShapePath.currentPath.closePath);
      });
    });
    suite('provides functions to extract path data', function () {
      test('#toShapes', function () {
        var mockShapePath = { toShapes: sinon.spy() };
        var context = new renderer.ThreeJSRenderContext(mockShapePath);
        context.toShapes(true);
        sinon.assert.calledWith(mockShapePath.toShapes, true);
      });
      test('#toVertices', function () {
        var mockShapePath = { subPaths: [
            { curves: [
                {
                  isLineCurve: true,
                  v1: { x: 1, y: 2 },
                  v2: { x: 3, y: 4 }
                },
                {
                  isLineCurve: false,
                  getPoints: function() {
                    return [ { x: 5, y: 6 }]
                  }
                }
              ] }
          ] };
        var context = new renderer.ThreeJSRenderContext(mockShapePath);
        var vertices = context.toVertices();
        assert.deepEqual(vertices, [1, 2, 0, 3, 4, 0, 5, 6, 0]);
      });
    });
  });
});
