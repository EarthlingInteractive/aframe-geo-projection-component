/* global assert, setup, suite, test */
require('aframe');
require('../../src/system');
var getD3Projection = require('../../src/projection').getD3Projection;
var ThreeJSRenderContext = require('../../src/renderContext').ThreeJSRenderContext;
var entityFactory = require('../helpers').entityFactory;

var lineGeoJson = {type: 'LineString', coordinates: [[0, 0], [100, 100]]};
var projection = getD3Projection('geoIdentity');

suite('geo-projection system', function () {
  var system;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'position') {
        return;
      }
      system = el.sceneEl.systems['geo-projection'];
      done();
    });
  });

  suite('#renderToContext', function () {
    test('returns a ThreeJSRenderContext', function () {
      var renderContext = system.renderToContext(lineGeoJson, projection);
      assert.instanceOf(renderContext, ThreeJSRenderContext);
    });
    test('populates the render context with data from the geoJson', function () {
      var renderContext = system.renderToContext(lineGeoJson, projection);
      var vertices = renderContext.toVertices();
      assert.sameOrderedMembers(vertices, [0, 0, 0, 100, 100, 0]);
    });
  });
});
