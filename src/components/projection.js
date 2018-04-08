/* global AFRAME */

var projectionUtils = require('../projectionUtils');
var constants = require('../constants');

/**
 * Projects GeoJSON to VR space.
 */
AFRAME.registerComponent('geo-projection', {
  schema: {
    projection: {
      default: 'geoIdentity'
    },
    width: {default: 1},
    height: {default: 1}
  },

  init: function () {
    this.onSrcLoaded = this.onSrcLoaded.bind(this);
    this.el.addEventListener(constants.GEO_SRC_LOADED_EVENT, this.onSrcLoaded);
  },

  remove: function () {
    this.el.removeEventListener(constants.GEO_SRC_LOADED_EVENT, this.onSrcLoaded);
  },

  update: function (oldData) {
    if (!this.geoJson) {
      return;
    }
    var differences = AFRAME.utils.diff(oldData, this.data);
    if (Object.keys(differences).length > 0) {
      this.projectGeoJson();
    }
  },

  onSrcLoaded: function (event) {
    this.geoJson = event.detail.geoJson;
    this.projectGeoJson();
  },

  projectGeoJson: function () {
    this.projection = projectionUtils.getFittedProjection(this.data.projection, this.geoJson, this.data.height, this.data.width);
    this.el.emit(constants.GEO_DATA_READY_EVENT, {});
  }
});
