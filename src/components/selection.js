/* global AFRAME */

var GEO_DATA_READY_EVENT = require('../constants').GEO_DATA_READY_EVENT;
var THREE = AFRAME.THREE;

/**
 * Responds to a raycaster event intersecting part of the map.
 */
AFRAME.registerComponent('geo-selection', {
  dependencies: ['geo-projection'],

  schema: {
    selectionStartEvent: {
      default: 'mouseenter'
    },
    selectionEndEvent: {
      default: 'mouseleave'
    }
  },

  init: function () {
    this.system = this.el.sceneEl.systems['geo-projection'];
    this.geoProjectionComponent = this.el.components['geo-projection'];
    this.material = new THREE.MeshStandardMaterial({ color: 'yellow' });
    this.ready = false;
    this.setReady = this.setReady.bind(this);
    this.el.addEventListener(GEO_DATA_READY_EVENT, this.setReady);
    this.handleSelection = this.handleSelection.bind(this);
    this.el.addEventListener(this.data.selectionStartEvent, this.handleSelection);
    this.handleSelectionEnd = this.handleSelectionEnd.bind(this);
    this.el.addEventListener(this.data.selectionEndEvent, this.handleSelectionEnd);
  },

  update: function (oldData) {
    if (!this.ready) {
      return;
    }
    if (this.geoProjectionComponent.geoJson) {
      this.render();
    }
  },

  remove: function () {
    this.el.removeEventListener(GEO_DATA_READY_EVENT, this.setReady);
    this.el.removeEventListener(this.data.selectionStartEvent, this.handleSelection);
    this.el.removeEventListener(this.data.selectionEndEvent, this.handleSelectionEnd);
  },

  setReady: function () {
    this.ready = true;
  },

  handleSelection: function (evt) {
    this.selected = evt.target;
    this.prevMaterial = this.selected.getObject3D('mesh').material;
    this.selected.getObject3D('mesh').material = this.material;
  },

  handleSelectionEnd: function () {
    this.selected.getObject3D('mesh').material = this.prevMaterial;
    this.selected = null;
    this.prevMaterial = null;
  }
});
