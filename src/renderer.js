var d3 = require('d3-geo');
var ThreeJSRenderContext = require('./renderContext').ThreeJSRenderContext;

var THREE = AFRAME.THREE;

module.exports = {
  /**
   * Takes the input geoJson and renders it as an Object3D.
   *
   * @param geoJson the geoJson object to render
   * @param renderOptions object containing parameters for rendering
   * @param renderOptions.projection the projection to use for rendering
   * @param renderOptions.meshType the type of Object3D to render -- 'line' or 'shape'
   * @param renderOptions.material the THREE.Material to use in the resulting Object3D
   * @param renderOptions.isCCW true if shapes are defined counter-clockwise and holes defined clockwise; false for the reverse
   * @return THREE.Object3D
   */
  renderGeoJson: function (geoJson, renderOptions) {
    var projection = renderOptions.projection;
    var meshType = renderOptions.meshType;
    var material = renderOptions.material;
    var isCCW = renderOptions.isCCW;

    var geometry = this.createGeometry(geoJson, projection, meshType, isCCW);
    return this.createMesh(meshType, geometry, material);
  },

  createGeometry: function (geoJson, projection, meshType, isCCW) {
    var shapePath = new THREE.ShapePath();
    var mapRenderContext = new ThreeJSRenderContext(shapePath);
    var mapPath = d3.geoPath(projection, mapRenderContext);
    mapPath(geoJson);

    switch (meshType) {
      case 'line':
        var lineGeometry = new THREE.BufferGeometry();
        var vertices = mapRenderContext.toVertices();
        lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return lineGeometry;
      case 'shape':
        const shapes = mapRenderContext.toShapes(isCCW);
        return new THREE.ShapeBufferGeometry(shapes);
      case 'extrude':
        const extrudeSettings = {
          amount: 1,
          bevelEnabled: false
        };
        const extShapes = mapRenderContext.toShapes(isCCW);
        return new THREE.ExtrudeBufferGeometry(extShapes, extrudeSettings);
      default:
        throw new Error('Unsupported meshType: ' + meshType);
    }
  },

  createMesh: function (meshType, geometry, material) {
    switch (meshType) {
      case 'line':
        return new THREE.LineSegments(geometry, material);
      case 'shape':
        return new THREE.Mesh(geometry, material);
      case 'extrude':
        return new THREE.Mesh(geometry, material);
      default:
        throw new Error('Unsupported meshType: ' + meshType);
    }
  }
};
