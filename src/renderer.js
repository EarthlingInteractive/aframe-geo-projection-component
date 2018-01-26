
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
  const verticesForShape = [];
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

module.exports = {
  /**
   * Takes the input geoJson and renders it as an Object3D.
   *
   * @param geoJson
   * @return THREE.Object3D
   */
  renderGeoJson: function (geoJson) {
    // getFittedProjection using geoJson
    // create geometry using projection and geoJson
    // create mesh from geometry and material
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array( [
      -1.0, -1.0,  1.0,
      1.0, -1.0,  1.0,
      1.0,  1.0,  1.0,

      1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0, -1.0,  1.0
    ] );

    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    return new THREE.LineSegments(geometry);
  },

  ThreeJSRenderContext: ThreeJSRenderContext
};
