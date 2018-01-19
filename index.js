/* global AFRAME */

var d3 = Object.assign({}, require('d3-scale'), require('d3-geo'), require('d3-geo-projection'));

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}
const THREE = AFRAME.THREE;

/**
 * Geo Projection component for A-Frame.
 */
AFRAME.registerComponent('geo-projection', {
  schema: {
    src: {
      type: 'asset'
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
    const src = this.data.src;
    if (src && src !== oldData.src) {
      this.loader.load(src, this.onSrcLoaded.bind(this));
    }
  },

  onSrcLoaded: function (text) {
    const json = JSON.parse(text);
    this.render(json);
  },

  render: function (geoJson) {

  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () { },

  /**
   * @returns the d3 projection or transform specified by the projection attribute
   */
  getD3Projection: function () {
    var projection = d3[this.data.projection];
    if (typeof projection !== 'function') {
      throw Error('Invalid d3 projection; use a projection from d3-geo or d3-geo-projection');
    }
    return projection();
  },

  /**
   * @returns a d3 transform that converts from normal SVG screen coordinates
   *          (an origin of [0,0] with y pointing down) to A-Frame coordinates
   *          where the extent is based on the height and width, the origin is
   *          in the center, and y points up
   */
  getWorldTransform: function () {
    const height = this.data.height;
    const width = this.data.width;

    const x = d3.scaleLinear().domain([0, width]).range([-width / 2, width / 2]);
    const y = d3.scaleLinear().domain([0, height]).range([height / 2, -height / 2]);

    return d3.geoTransform({
      point: function (px, py) {
        this.stream.point(x(px), y(py));
      }
    });
  },

  /**
   * @param geoJson the geometry to use for scaling and centering
   * @returns a d3 projection stream which centers the given geoJson in
   *          A-Frame coordinates and scales it to fit the height and width
   *          of the component
   */
  getFittedProjection: function (geoJson) {
    const height = this.data.height;
    const width = this.data.width;

    var projection = this.getD3Projection().fitSize([width, height], geoJson);
    var worldTransform = this.getWorldTransform();
    // Thanks to this StackOverflow answer on how to chain streams:
    // https://stackoverflow.com/a/31647135
    return {
      stream: function (s) {
        return projection.stream(worldTransform.stream(s));
      }
    };
  }
});
