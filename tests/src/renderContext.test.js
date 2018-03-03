/* global assert, suite, test */
var sinon = require('sinon');
var ThreeJSRenderContext = require('../../src/renderContext').ThreeJSRenderContext;

suite('ThreeJSRenderContext', function () {
  test('implements the d3-geo required subset of the CanvasRenderingContext2D API', function () {
    var context = new ThreeJSRenderContext();
    assert.property(context, 'beginPath');
    assert.property(context, 'moveTo');
    assert.property(context, 'lineTo');
    assert.property(context, 'arc');
    assert.property(context, 'closePath');
  });
  suite('delegates to the given THREE.ShapePath functions', function () {
    test('beginPath is a no-op', function () {
      var mockShapePath = { beginPath: sinon.spy() };
      var context = new ThreeJSRenderContext(mockShapePath);
      context.beginPath();
      sinon.assert.notCalled(mockShapePath.beginPath);
    });

    test('moveTo', function () {
      var mockShapePath = { moveTo: sinon.spy() };
      var context = new ThreeJSRenderContext(mockShapePath);
      context.moveTo(1, 2);
      sinon.assert.calledWith(mockShapePath.moveTo, 1, 2);
    });

    test('lineTo', function () {
      var mockShapePath = { lineTo: sinon.spy() };
      var context = new ThreeJSRenderContext(mockShapePath);
      context.lineTo(1, 2);
      sinon.assert.calledWith(mockShapePath.lineTo, 1, 2);
    });

    test('arc', function () {
      var mockShapePath = { currentPath: { arc: sinon.spy() } };
      var context = new ThreeJSRenderContext(mockShapePath);
      context.arc(1, 2, 3, 4, 5);
      sinon.assert.calledWith(mockShapePath.currentPath.arc, 1, 2, 3, 4, 5);
    });

    test('closePath', function () {
      var mockShapePath = { currentPath: { closePath: sinon.spy() } };
      var context = new ThreeJSRenderContext(mockShapePath);
      context.closePath();
      sinon.assert.calledOnce(mockShapePath.currentPath.closePath);
    });
  });
  suite('provides functions to extract path data', function () {
    test('#toShapes', function () {
      var mockResult = [1, 2];
      var mockShapePath = { toShapes: sinon.stub().returns(mockResult) };
      var context = new ThreeJSRenderContext(mockShapePath);
      var result = context.toShapes(true, true);
      sinon.assert.calledWith(mockShapePath.toShapes, true, true);
      assert.deepEqual(result, mockResult);
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
              getPoints: function () {
                return [ { x: 5, y: 6 } ];
              }
            }
          ] }
      ] };
      var context = new ThreeJSRenderContext(mockShapePath);
      var vertices = context.toVertices();
      assert.deepEqual(vertices, [1, 2, 0, 3, 4, 0, 5, 6, 0]);
    });
  });
});
