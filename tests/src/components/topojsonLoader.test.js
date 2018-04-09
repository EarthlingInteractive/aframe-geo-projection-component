/* global assert, setup, teardown, suite, test */
require('aframe');
var sinon = require('sinon');
var sandbox = sinon.createSandbox();
require('../../../src/components/topojsonLoader');
var entityFactory = require('../../helpers').entityFactory;
var GEO_SRC_LOADED_EVENT = require('../../../src/constants').GEO_SRC_LOADED_EVENT;

var THREE = AFRAME.THREE;

suite('topojson-loader component', function () {
  var component;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'topojson-loader') {
        return;
      }
      component = el.components['topojson-loader'];
      done();
    });
    el.setAttribute('topojson-loader', {});
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
    suite('topologyObject property', function () {
      test('exists', function () {
        assert.property(component.data, 'topologyObject');
      });
      test('defaults to empty string', function () {
        assert.propertyVal(component.data, 'topologyObject', '');
      });
    });
  });

  suite('#init', function () {
    test('initializes a FileLoader', function () {
      test('initializes a FileLoader', function () {
        component.init();
        assert.instanceOf(component.loader, THREE.FileLoader);
      });
    });
  });

  suite('#update', function () {
    suite('when the src property changes', function () {
      test('loads the src data', function () {
        var fakeLoader = { load: sandbox.spy() };
        component.loader = fakeLoader;

        component.data = { src: '/base/tests/assets/test.topo.json', topologyObject: '' };
        component.update({ src: '', topologyObject: '' });

        sinon.assert.calledWith(fakeLoader.load, '/base/tests/assets/test.topo.json', component.onSrcLoaded);
      });
    });
    suite('when the topologyObject property changes', function () {
      test('loads the src data', function () {
        var fakeLoader = { load: sandbox.spy() };
        component.loader = fakeLoader;

        component.data = { src: '/base/tests/assets/test.topo.json', topologyObject: 'aruba' };
        component.update({ src: '', topologyObject: '' });

        sinon.assert.calledWith(fakeLoader.load, '/base/tests/assets/test.topo.json', component.onSrcLoaded);
      });
    });
    suite('when the src property is blank', function () {
      test('does not try to load the src data', function () {
        var fakeLoader = { load: sandbox.spy() };
        component.loader = fakeLoader;

        component.data = { src: '', topologyObject: '' };
        component.update({ src: '/base/tests/assets/test.topo.json', topologyObject: '' });

        sinon.assert.notCalled(fakeLoader.load);
      });
    });
    suite('when no properties have changed', function () {
      test('does not try to load the src data', function () {
        var fakeLoader = { load: sandbox.spy() };
        component.loader = fakeLoader;

        component.data = { src: '/base/tests/assets/test.topo.json', topologyObject: 'aruba' };
        component.update({ src: '/base/tests/assets/test.topo.json', topologyObject: 'aruba' });

        sinon.assert.notCalled(fakeLoader.load);
      });
    });
  });

  suite('#onSrcLoaded', function () {
    var topoJson = '{"type":"Topology","transform":{"scale":[0.036003600360036005,0.017361589674592462],"translate":[-180,-89.99892578124998]},"objects":{"aruba":{"type":"Polygon","arcs":[[0]],"id":533},"line":{"type":"LineString","arcs":[[1]],"id":534}},"arcs":[[[3058,5901],[0,-2],[-2,1],[-1,3],[-2,3],[0,3],[1,1],[1,-3],[2,-5],[1,-1]],[[3058,5901],[0,1]]]}';
    suite('when topologyObject is defined', function () {
      test('emits an event containing the GeoJSON for the given topologyObject', function () {
        el.setAttribute('topojson-loader', { topologyObject: 'line' });

        var eventHandlerSpy = sandbox.spy();
        el.addEventListener(GEO_SRC_LOADED_EVENT, eventHandlerSpy);

        component.onSrcLoaded(topoJson);

        var expectedGeoJsonSnippet = {
          geometry: {
            type: 'LineString',
            coordinates: [[-69.9009900990099, 12.451814888520133], [-69.9009900990099, 12.469176478194726]]
          }
        };
        sinon.assert.calledWithMatch(eventHandlerSpy, { detail: { geoJson: expectedGeoJsonSnippet } });
      });
    });
    suite('when topologyObject is not defined', function () {
      test('emits an event containing the GeoJSON for the first topology object', function () {
        var eventHandlerSpy = sandbox.spy();
        el.addEventListener(GEO_SRC_LOADED_EVENT, eventHandlerSpy);

        component.onSrcLoaded(topoJson);

        var expectedGeoJsonSnippet = {
          geometry: {
            'type': 'Polygon',
            'coordinates': [
              [
                [-69.9009900990099, 12.451814888520133], [-69.9009900990099, 12.417091709170947],
                [-69.97299729972997, 12.43445329884554], [-70.00900090009, 12.486538067869319],
                [-70.08100810081008, 12.538622836893097], [-70.08100810081008, 12.590707605916876],
                [-70.04500450045005, 12.608069195591469], [-70.00900090009, 12.55598442656769],
                [-69.93699369936994, 12.469176478194726], [-69.9009900990099, 12.451814888520133]
              ]
            ]
          }
        };
        sinon.assert.calledWithMatch(eventHandlerSpy, { detail: { geoJson: expectedGeoJsonSnippet } });
      });
    });
    suite('when topologyObject does not exist in the TopoJSON src file', function () {
      test('throws an error', function () {
        assert.throws(
          function () {
            component.data.topologyObject = 'bad';
            component.onSrcLoaded(topoJson);
          },
          'TopologyObject with name bad could not be found.');
      });
    });
  });
});
