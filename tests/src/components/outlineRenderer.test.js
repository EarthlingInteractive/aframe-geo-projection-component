/* global assert, sinon, setup, suite, test */
require('aframe');
require('../../../index');
require('../../../src/components/outlineRenderer');

var GEO_DATA_READY_EVENT = require('../../../src/constants').GEO_DATA_READY_EVENT;
var entityFactory = require('../../helpers').entityFactory;

var THREE = AFRAME.THREE;

var lineGeoJson = {type: 'LineString', coordinates: [[0, 0], [100, 100]]};

suite('geo-outline-renderer', function () {
  var component;
  var el;

  setup(function (done) {
    el = entityFactory();
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== 'geo-outline-renderer') {
        return;
      }
      component = el.components['geo-outline-renderer'];
      done();
    });
    el.setAttribute('geo-outline-renderer', {});
  });

  suite('schema definition', function () {
    suite('color property', function () {
      test('exists', function () {
        assert.property(component.data, 'color');
      });
      test('has no default', function () {
        assert.propertyVal(component.data, 'color', '');
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
      var object3D = component.el.getObject3D('outlineMap');
      assert.notExists(object3D);

      component.geoProjectionComponent.geoJson = lineGeoJson;
      el.emit(GEO_DATA_READY_EVENT);
      object3D = component.el.getObject3D('outlineMap');
      assert.instanceOf(object3D, THREE.Object3D);
    });
  });

  suite('#update', function () {
    suite('when a color has been set', function () {
      test('uses a LineBasicMaterial with that color for the material', function () {
        component.data.color = 'red';
        component.update({ color: '' });
        assert.isTrue(component.material.color.equals(new THREE.Color('red')));
        assert.instanceOf(component.material, THREE.LineBasicMaterial);
      });
    });
    suite('when the color does not change', function () {
      test('does not change the material', function () {
        el.setAttribute('material', { color: 'blue' });
        component.data.color = '';
        component.update({ color: '' });
        assert.equal(component.material, el.components.material.material);
      });
    });
    suite('when no color is set', function () {
      test('uses the entity material', function () {
        el.setAttribute('material', { color: 'blue' });
        component.data.color = '';
        component.update({ color: 'green' });
        assert.isTrue(component.material.color.equals(new THREE.Color('blue')));
      });
    });
    suite('when the geoProjectComponent has geoJson loaded', function () {
      test('renders an Object3D', function () {
        component.render = sinon.spy();
        component.geoProjectionComponent.geoJson = lineGeoJson;
        component.update({});
        sinon.assert.called(component.render);
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
      component.geoProjectionComponent.geoJson = lineGeoJson;
      component.render();
      var object3D = component.el.getObject3D('outlineMap');
      assert.instanceOf(object3D, THREE.Object3D);
    });
    test('renders the output as LineSegments', function () {
      component.geoProjectionComponent.geoJson = lineGeoJson;
      component.render();
      var object3D = component.el.getObject3D('outlineMap');
      assert.instanceOf(object3D, THREE.LineSegments);
    });
    test('renders the output with the given material', function () {
      component.geoProjectionComponent.geoJson = lineGeoJson;
      component.render();
      var object3D = component.el.getObject3D('outlineMap');
      assert.equal(object3D.material, component.material);
    });
  });

  suite('#remove', function () {
    test('removes the Object3D set on the component', function () {
      component.geoProjectionComponent.geoJson = lineGeoJson;
      component.render();

      component.remove();

      var object3D = component.el.getObject3D('outlineMap');
      assert.isUndefined(object3D);
    });
    test('stops listening for the GEO_DATA_READY_EVENT event', function () {
      component.geoProjectionComponent.geoJson = lineGeoJson;
      component.render();

      component.remove();

      var object3D = component.el.getObject3D('outlineMap');
      assert.isUndefined(object3D);

      el.emit(GEO_DATA_READY_EVENT);

      object3D = component.el.getObject3D('outlineMap');
      assert.isUndefined(object3D);
    });
  });
});
