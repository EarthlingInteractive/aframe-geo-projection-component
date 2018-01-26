var projectionLib = require('./projection');
var d3 = require('d3-geo');

function ThreeJSRenderContext(shapePath) {
  this.shapePath = shapePath;
}

ThreeJSRenderContext.prototype.beginPath = function beginPath () {
 // no-op
};

ThreeJSRenderContext.prototype.moveTo = function moveTo (x, y) {
  this.shapePath.moveTo(x, y);
};

ThreeJSRenderContext.prototype.lineTo = function lineTo (x, y) {
  this.shapePath.lineTo(x, y);
};

ThreeJSRenderContext.prototype.arc = function arc (x, y, radius, startAngle, endAngle) {
  this.shapePath.currentPath.arc(x, y, radius, startAngle, endAngle);
};

ThreeJSRenderContext.prototype.closePath = function closePath () {
  this.shapePath.currentPath.closePath();
};

ThreeJSRenderContext.prototype.toShapes = function toShapes (isCCW) {
  this.shapePath.toShapes(isCCW);
};

ThreeJSRenderContext.prototype.toVertices = function toVertices () {
  var verticesForShape = [];
  this.shapePath.subPaths.forEach(function (path) {
    path.curves.forEach(function (curve) {
      if (curve.isLineCurve) {
        verticesForShape.push(curve.v1.x);
        verticesForShape.push(curve.v1.y);
        verticesForShape.push(0);
        verticesForShape.push(curve.v2.x);
        verticesForShape.push(curve.v2.y);
        verticesForShape.push(0);
      } else {
        curve.getPoints().forEach(function (point) {
          verticesForShape.push(point.x);
          verticesForShape.push(point.y);
          verticesForShape.push(0);
        });
      }
    });
  });
  return verticesForShape;
};

var THREE = AFRAME.THREE;

module.exports = {
  /**
   * Takes the input geoJson and renders it as an Object3D.
   *
   * @param geoJson
   * @return THREE.Object3D
   */
  renderGeoJson: function (geoJson) {
    var projection = projectionLib.getFittedProjection('geoIdentity', geoJson, 10, 10);
    var shapePath = new THREE.ShapePath();
    var mapRenderContext = new ThreeJSRenderContext(shapePath);
    var mapPath = d3.geoPath(projection, mapRenderContext);
    mapPath(geoJson);

    var geometry = new THREE.BufferGeometry();
    var vertices = mapRenderContext.toVertices();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return new THREE.LineSegments(geometry);
  },

  ThreeJSRenderContext: ThreeJSRenderContext
};
