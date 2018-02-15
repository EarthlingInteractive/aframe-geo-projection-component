/* global assert, setup, suite, test */
var d3 = require('d3-geo');
var projectionLib = require('../../src/projection');

suite('projection-related functions', function () {
  suite('#getD3Projection', function () {
    test('uses the projection attribute to look up a d3 projection', function () {
      assert.equal(projectionLib.getD3Projection('geoAlbers').toString(), d3.geoAlbers().toString());
    });
    test('can also be a d3 transform', function () {
      assert.equal(projectionLib.getD3Projection('geoIdentity').toString(), d3.geoIdentity().toString());
    });
    test('throws an error if an invalid projection is specified', function () {
      assert.throws(
        function () { projectionLib.getD3Projection('badStuff') },
        'Invalid d3 projection; use a projection from d3-geo or d3-geo-projection');
    });
  });

  suite('#getWorldTransform', function () {
    test('returns a transform that maps from d3 space to A-Frame space', function () {
      var height = 10;
      var width = 20;
      var geoJson = {type: 'LineString', coordinates: [[0, 0], [width, height]]};
      var worldTransform = projectionLib.getWorldTransform(height, width);
      var path = d3.geoPath().projection(worldTransform);
      var result = path(geoJson);
      assert.equal(result, 'M-10,5L10,-5', 'Line coords should start at top left corner and end at bottom right corner');
    });
    test('returns a transform that changes scales when the width and height change', function () {
      var height = 14;
      var width = 6;
      var geoJson = {type: 'LineString', coordinates: [[0, 0], [width, height]]};
      var worldTransform = projectionLib.getWorldTransform(height, width);
      var path = d3.geoPath().projection(worldTransform);
      var result = path(geoJson);
      assert.equal(result, 'M-3,7L3,-7', 'Line coords should start at top left corner and end at bottom right corner');
    });
  });

  suite('#getFittedProjection', function () {
    test('returns a projection fits and centers the given geoJson in A-Frame space', function () {
      var geoJson = {type: 'LineString', coordinates: [[0, 0], [100, 100]]};
      var projectionName = 'geoIdentity';
      var width = 2;
      var height= 2;
      var projection = projectionLib.getFittedProjection(projectionName, geoJson, height, width);
      var path = d3.geoPath().projection(projection);
      var result = path(geoJson);
      assert.equal(result, 'M-1,1L1,-1', 'Line coords should start at top left corner and end at bottom right corner');
    });
    test('returns a projection that handles when height and width are different', function () {
      var geoJson = {type: 'LineString', coordinates: [[0, 0], [100, 100]]};
      var projectionName = 'geoIdentity';
      var width = 10;
      var height= 20;
      var projection = projectionLib.getFittedProjection(projectionName, geoJson, height, width);
      var path = d3.geoPath().projection(projection);
      var result = path(geoJson);
      assert.equal(result, 'M-5,5L5,-5', 'Line should be centered and scaled but aspect ratio should remain constant');
    });
  });
});
