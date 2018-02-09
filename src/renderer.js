var d3 = require('d3-geo');
var projectionLib = require('./projection');
var ThreeJSRenderContext = require('./renderContext').ThreeJSRenderContext;

var THREE = AFRAME.THREE;

module.exports = {
  /**
   * Takes the input geoJson and renders it as an Object3D.
   *
   * @param geoJson the geoJson object to render
   * @param renderOptions object containing parameters for rendering
   * @param renderOptions.projectionName the name of a projection from d3-geo or d3-geo-projection
   * @param renderOptions.meshType the type of Object3D to render -- 'line' or 'shape'
   * @param renderOptions.height the height in A-Frame units
   * @param renderOptions.width the width in A-Frame units
   * @return THREE.Object3D
   */
  renderGeoJson: function (geoJson, renderOptions) {
    var projectionName = renderOptions.projectionName;
    var height = renderOptions.height;
    var width = renderOptions.width;
    var meshType = renderOptions.meshType;

    var projection = projectionLib.getFittedProjection(projectionName, geoJson, height, width);
    var shapePath = new THREE.ShapePath();
    var mapRenderContext = new ThreeJSRenderContext(shapePath);
    var mapPath = d3.geoPath(projection, mapRenderContext);
    mapPath(geoJson);

    switch (meshType) {
      case 'line':
        var lineGeometry = new THREE.BufferGeometry();
        var vertices = mapRenderContext.toVertices();
        lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return new THREE.LineSegments(lineGeometry);
      case 'shape':
        // TODO: pass isCCW as an option
        const shapes = mapRenderContext.toShapes();
        var shapeGeometry = new THREE.ShapeBufferGeometry(shapes);
        return new THREE.Mesh(shapeGeometry);
      default:
        throw new Error('Unsupported meshType: ' + meshType);
    }
  }
};
