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

  });
});
