/* global AFRAME */

require('./src/lineBasicMaterial');
var renderers = require('./src/renderers');
var projectionLib = require('./src/projection');
var topojson = require('topojson-client');

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}
var THREE = AFRAME.THREE;
var GEO_SRC_LOADED_EVENT = 'geo-src-loaded';

/**
 * Geo Projection component for A-Frame.
 */
AFRAME.registerComponent('geo-projection', {
  dependencies: ['material'],

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
    isCCW: {
      type: 'boolean',
      default: false
    },
    projection: {
      default: 'geoIdentity'
    },
    meshType: {
      oneOf: ['line', 'shape', 'extrude'],
      default: 'line'
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
    this.renderer = renderers[this.data.meshType];
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
    this.render();
    this.el.emit(GEO_SRC_LOADED_EVENT, {
      geoProjectionComponent: this
    });
  },

  parseGeoJson: function (text) {
    var json = JSON.parse(text);

    var geoJson = json;
    if (this.data.srcType === 'topojson') {
      var topologyObjectName = this.data.topologyObject;
      if (!this.data.topologyObject) {
        topologyObjectName = Object.keys(json.objects)[0];
      }
      geoJson = topojson.feature(json, json.objects[topologyObjectName]);
    }
    return geoJson;
  },

  render: function () {
    var material = this.el.components.material.material;
    var object3D = this.renderer.render(this.geoJson, this.projection, this.data.isCCW, material);
    this.el.setObject3D('map', object3D);
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    var obj = this.el.getObject3D('map');
    if (obj) {
      this.el.removeObject3D('map');
    }
  }
});

module.exports = {
  GEO_SRC_LOADED_EVENT: GEO_SRC_LOADED_EVENT
};
