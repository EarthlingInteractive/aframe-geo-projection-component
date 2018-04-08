/* global AFRAME */

var topojsonFeature = require('topojson-client').feature;
var GEO_SRC_LOADED_EVENT = require('../constants').GEO_SRC_LOADED_EVENT;

var THREE = AFRAME.THREE;

/**
 * Handles loading TopoJSON data from a file.  Converts it to GeoJSON features.
 */
AFRAME.registerComponent('topojson-loader', {
  schema: {
    src: {
      type: 'asset'
    },
    topologyObject: {
      type: 'string'
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
    if (this.data.src !== oldData.src || this.data.topologyObject !== oldData.topologyObject) {
      this.loader.load(this.data.src, this.onSrcLoaded);
    }
  },

  onSrcLoaded: function (text) {
    var geoJson = this.parseGeoJson(text);
    this.el.emit(GEO_SRC_LOADED_EVENT, { geoJson: geoJson });
  },

  parseGeoJson: function (text) {
    var json = JSON.parse(text);
    var topologyObjectName = this.data.topologyObject;
    if (!this.data.topologyObject) {
      topologyObjectName = Object.keys(json.objects)[0];
    }
    var topologyObject = json.objects[topologyObjectName];
    if (!topologyObject) {
      throw new Error('TopologyObject with name ' + topologyObjectName + ' could not be found.');
    }
    return topojsonFeature(json, topologyObject);
  }
});
