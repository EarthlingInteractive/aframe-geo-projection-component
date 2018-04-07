/* global AFRAME */

require('./src/system');
require('./src/outlineRenderer');
require('./src/shapeRenderer');
require('./src/extrudeRenderer');

var projectionLib = require('./src/projection');
var topojsonFeature = require('topojson-client').feature;

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}
var THREE = AFRAME.THREE;
var GEO_SRC_LOADED_EVENT = 'geo-src-loaded';

/**
 * Geo Projection component for A-Frame.
 */
AFRAME.registerComponent('geo-projection', {
  schema: {
    src: {
      type: 'asset'
    },
    srcType: {
      oneOf: ['geojson', 'topojson'],
      default: 'geojson'
    },
    topologyObject: {
      type: 'string'
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
    if (!this.data.src) {
      return;
    }
    var differences = AFRAME.utils.diff(oldData, this.data);
    if (Object.keys(differences).length > 0) {
      this.loader.load(this.data.src, this.onSrcLoaded.bind(this));
    }
  },

  onSrcLoaded: function (text) {
    this.geoJson = this.parseGeoJson(text);
    this.projection = projectionLib.getFittedProjection(this.data.projection, this.geoJson, this.data.height, this.data.width);
    this.el.emit(GEO_SRC_LOADED_EVENT, {});
  },

  parseGeoJson: function (text) {
    var json = JSON.parse(text);

    var geoJson = json;
    if (this.data.srcType === 'topojson') {
      var topologyObjectName = this.data.topologyObject;
      if (!this.data.topologyObject) {
        topologyObjectName = Object.keys(json.objects)[0];
      }
      geoJson = topojsonFeature(json, json.objects[topologyObjectName]);
    }
    return geoJson;
  }
});

module.exports = {
  GEO_SRC_LOADED_EVENT: GEO_SRC_LOADED_EVENT
};
