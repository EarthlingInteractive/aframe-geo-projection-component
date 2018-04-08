/* global AFRAME */

var THREE = AFRAME.THREE;

/**
 * Renders geoJson as extruded shapes.
 */
AFRAME.registerComponent('geo-extrude-renderer', {
  dependencies: ['geo-projection', 'material'],

  schema: {
    extrudeAmount: {
      default: 1
    },
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
    if (this.data.isCCW !== oldData.isCCW || this.data.extrudeAmount !== oldData.extrudeAmount) {
      this.render();
    }
  },

  remove: function () {
    this.el.removeEventListener('geo-src-loaded', this.render);
    var obj = this.el.getObject3D('extrudeMap');
    if (obj) {
      this.el.removeObject3D('extrudeMap');
    }
  },

  render: function () {
    var material = this.el.components.material.material;
    var geoJson = this.geoProjectionComponent.geoJson;
    var projection = this.geoProjectionComponent.projection;

    var mapRenderContext = this.system.renderToContext(geoJson, projection);
    const extrudeSettings = {
      amount: this.data.extrudeAmount,
      bevelEnabled: false
    };
    var shapes = mapRenderContext.toShapes(this.data.isCCW);
    var shapeGeometry = new THREE.ExtrudeBufferGeometry(shapes, extrudeSettings);
    var extrudeMesh = new THREE.Mesh(shapeGeometry, material);

    this.el.setObject3D('extrudeMap', extrudeMesh);
  }
});
