/* global AFRAME */

/* istanbul ignore next */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./src/system');
require('./src/projectionComponent');
require('./src/outlineRenderer');
require('./src/shapeRenderer');
require('./src/extrudeRenderer');
