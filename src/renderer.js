var d3 = require('d3-geo');
var projectionLib = require('./projection');
var ThreeJSRenderContext = require('./renderContext').ThreeJSRenderContext;

var THREE = AFRAME.THREE;

module.exports = {
  /**
   * Takes the input geoJson and renders it as an Object3D.
   *
   * @param geoJson the geoJson object to render
   * @param projectionName the name of a projection from d3-geo or d3-geo-projection
   * @param height the height in A-Frame units
   * @param width the width in A-Frame units
   * @return THREE.Object3D
   */
  renderGeoJson: function (geoJson, projectionName, height, width) {
    var projection = projectionLib.getFittedProjection(projectionName, geoJson, height, width);
    var shapePath = new THREE.ShapePath();
    var mapRenderContext = new ThreeJSRenderContext(shapePath);
    var mapPath = d3.geoPath(projection, mapRenderContext);
    mapPath(geoJson);

    var geometry = new THREE.BufferGeometry();
    var vertices = mapRenderContext.toVertices();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return new THREE.LineSegments(geometry);
  }
};
