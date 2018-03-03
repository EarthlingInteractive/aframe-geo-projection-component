/* global assert, setup, teardown, suite, test */
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
    suite('srcType property', function () {
      test('exists', function () {
        assert.property(component.data, 'srcType');
      });
      test('defaults to geojson', function () {
        assert.propertyVal(component.data, 'srcType', 'geojson');
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
    suite('isCCW property', function () {
      test('exists', function () {
        assert.property(component.data, 'isCCW');
      });
      test('defaults to false', function () {
        assert.propertyVal(component.data, 'isCCW', false);
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
    suite('meshType property', function () {
      test('exists', function () {
        assert.property(component.data, 'meshType');
      });
      test('defaults to line', function () {
        assert.propertyVal(component.data, 'meshType', 'line');
      });
    });
  });

  suite('dependencies', function () {
    suite('material', function () {
      test('can access a material defined on the component', function () {
        el.setAttribute('material', {color: 'red'});
        var material = el.components.material.material;
        assert.instanceOf(material, THREE.Material, 'is an instance of Material');
        assert.propertyVal(material.color, 'r', 1);
        assert.propertyVal(material.color, 'g', 0);
        assert.propertyVal(material.color, 'b', 0);
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

  suite('#update', function () {
    suite('when the src property changes', function () {
      test('loads the new src asset', function () {
        var fakeLoader = sandbox.createStubInstance(THREE.FileLoader);
        var loaderStub = sandbox.stub(THREE, 'FileLoader');
        loaderStub.returns(fakeLoader);
        sandbox.spy(component, 'update');
        sandbox.stub(component.onSrcLoaded, 'bind').callsFake(function () { return component.onSrcLoaded; });

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
    suite('when srcType is geojson', function () {
      test('parses the given text into JSON and renders it', function () {
        el.setAttribute('geo-projection', {
          srcType: 'geojson'
        });

        sandbox.spy(component, 'render');
        var text = '{ "type": "LineString", "coordinates": [[0, 0], [1, 1]] }';
        component.onSrcLoaded(text);

        assert.deepEqual(component.geoJson, {type: 'LineString', coordinates: [[0, 0], [1, 1]]});
        sinon.assert.called(component.render);
      });
    });
    suite('when srcType is topojson', function () {
      var topoJson = '{"type":"Topology","transform":{"scale":[0.036003600360036005,0.017361589674592462],"translate":[-180,-89.99892578124998]},"objects":{"aruba":{"type":"Polygon","arcs":[[0]],"id":533},"line":{"type":"LineString","arcs":[[1]],"id":534}},"arcs":[[[3058,5901],[0,-2],[-2,1],[-1,3],[-2,3],[0,3],[1,1],[1,-3],[2,-5],[1,-1]],[[3058,5901],[0,1]]]}';
      suite('and topologyObject is defined', function () {
        test('renders the given topologyObject', function () {
          el.setAttribute('geo-projection', {
            srcType: 'topojson',
            topologyObject: 'line'
          });

          sandbox.spy(component, 'render');
          component.onSrcLoaded(topoJson);

          var expectedGeoJsonSnippet = {
            geometry: {
              type: 'LineString',
              coordinates: [[-69.9009900990099, 12.451814888520133], [-69.9009900990099, 12.469176478194726]]
            }
          };
          assert.deepInclude(component.geoJson, expectedGeoJsonSnippet);
          sinon.assert.called(component.render);
        });
      });
      suite('and topologyObject is not defined', function () {
        test('chooses the first object as the feature', function () {
          el.setAttribute('geo-projection', {
            srcType: 'topojson'
          });

          sandbox.spy(component, 'render');
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
          assert.deepInclude(component.geoJson, expectedGeoJsonSnippet);
          sinon.assert.called(component.render);
        });
      });
    });
  });

  suite('#render', function () {
    test('sets an Object3D on the component', function () {
      component.geoJson = {type: 'LineString', coordinates: [[0, 0], [1, 1]]};
      component.render();
      var object3D = component.el.getObject3D('map');
      assert.instanceOf(object3D, THREE.Object3D);
    });
  });

  suite('#remove', function () {
    test('removes the Object3D set on the component', function () {
      var geoJson = {type: 'LineString', coordinates: [[0, 0], [1, 1]]};
      component.render(geoJson);
      component.remove();
      var object3D = component.el.getObject3D('map');
      assert.isUndefined(object3D);
    });
  });
});
