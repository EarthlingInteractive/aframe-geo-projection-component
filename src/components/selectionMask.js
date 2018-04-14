/* global AFRAME */

var GEO_DATA_READY_EVENT = require('../constants').GEO_DATA_READY_EVENT;
var THREE = AFRAME.THREE;

/**
 * Renders invisible entities for each feature to aid in selection.
 */
AFRAME.registerComponent('geo-selection-mask', {
  dependencies: ['geo-projection'],

  init: function () {
    this.system = this.el.sceneEl.systems['geo-projection'];
    this.geoProjectionComponent = this.el.components['geo-projection'];
    this.invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });
    this.render = this.render.bind(this);
    this.el.addEventListener(GEO_DATA_READY_EVENT, this.render);
  },

  update: function (oldData) {
    if (this.geoProjectionComponent.geoJson) {
      this.render();
    }
  },

  remove: function () {
    this.el.removeEventListener(GEO_DATA_READY_EVENT, this.render);
    var obj = this.el.getObject3D('outlineMap');
    if (obj) {
      this.el.removeObject3D('outlineMap');
    }
  },

  render: function () {
    var geoJson = this.geoProjectionComponent.geoJson;
    var projection = this.geoProjectionComponent.projection;

    geoJson.features.forEach(function (feature) {
      var mapRenderContext = this.system.renderToContext(feature, projection);
      const shapeGeometry = new THREE.ShapeGeometry(mapRenderContext.toShapes());

      shapeGeometry.computeBoundingBox();
      const center = shapeGeometry.boundingBox.getCenter();
      shapeGeometry.translate(-center.x, -center.y, -center.z);

      var mesh = new THREE.Mesh(shapeGeometry, this.invisibleMaterial);
      mesh.name = feature.id;
      var featureEntity = document.createElement('a-entity');
      featureEntity.setAttribute('id', feature.id);
      featureEntity.setAttribute('position', center);
      featureEntity.setAttribute('class', 'selectable');
      featureEntity.setObject3D('mesh', mesh);
      this.el.appendChild(featureEntity);
    }.bind(this));
  }
});
