/* global AFRAME */

var GEO_SRC_LOADED_EVENT = require('../constants').GEO_SRC_LOADED_EVENT;

var THREE = AFRAME.THREE;

/**
 * Handles loading GeoJSON data from a file.
 */
AFRAME.registerComponent('geojson-loader', {
  schema: {
    src: {
      type: 'asset'
    }
  },

  init: function () {
    this.loader = new THREE.FileLoader();
    this.onSrcLoaded = this.onSrcLoaded.bind(this);
  },

  update: function (oldData) {
    if (!this.data.src) {
      return;
    }
    if (this.data.src !== oldData.src) {
      this.loader.load(this.data.src, this.onSrcLoaded);
    }
  },

  onSrcLoaded: function (text) {
    var geoJson = JSON.parse(text);
    this.el.emit(GEO_SRC_LOADED_EVENT, { geoJson: geoJson });
  }
});
