/* global assert, setup, suite, test */
var renderer = require('../../src/renderers');
var projectionLib = require('../../src/projection');
var ThreeJSRenderContext = require('../../src/renderContext').ThreeJSRenderContext;
var sinon = require('sinon');
var sandbox = sinon.createSandbox();

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

var defaultProjection = function(geoJson) {
  return projectionLib.getFittedProjection('geoIdentity', geoJson, 10, 10);
};

var defaultRenderOptions = {
  projection: defaultProjection(lineGeoJson),
  meshType: 'line'
};

suite('renderer', function () {
  teardown(function () {
    sandbox.restore();
  });

  suite('#renderGeoJson', function () {
    test('returns an Object3D', function () {
      var result = renderer.renderGeoJson(lineGeoJson, defaultRenderOptions);
      assert.instanceOf(result, THREE.Object3D, 'result is an instance of Object3D');
    });
    suite('meshType', function () {
      suite('when the meshType is line', function () {
        test('renders the output as LineSegments', function () {
          var result = renderer.renderGeoJson(lineGeoJson, defaultRenderOptions);
          assert.instanceOf(result, THREE.LineSegments, 'result is an instance of LineSegments');
        });
        test('the output should use the given Material', function () {
          var otherRenderOptions = {
            projection: defaultProjection(lineGeoJson),
            meshType: 'line',
            material: new THREE.LineDashedMaterial()
          };
          var result = renderer.renderGeoJson(lineGeoJson, otherRenderOptions);
          assert.instanceOf(result.material, THREE.LineDashedMaterial, 'result has the correct Material set');
        });
      });
      suite('when the meshType is shape', function () {
        test('renders the output as a Mesh', function () {
          var otherRenderOptions = {
            projection: defaultProjection(squareGeoJson),
            meshType: 'shape'
          };
          var result = renderer.renderGeoJson(squareGeoJson, otherRenderOptions);
          assert.instanceOf(result, THREE.Mesh, 'result is an instance of Mesh');
        });
        test('the output should use the given Material', function () {
          var otherRenderOptions = {
            projection: defaultProjection(squareGeoJson),
            meshType: 'shape',
            material: new THREE.MeshLambertMaterial()
          };
          var result = renderer.renderGeoJson(squareGeoJson, otherRenderOptions);
          assert.instanceOf(result.material, THREE.MeshLambertMaterial, 'result has the correct Material set');
        });
        test('passes the isCCW value to the renderContext', function () {
          var otherRenderOptions = {
            projection: defaultProjection(squareGeoJson),
            meshType: 'shape',
            material: new THREE.MeshLambertMaterial(),
            isCCW: true
          };
          var toShapesStub = sandbox.stub(ThreeJSRenderContext.prototype, 'toShapes').callThrough();
          renderer.renderGeoJson(squareGeoJson, otherRenderOptions);
          sinon.assert.calledWith(toShapesStub, true);
        });
      });
      suite('when the meshType is extrude', function () {
        test('renders the output as a Mesh with an ExtrudeBufferGeometry', function () {
          var otherRenderOptions = {
            projection: defaultProjection(squareGeoJson),
            meshType: 'extrude'
          };
          var result = renderer.renderGeoJson(squareGeoJson, otherRenderOptions);
          assert.instanceOf(result, THREE.Mesh, 'result is an instance of Mesh');
          assert.instanceOf(result.geometry, THREE.ExtrudeBufferGeometry, 'result geometry is an instance of ExtrudeBufferGeometry');
        });
        test('the output should use the given Material', function () {
          var otherRenderOptions = {
            projection: defaultProjection(squareGeoJson),
            meshType: 'extrude',
            material: new THREE.MeshLambertMaterial()
          };
          var result = renderer.renderGeoJson(squareGeoJson, otherRenderOptions);
          assert.instanceOf(result.material, THREE.MeshLambertMaterial, 'result has the correct Material set');
        });
        test('passes the isCCW value to the renderContext', function () {
          var otherRenderOptions = {
            projection: defaultProjection(squareGeoJson),
            meshType: 'extrude',
            material: new THREE.MeshLambertMaterial(),
            isCCW: true
          };
          var toShapesStub = sandbox.stub(ThreeJSRenderContext.prototype, 'toShapes').callThrough();
          renderer.renderGeoJson(squareGeoJson, otherRenderOptions);
          sinon.assert.calledWith(toShapesStub, true);
        });
      });
      suite('when the meshType is invalid', function () {
        test('throws an error', function () {
          var badRenderOptions = {
            projection: defaultProjection(squareGeoJson),
            meshType: 'blah'
          };
          assert.throws(
            function () { renderer.renderGeoJson(squareGeoJson, badRenderOptions); },
            'Unsupported meshType: blah');
        });
      });
    });
    test('the output should have a BufferGeometry', function () {
      var result = renderer.renderGeoJson(lineGeoJson, defaultRenderOptions);
      assert.instanceOf(result.geometry, THREE.BufferGeometry, 'result has a BufferGeometry set');
    });
    test('the output should have a Material', function () {
      var result = renderer.renderGeoJson(lineGeoJson, defaultRenderOptions);
      assert.instanceOf(result.material, THREE.Material, 'result has a Material set');
    });
    suite('the BufferGeometry in the output should have vertices based on the input geoJson', function () {
      // TODO add tests for the other 7 types of geoJson objects
      suite('a diagonal line', function () {
        test('has two vertices', function () {
          var geometry = renderer.renderGeoJson(lineGeoJson, defaultRenderOptions).geometry;
          var position = geometry.getAttribute('position');
          assert.equal(position.count, 2, 'a line should have 2 vertices');
        });
        suite('has vertices that scale and center based on the given height and width', function () {
          test('for width = 10, height = 10', function () {
            var geometry = renderer.renderGeoJson(lineGeoJson, defaultRenderOptions).geometry;
            var position = geometry.getAttribute('position');
            assert.equal(position.array.toString(), '-5,5,0,5,-5,0');
          });
          test('for height = 20, width = 30', function () {
            var otherRenderOptions = {
              projection: projectionLib.getFittedProjection('geoIdentity', lineGeoJson, 20, 30),
              meshType: 'line'
            };
            var geometry = renderer.renderGeoJson(lineGeoJson, otherRenderOptions).geometry;
            var position = geometry.getAttribute('position');
            assert.equal(position.array.toString(), '-10,10,0,10,-10,0');
          });
        });
      });
      suite('a square', function () {
        test('has four pairs of vertices', function () {
          var geometry = renderer.renderGeoJson(squareGeoJson, defaultRenderOptions).geometry;
          var position = geometry.getAttribute('position');
          assert.equal(position.count, 8, 'a square should have 8 pairs of vertices');
        });
        suite('has vertices that scale and center based on the given height and width', function () {
          test('for width = 10, height = 10', function () {
            var geometry = renderer.renderGeoJson(squareGeoJson, defaultRenderOptions).geometry;
            var position = geometry.getAttribute('position');
            assert.equal(position.array.toString(), '-5,5,0,-5,-5,0,-5,-5,0,5,-5,0,5,-5,0,5,5,0,5,5,0,-5,5,0');
          });
          test('for height = 20, width = 30', function () {
            var otherRenderOptions = {
              projection: projectionLib.getFittedProjection('geoIdentity', squareGeoJson, 20, 30),
              meshType: 'line'
            };
            var geometry = renderer.renderGeoJson(squareGeoJson, otherRenderOptions).geometry;
            var position = geometry.getAttribute('position');
            assert.equal(position.array.toString(), '-10,10,0,-10,-10,0,-10,-10,0,10,-10,0,10,-10,0,10,10,0,10,10,0,-10,10,0');
          });
        });
      });
      test('projects the geoJson using the given D3 projection', function () {
        var miamiToNYCGeoJson = {
          type: 'LineString',
          coordinates: [
            [-80.191788, 25.761681], [-74.006058, 40.712772]
          ]
        };
        var otherRenderOptions = {
          projection: projectionLib.getFittedProjection('geoStereographic', miamiToNYCGeoJson, 10, 10),
          meshType: 'line',
          height: 10,
          width: 10
        };
        var geometry = renderer.renderGeoJson(miamiToNYCGeoJson, otherRenderOptions).geometry;
        var position = geometry.getAttribute('position');
        assert.equal(position.array.toString(), '-5,-4.883378505706787,0,5,4.883378505706787,0');
      });
    });
  });
});
