/* global AFRAME */

var THREE = AFRAME.THREE;

/**
 * Renders geoJson as solid, flat shapes.
 */
AFRAME.registerComponent('geo-shape-renderer', {
  dependencies: ['geo-projection', 'material'],

  schema: {
    isCCW: {
      type: 'boolean',
      default: false
    }
  },

  init: function () {
    this.system = this.el.sceneEl.systems['geo-projection'];
    this.geoProjectionComponent = this.el.components['geo-projection'];
    this.render = this.render.bind(this);
    this.el.addEventListener('geo-src-loaded', this.render);
  },

  update: function (oldData) {
    if (!this.geoProjectionComponent.geoJson) {
      return;
    }
    if (this.data.isCCW !== oldData.isCCW) {
      this.render();
    }
  },

  remove: function () {
    this.el.removeEventListener('geo-src-loaded', this.render);
    var obj = this.el.getObject3D('shapeMap');
    if (obj) {
      this.el.removeObject3D('shapeMap');
    }
  },

  render: function () {
    var material = this.el.components.material.material;
    var geoJson = this.geoProjectionComponent.geoJson;
    var projection = this.geoProjectionComponent.projection;

    var mapRenderContext = this.system.renderToContext(geoJson, projection);
    var shapes = mapRenderContext.toShapes(this.data.isCCW);
    var shapeGeometry = new THREE.ShapeBufferGeometry(shapes);
    var shapeMesh = new THREE.Mesh(shapeGeometry, material);

    this.el.setObject3D('shapeMap', shapeMesh);
  }
});
