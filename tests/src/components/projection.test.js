/* global assert, setup, teardown, suite, test */
require('aframe');
var sinon = require('sinon');
var sandbox = sinon.createSandbox();
require('../../../src/components/projection');
var constants = require('../../../src/constants');
var entityFactory = require('../../helpers').entityFactory;

var geoJson = {type: 'LineString', coordinates: [[0, 0], [1, 1]]};

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

  teardown(function () {
    sandbox.restore();
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
    suite('projection property', function () {
      test('exists', function () {
        assert.property(component.data, 'projection');
      });
      test('defaults to geoIdentity', function () {
        assert.propertyVal(component.data, 'projection', 'geoIdentity');
      });
    });
  });

  suite('#init', function () {
    test('listens for the GEO_SRC_LOADED_EVENT event', function () {
      var onSrcLoadedSpy = sandbox.spy();
      component.onSrcLoaded = onSrcLoadedSpy;

      component.init();

      el.emit(constants.GEO_SRC_LOADED_EVENT);

      sinon.assert.called(onSrcLoadedSpy);
    });
  });

  suite('#remove', function () {
    test('stopos listening for the GEO_SRC_LOADED_EVENT event', function () {
      var onSrcLoadedSpy = sandbox.spy();
      component.onSrcLoaded = onSrcLoadedSpy;

      component.init();

      component.remove();

      el.emit(constants.GEO_SRC_LOADED_EVENT);

      sinon.assert.notCalled(onSrcLoadedSpy);
    });
  });

  suite('#update', function () {
    suite('when a property changes', function () {
      test('reprojects the data', function () {
        component.geoJson = geoJson;
        component.projectGeoJson = sandbox.spy();

        component.data.width = 2;
        var oldData = { width: 1 };

        component.update(oldData);

        sinon.assert.called(component.projectGeoJson);
      });
    });
    suite('when no properties change', function () {
      test('does not reproject the data', function () {
        component.projectGeoJson = sandbox.spy();
        component.geoJson = geoJson;

        component.data = {
          width: 1,
          height: 1,
          projection: 'geoIdentity'
        };
        var oldData = {
          width: 1,
          height: 1,
          projection: 'geoIdentity'
        };

        component.update(oldData);

        sinon.assert.notCalled(component.projectGeoJson);
      });
    });
    suite('when the geoJson is blank', function () {
      test('does not reproject the data', function () {
        component.geoJson = null;
        component.projectGeoJson = sandbox.spy();
        component.data.width = 2;
        var oldData = { width: 1 };

        component.update(oldData);

        sinon.assert.notCalled(component.projectGeoJson);
      });
    });
  });

  suite('#onSrcLoaded', function () {
    var event = { detail: { geoJson: geoJson }};
    test('stores the GeoJson from the event', function () {
      component.onSrcLoaded(event);
      assert.equal(component.geoJson, geoJson);
    });
    test('projects the GeoJson', function () {
      component.projectGeoJson = sandbox.spy();
      component.onSrcLoaded(event);
      sinon.assert.called(component.projectGeoJson);
    });
  });
  suite('#projectGeoJson', function () {
    test('emits a GEO_DATA_READY_EVENT event', function () {
      var eventHandlerSpy = sandbox.spy();
      el.addEventListener(constants.GEO_DATA_READY_EVENT, eventHandlerSpy);

      component.projectGeoJson();

      sinon.assert.called(eventHandlerSpy);
    });
    test('calculation a projection', function () {
      component.projectGeoJson();
      assert.exists(component.projection);
      assert.exists(component.projection.stream);
    });
  });
});
