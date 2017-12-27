/* global assert, setup, suite, test */
require('aframe');
require('../index.js');
var entityFactory = require('./helpers').entityFactory;

suite('geo-projection component', function () {
  var component;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'geo-projection') {
        return;
      }
      component = el.components['geo-projection'];
      done();
    });
    el.setAttribute('geo-projection', {});
  });

  suite('schema definition', function () {
    suite('width property', function () {
      test('exists', function () {
        assert.property(component.data, 'width');
      });
      test('defaults to 1', function () {
        assert.propertyVal(component.data, 'width', 1);
      });
    });
    suite('height property', function () {
      test('exists', function () {
        assert.property(component.data, 'height');
      });
      test('defaults to 1', function () {
        assert.propertyVal(component.data, 'height', 1);
      });
    });
  });
});
