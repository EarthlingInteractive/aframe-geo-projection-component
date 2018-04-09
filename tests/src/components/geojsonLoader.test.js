/* global assert, setup, teardown, suite, test */
require('aframe');
var sinon = require('sinon');
var sandbox = sinon.createSandbox();
require('../../../src/components/geojsonLoader');
var entityFactory = require('../../helpers').entityFactory;
var GEO_SRC_LOADED_EVENT = require('../../../src/constants').GEO_SRC_LOADED_EVENT;

var THREE = AFRAME.THREE;

suite('geojson-loader component', function () {
  var component;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'geojson-loader') {
        return;
      }
      component = el.components['geojson-loader'];
      done();
    });
    el.setAttribute('geojson-loader', {});
  });

  teardown(function () {
    sandbox.restore();
  });

  suite('schema definition', function () {
    suite('src property', function () {
      test('exists', function () {
        assert.property(component.data, 'src');
      });
      test('defaults to empty string', function () {
        assert.propertyVal(component.data, 'src', '');
      });
    });
  });

  suite('#init', function () {
    test('initializes a FileLoader', function () {
      component.init();
      assert.instanceOf(component.loader, THREE.FileLoader);
    });
  });

  suite('#update', function () {
    suite('when the src property changes', function () {
      test('loads the src data', function () {
        var fakeLoader = { load: sandbox.spy() };
        component.loader = fakeLoader;

        component.data.src = '/base/tests/assets/test.json';
        var oldData = { src: '' };

        component.update(oldData);

        sinon.assert.calledWith(fakeLoader.load, '/base/tests/assets/test.json', component.onSrcLoaded);
      });
    });
    suite('when the src property is blank', function () {
      test('does not try to load the src data', function () {
        var fakeLoader = { load: sandbox.spy() };
        component.loader = fakeLoader;

        component.data.src = '';
        var oldData = { src: '/base/tests/assets/test.json' };

        component.update(oldData);

        sinon.assert.notCalled(fakeLoader.load);
      });
    });
    suite('when the src property has not changed', function () {
      test('does not try to load the src data', function () {
        var fakeLoader = { load: sandbox.spy() };
        component.loader = fakeLoader;

        component.data.src = '/base/tests/assets/test.json';
        var oldData = { src: '/base/tests/assets/test.json' };

        component.update(oldData);

        sinon.assert.notCalled(fakeLoader.load);
      });
    });
  });

  suite('#onSrcLoaded', function () {
    test('emits an event containing the GeoJSON', function () {
      var eventHandlerSpy = sandbox.spy();

      el.addEventListener(GEO_SRC_LOADED_EVENT, eventHandlerSpy);

      var text = '{ "type": "LineString", "coordinates": [[0, 0], [1, 1]] }';
      var expectedGeoJson = {type: 'LineString', coordinates: [[0, 0], [1, 1]]};

      component.onSrcLoaded(text);

      sinon.assert.calledWithMatch(eventHandlerSpy, { detail: { geoJson: expectedGeoJson } });
    });
  });
});
