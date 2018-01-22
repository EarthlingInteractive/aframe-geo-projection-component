
function ThreeJSRenderContext() {

}

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
