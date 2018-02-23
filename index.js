/* global AFRAME */

require('./src/lineBasicMaterial');
var renderer = require('./src/renderer');
var projectionLib = require('./src/projection');
var topojson = require('topojson-client');

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
    var src = this.data.src;
    if (src && src !== oldData.src) {
      this.loader.load(src, this.onSrcLoaded.bind(this));
    }
  },

  onSrcLoaded: function (text) {
    var json = JSON.parse(text);

    var geoJson = json;
    if (this.data.srcType === 'topojson') {
      var topologyObjectName = this.data.topologyObject;
      if (!this.data.topologyObject) {
        topologyObjectName = Object.keys(json.objects)[0];
      }
      geoJson = topojson.feature(json, json.objects[topologyObjectName]);
    }

    this.render(geoJson);
  },

  render: function (geoJson) {
    var material = this.el.components.material.material;
    var projection = projectionLib.getFittedProjection(this.data.projection, geoJson, this.data.height, this.data.width);
    var renderOptions = {
      projection: projection,
      meshType: this.data.meshType,
      material: material,
      isCCW: this.data.isCCW
    };
    var object3D = renderer.renderGeoJson(geoJson, renderOptions);
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
