var geoPath = require('d3-geo').geoPath;
var ThreeJSRenderContext = require('./renderContext').ThreeJSRenderContext;

var THREE = AFRAME.THREE;

module.exports = AFRAME.registerSystem('geo-projection', {
  /**
   * Takes the input geoJson and uses the projection and D3 to draw it
   * into a ThreeJSRenderContext.
   *
   * @param geoJson the geoJson object to render
   * @param projection the projection to use for rendering
   * @return ThreeJSRenderContext
   */
  renderToContext: function renderToContext (geoJson, projection) {
    var shapePath = new THREE.ShapePath();
    var mapRenderContext = new ThreeJSRenderContext(shapePath);
    var mapPath = geoPath(projection, mapRenderContext);
    mapPath(geoJson);
    return mapRenderContext;
  }
});
