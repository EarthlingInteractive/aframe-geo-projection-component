/* global assert, setup, suite, test */
var renderers = require('../../src/renderers');
var projectionLib = require('../../src/projection');

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

var defaultProjection = function (geoJson) {
  return projectionLib.getFittedProjection('geoIdentity', geoJson, 10, 10);
};

suite('renderers', function () {
  suite('line renderer', function () {
    suite('#render', function () {
      var result;
      setup(function () {
        var material = new THREE.LineDashedMaterial();
        var projection = defaultProjection(lineGeoJson);
        result = renderers.line.render(lineGeoJson, projection, false, material);
      });

      test('returns an Object3D', function () {
        assert.instanceOf(result, THREE.Object3D, 'result is an instance of Object3D');
      });
      test('renders the output as LineSegments', function () {
        assert.instanceOf(result, THREE.LineSegments, 'result is an instance of LineSegments');
      });
      test('renders the output with the given material', function () {
        assert.instanceOf(result.material, THREE.LineDashedMaterial, 'result has the correct Material set');
      });
    });
  });
  suite('shape renderer', function () {
    suite('#render', function () {
      var result;
      setup(function () {
        var material = new THREE.MeshLambertMaterial();
        var projection = defaultProjection(squareGeoJson);
        result = renderers.shape.render(squareGeoJson, projection, false, material);
      });

      test('returns an Object3D', function () {
        assert.instanceOf(result, THREE.Object3D, 'result is an instance of Object3D');
      });
      test('renders the output as a Mesh', function () {
        assert.instanceOf(result, THREE.Mesh, 'result is an instance of Mesh');
      });
      test('renders the output with the given material', function () {
        assert.instanceOf(result.material, THREE.MeshLambertMaterial, 'result has the correct Material set');
      });
    });
  });
  suite('extrude renderer', function () {
    suite('#render', function () {
      var result;
      setup(function () {
        var material = new THREE.MeshLambertMaterial();
        var projection = defaultProjection(squareGeoJson);
        result = renderers.extrude.render(squareGeoJson, projection, false, material);
      });

      test('returns an Object3D', function () {
        assert.instanceOf(result, THREE.Object3D, 'result is an instance of Object3D');
      });
      test('renders the output as a Mesh', function () {
        assert.instanceOf(result, THREE.Mesh, 'result is an instance of Mesh');
      });
      test('renders the output using ExtrudeBufferGeometry', function () {
        assert.instanceOf(result.geometry, THREE.ExtrudeBufferGeometry, 'result geometry is an instance of ExtrudeBufferGeometry');
      });
      test('renders the output with the given material', function () {
        assert.instanceOf(result.material, THREE.MeshLambertMaterial, 'result has the correct Material set');
      });
    });
  });
});
