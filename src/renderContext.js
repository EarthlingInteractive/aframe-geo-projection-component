/**
 * A rendering context that can be used with d3-geo to convert geoJSON
 * into data that can be used by THREE.js.  To do this, it implements
 * the d3-geo required subset of the CanvasRenderingContext2D API.
 *
 * @param shapePath a THREE.ShapePath that will hold the rendered data
 * @constructor
 * @see https://github.com/d3/d3-geo#path_context
 */
function ThreeJSRenderContext (shapePath) {
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

/**
 * Exports the data stored in this context into an array of Shapes.
 * By default solid shapes are defined clockwise (CW) and holes are
 * defined counterclockwise (CCW). If isCCW is set to true, then those
 * are flipped. If the parameter noHoles is set to true then all paths
 * are set as solid shapes and isCCW is ignored.
 *
 * The isCCW flag is important when rendering topoJSON vs. geoJSON.  For
 * features smaller than a hemisphere, topoJSON uses clockwise shapes while
 * geoJSON uses counterclockwise shapes.  For features larger than a
 * hemisphere (such as oceans), the opposite is true.
 *
 * @param isCCW changes how solids and holes are generated
 * @param noHoles whether or not to generate holes
 * @return {Array} of THREE.Shape objects
 * @see https://github.com/d3/d3-geo for a summary of winding order convention
 */
ThreeJSRenderContext.prototype.toShapes = function toShapes (isCCW, noHoles) {
  return this.shapePath.toShapes(isCCW, noHoles);
};

/**
 * Exports the data stored in this context into an array of vertices.  Each
 * vertex takes up three positions in the array so it is optimized to populate
 * a THREE.BufferGeometry.  The z parameter can be used to control the position of
 * the vertices on the z-axis.
 *
 * @param z optional parameter to set as the z-value for all the vertices produced; 0 will be used if no z is specified
 * @return {Array} of numbers
 */
ThreeJSRenderContext.prototype.toVertices = function toVertices (z) {
  var verticesForShape = [];
  var zVal = z || 0;
  this.shapePath.subPaths.forEach(function (path) {
    path.curves.forEach(function (curve) {
      if (curve.isLineCurve) {
        verticesForShape.push(curve.v1.x);
        verticesForShape.push(curve.v1.y);
        verticesForShape.push(zVal);
        verticesForShape.push(curve.v2.x);
        verticesForShape.push(curve.v2.y);
        verticesForShape.push(zVal);
      } else {
        curve.getPoints().forEach(function (point) {
          verticesForShape.push(point.x);
          verticesForShape.push(point.y);
          verticesForShape.push(zVal);
        });
      }
    });
  });
  return verticesForShape;
};

module.exports = {
  ThreeJSRenderContext: ThreeJSRenderContext
};
