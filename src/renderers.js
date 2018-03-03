var d3 = require('d3-geo');
var ThreeJSRenderContext = require('./renderContext').ThreeJSRenderContext;

var THREE = AFRAME.THREE;

function renderToContext (geoJson, projection) {
  var shapePath = new THREE.ShapePath();
  var mapRenderContext = new ThreeJSRenderContext(shapePath);
  var mapPath = d3.geoPath(projection, mapRenderContext);
  mapPath(geoJson);
  return mapRenderContext;
}

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

    var renderer = this.getRenderer(meshType);
    var geometry = renderer.createGeometry(geoJson, projection, isCCW);
    return renderer.createMesh(geometry, material);
  },

  getRenderer: function getRenderer (meshType) {
    switch (meshType) {
      case 'line':
        return this.lineRenderer;
      case 'shape':
        return this.shapeRenderer;
      case 'extrude':
        return this.extrudeRenderer;
      default:
        throw new Error('Unsupported meshType: ' + meshType);
    }
  },

  lineRenderer: {
    renderToContext: renderToContext,
    createGeometry: function createGeometry (geoJson, projection) {
      var mapRenderContext = this.renderToContext(geoJson, projection);
      var lineGeometry = new THREE.BufferGeometry();
      var vertices = mapRenderContext.toVertices();
      lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      return lineGeometry;
    },
    createMesh: function createMesh (geometry, material) {
      return new THREE.LineSegments(geometry, material);
    }
  },

  shapeRenderer: {
    renderToContext: renderToContext,
    createGeometry: function createGeometry (geoJson, projection, isCCW) {
      var mapRenderContext = this.renderToContext(geoJson, projection);
      const shapes = mapRenderContext.toShapes(isCCW);
      return new THREE.ShapeBufferGeometry(shapes);
    },
    createMesh: function createMesh (geometry, material) {
      return new THREE.Mesh(geometry, material);
    }
  },

  extrudeRenderer: {
    renderToContext: renderToContext,
    createGeometry: function createGeometry (geoJson, projection, isCCW) {
      var mapRenderContext = this.renderToContext(geoJson, projection);
      const extrudeSettings = {
        amount: 1,
        bevelEnabled: false
      };
      const extShapes = mapRenderContext.toShapes(isCCW);
      return new THREE.ExtrudeBufferGeometry(extShapes, extrudeSettings);
    },
    createMesh: function createMesh (geometry, material) {
      return new THREE.Mesh(geometry, material);
    }
  }
};
