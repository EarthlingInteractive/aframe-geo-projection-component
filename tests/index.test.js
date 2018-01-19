/* global assert, setup, suite, test */
require('aframe');
var d3 = require('d3-geo');
var sinon = require('sinon');
var sandbox = sinon.createSandbox();require('../index.js');
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

  suite('#getD3Projection', function () {
    test('exists as a method on the component', function () {
      assert.property(component, 'getD3Projection');
    });
    test('uses the projection attribute to look up a d3 projection', function () {
      el.setAttribute('geo-projection', {
        projection: 'geoAlbers'
      });
      assert.equal(component.getD3Projection().toString(), d3.geoAlbers().toString());
    });
    test('can also be a d3 transform', function () {
      assert.equal(component.getD3Projection().toString(), d3.geoIdentity().toString());
    });
    test('throws an error if an invalid projection is specified', function () {
      el.setAttribute('geo-projection', {
        projection: 'badStuff'
      });
      assert.throws(component.getD3Projection.bind(component), 'Invalid d3 projection; use a projection from d3-geo or d3-geo-projection');
    });
  });

  suite('#getWorldTransform', function () {
    test('exists as a method on the component', function () {
      assert.property(component, 'getWorldTransform');
    });
    test('returns a transform that maps from d3 space to A-Frame space', function () {
      var width = 20;
      var height = 10;
      el.setAttribute('geo-projection', {
        width: width,
        height: height
      });
      var geoJson = {type: 'LineString', coordinates: [[0, 0], [width, height]]};
      var worldTransform = component.getWorldTransform();
      var path = d3.geoPath().projection(worldTransform);
      var result = path(geoJson);
      assert.equal(result, 'M-10,5L10,-5', 'Line coords should start at top left corner and end at bottom right corner');
    });
  });

  suite('#getFittedProjection', function () {
    test('exists as a method on the component', function () {
      assert.property(component, 'getFittedProjection');
    });
    test('returns a projection fits and centers the given geoJson in A-Frame space', function () {
      var geoJson = {type: 'LineString', coordinates: [[0, 0], [100, 100]]};
      el.setAttribute('geo-projection', {
        projection: 'geoIdentity',
        width: 2,
        height: 2
      });
      var projection = component.getFittedProjection(geoJson);
      var path = d3.geoPath().projection(projection);
      var result = path(geoJson);
      assert.equal(result, 'M-1,1L1,-1', 'Line coords should start at top left corner and end at bottom right corner');
    });
  });
});
