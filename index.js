/* global AFRAME */

/* istanbul ignore next */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./src/system');
require('./src/components/projection');
require('./src/components/outlineRenderer');
require('./src/components/shapeRenderer');
require('./src/components/extrudeRenderer');
