var d3 = Object.assign({}, require('d3-scale'), require('d3-geo'), require('d3-geo-projection'));

module.exports = {
  /**
   * @param projectionName the name of a projection from d3-geo or d3-geo-projection
   * @returns the d3 projection or transform specified by the projectionName
   * @throws Error if projectionName doesn't exist in d3-geo or d3-geo-projection
   */
  getD3Projection: function (projectionName) {
    var projection = d3[projectionName];
    if (typeof projection !== 'function') {
      throw Error('Invalid d3 projection; use a projection from d3-geo or d3-geo-projection');
    }
    return projection();
  },

  /**
   * @param height the height in A-Frame units
   * @param width the width in A-Frame units
   * @returns a d3 transform that converts from normal SVG screen coordinates
   *          (an origin of [0,0] with y pointing down) to A-Frame coordinates
   *          where the extent is based on the height and width, the origin is
   *          in the center, and y points up
   */
  getWorldTransform: function (height, width) {
    const x = d3.scaleLinear().domain([0, width]).range([-width / 2, width / 2]);
    const y = d3.scaleLinear().domain([0, height]).range([height / 2, -height / 2]);

    return d3.geoTransform({
      point: function (px, py) {
        this.stream.point(x(px), y(py));
      }
    });
  },

  /**
   * @param projectionName the name of a projection from d3-geo or d3-geo-projection
   * @param height the height in A-Frame units
   * @param width the width in A-Frame units
   * @param geoJson the geometry to use for scaling and centering
   * @returns a d3 projection stream which centers the given geoJson in
   *          A-Frame coordinates and scales it to fit the height and width
   *          of the component
   */
  getFittedProjection: function (projectionName, geoJson, height, width) {
    var projection = this.getD3Projection(projectionName).fitSize([width, height], geoJson);
    var worldTransform = this.getWorldTransform(height, width);
    // Thanks to this StackOverflow answer on how to chain streams:
    // https://stackoverflow.com/a/31647135
    return {
      stream: function (s) {
        return projection.stream(worldTransform.stream(s));
      }
    };
  }
};
