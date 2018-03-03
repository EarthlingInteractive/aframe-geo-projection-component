var d3 = require('d3-geo');
var ThreeJSRenderContext = require('./renderContext').ThreeJSRenderContext;

var THREE = AFRAME.THREE;

/**
 * Takes the input geoJson and uses the projection and D3 to draw it
 * into a ThreeJSRenderContext.
 *
 * @param geoJson the geoJson object to render
 * @param projection the projection to use for rendering
 * @return ThreeJSRenderContext
 */
function renderToContext (geoJson, projection) {
  var shapePath = new THREE.ShapePath();
  var mapRenderContext = new ThreeJSRenderContext(shapePath);
  var mapPath = d3.geoPath(projection, mapRenderContext);
  mapPath(geoJson);
  return mapRenderContext;
}

/**
 * Takes the input geoJson and renders it as an Object3D.
 *
 * @param geoJson the geoJson object to render
 * @param projection the projection to use for rendering
 * @param isCCW true if shapes are defined counter-clockwise and holes defined clockwise; false for the reverse
 * @param material the THREE.Material to use in the resulting Object3D
 * @return THREE.Object3D
 */
function render (geoJson, projection, isCCW, material) {
  var geometry = this.createGeometry(geoJson, projection, isCCW);
  return this.createMesh(geometry, material);
}

module.exports = {
  line: {
    render: render,
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

  shape: {
    render: render,
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

  extrude: {
    render: render,
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
