/* global assert, setup, suite, test */
require('aframe');
require('../../../index');
require('../../../src/components/shapeRenderer');

var GEO_DATA_READY_EVENT = require('../../../src/constants').GEO_DATA_READY_EVENT;
var entityFactory = require('../../helpers').entityFactory;

var THREE = AFRAME.THREE;

var squareGeoJson = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]]
  }
};

suite('geo-shape-renderer', function () {
  var component;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'geo-shape-renderer') {
        return;
      }
      component = el.components['geo-shape-renderer'];
      done();
    });
    el.setAttribute('geo-shape-renderer', {});
  });

  suite('schema definition', function () {
    suite('isCCW property', function () {
      test('exists', function () {
        assert.property(component.data, 'isCCW');
      });
      test('defaults to false', function () {
        assert.propertyVal(component.data, 'isCCW', false);
      });
    });
  });

  suite('dependencies', function () {
    suite('material', function () {
      test('can access a material defined on the entity', function () {
        el.setAttribute('material', {color: 'red'});
        var material = el.components.material.material;
        assert.instanceOf(material, THREE.Material, 'is an instance of Material');
        assert.propertyVal(material.color, 'r', 1);
        assert.propertyVal(material.color, 'g', 0);
        assert.propertyVal(material.color, 'b', 0);
      });
    });
    suite('geo-projection', function () {
      test('can access a geo-projection component defined on the entity', function () {
        el.setAttribute('geo-projection', {});
        var geoProjection = el.components['geo-projection'];
        assert.exists(geoProjection);
      });
    });
  });

  suite('#init', function () {
    test('connects to the geo-projection system', function () {
      assert.equal(component.system.name, 'geo-projection');
    });
    test('connects to the geo-projection component', function () {
      assert.equal(component.geoProjectionComponent.name, 'geo-projection');
    });
    test('listens for the GEO_DATA_READY_EVENT event', function () {
      var object3D = component.el.getObject3D('shapeMap');
      assert.notExists(object3D);

      component.geoProjectionComponent.geoJson = squareGeoJson;
      el.emit(GEO_DATA_READY_EVENT);
      object3D = component.el.getObject3D('shapeMap');
      assert.instanceOf(object3D, THREE.Object3D);
    });
  });

  suite('#update', function () {
    suite('when the geoProjectComponent has geoJson loaded', function () {
      suite('and the value of isCCW changes', function () {
        test('re-renders', function () {
          component.render = sinon.spy();

          component.geoProjectionComponent.geoJson = squareGeoJson;

          component.data = { isCCW: false };
          component.update({ isCCW: true });

          sinon.assert.called(component.render);
        });
      });
      suite('and the value of isCCW has not changed', function () {
        test('does not re-render', function () {
          component.render = sinon.spy();

          component.geoProjectionComponent.geoJson = squareGeoJson;

          component.data = { isCCW: false };
          component.update({ isCCW: false });

          sinon.assert.notCalled(component.render);
        });
      });
    });
    suite('when the geoProjectComponent has no geoJson loaded', function () {
      test('does not render anything', function () {
        component.render = sinon.spy();
        component.geoProjectionComponent.geoJson = null;
        component.update({});
        sinon.assert.notCalled(component.render);
      });
    });
  });

  suite('#render', function () {
    test('sets an Object3D on the component', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('shapeMap');
      assert.instanceOf(object3D, THREE.Object3D);
    });
    test('renders the output as a Mesh', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('shapeMap');
      assert.instanceOf(object3D, THREE.Mesh);
    });
    test('renders the output with a ShapeBufferGeometry', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('shapeMap');
      assert.instanceOf(object3D.geometry, THREE.ShapeBufferGeometry);
    });
    test('renders the output with the given material', function () {
      var expectedMaterial = el.components.material.material;
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();
      var object3D = component.el.getObject3D('shapeMap');
      assert.equal(object3D.material, expectedMaterial);
    });
  });

  suite('#remove', function () {
    test('removes the Object3D set on the component', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();

      component.remove();

      var object3D = component.el.getObject3D('shapeMap');
      assert.isUndefined(object3D);
    });
    test('stops listening for the GEO_DATA_READY_EVENT event', function () {
      component.geoProjectionComponent.geoJson = squareGeoJson;
      component.render();

      component.remove();

      var object3D = component.el.getObject3D('shapeMap');
      assert.isUndefined(object3D);

      el.emit(GEO_DATA_READY_EVENT);

      object3D = component.el.getObject3D('shapeMap');
      assert.isUndefined(object3D);
    });
  });
});
