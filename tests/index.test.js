/* global assert, setup, suite, test */
require('aframe');
var sinon = require('sinon');
var sandbox = sinon.createSandbox();
require('../index.js');
var entityFactory = require('./helpers').entityFactory;

var THREE = AFRAME.THREE;

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
    suite('src property', function () {
      test('exists', function () {
        assert.property(component.data, 'src');
      });
      test('defaults to empty string', function () {
        assert.propertyVal(component.data, 'src', '');
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
    test('initializes a FileLoader', function () {
      var fakeLoader = sandbox.createStubInstance(THREE.FileLoader);
      var loaderStub = sandbox.stub(THREE, 'FileLoader');
      loaderStub.returns(fakeLoader);
      component.init();
      sinon.assert.calledWithNew(loaderStub);
      assert.equal(component.loader, fakeLoader);
    });
  });

  suite('#update', function() {
    suite('when the src property changes', function () {
      test('loads the new src asset', function () {
        var fakeLoader = sandbox.createStubInstance(THREE.FileLoader);
        var loaderStub = sandbox.stub(THREE, 'FileLoader');
        loaderStub.returns(fakeLoader);
        sandbox.spy(component, 'update');
        sandbox.stub(component.onSrcLoaded, 'bind').callsFake(function () { return component.onSrcLoaded });

        component.init();
        el.setAttribute('geo-projection', {
          src: 'assets/test.json'
        });

        sinon.assert.calledOnce(component.update);
        sinon.assert.calledWith(fakeLoader.load, 'assets/test.json', component.onSrcLoaded);
      });
    });
    suite('when the src property has not changed', function () {
      test('does not re-load the src asset', function () {
        var fakeLoader = sandbox.createStubInstance(THREE.FileLoader);
        var loaderStub = sandbox.stub(THREE, 'FileLoader');
        loaderStub.returns(fakeLoader);
        sandbox.spy(component, 'update');

        component.init();
        el.setAttribute('geo-projection', {
          width: 2
        });

        sinon.assert.calledOnce(component.update);
        sinon.assert.notCalled(fakeLoader.load);
      });
    });
  });

  suite('#onSrcLoaded', function () {
    test('parses the given text into JSON and renders it', function () {
      sandbox.spy(component, 'render');
      var text = '{ "type": "LineString", "coordinates": [[0, 0], [1, 1]] }';
      component.onSrcLoaded(text);
      sinon.assert.calledWithMatch(component.render, { type: 'LineString' });
    });
  });
});
