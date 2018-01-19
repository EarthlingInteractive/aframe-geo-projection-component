/* global AFRAME */

var d3 = Object.assign({}, require('d3-scale'), require('d3-geo'), require('d3-geo-projection'));
var projectionLib = require('./src/projection');

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}
const THREE = AFRAME.THREE;

/**
 * Geo Projection component for A-Frame.
 */
AFRAME.registerComponent('geo-projection', {
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
    const src = this.data.src;
    if (src && src !== oldData.src) {
      this.loader.load(src, this.onSrcLoaded.bind(this));
    }
  },

  onSrcLoaded: function (text) {
    const json = JSON.parse(text);
    this.render(json);
  },

  render: function (geoJson) {

  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () { }
});
