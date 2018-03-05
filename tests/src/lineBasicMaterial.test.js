/* global assert, setup, suite, test */
require('aframe');
require('../../src/lineBasicMaterial');
var entityFactory = require('../helpers').entityFactory;

var THREE = AFRAME.THREE;

suite('linebasic shader', function () {
  var material;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'material') {
        return;
      }
      material = el.components['material'];
      done();
    });
    el.setAttribute('material', {
      shader: 'linebasic'
    });
  });

  suite('schema definition (shader schema is copied into material)', function () {
    suite('blending property', function () {
      test('exists', function () {
        assert.property(material.data, 'blending');
      });
      test('defaults to THREE.NormalBlending', function () {
        assert.propertyVal(material.data, 'blending', THREE.NormalBlending);
      });
    });
    suite('color property', function () {
      test('exists', function () {
        assert.property(material.data, 'color');
      });
      test('defaults to #000', function () {
        assert.propertyVal(material.data, 'color', '#000');
      });
    });
    suite('depthTest property', function () {
      test('exists', function () {
        assert.property(material.data, 'depthTest');
      });
      test('defaults to true', function () {
        assert.propertyVal(material.data, 'depthTest', true);
      });
    });
    suite('depthFunc property', function () {
      test('exists', function () {
        assert.property(material.data, 'depthFunc');
      });
      test('defaults to THREE.LessEqualDepth', function () {
        assert.propertyVal(material.data, 'depthFunc', THREE.LessEqualDepth);
      });
    });
    suite('depthWrite property', function () {
      test('exists', function () {
        assert.property(material.data, 'depthWrite');
      });
      test('defaults to true', function () {
        assert.propertyVal(material.data, 'depthWrite', true);
      });
    });
    suite('fog property', function () {
      test('exists', function () {
        assert.property(material.data, 'fog');
      });
      test('defaults to false', function () {
        assert.propertyVal(material.data, 'fog', false);
      });
    });
    suite('linewidth property', function () {
      test('exists', function () {
        assert.property(material.data, 'linewidth');
      });
      test('defaults to 1', function () {
        assert.propertyVal(material.data, 'linewidth', 1);
      });
    });
    suite('linecap property', function () {
      test('exists', function () {
        assert.property(material.data, 'linecap');
      });
      test('defaults to line', function () {
        assert.propertyVal(material.data, 'linecap', 'round');
      });
    });
    suite('linejoin property', function () {
      test('exists', function () {
        assert.property(material.data, 'linejoin');
      });
      test('defaults to line', function () {
        assert.propertyVal(material.data, 'linejoin', 'round');
      });
    });
    suite('opacity property', function () {
      test('exists', function () {
        assert.property(material.data, 'opacity');
      });
      test('defaults to 1', function () {
        assert.propertyVal(material.data, 'opacity', 1);
      });
    });
    suite('side property', function () {
      test('exists', function () {
        assert.property(material.data, 'side');
      });
      test('defaults to THREE.FrontSide', function () {
        assert.propertyVal(material.data, 'side', THREE.FrontSide);
      });
    });
    suite('transparent property', function () {
      test('exists', function () {
        assert.property(material.data, 'transparent');
      });
      test('defaults to false', function () {
        assert.propertyVal(material.data, 'transparent', false);
      });
    });
    suite('vertexColors property', function () {
      test('exists', function () {
        assert.property(material.data, 'vertexColors');
      });
      test('defaults to THREE.NoColors', function () {
        assert.propertyVal(material.data, 'vertexColors', THREE.NoColors);
      });
    });
    suite('visible property', function () {
      test('exists', function () {
        assert.property(material.data, 'visible');
      });
      test('defaults to false', function () {
        assert.propertyVal(material.data, 'visible', true);
      });
    });
  });

  suite('#init', function () {
    test('initializes a LineBasicMaterial', function () {
      material.shader.init();
      assert.instanceOf(material.shader.material, THREE.LineBasicMaterial);
    });
  });

  suite('#update', function () {
    test('sets the renderer', function () {
      el.setAttribute('material', {
        visible: false
      });
      assert.equal(material.shader.material.visible, false);
    });
  });
});
