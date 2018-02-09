/* global AFRAME */

var renderer = require('./src/renderer');

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}
var THREE = AFRAME.THREE;

/**
 * Geo Projection component for A-Frame.
 */
AFRAME.registerComponent('geo-projection', {
  dependencies: ['material'],

  schema: {
    src: {
      type: 'asset'
    },
    projection: {
      default: 'geoIdentity'
    },
    width: {default: 1},
    height: {default: 1}
  },

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function () {
    this.loader = new THREE.FileLoader();
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    var src = this.data.src;
    if (src && src !== oldData.src) {
      this.loader.load(src, this.onSrcLoaded.bind(this));
    }
  },

  onSrcLoaded: function (text) {
    var json = JSON.parse(text);
    this.render(json);
  },

  render: function (geoJson) {
    var renderOptions = {
      projectionName: this.data.projection,
      height: this.data.height,
      width: this.data.width
    };
    var object3D = renderer.renderGeoJson(geoJson, renderOptions);
    this.el.setObject3D('map', object3D);
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () { }
});
