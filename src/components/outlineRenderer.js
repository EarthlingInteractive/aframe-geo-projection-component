/* global AFRAME */

var THREE = AFRAME.THREE;

/**
 * Renders geoJson as outlines.
 */
AFRAME.registerComponent('geo-outline-renderer', {
  dependencies: ['geo-projection', 'material'],

  schema: {
    color: {
      type: 'color',
      default: ''
    }
  },

  init: function () {
    this.system = this.el.sceneEl.systems['geo-projection'];
    this.geoProjectionComponent = this.el.components['geo-projection'];
    this.render = this.render.bind(this);
    this.el.addEventListener('geo-src-loaded', this.render);
  },

  update: function (oldData) {
    if (this.data.color !== oldData.color) {
      if (this.data.color) {
        this.material = new THREE.LineBasicMaterial({ color: this.data.color });
      } else {
        this.material = this.el.components.material.material;
      }
    }
    if (this.geoProjectionComponent.geoJson) {
      this.render();
    }
  },

  remove: function () {
    this.el.removeEventListener('geo-src-loaded', this.render);
    var obj = this.el.getObject3D('outlineMap');
    if (obj) {
      this.el.removeObject3D('outlineMap');
    }
  },

  render: function () {
    var geoJson = this.geoProjectionComponent.geoJson;
    var projection = this.geoProjectionComponent.projection;

    var mapRenderContext = this.system.renderToContext(geoJson, projection);
    var lineGeometry = new THREE.BufferGeometry();
    var vertices = mapRenderContext.toVertices();
    lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    var outlineMesh = new THREE.LineSegments(lineGeometry, this.material);
    this.el.setObject3D('outlineMap', outlineMesh);
  }
});
