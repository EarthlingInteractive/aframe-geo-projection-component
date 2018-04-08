/* global AFRAME */

/* istanbul ignore next */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./src/system');
require('./src/projection');
require('./src/outlineRenderer');
require('./src/shapeRenderer');
require('./src/extrudeRenderer');
