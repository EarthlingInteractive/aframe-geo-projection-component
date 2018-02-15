/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	/* global AFRAME */

	__webpack_require__(1);
	var renderer = __webpack_require__(2);
	var topojson = __webpack_require__(15);

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}
	var THREE = AFRAME.THREE;

	/**
	 * Geo Projection component for A-Frame.
	 */
	AFRAME.registerComponent('geo-projection', {
	  dependencies: ['material'],

	  schema: {
	    src: {
	      type: 'asset'
	    },
	    srcType: {
	      oneOf: ['geojson', 'topojson'],
	      default: 'geojson'
	    },
	    topologyObject: {
	      type: 'string'
	    },
	    isCCW: {
	      type: 'boolean',
	      default: false
	    },
	    projection: {
	      default: 'geoIdentity'
	    },
	    meshType: {
	      oneOf: ['line', 'shape', 'extrude'],
	      default: 'line'
	    },
	    width: {default: 1},
	    height: {default: 1}
	  },

	  /**
	   * Called once when component is attached. Generally for initial setup.
	   */
	  init: function () {
	    this.loader = new THREE.FileLoader();
	  },

	  /**
	   * Called when component is attached and when component data changes.
	   * Generally modifies the entity based on the data.
	   */
	  update: function (oldData) {
	    var src = this.data.src;
	    if (src && src !== oldData.src) {
	      this.loader.load(src, this.onSrcLoaded.bind(this));
	    }
	  },

	  onSrcLoaded: function (text) {
	    var json = JSON.parse(text);

	    var geoJson = json;
	    if (this.data.srcType === 'topojson') {
	      var topologyObjectName = this.data.topologyObject;
	      if (!this.data.topologyObject) {
	        topologyObjectName = Object.keys(json.objects)[0];
	      }
	      geoJson = topojson.feature(json, json.objects[topologyObjectName]);
	    }

	    this.render(geoJson);
	  },

	  render: function (geoJson) {
	    var material = this.el.components.material.material;
	    var renderOptions = {
	      projectionName: this.data.projection,
	      meshType: this.data.meshType,
	      material: material,
	      height: this.data.height,
	      width: this.data.width,
	      isCCW: this.data.isCCW
	    };
	    var object3D = renderer.renderGeoJson(geoJson, renderOptions);
	    this.el.setObject3D('map', object3D);
	  },

	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function () {
	    var obj = this.el.getObject3D('map');
	    if (obj) {
	      this.el.removeObject3D('map');
	    }
	  }
	});


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	var THREE = AFRAME.THREE;
	// from https://stackoverflow.com/questions/39905663/aframe-how-to-put-three-linebasicmaterial-in-aframe
	AFRAME.registerShader('linebasic', {
	  schema: {
	    blending:       {default: THREE.NormalBlending},
	    color:          {type: 'color', default: '#000', is: 'uniform'},
	    depthTest:      {default: true},
	    depthFunc:      {default: THREE.LessEqualDepth},
	    depthWrite:     {default: true},
	    fog:            {default: false},
	    linewidth:      {default: 1},
	    linecap:        {default: 'round'},
	    linejoin:       {default: 'round'},
	    opacity:        {default: 1},
	    side:           {default: THREE.FrontSide},
	    transparent:    {default: false},
	    vertexColors:   {default: THREE.NoColors},
	    visible:        {default: true}
	  },
	  init: function (data) {
	    data = AFRAME.utils.extend({}, data);
	    delete data.flatShading;
	    delete data.shader;
	    delete data.npot;
	    delete data.repeat;
	    delete data.offset;
	    this.material = new THREE.LineBasicMaterial(data);
	    this.update(data);
	  },
	  update: function (data) {
	    this.material.clone(data);
	  }
	});


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	var d3 = __webpack_require__(3);
	var projectionLib = __webpack_require__(5);
	var ThreeJSRenderContext = __webpack_require__(14).ThreeJSRenderContext;

	var THREE = AFRAME.THREE;

	module.exports = {
	  /**
	   * Takes the input geoJson and renders it as an Object3D.
	   *
	   * @param geoJson the geoJson object to render
	   * @param renderOptions object containing parameters for rendering
	   * @param renderOptions.projectionName the name of a projection from d3-geo or d3-geo-projection
	   * @param renderOptions.meshType the type of Object3D to render -- 'line' or 'shape'
	   * @param renderOptions.material the THREE.Material to use in the resulting Object3D
	   * @param renderOptions.height the height in A-Frame units
	   * @param renderOptions.width the width in A-Frame units
	   * @param renderOptions.isCCW true if shapes are defined counter-clockwise and holes defined clockwise; false for the reverse
	   * @return THREE.Object3D
	   */
	  renderGeoJson: function (geoJson, renderOptions) {
	    var projectionName = renderOptions.projectionName;
	    var height = renderOptions.height;
	    var width = renderOptions.width;
	    var meshType = renderOptions.meshType;
	    var material = renderOptions.material;
	    var isCCW = renderOptions.isCCW;

	    var projection = projectionLib.getFittedProjection(projectionName, geoJson, height, width);
	    var shapePath = new THREE.ShapePath();
	    var mapRenderContext = new ThreeJSRenderContext(shapePath);
	    var mapPath = d3.geoPath(projection, mapRenderContext);
	    mapPath(geoJson);

	    switch (meshType) {
	      case 'line':
	        var lineGeometry = new THREE.BufferGeometry();
	        var vertices = mapRenderContext.toVertices();
	        lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
	        return new THREE.LineSegments(lineGeometry, material);
	      case 'shape':
	        // TODO: pass isCCW as an option
	        const shapes = mapRenderContext.toShapes(isCCW);
	        var shapeGeometry = new THREE.ShapeBufferGeometry(shapes);
	        return new THREE.Mesh(shapeGeometry, material);
	      case 'extrude':
	        const extrudeSettings = {
	          amount: 1,
	          bevelEnabled: false
	        };
	        const extShapes = mapRenderContext.toShapes(isCCW);
	        var extGeometry = new THREE.ExtrudeBufferGeometry(extShapes, extrudeSettings);
	        return new THREE.Mesh(extGeometry, material);
	      default:
	        throw new Error('Unsupported meshType: ' + meshType);
	    }
	  }
	};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-geo/ Version 1.9.1. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports, __webpack_require__(4)) :
		typeof define === 'function' && define.amd ? define(['exports', 'd3-array'], factory) :
		(factory((global.d3 = global.d3 || {}),global.d3));
	}(this, (function (exports,d3Array) { 'use strict';

	// Adds floating point numbers with twice the normal precision.
	// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
	// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
	// 305–363 (1997).
	// Code adapted from GeographicLib by Charles F. F. Karney,
	// http://geographiclib.sourceforge.net/

	var adder = function() {
	  return new Adder;
	};

	function Adder() {
	  this.reset();
	}

	Adder.prototype = {
	  constructor: Adder,
	  reset: function() {
	    this.s = // rounded value
	    this.t = 0; // exact error
	  },
	  add: function(y) {
	    add(temp, y, this.t);
	    add(this, temp.s, this.s);
	    if (this.s) this.t += temp.t;
	    else this.s = temp.t;
	  },
	  valueOf: function() {
	    return this.s;
	  }
	};

	var temp = new Adder;

	function add(adder, a, b) {
	  var x = adder.s = a + b,
	      bv = x - a,
	      av = x - bv;
	  adder.t = (a - av) + (b - bv);
	}

	var epsilon = 1e-6;
	var epsilon2 = 1e-12;
	var pi = Math.PI;
	var halfPi = pi / 2;
	var quarterPi = pi / 4;
	var tau = pi * 2;

	var degrees = 180 / pi;
	var radians = pi / 180;

	var abs = Math.abs;
	var atan = Math.atan;
	var atan2 = Math.atan2;
	var cos = Math.cos;
	var ceil = Math.ceil;
	var exp = Math.exp;

	var log = Math.log;
	var pow = Math.pow;
	var sin = Math.sin;
	var sign = Math.sign || function(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
	var sqrt = Math.sqrt;
	var tan = Math.tan;

	function acos(x) {
	  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
	}

	function asin(x) {
	  return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
	}

	function haversin(x) {
	  return (x = sin(x / 2)) * x;
	}

	function noop() {}

	function streamGeometry(geometry, stream) {
	  if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
	    streamGeometryType[geometry.type](geometry, stream);
	  }
	}

	var streamObjectType = {
	  Feature: function(object, stream) {
	    streamGeometry(object.geometry, stream);
	  },
	  FeatureCollection: function(object, stream) {
	    var features = object.features, i = -1, n = features.length;
	    while (++i < n) streamGeometry(features[i].geometry, stream);
	  }
	};

	var streamGeometryType = {
	  Sphere: function(object, stream) {
	    stream.sphere();
	  },
	  Point: function(object, stream) {
	    object = object.coordinates;
	    stream.point(object[0], object[1], object[2]);
	  },
	  MultiPoint: function(object, stream) {
	    var coordinates = object.coordinates, i = -1, n = coordinates.length;
	    while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
	  },
	  LineString: function(object, stream) {
	    streamLine(object.coordinates, stream, 0);
	  },
	  MultiLineString: function(object, stream) {
	    var coordinates = object.coordinates, i = -1, n = coordinates.length;
	    while (++i < n) streamLine(coordinates[i], stream, 0);
	  },
	  Polygon: function(object, stream) {
	    streamPolygon(object.coordinates, stream);
	  },
	  MultiPolygon: function(object, stream) {
	    var coordinates = object.coordinates, i = -1, n = coordinates.length;
	    while (++i < n) streamPolygon(coordinates[i], stream);
	  },
	  GeometryCollection: function(object, stream) {
	    var geometries = object.geometries, i = -1, n = geometries.length;
	    while (++i < n) streamGeometry(geometries[i], stream);
	  }
	};

	function streamLine(coordinates, stream, closed) {
	  var i = -1, n = coordinates.length - closed, coordinate;
	  stream.lineStart();
	  while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
	  stream.lineEnd();
	}

	function streamPolygon(coordinates, stream) {
	  var i = -1, n = coordinates.length;
	  stream.polygonStart();
	  while (++i < n) streamLine(coordinates[i], stream, 1);
	  stream.polygonEnd();
	}

	var geoStream = function(object, stream) {
	  if (object && streamObjectType.hasOwnProperty(object.type)) {
	    streamObjectType[object.type](object, stream);
	  } else {
	    streamGeometry(object, stream);
	  }
	};

	var areaRingSum = adder();

	var areaSum = adder();
	var lambda00;
	var phi00;
	var lambda0;
	var cosPhi0;
	var sinPhi0;

	var areaStream = {
	  point: noop,
	  lineStart: noop,
	  lineEnd: noop,
	  polygonStart: function() {
	    areaRingSum.reset();
	    areaStream.lineStart = areaRingStart;
	    areaStream.lineEnd = areaRingEnd;
	  },
	  polygonEnd: function() {
	    var areaRing = +areaRingSum;
	    areaSum.add(areaRing < 0 ? tau + areaRing : areaRing);
	    this.lineStart = this.lineEnd = this.point = noop;
	  },
	  sphere: function() {
	    areaSum.add(tau);
	  }
	};

	function areaRingStart() {
	  areaStream.point = areaPointFirst;
	}

	function areaRingEnd() {
	  areaPoint(lambda00, phi00);
	}

	function areaPointFirst(lambda, phi) {
	  areaStream.point = areaPoint;
	  lambda00 = lambda, phi00 = phi;
	  lambda *= radians, phi *= radians;
	  lambda0 = lambda, cosPhi0 = cos(phi = phi / 2 + quarterPi), sinPhi0 = sin(phi);
	}

	function areaPoint(lambda, phi) {
	  lambda *= radians, phi *= radians;
	  phi = phi / 2 + quarterPi; // half the angular distance from south pole

	  // Spherical excess E for a spherical triangle with vertices: south pole,
	  // previous point, current point.  Uses a formula derived from Cagnoli’s
	  // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
	  var dLambda = lambda - lambda0,
	      sdLambda = dLambda >= 0 ? 1 : -1,
	      adLambda = sdLambda * dLambda,
	      cosPhi = cos(phi),
	      sinPhi = sin(phi),
	      k = sinPhi0 * sinPhi,
	      u = cosPhi0 * cosPhi + k * cos(adLambda),
	      v = k * sdLambda * sin(adLambda);
	  areaRingSum.add(atan2(v, u));

	  // Advance the previous points.
	  lambda0 = lambda, cosPhi0 = cosPhi, sinPhi0 = sinPhi;
	}

	var area = function(object) {
	  areaSum.reset();
	  geoStream(object, areaStream);
	  return areaSum * 2;
	};

	function spherical(cartesian) {
	  return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
	}

	function cartesian(spherical) {
	  var lambda = spherical[0], phi = spherical[1], cosPhi = cos(phi);
	  return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
	}

	function cartesianDot(a, b) {
	  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}

	function cartesianCross(a, b) {
	  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
	}

	// TODO return a
	function cartesianAddInPlace(a, b) {
	  a[0] += b[0], a[1] += b[1], a[2] += b[2];
	}

	function cartesianScale(vector, k) {
	  return [vector[0] * k, vector[1] * k, vector[2] * k];
	}

	// TODO return d
	function cartesianNormalizeInPlace(d) {
	  var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
	  d[0] /= l, d[1] /= l, d[2] /= l;
	}

	var lambda0$1;
	var phi0;
	var lambda1;
	var phi1;
	var lambda2;
	var lambda00$1;
	var phi00$1;
	var p0;
	var deltaSum = adder();
	var ranges;
	var range$1;

	var boundsStream = {
	  point: boundsPoint,
	  lineStart: boundsLineStart,
	  lineEnd: boundsLineEnd,
	  polygonStart: function() {
	    boundsStream.point = boundsRingPoint;
	    boundsStream.lineStart = boundsRingStart;
	    boundsStream.lineEnd = boundsRingEnd;
	    deltaSum.reset();
	    areaStream.polygonStart();
	  },
	  polygonEnd: function() {
	    areaStream.polygonEnd();
	    boundsStream.point = boundsPoint;
	    boundsStream.lineStart = boundsLineStart;
	    boundsStream.lineEnd = boundsLineEnd;
	    if (areaRingSum < 0) lambda0$1 = -(lambda1 = 180), phi0 = -(phi1 = 90);
	    else if (deltaSum > epsilon) phi1 = 90;
	    else if (deltaSum < -epsilon) phi0 = -90;
	    range$1[0] = lambda0$1, range$1[1] = lambda1;
	  }
	};

	function boundsPoint(lambda, phi) {
	  ranges.push(range$1 = [lambda0$1 = lambda, lambda1 = lambda]);
	  if (phi < phi0) phi0 = phi;
	  if (phi > phi1) phi1 = phi;
	}

	function linePoint(lambda, phi) {
	  var p = cartesian([lambda * radians, phi * radians]);
	  if (p0) {
	    var normal = cartesianCross(p0, p),
	        equatorial = [normal[1], -normal[0], 0],
	        inflection = cartesianCross(equatorial, normal);
	    cartesianNormalizeInPlace(inflection);
	    inflection = spherical(inflection);
	    var delta = lambda - lambda2,
	        sign$$1 = delta > 0 ? 1 : -1,
	        lambdai = inflection[0] * degrees * sign$$1,
	        phii,
	        antimeridian = abs(delta) > 180;
	    if (antimeridian ^ (sign$$1 * lambda2 < lambdai && lambdai < sign$$1 * lambda)) {
	      phii = inflection[1] * degrees;
	      if (phii > phi1) phi1 = phii;
	    } else if (lambdai = (lambdai + 360) % 360 - 180, antimeridian ^ (sign$$1 * lambda2 < lambdai && lambdai < sign$$1 * lambda)) {
	      phii = -inflection[1] * degrees;
	      if (phii < phi0) phi0 = phii;
	    } else {
	      if (phi < phi0) phi0 = phi;
	      if (phi > phi1) phi1 = phi;
	    }
	    if (antimeridian) {
	      if (lambda < lambda2) {
	        if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
	      } else {
	        if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
	      }
	    } else {
	      if (lambda1 >= lambda0$1) {
	        if (lambda < lambda0$1) lambda0$1 = lambda;
	        if (lambda > lambda1) lambda1 = lambda;
	      } else {
	        if (lambda > lambda2) {
	          if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
	        } else {
	          if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
	        }
	      }
	    }
	  } else {
	    ranges.push(range$1 = [lambda0$1 = lambda, lambda1 = lambda]);
	  }
	  if (phi < phi0) phi0 = phi;
	  if (phi > phi1) phi1 = phi;
	  p0 = p, lambda2 = lambda;
	}

	function boundsLineStart() {
	  boundsStream.point = linePoint;
	}

	function boundsLineEnd() {
	  range$1[0] = lambda0$1, range$1[1] = lambda1;
	  boundsStream.point = boundsPoint;
	  p0 = null;
	}

	function boundsRingPoint(lambda, phi) {
	  if (p0) {
	    var delta = lambda - lambda2;
	    deltaSum.add(abs(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta);
	  } else {
	    lambda00$1 = lambda, phi00$1 = phi;
	  }
	  areaStream.point(lambda, phi);
	  linePoint(lambda, phi);
	}

	function boundsRingStart() {
	  areaStream.lineStart();
	}

	function boundsRingEnd() {
	  boundsRingPoint(lambda00$1, phi00$1);
	  areaStream.lineEnd();
	  if (abs(deltaSum) > epsilon) lambda0$1 = -(lambda1 = 180);
	  range$1[0] = lambda0$1, range$1[1] = lambda1;
	  p0 = null;
	}

	// Finds the left-right distance between two longitudes.
	// This is almost the same as (lambda1 - lambda0 + 360°) % 360°, except that we want
	// the distance between ±180° to be 360°.
	function angle(lambda0, lambda1) {
	  return (lambda1 -= lambda0) < 0 ? lambda1 + 360 : lambda1;
	}

	function rangeCompare(a, b) {
	  return a[0] - b[0];
	}

	function rangeContains(range$$1, x) {
	  return range$$1[0] <= range$$1[1] ? range$$1[0] <= x && x <= range$$1[1] : x < range$$1[0] || range$$1[1] < x;
	}

	var bounds = function(feature) {
	  var i, n, a, b, merged, deltaMax, delta;

	  phi1 = lambda1 = -(lambda0$1 = phi0 = Infinity);
	  ranges = [];
	  geoStream(feature, boundsStream);

	  // First, sort ranges by their minimum longitudes.
	  if (n = ranges.length) {
	    ranges.sort(rangeCompare);

	    // Then, merge any ranges that overlap.
	    for (i = 1, a = ranges[0], merged = [a]; i < n; ++i) {
	      b = ranges[i];
	      if (rangeContains(a, b[0]) || rangeContains(a, b[1])) {
	        if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
	        if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
	      } else {
	        merged.push(a = b);
	      }
	    }

	    // Finally, find the largest gap between the merged ranges.
	    // The final bounding box will be the inverse of this gap.
	    for (deltaMax = -Infinity, n = merged.length - 1, i = 0, a = merged[n]; i <= n; a = b, ++i) {
	      b = merged[i];
	      if ((delta = angle(a[1], b[0])) > deltaMax) deltaMax = delta, lambda0$1 = b[0], lambda1 = a[1];
	    }
	  }

	  ranges = range$1 = null;

	  return lambda0$1 === Infinity || phi0 === Infinity
	      ? [[NaN, NaN], [NaN, NaN]]
	      : [[lambda0$1, phi0], [lambda1, phi1]];
	};

	var W0;
	var W1;
	var X0;
	var Y0;
	var Z0;
	var X1;
	var Y1;
	var Z1;
	var X2;
	var Y2;
	var Z2;
	var lambda00$2;
	var phi00$2;
	var x0;
	var y0;
	var z0; // previous point

	var centroidStream = {
	  sphere: noop,
	  point: centroidPoint,
	  lineStart: centroidLineStart,
	  lineEnd: centroidLineEnd,
	  polygonStart: function() {
	    centroidStream.lineStart = centroidRingStart;
	    centroidStream.lineEnd = centroidRingEnd;
	  },
	  polygonEnd: function() {
	    centroidStream.lineStart = centroidLineStart;
	    centroidStream.lineEnd = centroidLineEnd;
	  }
	};

	// Arithmetic mean of Cartesian vectors.
	function centroidPoint(lambda, phi) {
	  lambda *= radians, phi *= radians;
	  var cosPhi = cos(phi);
	  centroidPointCartesian(cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi));
	}

	function centroidPointCartesian(x, y, z) {
	  ++W0;
	  X0 += (x - X0) / W0;
	  Y0 += (y - Y0) / W0;
	  Z0 += (z - Z0) / W0;
	}

	function centroidLineStart() {
	  centroidStream.point = centroidLinePointFirst;
	}

	function centroidLinePointFirst(lambda, phi) {
	  lambda *= radians, phi *= radians;
	  var cosPhi = cos(phi);
	  x0 = cosPhi * cos(lambda);
	  y0 = cosPhi * sin(lambda);
	  z0 = sin(phi);
	  centroidStream.point = centroidLinePoint;
	  centroidPointCartesian(x0, y0, z0);
	}

	function centroidLinePoint(lambda, phi) {
	  lambda *= radians, phi *= radians;
	  var cosPhi = cos(phi),
	      x = cosPhi * cos(lambda),
	      y = cosPhi * sin(lambda),
	      z = sin(phi),
	      w = atan2(sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
	  W1 += w;
	  X1 += w * (x0 + (x0 = x));
	  Y1 += w * (y0 + (y0 = y));
	  Z1 += w * (z0 + (z0 = z));
	  centroidPointCartesian(x0, y0, z0);
	}

	function centroidLineEnd() {
	  centroidStream.point = centroidPoint;
	}

	// See J. E. Brock, The Inertia Tensor for a Spherical Triangle,
	// J. Applied Mechanics 42, 239 (1975).
	function centroidRingStart() {
	  centroidStream.point = centroidRingPointFirst;
	}

	function centroidRingEnd() {
	  centroidRingPoint(lambda00$2, phi00$2);
	  centroidStream.point = centroidPoint;
	}

	function centroidRingPointFirst(lambda, phi) {
	  lambda00$2 = lambda, phi00$2 = phi;
	  lambda *= radians, phi *= radians;
	  centroidStream.point = centroidRingPoint;
	  var cosPhi = cos(phi);
	  x0 = cosPhi * cos(lambda);
	  y0 = cosPhi * sin(lambda);
	  z0 = sin(phi);
	  centroidPointCartesian(x0, y0, z0);
	}

	function centroidRingPoint(lambda, phi) {
	  lambda *= radians, phi *= radians;
	  var cosPhi = cos(phi),
	      x = cosPhi * cos(lambda),
	      y = cosPhi * sin(lambda),
	      z = sin(phi),
	      cx = y0 * z - z0 * y,
	      cy = z0 * x - x0 * z,
	      cz = x0 * y - y0 * x,
	      m = sqrt(cx * cx + cy * cy + cz * cz),
	      w = asin(m), // line weight = angle
	      v = m && -w / m; // area weight multiplier
	  X2 += v * cx;
	  Y2 += v * cy;
	  Z2 += v * cz;
	  W1 += w;
	  X1 += w * (x0 + (x0 = x));
	  Y1 += w * (y0 + (y0 = y));
	  Z1 += w * (z0 + (z0 = z));
	  centroidPointCartesian(x0, y0, z0);
	}

	var centroid = function(object) {
	  W0 = W1 =
	  X0 = Y0 = Z0 =
	  X1 = Y1 = Z1 =
	  X2 = Y2 = Z2 = 0;
	  geoStream(object, centroidStream);

	  var x = X2,
	      y = Y2,
	      z = Z2,
	      m = x * x + y * y + z * z;

	  // If the area-weighted ccentroid is undefined, fall back to length-weighted ccentroid.
	  if (m < epsilon2) {
	    x = X1, y = Y1, z = Z1;
	    // If the feature has zero length, fall back to arithmetic mean of point vectors.
	    if (W1 < epsilon) x = X0, y = Y0, z = Z0;
	    m = x * x + y * y + z * z;
	    // If the feature still has an undefined ccentroid, then return.
	    if (m < epsilon2) return [NaN, NaN];
	  }

	  return [atan2(y, x) * degrees, asin(z / sqrt(m)) * degrees];
	};

	var constant = function(x) {
	  return function() {
	    return x;
	  };
	};

	var compose = function(a, b) {

	  function compose(x, y) {
	    return x = a(x, y), b(x[0], x[1]);
	  }

	  if (a.invert && b.invert) compose.invert = function(x, y) {
	    return x = b.invert(x, y), x && a.invert(x[0], x[1]);
	  };

	  return compose;
	};

	function rotationIdentity(lambda, phi) {
	  return [lambda > pi ? lambda - tau : lambda < -pi ? lambda + tau : lambda, phi];
	}

	rotationIdentity.invert = rotationIdentity;

	function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
	  return (deltaLambda %= tau) ? (deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
	    : rotationLambda(deltaLambda))
	    : (deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma)
	    : rotationIdentity);
	}

	function forwardRotationLambda(deltaLambda) {
	  return function(lambda, phi) {
	    return lambda += deltaLambda, [lambda > pi ? lambda - tau : lambda < -pi ? lambda + tau : lambda, phi];
	  };
	}

	function rotationLambda(deltaLambda) {
	  var rotation = forwardRotationLambda(deltaLambda);
	  rotation.invert = forwardRotationLambda(-deltaLambda);
	  return rotation;
	}

	function rotationPhiGamma(deltaPhi, deltaGamma) {
	  var cosDeltaPhi = cos(deltaPhi),
	      sinDeltaPhi = sin(deltaPhi),
	      cosDeltaGamma = cos(deltaGamma),
	      sinDeltaGamma = sin(deltaGamma);

	  function rotation(lambda, phi) {
	    var cosPhi = cos(phi),
	        x = cos(lambda) * cosPhi,
	        y = sin(lambda) * cosPhi,
	        z = sin(phi),
	        k = z * cosDeltaPhi + x * sinDeltaPhi;
	    return [
	      atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
	      asin(k * cosDeltaGamma + y * sinDeltaGamma)
	    ];
	  }

	  rotation.invert = function(lambda, phi) {
	    var cosPhi = cos(phi),
	        x = cos(lambda) * cosPhi,
	        y = sin(lambda) * cosPhi,
	        z = sin(phi),
	        k = z * cosDeltaGamma - y * sinDeltaGamma;
	    return [
	      atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
	      asin(k * cosDeltaPhi - x * sinDeltaPhi)
	    ];
	  };

	  return rotation;
	}

	var rotation = function(rotate) {
	  rotate = rotateRadians(rotate[0] * radians, rotate[1] * radians, rotate.length > 2 ? rotate[2] * radians : 0);

	  function forward(coordinates) {
	    coordinates = rotate(coordinates[0] * radians, coordinates[1] * radians);
	    return coordinates[0] *= degrees, coordinates[1] *= degrees, coordinates;
	  }

	  forward.invert = function(coordinates) {
	    coordinates = rotate.invert(coordinates[0] * radians, coordinates[1] * radians);
	    return coordinates[0] *= degrees, coordinates[1] *= degrees, coordinates;
	  };

	  return forward;
	};

	// Generates a circle centered at [0°, 0°], with a given radius and precision.
	function circleStream(stream, radius, delta, direction, t0, t1) {
	  if (!delta) return;
	  var cosRadius = cos(radius),
	      sinRadius = sin(radius),
	      step = direction * delta;
	  if (t0 == null) {
	    t0 = radius + direction * tau;
	    t1 = radius - step / 2;
	  } else {
	    t0 = circleRadius(cosRadius, t0);
	    t1 = circleRadius(cosRadius, t1);
	    if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau;
	  }
	  for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
	    point = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)]);
	    stream.point(point[0], point[1]);
	  }
	}

	// Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
	function circleRadius(cosRadius, point) {
	  point = cartesian(point), point[0] -= cosRadius;
	  cartesianNormalizeInPlace(point);
	  var radius = acos(-point[1]);
	  return ((-point[2] < 0 ? -radius : radius) + tau - epsilon) % tau;
	}

	var circle = function() {
	  var center = constant([0, 0]),
	      radius = constant(90),
	      precision = constant(6),
	      ring,
	      rotate,
	      stream = {point: point};

	  function point(x, y) {
	    ring.push(x = rotate(x, y));
	    x[0] *= degrees, x[1] *= degrees;
	  }

	  function circle() {
	    var c = center.apply(this, arguments),
	        r = radius.apply(this, arguments) * radians,
	        p = precision.apply(this, arguments) * radians;
	    ring = [];
	    rotate = rotateRadians(-c[0] * radians, -c[1] * radians, 0).invert;
	    circleStream(stream, r, p, 1);
	    c = {type: "Polygon", coordinates: [ring]};
	    ring = rotate = null;
	    return c;
	  }

	  circle.center = function(_) {
	    return arguments.length ? (center = typeof _ === "function" ? _ : constant([+_[0], +_[1]]), circle) : center;
	  };

	  circle.radius = function(_) {
	    return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), circle) : radius;
	  };

	  circle.precision = function(_) {
	    return arguments.length ? (precision = typeof _ === "function" ? _ : constant(+_), circle) : precision;
	  };

	  return circle;
	};

	var clipBuffer = function() {
	  var lines = [],
	      line;
	  return {
	    point: function(x, y) {
	      line.push([x, y]);
	    },
	    lineStart: function() {
	      lines.push(line = []);
	    },
	    lineEnd: noop,
	    rejoin: function() {
	      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
	    },
	    result: function() {
	      var result = lines;
	      lines = [];
	      line = null;
	      return result;
	    }
	  };
	};

	var pointEqual = function(a, b) {
	  return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
	};

	function Intersection(point, points, other, entry) {
	  this.x = point;
	  this.z = points;
	  this.o = other; // another intersection
	  this.e = entry; // is an entry?
	  this.v = false; // visited
	  this.n = this.p = null; // next & previous
	}

	// A generalized polygon clipping algorithm: given a polygon that has been cut
	// into its visible line segments, and rejoins the segments by interpolating
	// along the clip edge.
	var clipRejoin = function(segments, compareIntersection, startInside, interpolate, stream) {
	  var subject = [],
	      clip = [],
	      i,
	      n;

	  segments.forEach(function(segment) {
	    if ((n = segment.length - 1) <= 0) return;
	    var n, p0 = segment[0], p1 = segment[n], x;

	    // If the first and last points of a segment are coincident, then treat as a
	    // closed ring. TODO if all rings are closed, then the winding order of the
	    // exterior ring should be checked.
	    if (pointEqual(p0, p1)) {
	      stream.lineStart();
	      for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
	      stream.lineEnd();
	      return;
	    }

	    subject.push(x = new Intersection(p0, segment, null, true));
	    clip.push(x.o = new Intersection(p0, null, x, false));
	    subject.push(x = new Intersection(p1, segment, null, false));
	    clip.push(x.o = new Intersection(p1, null, x, true));
	  });

	  if (!subject.length) return;

	  clip.sort(compareIntersection);
	  link(subject);
	  link(clip);

	  for (i = 0, n = clip.length; i < n; ++i) {
	    clip[i].e = startInside = !startInside;
	  }

	  var start = subject[0],
	      points,
	      point;

	  while (1) {
	    // Find first unvisited intersection.
	    var current = start,
	        isSubject = true;
	    while (current.v) if ((current = current.n) === start) return;
	    points = current.z;
	    stream.lineStart();
	    do {
	      current.v = current.o.v = true;
	      if (current.e) {
	        if (isSubject) {
	          for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
	        } else {
	          interpolate(current.x, current.n.x, 1, stream);
	        }
	        current = current.n;
	      } else {
	        if (isSubject) {
	          points = current.p.z;
	          for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
	        } else {
	          interpolate(current.x, current.p.x, -1, stream);
	        }
	        current = current.p;
	      }
	      current = current.o;
	      points = current.z;
	      isSubject = !isSubject;
	    } while (!current.v);
	    stream.lineEnd();
	  }
	};

	function link(array) {
	  if (!(n = array.length)) return;
	  var n,
	      i = 0,
	      a = array[0],
	      b;
	  while (++i < n) {
	    a.n = b = array[i];
	    b.p = a;
	    a = b;
	  }
	  a.n = b = array[0];
	  b.p = a;
	}

	var sum = adder();

	var polygonContains = function(polygon, point) {
	  var lambda = point[0],
	      phi = point[1],
	      normal = [sin(lambda), -cos(lambda), 0],
	      angle = 0,
	      winding = 0;

	  sum.reset();

	  for (var i = 0, n = polygon.length; i < n; ++i) {
	    if (!(m = (ring = polygon[i]).length)) continue;
	    var ring,
	        m,
	        point0 = ring[m - 1],
	        lambda0 = point0[0],
	        phi0 = point0[1] / 2 + quarterPi,
	        sinPhi0 = sin(phi0),
	        cosPhi0 = cos(phi0);

	    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
	      var point1 = ring[j],
	          lambda1 = point1[0],
	          phi1 = point1[1] / 2 + quarterPi,
	          sinPhi1 = sin(phi1),
	          cosPhi1 = cos(phi1),
	          delta = lambda1 - lambda0,
	          sign$$1 = delta >= 0 ? 1 : -1,
	          absDelta = sign$$1 * delta,
	          antimeridian = absDelta > pi,
	          k = sinPhi0 * sinPhi1;

	      sum.add(atan2(k * sign$$1 * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)));
	      angle += antimeridian ? delta + sign$$1 * tau : delta;

	      // Are the longitudes either side of the point’s meridian (lambda),
	      // and are the latitudes smaller than the parallel (phi)?
	      if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
	        var arc = cartesianCross(cartesian(point0), cartesian(point1));
	        cartesianNormalizeInPlace(arc);
	        var intersection = cartesianCross(normal, arc);
	        cartesianNormalizeInPlace(intersection);
	        var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
	        if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
	          winding += antimeridian ^ delta >= 0 ? 1 : -1;
	        }
	      }
	    }
	  }

	  // First, determine whether the South pole is inside or outside:
	  //
	  // It is inside if:
	  // * the polygon winds around it in a clockwise direction.
	  // * the polygon does not (cumulatively) wind around it, but has a negative
	  //   (counter-clockwise) area.
	  //
	  // Second, count the (signed) number of times a segment crosses a lambda
	  // from the point to the South pole.  If it is zero, then the point is the
	  // same side as the South pole.

	  return (angle < -epsilon || angle < epsilon && sum < -epsilon) ^ (winding & 1);
	};

	var clip = function(pointVisible, clipLine, interpolate, start) {
	  return function(sink) {
	    var line = clipLine(sink),
	        ringBuffer = clipBuffer(),
	        ringSink = clipLine(ringBuffer),
	        polygonStarted = false,
	        polygon,
	        segments,
	        ring;

	    var clip = {
	      point: point,
	      lineStart: lineStart,
	      lineEnd: lineEnd,
	      polygonStart: function() {
	        clip.point = pointRing;
	        clip.lineStart = ringStart;
	        clip.lineEnd = ringEnd;
	        segments = [];
	        polygon = [];
	      },
	      polygonEnd: function() {
	        clip.point = point;
	        clip.lineStart = lineStart;
	        clip.lineEnd = lineEnd;
	        segments = d3Array.merge(segments);
	        var startInside = polygonContains(polygon, start);
	        if (segments.length) {
	          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
	          clipRejoin(segments, compareIntersection, startInside, interpolate, sink);
	        } else if (startInside) {
	          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
	          sink.lineStart();
	          interpolate(null, null, 1, sink);
	          sink.lineEnd();
	        }
	        if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
	        segments = polygon = null;
	      },
	      sphere: function() {
	        sink.polygonStart();
	        sink.lineStart();
	        interpolate(null, null, 1, sink);
	        sink.lineEnd();
	        sink.polygonEnd();
	      }
	    };

	    function point(lambda, phi) {
	      if (pointVisible(lambda, phi)) sink.point(lambda, phi);
	    }

	    function pointLine(lambda, phi) {
	      line.point(lambda, phi);
	    }

	    function lineStart() {
	      clip.point = pointLine;
	      line.lineStart();
	    }

	    function lineEnd() {
	      clip.point = point;
	      line.lineEnd();
	    }

	    function pointRing(lambda, phi) {
	      ring.push([lambda, phi]);
	      ringSink.point(lambda, phi);
	    }

	    function ringStart() {
	      ringSink.lineStart();
	      ring = [];
	    }

	    function ringEnd() {
	      pointRing(ring[0][0], ring[0][1]);
	      ringSink.lineEnd();

	      var clean = ringSink.clean(),
	          ringSegments = ringBuffer.result(),
	          i, n = ringSegments.length, m,
	          segment,
	          point;

	      ring.pop();
	      polygon.push(ring);
	      ring = null;

	      if (!n) return;

	      // No intersections.
	      if (clean & 1) {
	        segment = ringSegments[0];
	        if ((m = segment.length - 1) > 0) {
	          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
	          sink.lineStart();
	          for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
	          sink.lineEnd();
	        }
	        return;
	      }

	      // Rejoin connected segments.
	      // TODO reuse ringBuffer.rejoin()?
	      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

	      segments.push(ringSegments.filter(validSegment));
	    }

	    return clip;
	  };
	};

	function validSegment(segment) {
	  return segment.length > 1;
	}

	// Intersections are sorted along the clip edge. For both antimeridian cutting
	// and circle clipping, the same comparison is used.
	function compareIntersection(a, b) {
	  return ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon : halfPi - a[1])
	       - ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon : halfPi - b[1]);
	}

	var clipAntimeridian = clip(
	  function() { return true; },
	  clipAntimeridianLine,
	  clipAntimeridianInterpolate,
	  [-pi, -halfPi]
	);

	// Takes a line and cuts into visible segments. Return values: 0 - there were
	// intersections or the line was empty; 1 - no intersections; 2 - there were
	// intersections, and the first and last segments should be rejoined.
	function clipAntimeridianLine(stream) {
	  var lambda0 = NaN,
	      phi0 = NaN,
	      sign0 = NaN,
	      clean; // no intersections

	  return {
	    lineStart: function() {
	      stream.lineStart();
	      clean = 1;
	    },
	    point: function(lambda1, phi1) {
	      var sign1 = lambda1 > 0 ? pi : -pi,
	          delta = abs(lambda1 - lambda0);
	      if (abs(delta - pi) < epsilon) { // line crosses a pole
	        stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi);
	        stream.point(sign0, phi0);
	        stream.lineEnd();
	        stream.lineStart();
	        stream.point(sign1, phi0);
	        stream.point(lambda1, phi0);
	        clean = 0;
	      } else if (sign0 !== sign1 && delta >= pi) { // line crosses antimeridian
	        if (abs(lambda0 - sign0) < epsilon) lambda0 -= sign0 * epsilon; // handle degeneracies
	        if (abs(lambda1 - sign1) < epsilon) lambda1 -= sign1 * epsilon;
	        phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
	        stream.point(sign0, phi0);
	        stream.lineEnd();
	        stream.lineStart();
	        stream.point(sign1, phi0);
	        clean = 0;
	      }
	      stream.point(lambda0 = lambda1, phi0 = phi1);
	      sign0 = sign1;
	    },
	    lineEnd: function() {
	      stream.lineEnd();
	      lambda0 = phi0 = NaN;
	    },
	    clean: function() {
	      return 2 - clean; // if intersections, rejoin first and last segments
	    }
	  };
	}

	function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
	  var cosPhi0,
	      cosPhi1,
	      sinLambda0Lambda1 = sin(lambda0 - lambda1);
	  return abs(sinLambda0Lambda1) > epsilon
	      ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1)
	          - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0))
	          / (cosPhi0 * cosPhi1 * sinLambda0Lambda1))
	      : (phi0 + phi1) / 2;
	}

	function clipAntimeridianInterpolate(from, to, direction, stream) {
	  var phi;
	  if (from == null) {
	    phi = direction * halfPi;
	    stream.point(-pi, phi);
	    stream.point(0, phi);
	    stream.point(pi, phi);
	    stream.point(pi, 0);
	    stream.point(pi, -phi);
	    stream.point(0, -phi);
	    stream.point(-pi, -phi);
	    stream.point(-pi, 0);
	    stream.point(-pi, phi);
	  } else if (abs(from[0] - to[0]) > epsilon) {
	    var lambda = from[0] < to[0] ? pi : -pi;
	    phi = direction * lambda / 2;
	    stream.point(-lambda, phi);
	    stream.point(0, phi);
	    stream.point(lambda, phi);
	  } else {
	    stream.point(to[0], to[1]);
	  }
	}

	var clipCircle = function(radius) {
	  var cr = cos(radius),
	      delta = 6 * radians,
	      smallRadius = cr > 0,
	      notHemisphere = abs(cr) > epsilon; // TODO optimise for this common case

	  function interpolate(from, to, direction, stream) {
	    circleStream(stream, radius, delta, direction, from, to);
	  }

	  function visible(lambda, phi) {
	    return cos(lambda) * cos(phi) > cr;
	  }

	  // Takes a line and cuts into visible segments. Return values used for polygon
	  // clipping: 0 - there were intersections or the line was empty; 1 - no
	  // intersections 2 - there were intersections, and the first and last segments
	  // should be rejoined.
	  function clipLine(stream) {
	    var point0, // previous point
	        c0, // code for previous point
	        v0, // visibility of previous point
	        v00, // visibility of first point
	        clean; // no intersections
	    return {
	      lineStart: function() {
	        v00 = v0 = false;
	        clean = 1;
	      },
	      point: function(lambda, phi) {
	        var point1 = [lambda, phi],
	            point2,
	            v = visible(lambda, phi),
	            c = smallRadius
	              ? v ? 0 : code(lambda, phi)
	              : v ? code(lambda + (lambda < 0 ? pi : -pi), phi) : 0;
	        if (!point0 && (v00 = v0 = v)) stream.lineStart();
	        // Handle degeneracies.
	        // TODO ignore if not clipping polygons.
	        if (v !== v0) {
	          point2 = intersect(point0, point1);
	          if (!point2 || pointEqual(point0, point2) || pointEqual(point1, point2)) {
	            point1[0] += epsilon;
	            point1[1] += epsilon;
	            v = visible(point1[0], point1[1]);
	          }
	        }
	        if (v !== v0) {
	          clean = 0;
	          if (v) {
	            // outside going in
	            stream.lineStart();
	            point2 = intersect(point1, point0);
	            stream.point(point2[0], point2[1]);
	          } else {
	            // inside going out
	            point2 = intersect(point0, point1);
	            stream.point(point2[0], point2[1]);
	            stream.lineEnd();
	          }
	          point0 = point2;
	        } else if (notHemisphere && point0 && smallRadius ^ v) {
	          var t;
	          // If the codes for two points are different, or are both zero,
	          // and there this segment intersects with the small circle.
	          if (!(c & c0) && (t = intersect(point1, point0, true))) {
	            clean = 0;
	            if (smallRadius) {
	              stream.lineStart();
	              stream.point(t[0][0], t[0][1]);
	              stream.point(t[1][0], t[1][1]);
	              stream.lineEnd();
	            } else {
	              stream.point(t[1][0], t[1][1]);
	              stream.lineEnd();
	              stream.lineStart();
	              stream.point(t[0][0], t[0][1]);
	            }
	          }
	        }
	        if (v && (!point0 || !pointEqual(point0, point1))) {
	          stream.point(point1[0], point1[1]);
	        }
	        point0 = point1, v0 = v, c0 = c;
	      },
	      lineEnd: function() {
	        if (v0) stream.lineEnd();
	        point0 = null;
	      },
	      // Rejoin first and last segments if there were intersections and the first
	      // and last points were visible.
	      clean: function() {
	        return clean | ((v00 && v0) << 1);
	      }
	    };
	  }

	  // Intersects the great circle between a and b with the clip circle.
	  function intersect(a, b, two) {
	    var pa = cartesian(a),
	        pb = cartesian(b);

	    // We have two planes, n1.p = d1 and n2.p = d2.
	    // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
	    var n1 = [1, 0, 0], // normal
	        n2 = cartesianCross(pa, pb),
	        n2n2 = cartesianDot(n2, n2),
	        n1n2 = n2[0], // cartesianDot(n1, n2),
	        determinant = n2n2 - n1n2 * n1n2;

	    // Two polar points.
	    if (!determinant) return !two && a;

	    var c1 =  cr * n2n2 / determinant,
	        c2 = -cr * n1n2 / determinant,
	        n1xn2 = cartesianCross(n1, n2),
	        A = cartesianScale(n1, c1),
	        B = cartesianScale(n2, c2);
	    cartesianAddInPlace(A, B);

	    // Solve |p(t)|^2 = 1.
	    var u = n1xn2,
	        w = cartesianDot(A, u),
	        uu = cartesianDot(u, u),
	        t2 = w * w - uu * (cartesianDot(A, A) - 1);

	    if (t2 < 0) return;

	    var t = sqrt(t2),
	        q = cartesianScale(u, (-w - t) / uu);
	    cartesianAddInPlace(q, A);
	    q = spherical(q);

	    if (!two) return q;

	    // Two intersection points.
	    var lambda0 = a[0],
	        lambda1 = b[0],
	        phi0 = a[1],
	        phi1 = b[1],
	        z;

	    if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;

	    var delta = lambda1 - lambda0,
	        polar = abs(delta - pi) < epsilon,
	        meridian = polar || delta < epsilon;

	    if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

	    // Check that the first point is between a and b.
	    if (meridian
	        ? polar
	          ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon ? phi0 : phi1)
	          : phi0 <= q[1] && q[1] <= phi1
	        : delta > pi ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
	      var q1 = cartesianScale(u, (-w + t) / uu);
	      cartesianAddInPlace(q1, A);
	      return [q, spherical(q1)];
	    }
	  }

	  // Generates a 4-bit vector representing the location of a point relative to
	  // the small circle's bounding box.
	  function code(lambda, phi) {
	    var r = smallRadius ? radius : pi - radius,
	        code = 0;
	    if (lambda < -r) code |= 1; // left
	    else if (lambda > r) code |= 2; // right
	    if (phi < -r) code |= 4; // below
	    else if (phi > r) code |= 8; // above
	    return code;
	  }

	  return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi]);
	};

	var clipLine = function(a, b, x0, y0, x1, y1) {
	  var ax = a[0],
	      ay = a[1],
	      bx = b[0],
	      by = b[1],
	      t0 = 0,
	      t1 = 1,
	      dx = bx - ax,
	      dy = by - ay,
	      r;

	  r = x0 - ax;
	  if (!dx && r > 0) return;
	  r /= dx;
	  if (dx < 0) {
	    if (r < t0) return;
	    if (r < t1) t1 = r;
	  } else if (dx > 0) {
	    if (r > t1) return;
	    if (r > t0) t0 = r;
	  }

	  r = x1 - ax;
	  if (!dx && r < 0) return;
	  r /= dx;
	  if (dx < 0) {
	    if (r > t1) return;
	    if (r > t0) t0 = r;
	  } else if (dx > 0) {
	    if (r < t0) return;
	    if (r < t1) t1 = r;
	  }

	  r = y0 - ay;
	  if (!dy && r > 0) return;
	  r /= dy;
	  if (dy < 0) {
	    if (r < t0) return;
	    if (r < t1) t1 = r;
	  } else if (dy > 0) {
	    if (r > t1) return;
	    if (r > t0) t0 = r;
	  }

	  r = y1 - ay;
	  if (!dy && r < 0) return;
	  r /= dy;
	  if (dy < 0) {
	    if (r > t1) return;
	    if (r > t0) t0 = r;
	  } else if (dy > 0) {
	    if (r < t0) return;
	    if (r < t1) t1 = r;
	  }

	  if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
	  if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
	  return true;
	};

	var clipMax = 1e9;
	var clipMin = -clipMax;

	// TODO Use d3-polygon’s polygonContains here for the ring check?
	// TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

	function clipRectangle(x0, y0, x1, y1) {

	  function visible(x, y) {
	    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
	  }

	  function interpolate(from, to, direction, stream) {
	    var a = 0, a1 = 0;
	    if (from == null
	        || (a = corner(from, direction)) !== (a1 = corner(to, direction))
	        || comparePoint(from, to) < 0 ^ direction > 0) {
	      do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
	      while ((a = (a + direction + 4) % 4) !== a1);
	    } else {
	      stream.point(to[0], to[1]);
	    }
	  }

	  function corner(p, direction) {
	    return abs(p[0] - x0) < epsilon ? direction > 0 ? 0 : 3
	        : abs(p[0] - x1) < epsilon ? direction > 0 ? 2 : 1
	        : abs(p[1] - y0) < epsilon ? direction > 0 ? 1 : 0
	        : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
	  }

	  function compareIntersection(a, b) {
	    return comparePoint(a.x, b.x);
	  }

	  function comparePoint(a, b) {
	    var ca = corner(a, 1),
	        cb = corner(b, 1);
	    return ca !== cb ? ca - cb
	        : ca === 0 ? b[1] - a[1]
	        : ca === 1 ? a[0] - b[0]
	        : ca === 2 ? a[1] - b[1]
	        : b[0] - a[0];
	  }

	  return function(stream) {
	    var activeStream = stream,
	        bufferStream = clipBuffer(),
	        segments,
	        polygon,
	        ring,
	        x__, y__, v__, // first point
	        x_, y_, v_, // previous point
	        first,
	        clean;

	    var clipStream = {
	      point: point,
	      lineStart: lineStart,
	      lineEnd: lineEnd,
	      polygonStart: polygonStart,
	      polygonEnd: polygonEnd
	    };

	    function point(x, y) {
	      if (visible(x, y)) activeStream.point(x, y);
	    }

	    function polygonInside() {
	      var winding = 0;

	      for (var i = 0, n = polygon.length; i < n; ++i) {
	        for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
	          a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
	          if (a1 <= y1) { if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding; }
	          else { if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding; }
	        }
	      }

	      return winding;
	    }

	    // Buffer geometry within a polygon and then clip it en masse.
	    function polygonStart() {
	      activeStream = bufferStream, segments = [], polygon = [], clean = true;
	    }

	    function polygonEnd() {
	      var startInside = polygonInside(),
	          cleanInside = clean && startInside,
	          visible = (segments = d3Array.merge(segments)).length;
	      if (cleanInside || visible) {
	        stream.polygonStart();
	        if (cleanInside) {
	          stream.lineStart();
	          interpolate(null, null, 1, stream);
	          stream.lineEnd();
	        }
	        if (visible) {
	          clipRejoin(segments, compareIntersection, startInside, interpolate, stream);
	        }
	        stream.polygonEnd();
	      }
	      activeStream = stream, segments = polygon = ring = null;
	    }

	    function lineStart() {
	      clipStream.point = linePoint;
	      if (polygon) polygon.push(ring = []);
	      first = true;
	      v_ = false;
	      x_ = y_ = NaN;
	    }

	    // TODO rather than special-case polygons, simply handle them separately.
	    // Ideally, coincident intersection points should be jittered to avoid
	    // clipping issues.
	    function lineEnd() {
	      if (segments) {
	        linePoint(x__, y__);
	        if (v__ && v_) bufferStream.rejoin();
	        segments.push(bufferStream.result());
	      }
	      clipStream.point = point;
	      if (v_) activeStream.lineEnd();
	    }

	    function linePoint(x, y) {
	      var v = visible(x, y);
	      if (polygon) ring.push([x, y]);
	      if (first) {
	        x__ = x, y__ = y, v__ = v;
	        first = false;
	        if (v) {
	          activeStream.lineStart();
	          activeStream.point(x, y);
	        }
	      } else {
	        if (v && v_) activeStream.point(x, y);
	        else {
	          var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
	              b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
	          if (clipLine(a, b, x0, y0, x1, y1)) {
	            if (!v_) {
	              activeStream.lineStart();
	              activeStream.point(a[0], a[1]);
	            }
	            activeStream.point(b[0], b[1]);
	            if (!v) activeStream.lineEnd();
	            clean = false;
	          } else if (v) {
	            activeStream.lineStart();
	            activeStream.point(x, y);
	            clean = false;
	          }
	        }
	      }
	      x_ = x, y_ = y, v_ = v;
	    }

	    return clipStream;
	  };
	}

	var extent = function() {
	  var x0 = 0,
	      y0 = 0,
	      x1 = 960,
	      y1 = 500,
	      cache,
	      cacheStream,
	      clip;

	  return clip = {
	    stream: function(stream) {
	      return cache && cacheStream === stream ? cache : cache = clipRectangle(x0, y0, x1, y1)(cacheStream = stream);
	    },
	    extent: function(_) {
	      return arguments.length ? (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1], cache = cacheStream = null, clip) : [[x0, y0], [x1, y1]];
	    }
	  };
	};

	var lengthSum = adder();
	var lambda0$2;
	var sinPhi0$1;
	var cosPhi0$1;

	var lengthStream = {
	  sphere: noop,
	  point: noop,
	  lineStart: lengthLineStart,
	  lineEnd: noop,
	  polygonStart: noop,
	  polygonEnd: noop
	};

	function lengthLineStart() {
	  lengthStream.point = lengthPointFirst;
	  lengthStream.lineEnd = lengthLineEnd;
	}

	function lengthLineEnd() {
	  lengthStream.point = lengthStream.lineEnd = noop;
	}

	function lengthPointFirst(lambda, phi) {
	  lambda *= radians, phi *= radians;
	  lambda0$2 = lambda, sinPhi0$1 = sin(phi), cosPhi0$1 = cos(phi);
	  lengthStream.point = lengthPoint;
	}

	function lengthPoint(lambda, phi) {
	  lambda *= radians, phi *= radians;
	  var sinPhi = sin(phi),
	      cosPhi = cos(phi),
	      delta = abs(lambda - lambda0$2),
	      cosDelta = cos(delta),
	      sinDelta = sin(delta),
	      x = cosPhi * sinDelta,
	      y = cosPhi0$1 * sinPhi - sinPhi0$1 * cosPhi * cosDelta,
	      z = sinPhi0$1 * sinPhi + cosPhi0$1 * cosPhi * cosDelta;
	  lengthSum.add(atan2(sqrt(x * x + y * y), z));
	  lambda0$2 = lambda, sinPhi0$1 = sinPhi, cosPhi0$1 = cosPhi;
	}

	var length = function(object) {
	  lengthSum.reset();
	  geoStream(object, lengthStream);
	  return +lengthSum;
	};

	var coordinates = [null, null];
	var object = {type: "LineString", coordinates: coordinates};

	var distance = function(a, b) {
	  coordinates[0] = a;
	  coordinates[1] = b;
	  return length(object);
	};

	var containsObjectType = {
	  Feature: function(object, point) {
	    return containsGeometry(object.geometry, point);
	  },
	  FeatureCollection: function(object, point) {
	    var features = object.features, i = -1, n = features.length;
	    while (++i < n) if (containsGeometry(features[i].geometry, point)) return true;
	    return false;
	  }
	};

	var containsGeometryType = {
	  Sphere: function() {
	    return true;
	  },
	  Point: function(object, point) {
	    return containsPoint(object.coordinates, point);
	  },
	  MultiPoint: function(object, point) {
	    var coordinates = object.coordinates, i = -1, n = coordinates.length;
	    while (++i < n) if (containsPoint(coordinates[i], point)) return true;
	    return false;
	  },
	  LineString: function(object, point) {
	    return containsLine(object.coordinates, point);
	  },
	  MultiLineString: function(object, point) {
	    var coordinates = object.coordinates, i = -1, n = coordinates.length;
	    while (++i < n) if (containsLine(coordinates[i], point)) return true;
	    return false;
	  },
	  Polygon: function(object, point) {
	    return containsPolygon(object.coordinates, point);
	  },
	  MultiPolygon: function(object, point) {
	    var coordinates = object.coordinates, i = -1, n = coordinates.length;
	    while (++i < n) if (containsPolygon(coordinates[i], point)) return true;
	    return false;
	  },
	  GeometryCollection: function(object, point) {
	    var geometries = object.geometries, i = -1, n = geometries.length;
	    while (++i < n) if (containsGeometry(geometries[i], point)) return true;
	    return false;
	  }
	};

	function containsGeometry(geometry, point) {
	  return geometry && containsGeometryType.hasOwnProperty(geometry.type)
	      ? containsGeometryType[geometry.type](geometry, point)
	      : false;
	}

	function containsPoint(coordinates, point) {
	  return distance(coordinates, point) === 0;
	}

	function containsLine(coordinates, point) {
	  var ab = distance(coordinates[0], coordinates[1]),
	      ao = distance(coordinates[0], point),
	      ob = distance(point, coordinates[1]);
	  return ao + ob <= ab + epsilon;
	}

	function containsPolygon(coordinates, point) {
	  return !!polygonContains(coordinates.map(ringRadians), pointRadians(point));
	}

	function ringRadians(ring) {
	  return ring = ring.map(pointRadians), ring.pop(), ring;
	}

	function pointRadians(point) {
	  return [point[0] * radians, point[1] * radians];
	}

	var contains = function(object, point) {
	  return (object && containsObjectType.hasOwnProperty(object.type)
	      ? containsObjectType[object.type]
	      : containsGeometry)(object, point);
	};

	function graticuleX(y0, y1, dy) {
	  var y = d3Array.range(y0, y1 - epsilon, dy).concat(y1);
	  return function(x) { return y.map(function(y) { return [x, y]; }); };
	}

	function graticuleY(x0, x1, dx) {
	  var x = d3Array.range(x0, x1 - epsilon, dx).concat(x1);
	  return function(y) { return x.map(function(x) { return [x, y]; }); };
	}

	function graticule() {
	  var x1, x0, X1, X0,
	      y1, y0, Y1, Y0,
	      dx = 10, dy = dx, DX = 90, DY = 360,
	      x, y, X, Y,
	      precision = 2.5;

	  function graticule() {
	    return {type: "MultiLineString", coordinates: lines()};
	  }

	  function lines() {
	    return d3Array.range(ceil(X0 / DX) * DX, X1, DX).map(X)
	        .concat(d3Array.range(ceil(Y0 / DY) * DY, Y1, DY).map(Y))
	        .concat(d3Array.range(ceil(x0 / dx) * dx, x1, dx).filter(function(x) { return abs(x % DX) > epsilon; }).map(x))
	        .concat(d3Array.range(ceil(y0 / dy) * dy, y1, dy).filter(function(y) { return abs(y % DY) > epsilon; }).map(y));
	  }

	  graticule.lines = function() {
	    return lines().map(function(coordinates) { return {type: "LineString", coordinates: coordinates}; });
	  };

	  graticule.outline = function() {
	    return {
	      type: "Polygon",
	      coordinates: [
	        X(X0).concat(
	        Y(Y1).slice(1),
	        X(X1).reverse().slice(1),
	        Y(Y0).reverse().slice(1))
	      ]
	    };
	  };

	  graticule.extent = function(_) {
	    if (!arguments.length) return graticule.extentMinor();
	    return graticule.extentMajor(_).extentMinor(_);
	  };

	  graticule.extentMajor = function(_) {
	    if (!arguments.length) return [[X0, Y0], [X1, Y1]];
	    X0 = +_[0][0], X1 = +_[1][0];
	    Y0 = +_[0][1], Y1 = +_[1][1];
	    if (X0 > X1) _ = X0, X0 = X1, X1 = _;
	    if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
	    return graticule.precision(precision);
	  };

	  graticule.extentMinor = function(_) {
	    if (!arguments.length) return [[x0, y0], [x1, y1]];
	    x0 = +_[0][0], x1 = +_[1][0];
	    y0 = +_[0][1], y1 = +_[1][1];
	    if (x0 > x1) _ = x0, x0 = x1, x1 = _;
	    if (y0 > y1) _ = y0, y0 = y1, y1 = _;
	    return graticule.precision(precision);
	  };

	  graticule.step = function(_) {
	    if (!arguments.length) return graticule.stepMinor();
	    return graticule.stepMajor(_).stepMinor(_);
	  };

	  graticule.stepMajor = function(_) {
	    if (!arguments.length) return [DX, DY];
	    DX = +_[0], DY = +_[1];
	    return graticule;
	  };

	  graticule.stepMinor = function(_) {
	    if (!arguments.length) return [dx, dy];
	    dx = +_[0], dy = +_[1];
	    return graticule;
	  };

	  graticule.precision = function(_) {
	    if (!arguments.length) return precision;
	    precision = +_;
	    x = graticuleX(y0, y1, 90);
	    y = graticuleY(x0, x1, precision);
	    X = graticuleX(Y0, Y1, 90);
	    Y = graticuleY(X0, X1, precision);
	    return graticule;
	  };

	  return graticule
	      .extentMajor([[-180, -90 + epsilon], [180, 90 - epsilon]])
	      .extentMinor([[-180, -80 - epsilon], [180, 80 + epsilon]]);
	}

	function graticule10() {
	  return graticule()();
	}

	var interpolate = function(a, b) {
	  var x0 = a[0] * radians,
	      y0 = a[1] * radians,
	      x1 = b[0] * radians,
	      y1 = b[1] * radians,
	      cy0 = cos(y0),
	      sy0 = sin(y0),
	      cy1 = cos(y1),
	      sy1 = sin(y1),
	      kx0 = cy0 * cos(x0),
	      ky0 = cy0 * sin(x0),
	      kx1 = cy1 * cos(x1),
	      ky1 = cy1 * sin(x1),
	      d = 2 * asin(sqrt(haversin(y1 - y0) + cy0 * cy1 * haversin(x1 - x0))),
	      k = sin(d);

	  var interpolate = d ? function(t) {
	    var B = sin(t *= d) / k,
	        A = sin(d - t) / k,
	        x = A * kx0 + B * kx1,
	        y = A * ky0 + B * ky1,
	        z = A * sy0 + B * sy1;
	    return [
	      atan2(y, x) * degrees,
	      atan2(z, sqrt(x * x + y * y)) * degrees
	    ];
	  } : function() {
	    return [x0 * degrees, y0 * degrees];
	  };

	  interpolate.distance = d;

	  return interpolate;
	};

	var identity = function(x) {
	  return x;
	};

	var areaSum$1 = adder();
	var areaRingSum$1 = adder();
	var x00;
	var y00;
	var x0$1;
	var y0$1;

	var areaStream$1 = {
	  point: noop,
	  lineStart: noop,
	  lineEnd: noop,
	  polygonStart: function() {
	    areaStream$1.lineStart = areaRingStart$1;
	    areaStream$1.lineEnd = areaRingEnd$1;
	  },
	  polygonEnd: function() {
	    areaStream$1.lineStart = areaStream$1.lineEnd = areaStream$1.point = noop;
	    areaSum$1.add(abs(areaRingSum$1));
	    areaRingSum$1.reset();
	  },
	  result: function() {
	    var area = areaSum$1 / 2;
	    areaSum$1.reset();
	    return area;
	  }
	};

	function areaRingStart$1() {
	  areaStream$1.point = areaPointFirst$1;
	}

	function areaPointFirst$1(x, y) {
	  areaStream$1.point = areaPoint$1;
	  x00 = x0$1 = x, y00 = y0$1 = y;
	}

	function areaPoint$1(x, y) {
	  areaRingSum$1.add(y0$1 * x - x0$1 * y);
	  x0$1 = x, y0$1 = y;
	}

	function areaRingEnd$1() {
	  areaPoint$1(x00, y00);
	}

	var x0$2 = Infinity;
	var y0$2 = x0$2;
	var x1 = -x0$2;
	var y1 = x1;

	var boundsStream$1 = {
	  point: boundsPoint$1,
	  lineStart: noop,
	  lineEnd: noop,
	  polygonStart: noop,
	  polygonEnd: noop,
	  result: function() {
	    var bounds = [[x0$2, y0$2], [x1, y1]];
	    x1 = y1 = -(y0$2 = x0$2 = Infinity);
	    return bounds;
	  }
	};

	function boundsPoint$1(x, y) {
	  if (x < x0$2) x0$2 = x;
	  if (x > x1) x1 = x;
	  if (y < y0$2) y0$2 = y;
	  if (y > y1) y1 = y;
	}

	// TODO Enforce positive area for exterior, negative area for interior?

	var X0$1 = 0;
	var Y0$1 = 0;
	var Z0$1 = 0;
	var X1$1 = 0;
	var Y1$1 = 0;
	var Z1$1 = 0;
	var X2$1 = 0;
	var Y2$1 = 0;
	var Z2$1 = 0;
	var x00$1;
	var y00$1;
	var x0$3;
	var y0$3;

	var centroidStream$1 = {
	  point: centroidPoint$1,
	  lineStart: centroidLineStart$1,
	  lineEnd: centroidLineEnd$1,
	  polygonStart: function() {
	    centroidStream$1.lineStart = centroidRingStart$1;
	    centroidStream$1.lineEnd = centroidRingEnd$1;
	  },
	  polygonEnd: function() {
	    centroidStream$1.point = centroidPoint$1;
	    centroidStream$1.lineStart = centroidLineStart$1;
	    centroidStream$1.lineEnd = centroidLineEnd$1;
	  },
	  result: function() {
	    var centroid = Z2$1 ? [X2$1 / Z2$1, Y2$1 / Z2$1]
	        : Z1$1 ? [X1$1 / Z1$1, Y1$1 / Z1$1]
	        : Z0$1 ? [X0$1 / Z0$1, Y0$1 / Z0$1]
	        : [NaN, NaN];
	    X0$1 = Y0$1 = Z0$1 =
	    X1$1 = Y1$1 = Z1$1 =
	    X2$1 = Y2$1 = Z2$1 = 0;
	    return centroid;
	  }
	};

	function centroidPoint$1(x, y) {
	  X0$1 += x;
	  Y0$1 += y;
	  ++Z0$1;
	}

	function centroidLineStart$1() {
	  centroidStream$1.point = centroidPointFirstLine;
	}

	function centroidPointFirstLine(x, y) {
	  centroidStream$1.point = centroidPointLine;
	  centroidPoint$1(x0$3 = x, y0$3 = y);
	}

	function centroidPointLine(x, y) {
	  var dx = x - x0$3, dy = y - y0$3, z = sqrt(dx * dx + dy * dy);
	  X1$1 += z * (x0$3 + x) / 2;
	  Y1$1 += z * (y0$3 + y) / 2;
	  Z1$1 += z;
	  centroidPoint$1(x0$3 = x, y0$3 = y);
	}

	function centroidLineEnd$1() {
	  centroidStream$1.point = centroidPoint$1;
	}

	function centroidRingStart$1() {
	  centroidStream$1.point = centroidPointFirstRing;
	}

	function centroidRingEnd$1() {
	  centroidPointRing(x00$1, y00$1);
	}

	function centroidPointFirstRing(x, y) {
	  centroidStream$1.point = centroidPointRing;
	  centroidPoint$1(x00$1 = x0$3 = x, y00$1 = y0$3 = y);
	}

	function centroidPointRing(x, y) {
	  var dx = x - x0$3,
	      dy = y - y0$3,
	      z = sqrt(dx * dx + dy * dy);

	  X1$1 += z * (x0$3 + x) / 2;
	  Y1$1 += z * (y0$3 + y) / 2;
	  Z1$1 += z;

	  z = y0$3 * x - x0$3 * y;
	  X2$1 += z * (x0$3 + x);
	  Y2$1 += z * (y0$3 + y);
	  Z2$1 += z * 3;
	  centroidPoint$1(x0$3 = x, y0$3 = y);
	}

	function PathContext(context) {
	  this._context = context;
	}

	PathContext.prototype = {
	  _radius: 4.5,
	  pointRadius: function(_) {
	    return this._radius = _, this;
	  },
	  polygonStart: function() {
	    this._line = 0;
	  },
	  polygonEnd: function() {
	    this._line = NaN;
	  },
	  lineStart: function() {
	    this._point = 0;
	  },
	  lineEnd: function() {
	    if (this._line === 0) this._context.closePath();
	    this._point = NaN;
	  },
	  point: function(x, y) {
	    switch (this._point) {
	      case 0: {
	        this._context.moveTo(x, y);
	        this._point = 1;
	        break;
	      }
	      case 1: {
	        this._context.lineTo(x, y);
	        break;
	      }
	      default: {
	        this._context.moveTo(x + this._radius, y);
	        this._context.arc(x, y, this._radius, 0, tau);
	        break;
	      }
	    }
	  },
	  result: noop
	};

	var lengthSum$1 = adder();
	var lengthRing;
	var x00$2;
	var y00$2;
	var x0$4;
	var y0$4;

	var lengthStream$1 = {
	  point: noop,
	  lineStart: function() {
	    lengthStream$1.point = lengthPointFirst$1;
	  },
	  lineEnd: function() {
	    if (lengthRing) lengthPoint$1(x00$2, y00$2);
	    lengthStream$1.point = noop;
	  },
	  polygonStart: function() {
	    lengthRing = true;
	  },
	  polygonEnd: function() {
	    lengthRing = null;
	  },
	  result: function() {
	    var length = +lengthSum$1;
	    lengthSum$1.reset();
	    return length;
	  }
	};

	function lengthPointFirst$1(x, y) {
	  lengthStream$1.point = lengthPoint$1;
	  x00$2 = x0$4 = x, y00$2 = y0$4 = y;
	}

	function lengthPoint$1(x, y) {
	  x0$4 -= x, y0$4 -= y;
	  lengthSum$1.add(sqrt(x0$4 * x0$4 + y0$4 * y0$4));
	  x0$4 = x, y0$4 = y;
	}

	function PathString() {
	  this._string = [];
	}

	PathString.prototype = {
	  _radius: 4.5,
	  _circle: circle$1(4.5),
	  pointRadius: function(_) {
	    if ((_ = +_) !== this._radius) this._radius = _, this._circle = null;
	    return this;
	  },
	  polygonStart: function() {
	    this._line = 0;
	  },
	  polygonEnd: function() {
	    this._line = NaN;
	  },
	  lineStart: function() {
	    this._point = 0;
	  },
	  lineEnd: function() {
	    if (this._line === 0) this._string.push("Z");
	    this._point = NaN;
	  },
	  point: function(x, y) {
	    switch (this._point) {
	      case 0: {
	        this._string.push("M", x, ",", y);
	        this._point = 1;
	        break;
	      }
	      case 1: {
	        this._string.push("L", x, ",", y);
	        break;
	      }
	      default: {
	        if (this._circle == null) this._circle = circle$1(this._radius);
	        this._string.push("M", x, ",", y, this._circle);
	        break;
	      }
	    }
	  },
	  result: function() {
	    if (this._string.length) {
	      var result = this._string.join("");
	      this._string = [];
	      return result;
	    } else {
	      return null;
	    }
	  }
	};

	function circle$1(radius) {
	  return "m0," + radius
	      + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
	      + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
	      + "z";
	}

	var index = function(projection, context) {
	  var pointRadius = 4.5,
	      projectionStream,
	      contextStream;

	  function path(object) {
	    if (object) {
	      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
	      geoStream(object, projectionStream(contextStream));
	    }
	    return contextStream.result();
	  }

	  path.area = function(object) {
	    geoStream(object, projectionStream(areaStream$1));
	    return areaStream$1.result();
	  };

	  path.measure = function(object) {
	    geoStream(object, projectionStream(lengthStream$1));
	    return lengthStream$1.result();
	  };

	  path.bounds = function(object) {
	    geoStream(object, projectionStream(boundsStream$1));
	    return boundsStream$1.result();
	  };

	  path.centroid = function(object) {
	    geoStream(object, projectionStream(centroidStream$1));
	    return centroidStream$1.result();
	  };

	  path.projection = function(_) {
	    return arguments.length ? (projectionStream = _ == null ? (projection = null, identity) : (projection = _).stream, path) : projection;
	  };

	  path.context = function(_) {
	    if (!arguments.length) return context;
	    contextStream = _ == null ? (context = null, new PathString) : new PathContext(context = _);
	    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
	    return path;
	  };

	  path.pointRadius = function(_) {
	    if (!arguments.length) return pointRadius;
	    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
	    return path;
	  };

	  return path.projection(projection).context(context);
	};

	var transform = function(methods) {
	  return {
	    stream: transformer(methods)
	  };
	};

	function transformer(methods) {
	  return function(stream) {
	    var s = new TransformStream;
	    for (var key in methods) s[key] = methods[key];
	    s.stream = stream;
	    return s;
	  };
	}

	function TransformStream() {}

	TransformStream.prototype = {
	  constructor: TransformStream,
	  point: function(x, y) { this.stream.point(x, y); },
	  sphere: function() { this.stream.sphere(); },
	  lineStart: function() { this.stream.lineStart(); },
	  lineEnd: function() { this.stream.lineEnd(); },
	  polygonStart: function() { this.stream.polygonStart(); },
	  polygonEnd: function() { this.stream.polygonEnd(); }
	};

	function fit(projection, fitBounds, object) {
	  var clip = projection.clipExtent && projection.clipExtent();
	  projection.scale(150).translate([0, 0]);
	  if (clip != null) projection.clipExtent(null);
	  geoStream(object, projection.stream(boundsStream$1));
	  fitBounds(boundsStream$1.result());
	  if (clip != null) projection.clipExtent(clip);
	  return projection;
	}

	function fitExtent(projection, extent, object) {
	  return fit(projection, function(b) {
	    var w = extent[1][0] - extent[0][0],
	        h = extent[1][1] - extent[0][1],
	        k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
	        x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
	        y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;
	    projection.scale(150 * k).translate([x, y]);
	  }, object);
	}

	function fitSize(projection, size, object) {
	  return fitExtent(projection, [[0, 0], size], object);
	}

	function fitWidth(projection, width, object) {
	  return fit(projection, function(b) {
	    var w = +width,
	        k = w / (b[1][0] - b[0][0]),
	        x = (w - k * (b[1][0] + b[0][0])) / 2,
	        y = -k * b[0][1];
	    projection.scale(150 * k).translate([x, y]);
	  }, object);
	}

	function fitHeight(projection, height, object) {
	  return fit(projection, function(b) {
	    var h = +height,
	        k = h / (b[1][1] - b[0][1]),
	        x = -k * b[0][0],
	        y = (h - k * (b[1][1] + b[0][1])) / 2;
	    projection.scale(150 * k).translate([x, y]);
	  }, object);
	}

	var maxDepth = 16;
	var cosMinDistance = cos(30 * radians); // cos(minimum angular distance)

	var resample = function(project, delta2) {
	  return +delta2 ? resample$1(project, delta2) : resampleNone(project);
	};

	function resampleNone(project) {
	  return transformer({
	    point: function(x, y) {
	      x = project(x, y);
	      this.stream.point(x[0], x[1]);
	    }
	  });
	}

	function resample$1(project, delta2) {

	  function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
	    var dx = x1 - x0,
	        dy = y1 - y0,
	        d2 = dx * dx + dy * dy;
	    if (d2 > 4 * delta2 && depth--) {
	      var a = a0 + a1,
	          b = b0 + b1,
	          c = c0 + c1,
	          m = sqrt(a * a + b * b + c * c),
	          phi2 = asin(c /= m),
	          lambda2 = abs(abs(c) - 1) < epsilon || abs(lambda0 - lambda1) < epsilon ? (lambda0 + lambda1) / 2 : atan2(b, a),
	          p = project(lambda2, phi2),
	          x2 = p[0],
	          y2 = p[1],
	          dx2 = x2 - x0,
	          dy2 = y2 - y0,
	          dz = dy * dx2 - dx * dy2;
	      if (dz * dz / d2 > delta2 // perpendicular projected distance
	          || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
	          || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
	        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
	        stream.point(x2, y2);
	        resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
	      }
	    }
	  }
	  return function(stream) {
	    var lambda00, x00, y00, a00, b00, c00, // first point
	        lambda0, x0, y0, a0, b0, c0; // previous point

	    var resampleStream = {
	      point: point,
	      lineStart: lineStart,
	      lineEnd: lineEnd,
	      polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
	      polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
	    };

	    function point(x, y) {
	      x = project(x, y);
	      stream.point(x[0], x[1]);
	    }

	    function lineStart() {
	      x0 = NaN;
	      resampleStream.point = linePoint;
	      stream.lineStart();
	    }

	    function linePoint(lambda, phi) {
	      var c = cartesian([lambda, phi]), p = project(lambda, phi);
	      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
	      stream.point(x0, y0);
	    }

	    function lineEnd() {
	      resampleStream.point = point;
	      stream.lineEnd();
	    }

	    function ringStart() {
	      lineStart();
	      resampleStream.point = ringPoint;
	      resampleStream.lineEnd = ringEnd;
	    }

	    function ringPoint(lambda, phi) {
	      linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
	      resampleStream.point = linePoint;
	    }

	    function ringEnd() {
	      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
	      resampleStream.lineEnd = lineEnd;
	      lineEnd();
	    }

	    return resampleStream;
	  };
	}

	var transformRadians = transformer({
	  point: function(x, y) {
	    this.stream.point(x * radians, y * radians);
	  }
	});

	function transformRotate(rotate) {
	  return transformer({
	    point: function(x, y) {
	      var r = rotate(x, y);
	      return this.stream.point(r[0], r[1]);
	    }
	  });
	}

	function projection(project) {
	  return projectionMutator(function() { return project; })();
	}

	function projectionMutator(projectAt) {
	  var project,
	      k = 150, // scale
	      x = 480, y = 250, // translate
	      dx, dy, lambda = 0, phi = 0, // center
	      deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, projectRotate, // rotate
	      theta = null, preclip = clipAntimeridian, // clip angle
	      x0 = null, y0, x1, y1, postclip = identity, // clip extent
	      delta2 = 0.5, projectResample = resample(projectTransform, delta2), // precision
	      cache,
	      cacheStream;

	  function projection(point) {
	    point = projectRotate(point[0] * radians, point[1] * radians);
	    return [point[0] * k + dx, dy - point[1] * k];
	  }

	  function invert(point) {
	    point = projectRotate.invert((point[0] - dx) / k, (dy - point[1]) / k);
	    return point && [point[0] * degrees, point[1] * degrees];
	  }

	  function projectTransform(x, y) {
	    return x = project(x, y), [x[0] * k + dx, dy - x[1] * k];
	  }

	  projection.stream = function(stream) {
	    return cache && cacheStream === stream ? cache : cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip(cacheStream = stream)))));
	  };

	  projection.preclip = function(_) {
	    return arguments.length ? (preclip = _, theta = undefined, reset()) : preclip;
	  };

	  projection.postclip = function(_) {
	    return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
	  };

	  projection.clipAngle = function(_) {
	    return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees;
	  };

	  projection.clipExtent = function(_) {
	    return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
	  };

	  projection.scale = function(_) {
	    return arguments.length ? (k = +_, recenter()) : k;
	  };

	  projection.translate = function(_) {
	    return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
	  };

	  projection.center = function(_) {
	    return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees, phi * degrees];
	  };

	  projection.rotate = function(_) {
	    return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees, deltaPhi * degrees, deltaGamma * degrees];
	  };

	  projection.precision = function(_) {
	    return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt(delta2);
	  };

	  projection.fitExtent = function(extent, object) {
	    return fitExtent(projection, extent, object);
	  };

	  projection.fitSize = function(size, object) {
	    return fitSize(projection, size, object);
	  };

	  projection.fitWidth = function(width, object) {
	    return fitWidth(projection, width, object);
	  };

	  projection.fitHeight = function(height, object) {
	    return fitHeight(projection, height, object);
	  };

	  function recenter() {
	    projectRotate = compose(rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma), project);
	    var center = project(lambda, phi);
	    dx = x - center[0] * k;
	    dy = y + center[1] * k;
	    return reset();
	  }

	  function reset() {
	    cache = cacheStream = null;
	    return projection;
	  }

	  return function() {
	    project = projectAt.apply(this, arguments);
	    projection.invert = project.invert && invert;
	    return recenter();
	  };
	}

	function conicProjection(projectAt) {
	  var phi0 = 0,
	      phi1 = pi / 3,
	      m = projectionMutator(projectAt),
	      p = m(phi0, phi1);

	  p.parallels = function(_) {
	    return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees, phi1 * degrees];
	  };

	  return p;
	}

	function cylindricalEqualAreaRaw(phi0) {
	  var cosPhi0 = cos(phi0);

	  function forward(lambda, phi) {
	    return [lambda * cosPhi0, sin(phi) / cosPhi0];
	  }

	  forward.invert = function(x, y) {
	    return [x / cosPhi0, asin(y * cosPhi0)];
	  };

	  return forward;
	}

	function conicEqualAreaRaw(y0, y1) {
	  var sy0 = sin(y0), n = (sy0 + sin(y1)) / 2;

	  // Are the parallels symmetrical around the Equator?
	  if (abs(n) < epsilon) return cylindricalEqualAreaRaw(y0);

	  var c = 1 + sy0 * (2 * n - sy0), r0 = sqrt(c) / n;

	  function project(x, y) {
	    var r = sqrt(c - 2 * n * sin(y)) / n;
	    return [r * sin(x *= n), r0 - r * cos(x)];
	  }

	  project.invert = function(x, y) {
	    var r0y = r0 - y;
	    return [atan2(x, abs(r0y)) / n * sign(r0y), asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
	  };

	  return project;
	}

	var conicEqualArea = function() {
	  return conicProjection(conicEqualAreaRaw)
	      .scale(155.424)
	      .center([0, 33.6442]);
	};

	var albers = function() {
	  return conicEqualArea()
	      .parallels([29.5, 45.5])
	      .scale(1070)
	      .translate([480, 250])
	      .rotate([96, 0])
	      .center([-0.6, 38.7]);
	};

	// The projections must have mutually exclusive clip regions on the sphere,
	// as this will avoid emitting interleaving lines and polygons.
	function multiplex(streams) {
	  var n = streams.length;
	  return {
	    point: function(x, y) { var i = -1; while (++i < n) streams[i].point(x, y); },
	    sphere: function() { var i = -1; while (++i < n) streams[i].sphere(); },
	    lineStart: function() { var i = -1; while (++i < n) streams[i].lineStart(); },
	    lineEnd: function() { var i = -1; while (++i < n) streams[i].lineEnd(); },
	    polygonStart: function() { var i = -1; while (++i < n) streams[i].polygonStart(); },
	    polygonEnd: function() { var i = -1; while (++i < n) streams[i].polygonEnd(); }
	  };
	}

	// A composite projection for the United States, configured by default for
	// 960×500. The projection also works quite well at 960×600 if you change the
	// scale to 1285 and adjust the translate accordingly. The set of standard
	// parallels for each region comes from USGS, which is published here:
	// http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
	var albersUsa = function() {
	  var cache,
	      cacheStream,
	      lower48 = albers(), lower48Point,
	      alaska = conicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]), alaskaPoint, // EPSG:3338
	      hawaii = conicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]), hawaiiPoint, // ESRI:102007
	      point, pointStream = {point: function(x, y) { point = [x, y]; }};

	  function albersUsa(coordinates) {
	    var x = coordinates[0], y = coordinates[1];
	    return point = null, (lower48Point.point(x, y), point)
	        || (alaskaPoint.point(x, y), point)
	        || (hawaiiPoint.point(x, y), point);
	  }

	  albersUsa.invert = function(coordinates) {
	    var k = lower48.scale(),
	        t = lower48.translate(),
	        x = (coordinates[0] - t[0]) / k,
	        y = (coordinates[1] - t[1]) / k;
	    return (y >= 0.120 && y < 0.234 && x >= -0.425 && x < -0.214 ? alaska
	        : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115 ? hawaii
	        : lower48).invert(coordinates);
	  };

	  albersUsa.stream = function(stream) {
	    return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
	  };

	  albersUsa.precision = function(_) {
	    if (!arguments.length) return lower48.precision();
	    lower48.precision(_), alaska.precision(_), hawaii.precision(_);
	    return reset();
	  };

	  albersUsa.scale = function(_) {
	    if (!arguments.length) return lower48.scale();
	    lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
	    return albersUsa.translate(lower48.translate());
	  };

	  albersUsa.translate = function(_) {
	    if (!arguments.length) return lower48.translate();
	    var k = lower48.scale(), x = +_[0], y = +_[1];

	    lower48Point = lower48
	        .translate(_)
	        .clipExtent([[x - 0.455 * k, y - 0.238 * k], [x + 0.455 * k, y + 0.238 * k]])
	        .stream(pointStream);

	    alaskaPoint = alaska
	        .translate([x - 0.307 * k, y + 0.201 * k])
	        .clipExtent([[x - 0.425 * k + epsilon, y + 0.120 * k + epsilon], [x - 0.214 * k - epsilon, y + 0.234 * k - epsilon]])
	        .stream(pointStream);

	    hawaiiPoint = hawaii
	        .translate([x - 0.205 * k, y + 0.212 * k])
	        .clipExtent([[x - 0.214 * k + epsilon, y + 0.166 * k + epsilon], [x - 0.115 * k - epsilon, y + 0.234 * k - epsilon]])
	        .stream(pointStream);

	    return reset();
	  };

	  albersUsa.fitExtent = function(extent, object) {
	    return fitExtent(albersUsa, extent, object);
	  };

	  albersUsa.fitSize = function(size, object) {
	    return fitSize(albersUsa, size, object);
	  };

	  albersUsa.fitWidth = function(width, object) {
	    return fitWidth(albersUsa, width, object);
	  };

	  albersUsa.fitHeight = function(height, object) {
	    return fitHeight(albersUsa, height, object);
	  };

	  function reset() {
	    cache = cacheStream = null;
	    return albersUsa;
	  }

	  return albersUsa.scale(1070);
	};

	function azimuthalRaw(scale) {
	  return function(x, y) {
	    var cx = cos(x),
	        cy = cos(y),
	        k = scale(cx * cy);
	    return [
	      k * cy * sin(x),
	      k * sin(y)
	    ];
	  }
	}

	function azimuthalInvert(angle) {
	  return function(x, y) {
	    var z = sqrt(x * x + y * y),
	        c = angle(z),
	        sc = sin(c),
	        cc = cos(c);
	    return [
	      atan2(x * sc, z * cc),
	      asin(z && y * sc / z)
	    ];
	  }
	}

	var azimuthalEqualAreaRaw = azimuthalRaw(function(cxcy) {
	  return sqrt(2 / (1 + cxcy));
	});

	azimuthalEqualAreaRaw.invert = azimuthalInvert(function(z) {
	  return 2 * asin(z / 2);
	});

	var azimuthalEqualArea = function() {
	  return projection(azimuthalEqualAreaRaw)
	      .scale(124.75)
	      .clipAngle(180 - 1e-3);
	};

	var azimuthalEquidistantRaw = azimuthalRaw(function(c) {
	  return (c = acos(c)) && c / sin(c);
	});

	azimuthalEquidistantRaw.invert = azimuthalInvert(function(z) {
	  return z;
	});

	var azimuthalEquidistant = function() {
	  return projection(azimuthalEquidistantRaw)
	      .scale(79.4188)
	      .clipAngle(180 - 1e-3);
	};

	function mercatorRaw(lambda, phi) {
	  return [lambda, log(tan((halfPi + phi) / 2))];
	}

	mercatorRaw.invert = function(x, y) {
	  return [x, 2 * atan(exp(y)) - halfPi];
	};

	var mercator = function() {
	  return mercatorProjection(mercatorRaw)
	      .scale(961 / tau);
	};

	function mercatorProjection(project) {
	  var m = projection(project),
	      center = m.center,
	      scale = m.scale,
	      translate = m.translate,
	      clipExtent = m.clipExtent,
	      x0 = null, y0, x1, y1; // clip extent

	  m.scale = function(_) {
	    return arguments.length ? (scale(_), reclip()) : scale();
	  };

	  m.translate = function(_) {
	    return arguments.length ? (translate(_), reclip()) : translate();
	  };

	  m.center = function(_) {
	    return arguments.length ? (center(_), reclip()) : center();
	  };

	  m.clipExtent = function(_) {
	    return arguments.length ? (_ == null ? x0 = y0 = x1 = y1 = null : (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reclip()) : x0 == null ? null : [[x0, y0], [x1, y1]];
	  };

	  function reclip() {
	    var k = pi * scale(),
	        t = m(rotation(m.rotate()).invert([0, 0]));
	    return clipExtent(x0 == null
	        ? [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]] : project === mercatorRaw
	        ? [[Math.max(t[0] - k, x0), y0], [Math.min(t[0] + k, x1), y1]]
	        : [[x0, Math.max(t[1] - k, y0)], [x1, Math.min(t[1] + k, y1)]]);
	  }

	  return reclip();
	}

	function tany(y) {
	  return tan((halfPi + y) / 2);
	}

	function conicConformalRaw(y0, y1) {
	  var cy0 = cos(y0),
	      n = y0 === y1 ? sin(y0) : log(cy0 / cos(y1)) / log(tany(y1) / tany(y0)),
	      f = cy0 * pow(tany(y0), n) / n;

	  if (!n) return mercatorRaw;

	  function project(x, y) {
	    if (f > 0) { if (y < -halfPi + epsilon) y = -halfPi + epsilon; }
	    else { if (y > halfPi - epsilon) y = halfPi - epsilon; }
	    var r = f / pow(tany(y), n);
	    return [r * sin(n * x), f - r * cos(n * x)];
	  }

	  project.invert = function(x, y) {
	    var fy = f - y, r = sign(n) * sqrt(x * x + fy * fy);
	    return [atan2(x, abs(fy)) / n * sign(fy), 2 * atan(pow(f / r, 1 / n)) - halfPi];
	  };

	  return project;
	}

	var conicConformal = function() {
	  return conicProjection(conicConformalRaw)
	      .scale(109.5)
	      .parallels([30, 30]);
	};

	function equirectangularRaw(lambda, phi) {
	  return [lambda, phi];
	}

	equirectangularRaw.invert = equirectangularRaw;

	var equirectangular = function() {
	  return projection(equirectangularRaw)
	      .scale(152.63);
	};

	function conicEquidistantRaw(y0, y1) {
	  var cy0 = cos(y0),
	      n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
	      g = cy0 / n + y0;

	  if (abs(n) < epsilon) return equirectangularRaw;

	  function project(x, y) {
	    var gy = g - y, nx = n * x;
	    return [gy * sin(nx), g - gy * cos(nx)];
	  }

	  project.invert = function(x, y) {
	    var gy = g - y;
	    return [atan2(x, abs(gy)) / n * sign(gy), g - sign(n) * sqrt(x * x + gy * gy)];
	  };

	  return project;
	}

	var conicEquidistant = function() {
	  return conicProjection(conicEquidistantRaw)
	      .scale(131.154)
	      .center([0, 13.9389]);
	};

	function gnomonicRaw(x, y) {
	  var cy = cos(y), k = cos(x) * cy;
	  return [cy * sin(x) / k, sin(y) / k];
	}

	gnomonicRaw.invert = azimuthalInvert(atan);

	var gnomonic = function() {
	  return projection(gnomonicRaw)
	      .scale(144.049)
	      .clipAngle(60);
	};

	function scaleTranslate(kx, ky, tx, ty) {
	  return kx === 1 && ky === 1 && tx === 0 && ty === 0 ? identity : transformer({
	    point: function(x, y) {
	      this.stream.point(x * kx + tx, y * ky + ty);
	    }
	  });
	}

	var identity$1 = function() {
	  var k = 1, tx = 0, ty = 0, sx = 1, sy = 1, transform$$1 = identity, // scale, translate and reflect
	      x0 = null, y0, x1, y1, // clip extent
	      postclip = identity,
	      cache,
	      cacheStream,
	      projection;

	  function reset() {
	    cache = cacheStream = null;
	    return projection;
	  }

	  return projection = {
	    stream: function(stream) {
	      return cache && cacheStream === stream ? cache : cache = transform$$1(postclip(cacheStream = stream));
	    },
	    postclip: function(_) {
	      return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
	    },
	    clipExtent: function(_) {
	      return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
	    },
	    scale: function(_) {
	      return arguments.length ? (transform$$1 = scaleTranslate((k = +_) * sx, k * sy, tx, ty), reset()) : k;
	    },
	    translate: function(_) {
	      return arguments.length ? (transform$$1 = scaleTranslate(k * sx, k * sy, tx = +_[0], ty = +_[1]), reset()) : [tx, ty];
	    },
	    reflectX: function(_) {
	      return arguments.length ? (transform$$1 = scaleTranslate(k * (sx = _ ? -1 : 1), k * sy, tx, ty), reset()) : sx < 0;
	    },
	    reflectY: function(_) {
	      return arguments.length ? (transform$$1 = scaleTranslate(k * sx, k * (sy = _ ? -1 : 1), tx, ty), reset()) : sy < 0;
	    },
	    fitExtent: function(extent, object) {
	      return fitExtent(projection, extent, object);
	    },
	    fitSize: function(size, object) {
	      return fitSize(projection, size, object);
	    },
	    fitWidth: function(width, object) {
	      return fitWidth(projection, width, object);
	    },
	    fitHeight: function(height, object) {
	      return fitHeight(projection, height, object);
	    }
	  };
	};

	function naturalEarth1Raw(lambda, phi) {
	  var phi2 = phi * phi, phi4 = phi2 * phi2;
	  return [
	    lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
	    phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)))
	  ];
	}

	naturalEarth1Raw.invert = function(x, y) {
	  var phi = y, i = 25, delta;
	  do {
	    var phi2 = phi * phi, phi4 = phi2 * phi2;
	    phi -= delta = (phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))) - y) /
	        (1.007226 + phi2 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi2 - 0.005916 * 11 * phi4)));
	  } while (abs(delta) > epsilon && --i > 0);
	  return [
	    x / (0.8707 + (phi2 = phi * phi) * (-0.131979 + phi2 * (-0.013791 + phi2 * phi2 * phi2 * (0.003971 - 0.001529 * phi2)))),
	    phi
	  ];
	};

	var naturalEarth1 = function() {
	  return projection(naturalEarth1Raw)
	      .scale(175.295);
	};

	function orthographicRaw(x, y) {
	  return [cos(y) * sin(x), sin(y)];
	}

	orthographicRaw.invert = azimuthalInvert(asin);

	var orthographic = function() {
	  return projection(orthographicRaw)
	      .scale(249.5)
	      .clipAngle(90 + epsilon);
	};

	function stereographicRaw(x, y) {
	  var cy = cos(y), k = 1 + cos(x) * cy;
	  return [cy * sin(x) / k, sin(y) / k];
	}

	stereographicRaw.invert = azimuthalInvert(function(z) {
	  return 2 * atan(z);
	});

	var stereographic = function() {
	  return projection(stereographicRaw)
	      .scale(250)
	      .clipAngle(142);
	};

	function transverseMercatorRaw(lambda, phi) {
	  return [log(tan((halfPi + phi) / 2)), -lambda];
	}

	transverseMercatorRaw.invert = function(x, y) {
	  return [-y, 2 * atan(exp(x)) - halfPi];
	};

	var transverseMercator = function() {
	  var m = mercatorProjection(transverseMercatorRaw),
	      center = m.center,
	      rotate = m.rotate;

	  m.center = function(_) {
	    return arguments.length ? center([-_[1], _[0]]) : (_ = center(), [_[1], -_[0]]);
	  };

	  m.rotate = function(_) {
	    return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
	  };

	  return rotate([0, 0, 90])
	      .scale(159.155);
	};

	exports.geoArea = area;
	exports.geoBounds = bounds;
	exports.geoCentroid = centroid;
	exports.geoCircle = circle;
	exports.geoClipAntimeridian = clipAntimeridian;
	exports.geoClipCircle = clipCircle;
	exports.geoClipExtent = extent;
	exports.geoClipRectangle = clipRectangle;
	exports.geoContains = contains;
	exports.geoDistance = distance;
	exports.geoGraticule = graticule;
	exports.geoGraticule10 = graticule10;
	exports.geoInterpolate = interpolate;
	exports.geoLength = length;
	exports.geoPath = index;
	exports.geoAlbers = albers;
	exports.geoAlbersUsa = albersUsa;
	exports.geoAzimuthalEqualArea = azimuthalEqualArea;
	exports.geoAzimuthalEqualAreaRaw = azimuthalEqualAreaRaw;
	exports.geoAzimuthalEquidistant = azimuthalEquidistant;
	exports.geoAzimuthalEquidistantRaw = azimuthalEquidistantRaw;
	exports.geoConicConformal = conicConformal;
	exports.geoConicConformalRaw = conicConformalRaw;
	exports.geoConicEqualArea = conicEqualArea;
	exports.geoConicEqualAreaRaw = conicEqualAreaRaw;
	exports.geoConicEquidistant = conicEquidistant;
	exports.geoConicEquidistantRaw = conicEquidistantRaw;
	exports.geoEquirectangular = equirectangular;
	exports.geoEquirectangularRaw = equirectangularRaw;
	exports.geoGnomonic = gnomonic;
	exports.geoGnomonicRaw = gnomonicRaw;
	exports.geoIdentity = identity$1;
	exports.geoProjection = projection;
	exports.geoProjectionMutator = projectionMutator;
	exports.geoMercator = mercator;
	exports.geoMercatorRaw = mercatorRaw;
	exports.geoNaturalEarth1 = naturalEarth1;
	exports.geoNaturalEarth1Raw = naturalEarth1Raw;
	exports.geoOrthographic = orthographic;
	exports.geoOrthographicRaw = orthographicRaw;
	exports.geoStereographic = stereographic;
	exports.geoStereographicRaw = stereographicRaw;
	exports.geoTransverseMercator = transverseMercator;
	exports.geoTransverseMercatorRaw = transverseMercatorRaw;
	exports.geoRotation = rotation;
	exports.geoStream = geoStream;
	exports.geoTransform = transform;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-array/ Version 1.2.1. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.d3 = global.d3 || {})));
	}(this, (function (exports) { 'use strict';

	var ascending = function(a, b) {
	  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	};

	var bisector = function(compare) {
	  if (compare.length === 1) compare = ascendingComparator(compare);
	  return {
	    left: function(a, x, lo, hi) {
	      if (lo == null) lo = 0;
	      if (hi == null) hi = a.length;
	      while (lo < hi) {
	        var mid = lo + hi >>> 1;
	        if (compare(a[mid], x) < 0) lo = mid + 1;
	        else hi = mid;
	      }
	      return lo;
	    },
	    right: function(a, x, lo, hi) {
	      if (lo == null) lo = 0;
	      if (hi == null) hi = a.length;
	      while (lo < hi) {
	        var mid = lo + hi >>> 1;
	        if (compare(a[mid], x) > 0) hi = mid;
	        else lo = mid + 1;
	      }
	      return lo;
	    }
	  };
	};

	function ascendingComparator(f) {
	  return function(d, x) {
	    return ascending(f(d), x);
	  };
	}

	var ascendingBisect = bisector(ascending);
	var bisectRight = ascendingBisect.right;
	var bisectLeft = ascendingBisect.left;

	var pairs = function(array, f) {
	  if (f == null) f = pair;
	  var i = 0, n = array.length - 1, p = array[0], pairs = new Array(n < 0 ? 0 : n);
	  while (i < n) pairs[i] = f(p, p = array[++i]);
	  return pairs;
	};

	function pair(a, b) {
	  return [a, b];
	}

	var cross = function(values0, values1, reduce) {
	  var n0 = values0.length,
	      n1 = values1.length,
	      values = new Array(n0 * n1),
	      i0,
	      i1,
	      i,
	      value0;

	  if (reduce == null) reduce = pair;

	  for (i0 = i = 0; i0 < n0; ++i0) {
	    for (value0 = values0[i0], i1 = 0; i1 < n1; ++i1, ++i) {
	      values[i] = reduce(value0, values1[i1]);
	    }
	  }

	  return values;
	};

	var descending = function(a, b) {
	  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
	};

	var number = function(x) {
	  return x === null ? NaN : +x;
	};

	var variance = function(values, valueof) {
	  var n = values.length,
	      m = 0,
	      i = -1,
	      mean = 0,
	      value,
	      delta,
	      sum = 0;

	  if (valueof == null) {
	    while (++i < n) {
	      if (!isNaN(value = number(values[i]))) {
	        delta = value - mean;
	        mean += delta / ++m;
	        sum += delta * (value - mean);
	      }
	    }
	  }

	  else {
	    while (++i < n) {
	      if (!isNaN(value = number(valueof(values[i], i, values)))) {
	        delta = value - mean;
	        mean += delta / ++m;
	        sum += delta * (value - mean);
	      }
	    }
	  }

	  if (m > 1) return sum / (m - 1);
	};

	var deviation = function(array, f) {
	  var v = variance(array, f);
	  return v ? Math.sqrt(v) : v;
	};

	var extent = function(values, valueof) {
	  var n = values.length,
	      i = -1,
	      value,
	      min,
	      max;

	  if (valueof == null) {
	    while (++i < n) { // Find the first comparable value.
	      if ((value = values[i]) != null && value >= value) {
	        min = max = value;
	        while (++i < n) { // Compare the remaining values.
	          if ((value = values[i]) != null) {
	            if (min > value) min = value;
	            if (max < value) max = value;
	          }
	        }
	      }
	    }
	  }

	  else {
	    while (++i < n) { // Find the first comparable value.
	      if ((value = valueof(values[i], i, values)) != null && value >= value) {
	        min = max = value;
	        while (++i < n) { // Compare the remaining values.
	          if ((value = valueof(values[i], i, values)) != null) {
	            if (min > value) min = value;
	            if (max < value) max = value;
	          }
	        }
	      }
	    }
	  }

	  return [min, max];
	};

	var array = Array.prototype;

	var slice = array.slice;
	var map = array.map;

	var constant = function(x) {
	  return function() {
	    return x;
	  };
	};

	var identity = function(x) {
	  return x;
	};

	var range = function(start, stop, step) {
	  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

	  var i = -1,
	      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
	      range = new Array(n);

	  while (++i < n) {
	    range[i] = start + i * step;
	  }

	  return range;
	};

	var e10 = Math.sqrt(50);
	var e5 = Math.sqrt(10);
	var e2 = Math.sqrt(2);

	var ticks = function(start, stop, count) {
	  var reverse,
	      i = -1,
	      n,
	      ticks,
	      step;

	  stop = +stop, start = +start, count = +count;
	  if (start === stop && count > 0) return [start];
	  if (reverse = stop < start) n = start, start = stop, stop = n;
	  if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

	  if (step > 0) {
	    start = Math.ceil(start / step);
	    stop = Math.floor(stop / step);
	    ticks = new Array(n = Math.ceil(stop - start + 1));
	    while (++i < n) ticks[i] = (start + i) * step;
	  } else {
	    start = Math.floor(start * step);
	    stop = Math.ceil(stop * step);
	    ticks = new Array(n = Math.ceil(start - stop + 1));
	    while (++i < n) ticks[i] = (start - i) / step;
	  }

	  if (reverse) ticks.reverse();

	  return ticks;
	};

	function tickIncrement(start, stop, count) {
	  var step = (stop - start) / Math.max(0, count),
	      power = Math.floor(Math.log(step) / Math.LN10),
	      error = step / Math.pow(10, power);
	  return power >= 0
	      ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
	      : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
	}

	function tickStep(start, stop, count) {
	  var step0 = Math.abs(stop - start) / Math.max(0, count),
	      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
	      error = step0 / step1;
	  if (error >= e10) step1 *= 10;
	  else if (error >= e5) step1 *= 5;
	  else if (error >= e2) step1 *= 2;
	  return stop < start ? -step1 : step1;
	}

	var sturges = function(values) {
	  return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
	};

	var histogram = function() {
	  var value = identity,
	      domain = extent,
	      threshold = sturges;

	  function histogram(data) {
	    var i,
	        n = data.length,
	        x,
	        values = new Array(n);

	    for (i = 0; i < n; ++i) {
	      values[i] = value(data[i], i, data);
	    }

	    var xz = domain(values),
	        x0 = xz[0],
	        x1 = xz[1],
	        tz = threshold(values, x0, x1);

	    // Convert number of thresholds into uniform thresholds.
	    if (!Array.isArray(tz)) {
	      tz = tickStep(x0, x1, tz);
	      tz = range(Math.ceil(x0 / tz) * tz, Math.floor(x1 / tz) * tz, tz); // exclusive
	    }

	    // Remove any thresholds outside the domain.
	    var m = tz.length;
	    while (tz[0] <= x0) tz.shift(), --m;
	    while (tz[m - 1] > x1) tz.pop(), --m;

	    var bins = new Array(m + 1),
	        bin;

	    // Initialize bins.
	    for (i = 0; i <= m; ++i) {
	      bin = bins[i] = [];
	      bin.x0 = i > 0 ? tz[i - 1] : x0;
	      bin.x1 = i < m ? tz[i] : x1;
	    }

	    // Assign data to bins by value, ignoring any outside the domain.
	    for (i = 0; i < n; ++i) {
	      x = values[i];
	      if (x0 <= x && x <= x1) {
	        bins[bisectRight(tz, x, 0, m)].push(data[i]);
	      }
	    }

	    return bins;
	  }

	  histogram.value = function(_) {
	    return arguments.length ? (value = typeof _ === "function" ? _ : constant(_), histogram) : value;
	  };

	  histogram.domain = function(_) {
	    return arguments.length ? (domain = typeof _ === "function" ? _ : constant([_[0], _[1]]), histogram) : domain;
	  };

	  histogram.thresholds = function(_) {
	    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), histogram) : threshold;
	  };

	  return histogram;
	};

	var quantile = function(values, p, valueof) {
	  if (valueof == null) valueof = number;
	  if (!(n = values.length)) return;
	  if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values);
	  if (p >= 1) return +valueof(values[n - 1], n - 1, values);
	  var n,
	      i = (n - 1) * p,
	      i0 = Math.floor(i),
	      value0 = +valueof(values[i0], i0, values),
	      value1 = +valueof(values[i0 + 1], i0 + 1, values);
	  return value0 + (value1 - value0) * (i - i0);
	};

	var freedmanDiaconis = function(values, min, max) {
	  values = map.call(values, number).sort(ascending);
	  return Math.ceil((max - min) / (2 * (quantile(values, 0.75) - quantile(values, 0.25)) * Math.pow(values.length, -1 / 3)));
	};

	var scott = function(values, min, max) {
	  return Math.ceil((max - min) / (3.5 * deviation(values) * Math.pow(values.length, -1 / 3)));
	};

	var max = function(values, valueof) {
	  var n = values.length,
	      i = -1,
	      value,
	      max;

	  if (valueof == null) {
	    while (++i < n) { // Find the first comparable value.
	      if ((value = values[i]) != null && value >= value) {
	        max = value;
	        while (++i < n) { // Compare the remaining values.
	          if ((value = values[i]) != null && value > max) {
	            max = value;
	          }
	        }
	      }
	    }
	  }

	  else {
	    while (++i < n) { // Find the first comparable value.
	      if ((value = valueof(values[i], i, values)) != null && value >= value) {
	        max = value;
	        while (++i < n) { // Compare the remaining values.
	          if ((value = valueof(values[i], i, values)) != null && value > max) {
	            max = value;
	          }
	        }
	      }
	    }
	  }

	  return max;
	};

	var mean = function(values, valueof) {
	  var n = values.length,
	      m = n,
	      i = -1,
	      value,
	      sum = 0;

	  if (valueof == null) {
	    while (++i < n) {
	      if (!isNaN(value = number(values[i]))) sum += value;
	      else --m;
	    }
	  }

	  else {
	    while (++i < n) {
	      if (!isNaN(value = number(valueof(values[i], i, values)))) sum += value;
	      else --m;
	    }
	  }

	  if (m) return sum / m;
	};

	var median = function(values, valueof) {
	  var n = values.length,
	      i = -1,
	      value,
	      numbers = [];

	  if (valueof == null) {
	    while (++i < n) {
	      if (!isNaN(value = number(values[i]))) {
	        numbers.push(value);
	      }
	    }
	  }

	  else {
	    while (++i < n) {
	      if (!isNaN(value = number(valueof(values[i], i, values)))) {
	        numbers.push(value);
	      }
	    }
	  }

	  return quantile(numbers.sort(ascending), 0.5);
	};

	var merge = function(arrays) {
	  var n = arrays.length,
	      m,
	      i = -1,
	      j = 0,
	      merged,
	      array;

	  while (++i < n) j += arrays[i].length;
	  merged = new Array(j);

	  while (--n >= 0) {
	    array = arrays[n];
	    m = array.length;
	    while (--m >= 0) {
	      merged[--j] = array[m];
	    }
	  }

	  return merged;
	};

	var min = function(values, valueof) {
	  var n = values.length,
	      i = -1,
	      value,
	      min;

	  if (valueof == null) {
	    while (++i < n) { // Find the first comparable value.
	      if ((value = values[i]) != null && value >= value) {
	        min = value;
	        while (++i < n) { // Compare the remaining values.
	          if ((value = values[i]) != null && min > value) {
	            min = value;
	          }
	        }
	      }
	    }
	  }

	  else {
	    while (++i < n) { // Find the first comparable value.
	      if ((value = valueof(values[i], i, values)) != null && value >= value) {
	        min = value;
	        while (++i < n) { // Compare the remaining values.
	          if ((value = valueof(values[i], i, values)) != null && min > value) {
	            min = value;
	          }
	        }
	      }
	    }
	  }

	  return min;
	};

	var permute = function(array, indexes) {
	  var i = indexes.length, permutes = new Array(i);
	  while (i--) permutes[i] = array[indexes[i]];
	  return permutes;
	};

	var scan = function(values, compare) {
	  if (!(n = values.length)) return;
	  var n,
	      i = 0,
	      j = 0,
	      xi,
	      xj = values[j];

	  if (compare == null) compare = ascending;

	  while (++i < n) {
	    if (compare(xi = values[i], xj) < 0 || compare(xj, xj) !== 0) {
	      xj = xi, j = i;
	    }
	  }

	  if (compare(xj, xj) === 0) return j;
	};

	var shuffle = function(array, i0, i1) {
	  var m = (i1 == null ? array.length : i1) - (i0 = i0 == null ? 0 : +i0),
	      t,
	      i;

	  while (m) {
	    i = Math.random() * m-- | 0;
	    t = array[m + i0];
	    array[m + i0] = array[i + i0];
	    array[i + i0] = t;
	  }

	  return array;
	};

	var sum = function(values, valueof) {
	  var n = values.length,
	      i = -1,
	      value,
	      sum = 0;

	  if (valueof == null) {
	    while (++i < n) {
	      if (value = +values[i]) sum += value; // Note: zero and null are equivalent.
	    }
	  }

	  else {
	    while (++i < n) {
	      if (value = +valueof(values[i], i, values)) sum += value;
	    }
	  }

	  return sum;
	};

	var transpose = function(matrix) {
	  if (!(n = matrix.length)) return [];
	  for (var i = -1, m = min(matrix, length), transpose = new Array(m); ++i < m;) {
	    for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
	      row[j] = matrix[j][i];
	    }
	  }
	  return transpose;
	};

	function length(d) {
	  return d.length;
	}

	var zip = function() {
	  return transpose(arguments);
	};

	exports.bisect = bisectRight;
	exports.bisectRight = bisectRight;
	exports.bisectLeft = bisectLeft;
	exports.ascending = ascending;
	exports.bisector = bisector;
	exports.cross = cross;
	exports.descending = descending;
	exports.deviation = deviation;
	exports.extent = extent;
	exports.histogram = histogram;
	exports.thresholdFreedmanDiaconis = freedmanDiaconis;
	exports.thresholdScott = scott;
	exports.thresholdSturges = sturges;
	exports.max = max;
	exports.mean = mean;
	exports.median = median;
	exports.merge = merge;
	exports.min = min;
	exports.pairs = pairs;
	exports.permute = permute;
	exports.quantile = quantile;
	exports.range = range;
	exports.scan = scan;
	exports.shuffle = shuffle;
	exports.sum = sum;
	exports.ticks = ticks;
	exports.tickIncrement = tickIncrement;
	exports.tickStep = tickStep;
	exports.transpose = transpose;
	exports.variance = variance;
	exports.zip = zip;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	var d3 = Object.assign({}, __webpack_require__(6), __webpack_require__(3), __webpack_require__(13));

	module.exports = {
	  /**
	   * @param projectionName the name of a projection from d3-geo or d3-geo-projection
	   * @returns the d3 projection or transform specified by the projectionName
	   * @throws Error if projectionName doesn't exist in d3-geo or d3-geo-projection
	   */
	  getD3Projection: function (projectionName) {
	    var projection = d3[projectionName];
	    if (typeof projection !== 'function') {
	      throw Error('Invalid d3 projection; use a projection from d3-geo or d3-geo-projection');
	    }
	    return projection();
	  },

	  /**
	   * @param height the height in A-Frame units
	   * @param width the width in A-Frame units
	   * @returns a d3 transform that converts from normal SVG screen coordinates
	   *          (an origin of [0,0] with y pointing down) to A-Frame coordinates
	   *          where the extent is based on the height and width, the origin is
	   *          in the center, and y points up
	   */
	  getWorldTransform: function (height, width) {
	    const x = d3.scaleLinear().domain([0, width]).range([-width / 2, width / 2]);
	    const y = d3.scaleLinear().domain([0, height]).range([height / 2, -height / 2]);

	    return d3.geoTransform({
	      point: function (px, py) {
	        this.stream.point(x(px), y(py));
	      }
	    });
	  },

	  /**
	   * @param projectionName the name of a projection from d3-geo or d3-geo-projection
	   * @param height the height in A-Frame units
	   * @param width the width in A-Frame units
	   * @param geoJson the geometry to use for scaling and centering
	   * @returns a d3 projection stream which centers the given geoJson in
	   *          A-Frame coordinates and scales it to fit the height and width
	   *          of the component
	   */
	  getFittedProjection: function (projectionName, geoJson, height, width) {
	    var projection = this.getD3Projection(projectionName).fitSize([width, height], geoJson);
	    var worldTransform = this.getWorldTransform(height, width);
	    // Thanks to this StackOverflow answer on how to chain streams:
	    // https://stackoverflow.com/a/31647135
	    return {
	      stream: function (s) {
	        return projection.stream(worldTransform.stream(s));
	      }
	    };
	  }
	};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-scale/ Version 1.0.7. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports, __webpack_require__(4), __webpack_require__(7), __webpack_require__(8), __webpack_require__(10), __webpack_require__(11), __webpack_require__(12), __webpack_require__(9)) :
		typeof define === 'function' && define.amd ? define(['exports', 'd3-array', 'd3-collection', 'd3-interpolate', 'd3-format', 'd3-time', 'd3-time-format', 'd3-color'], factory) :
		(factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
	}(this, (function (exports,d3Array,d3Collection,d3Interpolate,d3Format,d3Time,d3TimeFormat,d3Color) { 'use strict';

	var array = Array.prototype;

	var map$1 = array.map;
	var slice = array.slice;

	var implicit = {name: "implicit"};

	function ordinal(range$$1) {
	  var index = d3Collection.map(),
	      domain = [],
	      unknown = implicit;

	  range$$1 = range$$1 == null ? [] : slice.call(range$$1);

	  function scale(d) {
	    var key = d + "", i = index.get(key);
	    if (!i) {
	      if (unknown !== implicit) return unknown;
	      index.set(key, i = domain.push(d));
	    }
	    return range$$1[(i - 1) % range$$1.length];
	  }

	  scale.domain = function(_) {
	    if (!arguments.length) return domain.slice();
	    domain = [], index = d3Collection.map();
	    var i = -1, n = _.length, d, key;
	    while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
	    return scale;
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range$$1 = slice.call(_), scale) : range$$1.slice();
	  };

	  scale.unknown = function(_) {
	    return arguments.length ? (unknown = _, scale) : unknown;
	  };

	  scale.copy = function() {
	    return ordinal()
	        .domain(domain)
	        .range(range$$1)
	        .unknown(unknown);
	  };

	  return scale;
	}

	function band() {
	  var scale = ordinal().unknown(undefined),
	      domain = scale.domain,
	      ordinalRange = scale.range,
	      range$$1 = [0, 1],
	      step,
	      bandwidth,
	      round = false,
	      paddingInner = 0,
	      paddingOuter = 0,
	      align = 0.5;

	  delete scale.unknown;

	  function rescale() {
	    var n = domain().length,
	        reverse = range$$1[1] < range$$1[0],
	        start = range$$1[reverse - 0],
	        stop = range$$1[1 - reverse];
	    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
	    if (round) step = Math.floor(step);
	    start += (stop - start - step * (n - paddingInner)) * align;
	    bandwidth = step * (1 - paddingInner);
	    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
	    var values = d3Array.range(n).map(function(i) { return start + step * i; });
	    return ordinalRange(reverse ? values.reverse() : values);
	  }

	  scale.domain = function(_) {
	    return arguments.length ? (domain(_), rescale()) : domain();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range$$1 = [+_[0], +_[1]], rescale()) : range$$1.slice();
	  };

	  scale.rangeRound = function(_) {
	    return range$$1 = [+_[0], +_[1]], round = true, rescale();
	  };

	  scale.bandwidth = function() {
	    return bandwidth;
	  };

	  scale.step = function() {
	    return step;
	  };

	  scale.round = function(_) {
	    return arguments.length ? (round = !!_, rescale()) : round;
	  };

	  scale.padding = function(_) {
	    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
	  };

	  scale.paddingInner = function(_) {
	    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
	  };

	  scale.paddingOuter = function(_) {
	    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
	  };

	  scale.align = function(_) {
	    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
	  };

	  scale.copy = function() {
	    return band()
	        .domain(domain())
	        .range(range$$1)
	        .round(round)
	        .paddingInner(paddingInner)
	        .paddingOuter(paddingOuter)
	        .align(align);
	  };

	  return rescale();
	}

	function pointish(scale) {
	  var copy = scale.copy;

	  scale.padding = scale.paddingOuter;
	  delete scale.paddingInner;
	  delete scale.paddingOuter;

	  scale.copy = function() {
	    return pointish(copy());
	  };

	  return scale;
	}

	function point() {
	  return pointish(band().paddingInner(1));
	}

	var constant = function(x) {
	  return function() {
	    return x;
	  };
	};

	var number = function(x) {
	  return +x;
	};

	var unit = [0, 1];

	function deinterpolateLinear(a, b) {
	  return (b -= (a = +a))
	      ? function(x) { return (x - a) / b; }
	      : constant(b);
	}

	function deinterpolateClamp(deinterpolate) {
	  return function(a, b) {
	    var d = deinterpolate(a = +a, b = +b);
	    return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
	  };
	}

	function reinterpolateClamp(reinterpolate) {
	  return function(a, b) {
	    var r = reinterpolate(a = +a, b = +b);
	    return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
	  };
	}

	function bimap(domain, range$$1, deinterpolate, reinterpolate) {
	  var d0 = domain[0], d1 = domain[1], r0 = range$$1[0], r1 = range$$1[1];
	  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);
	  else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
	  return function(x) { return r0(d0(x)); };
	}

	function polymap(domain, range$$1, deinterpolate, reinterpolate) {
	  var j = Math.min(domain.length, range$$1.length) - 1,
	      d = new Array(j),
	      r = new Array(j),
	      i = -1;

	  // Reverse descending domains.
	  if (domain[j] < domain[0]) {
	    domain = domain.slice().reverse();
	    range$$1 = range$$1.slice().reverse();
	  }

	  while (++i < j) {
	    d[i] = deinterpolate(domain[i], domain[i + 1]);
	    r[i] = reinterpolate(range$$1[i], range$$1[i + 1]);
	  }

	  return function(x) {
	    var i = d3Array.bisect(domain, x, 1, j) - 1;
	    return r[i](d[i](x));
	  };
	}

	function copy(source, target) {
	  return target
	      .domain(source.domain())
	      .range(source.range())
	      .interpolate(source.interpolate())
	      .clamp(source.clamp());
	}

	// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
	// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
	function continuous(deinterpolate, reinterpolate) {
	  var domain = unit,
	      range$$1 = unit,
	      interpolate$$1 = d3Interpolate.interpolate,
	      clamp = false,
	      piecewise,
	      output,
	      input;

	  function rescale() {
	    piecewise = Math.min(domain.length, range$$1.length) > 2 ? polymap : bimap;
	    output = input = null;
	    return scale;
	  }

	  function scale(x) {
	    return (output || (output = piecewise(domain, range$$1, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
	  }

	  scale.invert = function(y) {
	    return (input || (input = piecewise(range$$1, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
	  };

	  scale.domain = function(_) {
	    return arguments.length ? (domain = map$1.call(_, number), rescale()) : domain.slice();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range$$1 = slice.call(_), rescale()) : range$$1.slice();
	  };

	  scale.rangeRound = function(_) {
	    return range$$1 = slice.call(_), interpolate$$1 = d3Interpolate.interpolateRound, rescale();
	  };

	  scale.clamp = function(_) {
	    return arguments.length ? (clamp = !!_, rescale()) : clamp;
	  };

	  scale.interpolate = function(_) {
	    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
	  };

	  return rescale();
	}

	var tickFormat = function(domain, count, specifier) {
	  var start = domain[0],
	      stop = domain[domain.length - 1],
	      step = d3Array.tickStep(start, stop, count == null ? 10 : count),
	      precision;
	  specifier = d3Format.formatSpecifier(specifier == null ? ",f" : specifier);
	  switch (specifier.type) {
	    case "s": {
	      var value = Math.max(Math.abs(start), Math.abs(stop));
	      if (specifier.precision == null && !isNaN(precision = d3Format.precisionPrefix(step, value))) specifier.precision = precision;
	      return d3Format.formatPrefix(specifier, value);
	    }
	    case "":
	    case "e":
	    case "g":
	    case "p":
	    case "r": {
	      if (specifier.precision == null && !isNaN(precision = d3Format.precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
	      break;
	    }
	    case "f":
	    case "%": {
	      if (specifier.precision == null && !isNaN(precision = d3Format.precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
	      break;
	    }
	  }
	  return d3Format.format(specifier);
	};

	function linearish(scale) {
	  var domain = scale.domain;

	  scale.ticks = function(count) {
	    var d = domain();
	    return d3Array.ticks(d[0], d[d.length - 1], count == null ? 10 : count);
	  };

	  scale.tickFormat = function(count, specifier) {
	    return tickFormat(domain(), count, specifier);
	  };

	  scale.nice = function(count) {
	    if (count == null) count = 10;

	    var d = domain(),
	        i0 = 0,
	        i1 = d.length - 1,
	        start = d[i0],
	        stop = d[i1],
	        step;

	    if (stop < start) {
	      step = start, start = stop, stop = step;
	      step = i0, i0 = i1, i1 = step;
	    }

	    step = d3Array.tickIncrement(start, stop, count);

	    if (step > 0) {
	      start = Math.floor(start / step) * step;
	      stop = Math.ceil(stop / step) * step;
	      step = d3Array.tickIncrement(start, stop, count);
	    } else if (step < 0) {
	      start = Math.ceil(start * step) / step;
	      stop = Math.floor(stop * step) / step;
	      step = d3Array.tickIncrement(start, stop, count);
	    }

	    if (step > 0) {
	      d[i0] = Math.floor(start / step) * step;
	      d[i1] = Math.ceil(stop / step) * step;
	      domain(d);
	    } else if (step < 0) {
	      d[i0] = Math.ceil(start * step) / step;
	      d[i1] = Math.floor(stop * step) / step;
	      domain(d);
	    }

	    return scale;
	  };

	  return scale;
	}

	function linear() {
	  var scale = continuous(deinterpolateLinear, d3Interpolate.interpolateNumber);

	  scale.copy = function() {
	    return copy(scale, linear());
	  };

	  return linearish(scale);
	}

	function identity() {
	  var domain = [0, 1];

	  function scale(x) {
	    return +x;
	  }

	  scale.invert = scale;

	  scale.domain = scale.range = function(_) {
	    return arguments.length ? (domain = map$1.call(_, number), scale) : domain.slice();
	  };

	  scale.copy = function() {
	    return identity().domain(domain);
	  };

	  return linearish(scale);
	}

	var nice = function(domain, interval) {
	  domain = domain.slice();

	  var i0 = 0,
	      i1 = domain.length - 1,
	      x0 = domain[i0],
	      x1 = domain[i1],
	      t;

	  if (x1 < x0) {
	    t = i0, i0 = i1, i1 = t;
	    t = x0, x0 = x1, x1 = t;
	  }

	  domain[i0] = interval.floor(x0);
	  domain[i1] = interval.ceil(x1);
	  return domain;
	};

	function deinterpolate(a, b) {
	  return (b = Math.log(b / a))
	      ? function(x) { return Math.log(x / a) / b; }
	      : constant(b);
	}

	function reinterpolate(a, b) {
	  return a < 0
	      ? function(t) { return -Math.pow(-b, t) * Math.pow(-a, 1 - t); }
	      : function(t) { return Math.pow(b, t) * Math.pow(a, 1 - t); };
	}

	function pow10(x) {
	  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
	}

	function powp(base) {
	  return base === 10 ? pow10
	      : base === Math.E ? Math.exp
	      : function(x) { return Math.pow(base, x); };
	}

	function logp(base) {
	  return base === Math.E ? Math.log
	      : base === 10 && Math.log10
	      || base === 2 && Math.log2
	      || (base = Math.log(base), function(x) { return Math.log(x) / base; });
	}

	function reflect(f) {
	  return function(x) {
	    return -f(-x);
	  };
	}

	function log() {
	  var scale = continuous(deinterpolate, reinterpolate).domain([1, 10]),
	      domain = scale.domain,
	      base = 10,
	      logs = logp(10),
	      pows = powp(10);

	  function rescale() {
	    logs = logp(base), pows = powp(base);
	    if (domain()[0] < 0) logs = reflect(logs), pows = reflect(pows);
	    return scale;
	  }

	  scale.base = function(_) {
	    return arguments.length ? (base = +_, rescale()) : base;
	  };

	  scale.domain = function(_) {
	    return arguments.length ? (domain(_), rescale()) : domain();
	  };

	  scale.ticks = function(count) {
	    var d = domain(),
	        u = d[0],
	        v = d[d.length - 1],
	        r;

	    if (r = v < u) i = u, u = v, v = i;

	    var i = logs(u),
	        j = logs(v),
	        p,
	        k,
	        t,
	        n = count == null ? 10 : +count,
	        z = [];

	    if (!(base % 1) && j - i < n) {
	      i = Math.round(i) - 1, j = Math.round(j) + 1;
	      if (u > 0) for (; i < j; ++i) {
	        for (k = 1, p = pows(i); k < base; ++k) {
	          t = p * k;
	          if (t < u) continue;
	          if (t > v) break;
	          z.push(t);
	        }
	      } else for (; i < j; ++i) {
	        for (k = base - 1, p = pows(i); k >= 1; --k) {
	          t = p * k;
	          if (t < u) continue;
	          if (t > v) break;
	          z.push(t);
	        }
	      }
	    } else {
	      z = d3Array.ticks(i, j, Math.min(j - i, n)).map(pows);
	    }

	    return r ? z.reverse() : z;
	  };

	  scale.tickFormat = function(count, specifier) {
	    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
	    if (typeof specifier !== "function") specifier = d3Format.format(specifier);
	    if (count === Infinity) return specifier;
	    if (count == null) count = 10;
	    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
	    return function(d) {
	      var i = d / pows(Math.round(logs(d)));
	      if (i * base < base - 0.5) i *= base;
	      return i <= k ? specifier(d) : "";
	    };
	  };

	  scale.nice = function() {
	    return domain(nice(domain(), {
	      floor: function(x) { return pows(Math.floor(logs(x))); },
	      ceil: function(x) { return pows(Math.ceil(logs(x))); }
	    }));
	  };

	  scale.copy = function() {
	    return copy(scale, log().base(base));
	  };

	  return scale;
	}

	function raise(x, exponent) {
	  return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
	}

	function pow() {
	  var exponent = 1,
	      scale = continuous(deinterpolate, reinterpolate),
	      domain = scale.domain;

	  function deinterpolate(a, b) {
	    return (b = raise(b, exponent) - (a = raise(a, exponent)))
	        ? function(x) { return (raise(x, exponent) - a) / b; }
	        : constant(b);
	  }

	  function reinterpolate(a, b) {
	    b = raise(b, exponent) - (a = raise(a, exponent));
	    return function(t) { return raise(a + b * t, 1 / exponent); };
	  }

	  scale.exponent = function(_) {
	    return arguments.length ? (exponent = +_, domain(domain())) : exponent;
	  };

	  scale.copy = function() {
	    return copy(scale, pow().exponent(exponent));
	  };

	  return linearish(scale);
	}

	function sqrt() {
	  return pow().exponent(0.5);
	}

	function quantile$1() {
	  var domain = [],
	      range$$1 = [],
	      thresholds = [];

	  function rescale() {
	    var i = 0, n = Math.max(1, range$$1.length);
	    thresholds = new Array(n - 1);
	    while (++i < n) thresholds[i - 1] = d3Array.quantile(domain, i / n);
	    return scale;
	  }

	  function scale(x) {
	    if (!isNaN(x = +x)) return range$$1[d3Array.bisect(thresholds, x)];
	  }

	  scale.invertExtent = function(y) {
	    var i = range$$1.indexOf(y);
	    return i < 0 ? [NaN, NaN] : [
	      i > 0 ? thresholds[i - 1] : domain[0],
	      i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
	    ];
	  };

	  scale.domain = function(_) {
	    if (!arguments.length) return domain.slice();
	    domain = [];
	    for (var i = 0, n = _.length, d; i < n; ++i) if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
	    domain.sort(d3Array.ascending);
	    return rescale();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range$$1 = slice.call(_), rescale()) : range$$1.slice();
	  };

	  scale.quantiles = function() {
	    return thresholds.slice();
	  };

	  scale.copy = function() {
	    return quantile$1()
	        .domain(domain)
	        .range(range$$1);
	  };

	  return scale;
	}

	function quantize() {
	  var x0 = 0,
	      x1 = 1,
	      n = 1,
	      domain = [0.5],
	      range$$1 = [0, 1];

	  function scale(x) {
	    if (x <= x) return range$$1[d3Array.bisect(domain, x, 0, n)];
	  }

	  function rescale() {
	    var i = -1;
	    domain = new Array(n);
	    while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
	    return scale;
	  }

	  scale.domain = function(_) {
	    return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
	  };

	  scale.range = function(_) {
	    return arguments.length ? (n = (range$$1 = slice.call(_)).length - 1, rescale()) : range$$1.slice();
	  };

	  scale.invertExtent = function(y) {
	    var i = range$$1.indexOf(y);
	    return i < 0 ? [NaN, NaN]
	        : i < 1 ? [x0, domain[0]]
	        : i >= n ? [domain[n - 1], x1]
	        : [domain[i - 1], domain[i]];
	  };

	  scale.copy = function() {
	    return quantize()
	        .domain([x0, x1])
	        .range(range$$1);
	  };

	  return linearish(scale);
	}

	function threshold() {
	  var domain = [0.5],
	      range$$1 = [0, 1],
	      n = 1;

	  function scale(x) {
	    if (x <= x) return range$$1[d3Array.bisect(domain, x, 0, n)];
	  }

	  scale.domain = function(_) {
	    return arguments.length ? (domain = slice.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : domain.slice();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range$$1 = slice.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : range$$1.slice();
	  };

	  scale.invertExtent = function(y) {
	    var i = range$$1.indexOf(y);
	    return [domain[i - 1], domain[i]];
	  };

	  scale.copy = function() {
	    return threshold()
	        .domain(domain)
	        .range(range$$1);
	  };

	  return scale;
	}

	var durationSecond = 1000;
	var durationMinute = durationSecond * 60;
	var durationHour = durationMinute * 60;
	var durationDay = durationHour * 24;
	var durationWeek = durationDay * 7;
	var durationMonth = durationDay * 30;
	var durationYear = durationDay * 365;

	function date(t) {
	  return new Date(t);
	}

	function number$1(t) {
	  return t instanceof Date ? +t : +new Date(+t);
	}

	function calendar(year, month, week, day, hour, minute, second, millisecond, format$$1) {
	  var scale = continuous(deinterpolateLinear, d3Interpolate.interpolateNumber),
	      invert = scale.invert,
	      domain = scale.domain;

	  var formatMillisecond = format$$1(".%L"),
	      formatSecond = format$$1(":%S"),
	      formatMinute = format$$1("%I:%M"),
	      formatHour = format$$1("%I %p"),
	      formatDay = format$$1("%a %d"),
	      formatWeek = format$$1("%b %d"),
	      formatMonth = format$$1("%B"),
	      formatYear = format$$1("%Y");

	  var tickIntervals = [
	    [second,  1,      durationSecond],
	    [second,  5,  5 * durationSecond],
	    [second, 15, 15 * durationSecond],
	    [second, 30, 30 * durationSecond],
	    [minute,  1,      durationMinute],
	    [minute,  5,  5 * durationMinute],
	    [minute, 15, 15 * durationMinute],
	    [minute, 30, 30 * durationMinute],
	    [  hour,  1,      durationHour  ],
	    [  hour,  3,  3 * durationHour  ],
	    [  hour,  6,  6 * durationHour  ],
	    [  hour, 12, 12 * durationHour  ],
	    [   day,  1,      durationDay   ],
	    [   day,  2,  2 * durationDay   ],
	    [  week,  1,      durationWeek  ],
	    [ month,  1,      durationMonth ],
	    [ month,  3,  3 * durationMonth ],
	    [  year,  1,      durationYear  ]
	  ];

	  function tickFormat(date) {
	    return (second(date) < date ? formatMillisecond
	        : minute(date) < date ? formatSecond
	        : hour(date) < date ? formatMinute
	        : day(date) < date ? formatHour
	        : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
	        : year(date) < date ? formatMonth
	        : formatYear)(date);
	  }

	  function tickInterval(interval, start, stop, step) {
	    if (interval == null) interval = 10;

	    // If a desired tick count is specified, pick a reasonable tick interval
	    // based on the extent of the domain and a rough estimate of tick size.
	    // Otherwise, assume interval is already a time interval and use it.
	    if (typeof interval === "number") {
	      var target = Math.abs(stop - start) / interval,
	          i = d3Array.bisector(function(i) { return i[2]; }).right(tickIntervals, target);
	      if (i === tickIntervals.length) {
	        step = d3Array.tickStep(start / durationYear, stop / durationYear, interval);
	        interval = year;
	      } else if (i) {
	        i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
	        step = i[1];
	        interval = i[0];
	      } else {
	        step = Math.max(d3Array.tickStep(start, stop, interval), 1);
	        interval = millisecond;
	      }
	    }

	    return step == null ? interval : interval.every(step);
	  }

	  scale.invert = function(y) {
	    return new Date(invert(y));
	  };

	  scale.domain = function(_) {
	    return arguments.length ? domain(map$1.call(_, number$1)) : domain().map(date);
	  };

	  scale.ticks = function(interval, step) {
	    var d = domain(),
	        t0 = d[0],
	        t1 = d[d.length - 1],
	        r = t1 < t0,
	        t;
	    if (r) t = t0, t0 = t1, t1 = t;
	    t = tickInterval(interval, t0, t1, step);
	    t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
	    return r ? t.reverse() : t;
	  };

	  scale.tickFormat = function(count, specifier) {
	    return specifier == null ? tickFormat : format$$1(specifier);
	  };

	  scale.nice = function(interval, step) {
	    var d = domain();
	    return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
	        ? domain(nice(d, interval))
	        : scale;
	  };

	  scale.copy = function() {
	    return copy(scale, calendar(year, month, week, day, hour, minute, second, millisecond, format$$1));
	  };

	  return scale;
	}

	var time = function() {
	  return calendar(d3Time.timeYear, d3Time.timeMonth, d3Time.timeWeek, d3Time.timeDay, d3Time.timeHour, d3Time.timeMinute, d3Time.timeSecond, d3Time.timeMillisecond, d3TimeFormat.timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
	};

	var utcTime = function() {
	  return calendar(d3Time.utcYear, d3Time.utcMonth, d3Time.utcWeek, d3Time.utcDay, d3Time.utcHour, d3Time.utcMinute, d3Time.utcSecond, d3Time.utcMillisecond, d3TimeFormat.utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]);
	};

	var colors = function(s) {
	  return s.match(/.{6}/g).map(function(x) {
	    return "#" + x;
	  });
	};

	var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

	var category20b = colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

	var category20c = colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

	var category20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

	var cubehelix$1 = d3Interpolate.interpolateCubehelixLong(d3Color.cubehelix(300, 0.5, 0.0), d3Color.cubehelix(-240, 0.5, 1.0));

	var warm = d3Interpolate.interpolateCubehelixLong(d3Color.cubehelix(-100, 0.75, 0.35), d3Color.cubehelix(80, 1.50, 0.8));

	var cool = d3Interpolate.interpolateCubehelixLong(d3Color.cubehelix(260, 0.75, 0.35), d3Color.cubehelix(80, 1.50, 0.8));

	var rainbow = d3Color.cubehelix();

	var rainbow$1 = function(t) {
	  if (t < 0 || t > 1) t -= Math.floor(t);
	  var ts = Math.abs(t - 0.5);
	  rainbow.h = 360 * t - 100;
	  rainbow.s = 1.5 - 1.5 * ts;
	  rainbow.l = 0.8 - 0.9 * ts;
	  return rainbow + "";
	};

	function ramp(range$$1) {
	  var n = range$$1.length;
	  return function(t) {
	    return range$$1[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
	  };
	}

	var viridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

	var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

	var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

	var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

	function sequential(interpolator) {
	  var x0 = 0,
	      x1 = 1,
	      clamp = false;

	  function scale(x) {
	    var t = (x - x0) / (x1 - x0);
	    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
	  }

	  scale.domain = function(_) {
	    return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
	  };

	  scale.clamp = function(_) {
	    return arguments.length ? (clamp = !!_, scale) : clamp;
	  };

	  scale.interpolator = function(_) {
	    return arguments.length ? (interpolator = _, scale) : interpolator;
	  };

	  scale.copy = function() {
	    return sequential(interpolator).domain([x0, x1]).clamp(clamp);
	  };

	  return linearish(scale);
	}

	exports.scaleBand = band;
	exports.scalePoint = point;
	exports.scaleIdentity = identity;
	exports.scaleLinear = linear;
	exports.scaleLog = log;
	exports.scaleOrdinal = ordinal;
	exports.scaleImplicit = implicit;
	exports.scalePow = pow;
	exports.scaleSqrt = sqrt;
	exports.scaleQuantile = quantile$1;
	exports.scaleQuantize = quantize;
	exports.scaleThreshold = threshold;
	exports.scaleTime = time;
	exports.scaleUtc = utcTime;
	exports.schemeCategory10 = category10;
	exports.schemeCategory20b = category20b;
	exports.schemeCategory20c = category20c;
	exports.schemeCategory20 = category20;
	exports.interpolateCubehelixDefault = cubehelix$1;
	exports.interpolateRainbow = rainbow$1;
	exports.interpolateWarm = warm;
	exports.interpolateCool = cool;
	exports.interpolateViridis = viridis;
	exports.interpolateMagma = magma;
	exports.interpolateInferno = inferno;
	exports.interpolatePlasma = plasma;
	exports.scaleSequential = sequential;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-collection/ Version 1.0.4. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.d3 = global.d3 || {})));
	}(this, (function (exports) { 'use strict';

	var prefix = "$";

	function Map() {}

	Map.prototype = map.prototype = {
	  constructor: Map,
	  has: function(key) {
	    return (prefix + key) in this;
	  },
	  get: function(key) {
	    return this[prefix + key];
	  },
	  set: function(key, value) {
	    this[prefix + key] = value;
	    return this;
	  },
	  remove: function(key) {
	    var property = prefix + key;
	    return property in this && delete this[property];
	  },
	  clear: function() {
	    for (var property in this) if (property[0] === prefix) delete this[property];
	  },
	  keys: function() {
	    var keys = [];
	    for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
	    return keys;
	  },
	  values: function() {
	    var values = [];
	    for (var property in this) if (property[0] === prefix) values.push(this[property]);
	    return values;
	  },
	  entries: function() {
	    var entries = [];
	    for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
	    return entries;
	  },
	  size: function() {
	    var size = 0;
	    for (var property in this) if (property[0] === prefix) ++size;
	    return size;
	  },
	  empty: function() {
	    for (var property in this) if (property[0] === prefix) return false;
	    return true;
	  },
	  each: function(f) {
	    for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
	  }
	};

	function map(object, f) {
	  var map = new Map;

	  // Copy constructor.
	  if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

	  // Index array by numeric index or specified key function.
	  else if (Array.isArray(object)) {
	    var i = -1,
	        n = object.length,
	        o;

	    if (f == null) while (++i < n) map.set(i, object[i]);
	    else while (++i < n) map.set(f(o = object[i], i, object), o);
	  }

	  // Convert object to map.
	  else if (object) for (var key in object) map.set(key, object[key]);

	  return map;
	}

	var nest = function() {
	  var keys = [],
	      sortKeys = [],
	      sortValues,
	      rollup,
	      nest;

	  function apply(array, depth, createResult, setResult) {
	    if (depth >= keys.length) {
	      if (sortValues != null) array.sort(sortValues);
	      return rollup != null ? rollup(array) : array;
	    }

	    var i = -1,
	        n = array.length,
	        key = keys[depth++],
	        keyValue,
	        value,
	        valuesByKey = map(),
	        values,
	        result = createResult();

	    while (++i < n) {
	      if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
	        values.push(value);
	      } else {
	        valuesByKey.set(keyValue, [value]);
	      }
	    }

	    valuesByKey.each(function(values, key) {
	      setResult(result, key, apply(values, depth, createResult, setResult));
	    });

	    return result;
	  }

	  function entries(map$$1, depth) {
	    if (++depth > keys.length) return map$$1;
	    var array, sortKey = sortKeys[depth - 1];
	    if (rollup != null && depth >= keys.length) array = map$$1.entries();
	    else array = [], map$$1.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
	    return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
	  }

	  return nest = {
	    object: function(array) { return apply(array, 0, createObject, setObject); },
	    map: function(array) { return apply(array, 0, createMap, setMap); },
	    entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
	    key: function(d) { keys.push(d); return nest; },
	    sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
	    sortValues: function(order) { sortValues = order; return nest; },
	    rollup: function(f) { rollup = f; return nest; }
	  };
	};

	function createObject() {
	  return {};
	}

	function setObject(object, key, value) {
	  object[key] = value;
	}

	function createMap() {
	  return map();
	}

	function setMap(map$$1, key, value) {
	  map$$1.set(key, value);
	}

	function Set() {}

	var proto = map.prototype;

	Set.prototype = set.prototype = {
	  constructor: Set,
	  has: proto.has,
	  add: function(value) {
	    value += "";
	    this[prefix + value] = value;
	    return this;
	  },
	  remove: proto.remove,
	  clear: proto.clear,
	  values: proto.keys,
	  size: proto.size,
	  empty: proto.empty,
	  each: proto.each
	};

	function set(object, f) {
	  var set = new Set;

	  // Copy constructor.
	  if (object instanceof Set) object.each(function(value) { set.add(value); });

	  // Otherwise, assume it’s an array.
	  else if (object) {
	    var i = -1, n = object.length;
	    if (f == null) while (++i < n) set.add(object[i]);
	    else while (++i < n) set.add(f(object[i], i, object));
	  }

	  return set;
	}

	var keys = function(map) {
	  var keys = [];
	  for (var key in map) keys.push(key);
	  return keys;
	};

	var values = function(map) {
	  var values = [];
	  for (var key in map) values.push(map[key]);
	  return values;
	};

	var entries = function(map) {
	  var entries = [];
	  for (var key in map) entries.push({key: key, value: map[key]});
	  return entries;
	};

	exports.nest = nest;
	exports.set = set;
	exports.map = map;
	exports.keys = keys;
	exports.values = values;
	exports.entries = entries;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-interpolate/ Version 1.1.6. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports, __webpack_require__(9)) :
		typeof define === 'function' && define.amd ? define(['exports', 'd3-color'], factory) :
		(factory((global.d3 = global.d3 || {}),global.d3));
	}(this, (function (exports,d3Color) { 'use strict';

	function basis(t1, v0, v1, v2, v3) {
	  var t2 = t1 * t1, t3 = t2 * t1;
	  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
	      + (4 - 6 * t2 + 3 * t3) * v1
	      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
	      + t3 * v3) / 6;
	}

	var basis$1 = function(values) {
	  var n = values.length - 1;
	  return function(t) {
	    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
	        v1 = values[i],
	        v2 = values[i + 1],
	        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
	        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
	    return basis((t - i / n) * n, v0, v1, v2, v3);
	  };
	};

	var basisClosed = function(values) {
	  var n = values.length;
	  return function(t) {
	    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
	        v0 = values[(i + n - 1) % n],
	        v1 = values[i % n],
	        v2 = values[(i + 1) % n],
	        v3 = values[(i + 2) % n];
	    return basis((t - i / n) * n, v0, v1, v2, v3);
	  };
	};

	var constant = function(x) {
	  return function() {
	    return x;
	  };
	};

	function linear(a, d) {
	  return function(t) {
	    return a + t * d;
	  };
	}

	function exponential(a, b, y) {
	  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
	    return Math.pow(a + t * b, y);
	  };
	}

	function hue(a, b) {
	  var d = b - a;
	  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant(isNaN(a) ? b : a);
	}

	function gamma(y) {
	  return (y = +y) === 1 ? nogamma : function(a, b) {
	    return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
	  };
	}

	function nogamma(a, b) {
	  var d = b - a;
	  return d ? linear(a, d) : constant(isNaN(a) ? b : a);
	}

	var rgb$1 = ((function rgbGamma(y) {
	  var color$$1 = gamma(y);

	  function rgb$$1(start, end) {
	    var r = color$$1((start = d3Color.rgb(start)).r, (end = d3Color.rgb(end)).r),
	        g = color$$1(start.g, end.g),
	        b = color$$1(start.b, end.b),
	        opacity = nogamma(start.opacity, end.opacity);
	    return function(t) {
	      start.r = r(t);
	      start.g = g(t);
	      start.b = b(t);
	      start.opacity = opacity(t);
	      return start + "";
	    };
	  }

	  rgb$$1.gamma = rgbGamma;

	  return rgb$$1;
	}))(1);

	function rgbSpline(spline) {
	  return function(colors) {
	    var n = colors.length,
	        r = new Array(n),
	        g = new Array(n),
	        b = new Array(n),
	        i, color$$1;
	    for (i = 0; i < n; ++i) {
	      color$$1 = d3Color.rgb(colors[i]);
	      r[i] = color$$1.r || 0;
	      g[i] = color$$1.g || 0;
	      b[i] = color$$1.b || 0;
	    }
	    r = spline(r);
	    g = spline(g);
	    b = spline(b);
	    color$$1.opacity = 1;
	    return function(t) {
	      color$$1.r = r(t);
	      color$$1.g = g(t);
	      color$$1.b = b(t);
	      return color$$1 + "";
	    };
	  };
	}

	var rgbBasis = rgbSpline(basis$1);
	var rgbBasisClosed = rgbSpline(basisClosed);

	var array = function(a, b) {
	  var nb = b ? b.length : 0,
	      na = a ? Math.min(nb, a.length) : 0,
	      x = new Array(na),
	      c = new Array(nb),
	      i;

	  for (i = 0; i < na; ++i) x[i] = value(a[i], b[i]);
	  for (; i < nb; ++i) c[i] = b[i];

	  return function(t) {
	    for (i = 0; i < na; ++i) c[i] = x[i](t);
	    return c;
	  };
	};

	var date = function(a, b) {
	  var d = new Date;
	  return a = +a, b -= a, function(t) {
	    return d.setTime(a + b * t), d;
	  };
	};

	var number = function(a, b) {
	  return a = +a, b -= a, function(t) {
	    return a + b * t;
	  };
	};

	var object = function(a, b) {
	  var i = {},
	      c = {},
	      k;

	  if (a === null || typeof a !== "object") a = {};
	  if (b === null || typeof b !== "object") b = {};

	  for (k in b) {
	    if (k in a) {
	      i[k] = value(a[k], b[k]);
	    } else {
	      c[k] = b[k];
	    }
	  }

	  return function(t) {
	    for (k in i) c[k] = i[k](t);
	    return c;
	  };
	};

	var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
	var reB = new RegExp(reA.source, "g");

	function zero(b) {
	  return function() {
	    return b;
	  };
	}

	function one(b) {
	  return function(t) {
	    return b(t) + "";
	  };
	}

	var string = function(a, b) {
	  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
	      am, // current match in a
	      bm, // current match in b
	      bs, // string preceding current number in b, if any
	      i = -1, // index in s
	      s = [], // string constants and placeholders
	      q = []; // number interpolators

	  // Coerce inputs to strings.
	  a = a + "", b = b + "";

	  // Interpolate pairs of numbers in a & b.
	  while ((am = reA.exec(a))
	      && (bm = reB.exec(b))) {
	    if ((bs = bm.index) > bi) { // a string precedes the next number in b
	      bs = b.slice(bi, bs);
	      if (s[i]) s[i] += bs; // coalesce with previous string
	      else s[++i] = bs;
	    }
	    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
	      if (s[i]) s[i] += bm; // coalesce with previous string
	      else s[++i] = bm;
	    } else { // interpolate non-matching numbers
	      s[++i] = null;
	      q.push({i: i, x: number(am, bm)});
	    }
	    bi = reB.lastIndex;
	  }

	  // Add remains of b.
	  if (bi < b.length) {
	    bs = b.slice(bi);
	    if (s[i]) s[i] += bs; // coalesce with previous string
	    else s[++i] = bs;
	  }

	  // Special optimization for only a single match.
	  // Otherwise, interpolate each of the numbers and rejoin the string.
	  return s.length < 2 ? (q[0]
	      ? one(q[0].x)
	      : zero(b))
	      : (b = q.length, function(t) {
	          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
	          return s.join("");
	        });
	};

	var value = function(a, b) {
	  var t = typeof b, c;
	  return b == null || t === "boolean" ? constant(b)
	      : (t === "number" ? number
	      : t === "string" ? ((c = d3Color.color(b)) ? (b = c, rgb$1) : string)
	      : b instanceof d3Color.color ? rgb$1
	      : b instanceof Date ? date
	      : Array.isArray(b) ? array
	      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
	      : number)(a, b);
	};

	var round = function(a, b) {
	  return a = +a, b -= a, function(t) {
	    return Math.round(a + b * t);
	  };
	};

	var degrees = 180 / Math.PI;

	var identity = {
	  translateX: 0,
	  translateY: 0,
	  rotate: 0,
	  skewX: 0,
	  scaleX: 1,
	  scaleY: 1
	};

	var decompose = function(a, b, c, d, e, f) {
	  var scaleX, scaleY, skewX;
	  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
	  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
	  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
	  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
	  return {
	    translateX: e,
	    translateY: f,
	    rotate: Math.atan2(b, a) * degrees,
	    skewX: Math.atan(skewX) * degrees,
	    scaleX: scaleX,
	    scaleY: scaleY
	  };
	};

	var cssNode;
	var cssRoot;
	var cssView;
	var svgNode;

	function parseCss(value) {
	  if (value === "none") return identity;
	  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
	  cssNode.style.transform = value;
	  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
	  cssRoot.removeChild(cssNode);
	  value = value.slice(7, -1).split(",");
	  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
	}

	function parseSvg(value) {
	  if (value == null) return identity;
	  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
	  svgNode.setAttribute("transform", value);
	  if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
	  value = value.matrix;
	  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
	}

	function interpolateTransform(parse, pxComma, pxParen, degParen) {

	  function pop(s) {
	    return s.length ? s.pop() + " " : "";
	  }

	  function translate(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push("translate(", null, pxComma, null, pxParen);
	      q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
	    } else if (xb || yb) {
	      s.push("translate(" + xb + pxComma + yb + pxParen);
	    }
	  }

	  function rotate(a, b, s, q) {
	    if (a !== b) {
	      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
	      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "rotate(" + b + degParen);
	    }
	  }

	  function skewX(a, b, s, q) {
	    if (a !== b) {
	      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "skewX(" + b + degParen);
	    }
	  }

	  function scale(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
	      q.push({i: i - 4, x: number(xa, xb)}, {i: i - 2, x: number(ya, yb)});
	    } else if (xb !== 1 || yb !== 1) {
	      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
	    }
	  }

	  return function(a, b) {
	    var s = [], // string constants and placeholders
	        q = []; // number interpolators
	    a = parse(a), b = parse(b);
	    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
	    rotate(a.rotate, b.rotate, s, q);
	    skewX(a.skewX, b.skewX, s, q);
	    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
	    a = b = null; // gc
	    return function(t) {
	      var i = -1, n = q.length, o;
	      while (++i < n) s[(o = q[i]).i] = o.x(t);
	      return s.join("");
	    };
	  };
	}

	var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
	var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

	var rho = Math.SQRT2;
	var rho2 = 2;
	var rho4 = 4;
	var epsilon2 = 1e-12;

	function cosh(x) {
	  return ((x = Math.exp(x)) + 1 / x) / 2;
	}

	function sinh(x) {
	  return ((x = Math.exp(x)) - 1 / x) / 2;
	}

	function tanh(x) {
	  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
	}

	// p0 = [ux0, uy0, w0]
	// p1 = [ux1, uy1, w1]
	var zoom = function(p0, p1) {
	  var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
	      ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
	      dx = ux1 - ux0,
	      dy = uy1 - uy0,
	      d2 = dx * dx + dy * dy,
	      i,
	      S;

	  // Special case for u0 ≅ u1.
	  if (d2 < epsilon2) {
	    S = Math.log(w1 / w0) / rho;
	    i = function(t) {
	      return [
	        ux0 + t * dx,
	        uy0 + t * dy,
	        w0 * Math.exp(rho * t * S)
	      ];
	    };
	  }

	  // General case.
	  else {
	    var d1 = Math.sqrt(d2),
	        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
	        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
	        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
	        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
	    S = (r1 - r0) / rho;
	    i = function(t) {
	      var s = t * S,
	          coshr0 = cosh(r0),
	          u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
	      return [
	        ux0 + u * dx,
	        uy0 + u * dy,
	        w0 * coshr0 / cosh(rho * s + r0)
	      ];
	    };
	  }

	  i.duration = S * 1000;

	  return i;
	};

	function hsl$1(hue$$1) {
	  return function(start, end) {
	    var h = hue$$1((start = d3Color.hsl(start)).h, (end = d3Color.hsl(end)).h),
	        s = nogamma(start.s, end.s),
	        l = nogamma(start.l, end.l),
	        opacity = nogamma(start.opacity, end.opacity);
	    return function(t) {
	      start.h = h(t);
	      start.s = s(t);
	      start.l = l(t);
	      start.opacity = opacity(t);
	      return start + "";
	    };
	  }
	}

	var hsl$2 = hsl$1(hue);
	var hslLong = hsl$1(nogamma);

	function lab$1(start, end) {
	  var l = nogamma((start = d3Color.lab(start)).l, (end = d3Color.lab(end)).l),
	      a = nogamma(start.a, end.a),
	      b = nogamma(start.b, end.b),
	      opacity = nogamma(start.opacity, end.opacity);
	  return function(t) {
	    start.l = l(t);
	    start.a = a(t);
	    start.b = b(t);
	    start.opacity = opacity(t);
	    return start + "";
	  };
	}

	function hcl$1(hue$$1) {
	  return function(start, end) {
	    var h = hue$$1((start = d3Color.hcl(start)).h, (end = d3Color.hcl(end)).h),
	        c = nogamma(start.c, end.c),
	        l = nogamma(start.l, end.l),
	        opacity = nogamma(start.opacity, end.opacity);
	    return function(t) {
	      start.h = h(t);
	      start.c = c(t);
	      start.l = l(t);
	      start.opacity = opacity(t);
	      return start + "";
	    };
	  }
	}

	var hcl$2 = hcl$1(hue);
	var hclLong = hcl$1(nogamma);

	function cubehelix$1(hue$$1) {
	  return (function cubehelixGamma(y) {
	    y = +y;

	    function cubehelix$$1(start, end) {
	      var h = hue$$1((start = d3Color.cubehelix(start)).h, (end = d3Color.cubehelix(end)).h),
	          s = nogamma(start.s, end.s),
	          l = nogamma(start.l, end.l),
	          opacity = nogamma(start.opacity, end.opacity);
	      return function(t) {
	        start.h = h(t);
	        start.s = s(t);
	        start.l = l(Math.pow(t, y));
	        start.opacity = opacity(t);
	        return start + "";
	      };
	    }

	    cubehelix$$1.gamma = cubehelixGamma;

	    return cubehelix$$1;
	  })(1);
	}

	var cubehelix$2 = cubehelix$1(hue);
	var cubehelixLong = cubehelix$1(nogamma);

	var quantize = function(interpolator, n) {
	  var samples = new Array(n);
	  for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
	  return samples;
	};

	exports.interpolate = value;
	exports.interpolateArray = array;
	exports.interpolateBasis = basis$1;
	exports.interpolateBasisClosed = basisClosed;
	exports.interpolateDate = date;
	exports.interpolateNumber = number;
	exports.interpolateObject = object;
	exports.interpolateRound = round;
	exports.interpolateString = string;
	exports.interpolateTransformCss = interpolateTransformCss;
	exports.interpolateTransformSvg = interpolateTransformSvg;
	exports.interpolateZoom = zoom;
	exports.interpolateRgb = rgb$1;
	exports.interpolateRgbBasis = rgbBasis;
	exports.interpolateRgbBasisClosed = rgbBasisClosed;
	exports.interpolateHsl = hsl$2;
	exports.interpolateHslLong = hslLong;
	exports.interpolateLab = lab$1;
	exports.interpolateHcl = hcl$2;
	exports.interpolateHclLong = hclLong;
	exports.interpolateCubehelix = cubehelix$2;
	exports.interpolateCubehelixLong = cubehelixLong;
	exports.quantize = quantize;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-color/ Version 1.0.3. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.d3 = global.d3 || {})));
	}(this, (function (exports) { 'use strict';

	var define = function(constructor, factory, prototype) {
	  constructor.prototype = factory.prototype = prototype;
	  prototype.constructor = constructor;
	};

	function extend(parent, definition) {
	  var prototype = Object.create(parent.prototype);
	  for (var key in definition) prototype[key] = definition[key];
	  return prototype;
	}

	function Color() {}

	var darker = 0.7;
	var brighter = 1 / darker;

	var reI = "\\s*([+-]?\\d+)\\s*";
	var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
	var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
	var reHex3 = /^#([0-9a-f]{3})$/;
	var reHex6 = /^#([0-9a-f]{6})$/;
	var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
	var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
	var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
	var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
	var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
	var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

	var named = {
	  aliceblue: 0xf0f8ff,
	  antiquewhite: 0xfaebd7,
	  aqua: 0x00ffff,
	  aquamarine: 0x7fffd4,
	  azure: 0xf0ffff,
	  beige: 0xf5f5dc,
	  bisque: 0xffe4c4,
	  black: 0x000000,
	  blanchedalmond: 0xffebcd,
	  blue: 0x0000ff,
	  blueviolet: 0x8a2be2,
	  brown: 0xa52a2a,
	  burlywood: 0xdeb887,
	  cadetblue: 0x5f9ea0,
	  chartreuse: 0x7fff00,
	  chocolate: 0xd2691e,
	  coral: 0xff7f50,
	  cornflowerblue: 0x6495ed,
	  cornsilk: 0xfff8dc,
	  crimson: 0xdc143c,
	  cyan: 0x00ffff,
	  darkblue: 0x00008b,
	  darkcyan: 0x008b8b,
	  darkgoldenrod: 0xb8860b,
	  darkgray: 0xa9a9a9,
	  darkgreen: 0x006400,
	  darkgrey: 0xa9a9a9,
	  darkkhaki: 0xbdb76b,
	  darkmagenta: 0x8b008b,
	  darkolivegreen: 0x556b2f,
	  darkorange: 0xff8c00,
	  darkorchid: 0x9932cc,
	  darkred: 0x8b0000,
	  darksalmon: 0xe9967a,
	  darkseagreen: 0x8fbc8f,
	  darkslateblue: 0x483d8b,
	  darkslategray: 0x2f4f4f,
	  darkslategrey: 0x2f4f4f,
	  darkturquoise: 0x00ced1,
	  darkviolet: 0x9400d3,
	  deeppink: 0xff1493,
	  deepskyblue: 0x00bfff,
	  dimgray: 0x696969,
	  dimgrey: 0x696969,
	  dodgerblue: 0x1e90ff,
	  firebrick: 0xb22222,
	  floralwhite: 0xfffaf0,
	  forestgreen: 0x228b22,
	  fuchsia: 0xff00ff,
	  gainsboro: 0xdcdcdc,
	  ghostwhite: 0xf8f8ff,
	  gold: 0xffd700,
	  goldenrod: 0xdaa520,
	  gray: 0x808080,
	  green: 0x008000,
	  greenyellow: 0xadff2f,
	  grey: 0x808080,
	  honeydew: 0xf0fff0,
	  hotpink: 0xff69b4,
	  indianred: 0xcd5c5c,
	  indigo: 0x4b0082,
	  ivory: 0xfffff0,
	  khaki: 0xf0e68c,
	  lavender: 0xe6e6fa,
	  lavenderblush: 0xfff0f5,
	  lawngreen: 0x7cfc00,
	  lemonchiffon: 0xfffacd,
	  lightblue: 0xadd8e6,
	  lightcoral: 0xf08080,
	  lightcyan: 0xe0ffff,
	  lightgoldenrodyellow: 0xfafad2,
	  lightgray: 0xd3d3d3,
	  lightgreen: 0x90ee90,
	  lightgrey: 0xd3d3d3,
	  lightpink: 0xffb6c1,
	  lightsalmon: 0xffa07a,
	  lightseagreen: 0x20b2aa,
	  lightskyblue: 0x87cefa,
	  lightslategray: 0x778899,
	  lightslategrey: 0x778899,
	  lightsteelblue: 0xb0c4de,
	  lightyellow: 0xffffe0,
	  lime: 0x00ff00,
	  limegreen: 0x32cd32,
	  linen: 0xfaf0e6,
	  magenta: 0xff00ff,
	  maroon: 0x800000,
	  mediumaquamarine: 0x66cdaa,
	  mediumblue: 0x0000cd,
	  mediumorchid: 0xba55d3,
	  mediumpurple: 0x9370db,
	  mediumseagreen: 0x3cb371,
	  mediumslateblue: 0x7b68ee,
	  mediumspringgreen: 0x00fa9a,
	  mediumturquoise: 0x48d1cc,
	  mediumvioletred: 0xc71585,
	  midnightblue: 0x191970,
	  mintcream: 0xf5fffa,
	  mistyrose: 0xffe4e1,
	  moccasin: 0xffe4b5,
	  navajowhite: 0xffdead,
	  navy: 0x000080,
	  oldlace: 0xfdf5e6,
	  olive: 0x808000,
	  olivedrab: 0x6b8e23,
	  orange: 0xffa500,
	  orangered: 0xff4500,
	  orchid: 0xda70d6,
	  palegoldenrod: 0xeee8aa,
	  palegreen: 0x98fb98,
	  paleturquoise: 0xafeeee,
	  palevioletred: 0xdb7093,
	  papayawhip: 0xffefd5,
	  peachpuff: 0xffdab9,
	  peru: 0xcd853f,
	  pink: 0xffc0cb,
	  plum: 0xdda0dd,
	  powderblue: 0xb0e0e6,
	  purple: 0x800080,
	  rebeccapurple: 0x663399,
	  red: 0xff0000,
	  rosybrown: 0xbc8f8f,
	  royalblue: 0x4169e1,
	  saddlebrown: 0x8b4513,
	  salmon: 0xfa8072,
	  sandybrown: 0xf4a460,
	  seagreen: 0x2e8b57,
	  seashell: 0xfff5ee,
	  sienna: 0xa0522d,
	  silver: 0xc0c0c0,
	  skyblue: 0x87ceeb,
	  slateblue: 0x6a5acd,
	  slategray: 0x708090,
	  slategrey: 0x708090,
	  snow: 0xfffafa,
	  springgreen: 0x00ff7f,
	  steelblue: 0x4682b4,
	  tan: 0xd2b48c,
	  teal: 0x008080,
	  thistle: 0xd8bfd8,
	  tomato: 0xff6347,
	  turquoise: 0x40e0d0,
	  violet: 0xee82ee,
	  wheat: 0xf5deb3,
	  white: 0xffffff,
	  whitesmoke: 0xf5f5f5,
	  yellow: 0xffff00,
	  yellowgreen: 0x9acd32
	};

	define(Color, color, {
	  displayable: function() {
	    return this.rgb().displayable();
	  },
	  toString: function() {
	    return this.rgb() + "";
	  }
	});

	function color(format) {
	  var m;
	  format = (format + "").trim().toLowerCase();
	  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
	      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
	      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
	      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
	      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
	      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
	      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
	      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
	      : named.hasOwnProperty(format) ? rgbn(named[format])
	      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
	      : null;
	}

	function rgbn(n) {
	  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
	}

	function rgba(r, g, b, a) {
	  if (a <= 0) r = g = b = NaN;
	  return new Rgb(r, g, b, a);
	}

	function rgbConvert(o) {
	  if (!(o instanceof Color)) o = color(o);
	  if (!o) return new Rgb;
	  o = o.rgb();
	  return new Rgb(o.r, o.g, o.b, o.opacity);
	}

	function rgb(r, g, b, opacity) {
	  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
	}

	function Rgb(r, g, b, opacity) {
	  this.r = +r;
	  this.g = +g;
	  this.b = +b;
	  this.opacity = +opacity;
	}

	define(Rgb, rgb, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  rgb: function() {
	    return this;
	  },
	  displayable: function() {
	    return (0 <= this.r && this.r <= 255)
	        && (0 <= this.g && this.g <= 255)
	        && (0 <= this.b && this.b <= 255)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  toString: function() {
	    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
	    return (a === 1 ? "rgb(" : "rgba(")
	        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
	        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
	        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
	        + (a === 1 ? ")" : ", " + a + ")");
	  }
	}));

	function hsla(h, s, l, a) {
	  if (a <= 0) h = s = l = NaN;
	  else if (l <= 0 || l >= 1) h = s = NaN;
	  else if (s <= 0) h = NaN;
	  return new Hsl(h, s, l, a);
	}

	function hslConvert(o) {
	  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
	  if (!(o instanceof Color)) o = color(o);
	  if (!o) return new Hsl;
	  if (o instanceof Hsl) return o;
	  o = o.rgb();
	  var r = o.r / 255,
	      g = o.g / 255,
	      b = o.b / 255,
	      min = Math.min(r, g, b),
	      max = Math.max(r, g, b),
	      h = NaN,
	      s = max - min,
	      l = (max + min) / 2;
	  if (s) {
	    if (r === max) h = (g - b) / s + (g < b) * 6;
	    else if (g === max) h = (b - r) / s + 2;
	    else h = (r - g) / s + 4;
	    s /= l < 0.5 ? max + min : 2 - max - min;
	    h *= 60;
	  } else {
	    s = l > 0 && l < 1 ? 0 : h;
	  }
	  return new Hsl(h, s, l, o.opacity);
	}

	function hsl(h, s, l, opacity) {
	  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
	}

	function Hsl(h, s, l, opacity) {
	  this.h = +h;
	  this.s = +s;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Hsl, hsl, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  rgb: function() {
	    var h = this.h % 360 + (this.h < 0) * 360,
	        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
	        l = this.l,
	        m2 = l + (l < 0.5 ? l : 1 - l) * s,
	        m1 = 2 * l - m2;
	    return new Rgb(
	      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
	      hsl2rgb(h, m1, m2),
	      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
	      this.opacity
	    );
	  },
	  displayable: function() {
	    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
	        && (0 <= this.l && this.l <= 1)
	        && (0 <= this.opacity && this.opacity <= 1);
	  }
	}));

	/* From FvD 13.37, CSS Color Module Level 3 */
	function hsl2rgb(h, m1, m2) {
	  return (h < 60 ? m1 + (m2 - m1) * h / 60
	      : h < 180 ? m2
	      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
	      : m1) * 255;
	}

	var deg2rad = Math.PI / 180;
	var rad2deg = 180 / Math.PI;

	var Kn = 18;
	var Xn = 0.950470;
	var Yn = 1;
	var Zn = 1.088830;
	var t0 = 4 / 29;
	var t1 = 6 / 29;
	var t2 = 3 * t1 * t1;
	var t3 = t1 * t1 * t1;

	function labConvert(o) {
	  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
	  if (o instanceof Hcl) {
	    var h = o.h * deg2rad;
	    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
	  }
	  if (!(o instanceof Rgb)) o = rgbConvert(o);
	  var b = rgb2xyz(o.r),
	      a = rgb2xyz(o.g),
	      l = rgb2xyz(o.b),
	      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
	      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
	      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
	  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
	}

	function lab(l, a, b, opacity) {
	  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
	}

	function Lab(l, a, b, opacity) {
	  this.l = +l;
	  this.a = +a;
	  this.b = +b;
	  this.opacity = +opacity;
	}

	define(Lab, lab, extend(Color, {
	  brighter: function(k) {
	    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
	  },
	  darker: function(k) {
	    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
	  },
	  rgb: function() {
	    var y = (this.l + 16) / 116,
	        x = isNaN(this.a) ? y : y + this.a / 500,
	        z = isNaN(this.b) ? y : y - this.b / 200;
	    y = Yn * lab2xyz(y);
	    x = Xn * lab2xyz(x);
	    z = Zn * lab2xyz(z);
	    return new Rgb(
	      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
	      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
	      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
	      this.opacity
	    );
	  }
	}));

	function xyz2lab(t) {
	  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
	}

	function lab2xyz(t) {
	  return t > t1 ? t * t * t : t2 * (t - t0);
	}

	function xyz2rgb(x) {
	  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
	}

	function rgb2xyz(x) {
	  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
	}

	function hclConvert(o) {
	  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
	  if (!(o instanceof Lab)) o = labConvert(o);
	  var h = Math.atan2(o.b, o.a) * rad2deg;
	  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
	}

	function hcl(h, c, l, opacity) {
	  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
	}

	function Hcl(h, c, l, opacity) {
	  this.h = +h;
	  this.c = +c;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Hcl, hcl, extend(Color, {
	  brighter: function(k) {
	    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
	  },
	  darker: function(k) {
	    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
	  },
	  rgb: function() {
	    return labConvert(this).rgb();
	  }
	}));

	var A = -0.14861;
	var B = +1.78277;
	var C = -0.29227;
	var D = -0.90649;
	var E = +1.97294;
	var ED = E * D;
	var EB = E * B;
	var BC_DA = B * C - D * A;

	function cubehelixConvert(o) {
	  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
	  if (!(o instanceof Rgb)) o = rgbConvert(o);
	  var r = o.r / 255,
	      g = o.g / 255,
	      b = o.b / 255,
	      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
	      bl = b - l,
	      k = (E * (g - l) - C * bl) / D,
	      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
	      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
	  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
	}

	function cubehelix(h, s, l, opacity) {
	  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
	}

	function Cubehelix(h, s, l, opacity) {
	  this.h = +h;
	  this.s = +s;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Cubehelix, cubehelix, extend(Color, {
	  brighter: function(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
	  },
	  darker: function(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
	  },
	  rgb: function() {
	    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
	        l = +this.l,
	        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
	        cosh = Math.cos(h),
	        sinh = Math.sin(h);
	    return new Rgb(
	      255 * (l + a * (A * cosh + B * sinh)),
	      255 * (l + a * (C * cosh + D * sinh)),
	      255 * (l + a * (E * cosh)),
	      this.opacity
	    );
	  }
	}));

	exports.color = color;
	exports.rgb = rgb;
	exports.hsl = hsl;
	exports.lab = lab;
	exports.hcl = hcl;
	exports.cubehelix = cubehelix;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-format/ Version 1.2.1. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.d3 = global.d3 || {})));
	}(this, (function (exports) { 'use strict';

	// Computes the decimal coefficient and exponent of the specified number x with
	// significant digits p, where x is positive and p is in [1, 21] or undefined.
	// For example, formatDecimal(1.23) returns ["123", 0].
	var formatDecimal = function(x, p) {
	  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
	  var i, coefficient = x.slice(0, i);

	  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
	  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
	  return [
	    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
	    +x.slice(i + 1)
	  ];
	};

	var exponent = function(x) {
	  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
	};

	var formatGroup = function(grouping, thousands) {
	  return function(value, width) {
	    var i = value.length,
	        t = [],
	        j = 0,
	        g = grouping[0],
	        length = 0;

	    while (i > 0 && g > 0) {
	      if (length + g + 1 > width) g = Math.max(1, width - length);
	      t.push(value.substring(i -= g, i + g));
	      if ((length += g + 1) > width) break;
	      g = grouping[j = (j + 1) % grouping.length];
	    }

	    return t.reverse().join(thousands);
	  };
	};

	var formatNumerals = function(numerals) {
	  return function(value) {
	    return value.replace(/[0-9]/g, function(i) {
	      return numerals[+i];
	    });
	  };
	};

	var formatDefault = function(x, p) {
	  x = x.toPrecision(p);

	  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
	    switch (x[i]) {
	      case ".": i0 = i1 = i; break;
	      case "0": if (i0 === 0) i0 = i; i1 = i; break;
	      case "e": break out;
	      default: if (i0 > 0) i0 = 0; break;
	    }
	  }

	  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
	};

	var prefixExponent;

	var formatPrefixAuto = function(x, p) {
	  var d = formatDecimal(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1],
	      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
	      n = coefficient.length;
	  return i === n ? coefficient
	      : i > n ? coefficient + new Array(i - n + 1).join("0")
	      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
	      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
	};

	var formatRounded = function(x, p) {
	  var d = formatDecimal(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1];
	  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
	      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
	      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
	};

	var formatTypes = {
	  "": formatDefault,
	  "%": function(x, p) { return (x * 100).toFixed(p); },
	  "b": function(x) { return Math.round(x).toString(2); },
	  "c": function(x) { return x + ""; },
	  "d": function(x) { return Math.round(x).toString(10); },
	  "e": function(x, p) { return x.toExponential(p); },
	  "f": function(x, p) { return x.toFixed(p); },
	  "g": function(x, p) { return x.toPrecision(p); },
	  "o": function(x) { return Math.round(x).toString(8); },
	  "p": function(x, p) { return formatRounded(x * 100, p); },
	  "r": formatRounded,
	  "s": formatPrefixAuto,
	  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
	  "x": function(x) { return Math.round(x).toString(16); }
	};

	// [[fill]align][sign][symbol][0][width][,][.precision][type]
	var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

	function formatSpecifier(specifier) {
	  return new FormatSpecifier(specifier);
	}

	formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

	function FormatSpecifier(specifier) {
	  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

	  var match,
	      fill = match[1] || " ",
	      align = match[2] || ">",
	      sign = match[3] || "-",
	      symbol = match[4] || "",
	      zero = !!match[5],
	      width = match[6] && +match[6],
	      comma = !!match[7],
	      precision = match[8] && +match[8].slice(1),
	      type = match[9] || "";

	  // The "n" type is an alias for ",g".
	  if (type === "n") comma = true, type = "g";

	  // Map invalid types to the default format.
	  else if (!formatTypes[type]) type = "";

	  // If zero fill is specified, padding goes after sign and before digits.
	  if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

	  this.fill = fill;
	  this.align = align;
	  this.sign = sign;
	  this.symbol = symbol;
	  this.zero = zero;
	  this.width = width;
	  this.comma = comma;
	  this.precision = precision;
	  this.type = type;
	}

	FormatSpecifier.prototype.toString = function() {
	  return this.fill
	      + this.align
	      + this.sign
	      + this.symbol
	      + (this.zero ? "0" : "")
	      + (this.width == null ? "" : Math.max(1, this.width | 0))
	      + (this.comma ? "," : "")
	      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
	      + this.type;
	};

	var identity = function(x) {
	  return x;
	};

	var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

	var formatLocale = function(locale) {
	  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity,
	      currency = locale.currency,
	      decimal = locale.decimal,
	      numerals = locale.numerals ? formatNumerals(locale.numerals) : identity,
	      percent = locale.percent || "%";

	  function newFormat(specifier) {
	    specifier = formatSpecifier(specifier);

	    var fill = specifier.fill,
	        align = specifier.align,
	        sign = specifier.sign,
	        symbol = specifier.symbol,
	        zero = specifier.zero,
	        width = specifier.width,
	        comma = specifier.comma,
	        precision = specifier.precision,
	        type = specifier.type;

	    // Compute the prefix and suffix.
	    // For SI-prefix, the suffix is lazily computed.
	    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
	        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? percent : "";

	    // What format function should we use?
	    // Is this an integer type?
	    // Can this type generate exponential notation?
	    var formatType = formatTypes[type],
	        maybeSuffix = !type || /[defgprs%]/.test(type);

	    // Set the default precision if not specified,
	    // or clamp the specified precision to the supported range.
	    // For significant precision, it must be in [1, 21].
	    // For fixed precision, it must be in [0, 20].
	    precision = precision == null ? (type ? 6 : 12)
	        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
	        : Math.max(0, Math.min(20, precision));

	    function format(value) {
	      var valuePrefix = prefix,
	          valueSuffix = suffix,
	          i, n, c;

	      if (type === "c") {
	        valueSuffix = formatType(value) + valueSuffix;
	        value = "";
	      } else {
	        value = +value;

	        // Perform the initial formatting.
	        var valueNegative = value < 0;
	        value = formatType(Math.abs(value), precision);

	        // If a negative value rounds to zero during formatting, treat as positive.
	        if (valueNegative && +value === 0) valueNegative = false;

	        // Compute the prefix and suffix.
	        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
	        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

	        // Break the formatted value into the integer “value” part that can be
	        // grouped, and fractional or exponential “suffix” part that is not.
	        if (maybeSuffix) {
	          i = -1, n = value.length;
	          while (++i < n) {
	            if (c = value.charCodeAt(i), 48 > c || c > 57) {
	              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
	              value = value.slice(0, i);
	              break;
	            }
	          }
	        }
	      }

	      // If the fill character is not "0", grouping is applied before padding.
	      if (comma && !zero) value = group(value, Infinity);

	      // Compute the padding.
	      var length = valuePrefix.length + value.length + valueSuffix.length,
	          padding = length < width ? new Array(width - length + 1).join(fill) : "";

	      // If the fill character is "0", grouping is applied after padding.
	      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

	      // Reconstruct the final output based on the desired alignment.
	      switch (align) {
	        case "<": value = valuePrefix + value + valueSuffix + padding; break;
	        case "=": value = valuePrefix + padding + value + valueSuffix; break;
	        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
	        default: value = padding + valuePrefix + value + valueSuffix; break;
	      }

	      return numerals(value);
	    }

	    format.toString = function() {
	      return specifier + "";
	    };

	    return format;
	  }

	  function formatPrefix(specifier, value) {
	    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
	        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
	        k = Math.pow(10, -e),
	        prefix = prefixes[8 + e / 3];
	    return function(value) {
	      return f(k * value) + prefix;
	    };
	  }

	  return {
	    format: newFormat,
	    formatPrefix: formatPrefix
	  };
	};

	var locale;



	defaultLocale({
	  decimal: ".",
	  thousands: ",",
	  grouping: [3],
	  currency: ["$", ""]
	});

	function defaultLocale(definition) {
	  locale = formatLocale(definition);
	  exports.format = locale.format;
	  exports.formatPrefix = locale.formatPrefix;
	  return locale;
	}

	var precisionFixed = function(step) {
	  return Math.max(0, -exponent(Math.abs(step)));
	};

	var precisionPrefix = function(step, value) {
	  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
	};

	var precisionRound = function(step, max) {
	  step = Math.abs(step), max = Math.abs(max) - step;
	  return Math.max(0, exponent(max) - exponent(step)) + 1;
	};

	exports.formatDefaultLocale = defaultLocale;
	exports.formatLocale = formatLocale;
	exports.formatSpecifier = formatSpecifier;
	exports.precisionFixed = precisionFixed;
	exports.precisionPrefix = precisionPrefix;
	exports.precisionRound = precisionRound;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-time/ Version 1.0.8. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.d3 = global.d3 || {})));
	}(this, (function (exports) { 'use strict';

	var t0 = new Date;
	var t1 = new Date;

	function newInterval(floori, offseti, count, field) {

	  function interval(date) {
	    return floori(date = new Date(+date)), date;
	  }

	  interval.floor = interval;

	  interval.ceil = function(date) {
	    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
	  };

	  interval.round = function(date) {
	    var d0 = interval(date),
	        d1 = interval.ceil(date);
	    return date - d0 < d1 - date ? d0 : d1;
	  };

	  interval.offset = function(date, step) {
	    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
	  };

	  interval.range = function(start, stop, step) {
	    var range = [], previous;
	    start = interval.ceil(start);
	    step = step == null ? 1 : Math.floor(step);
	    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
	    do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
	    while (previous < start && start < stop);
	    return range;
	  };

	  interval.filter = function(test) {
	    return newInterval(function(date) {
	      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
	    }, function(date, step) {
	      if (date >= date) {
	        if (step < 0) while (++step <= 0) {
	          while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
	        } else while (--step >= 0) {
	          while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
	        }
	      }
	    });
	  };

	  if (count) {
	    interval.count = function(start, end) {
	      t0.setTime(+start), t1.setTime(+end);
	      floori(t0), floori(t1);
	      return Math.floor(count(t0, t1));
	    };

	    interval.every = function(step) {
	      step = Math.floor(step);
	      return !isFinite(step) || !(step > 0) ? null
	          : !(step > 1) ? interval
	          : interval.filter(field
	              ? function(d) { return field(d) % step === 0; }
	              : function(d) { return interval.count(0, d) % step === 0; });
	    };
	  }

	  return interval;
	}

	var millisecond = newInterval(function() {
	  // noop
	}, function(date, step) {
	  date.setTime(+date + step);
	}, function(start, end) {
	  return end - start;
	});

	// An optimized implementation for this simple case.
	millisecond.every = function(k) {
	  k = Math.floor(k);
	  if (!isFinite(k) || !(k > 0)) return null;
	  if (!(k > 1)) return millisecond;
	  return newInterval(function(date) {
	    date.setTime(Math.floor(date / k) * k);
	  }, function(date, step) {
	    date.setTime(+date + step * k);
	  }, function(start, end) {
	    return (end - start) / k;
	  });
	};

	var milliseconds = millisecond.range;

	var durationSecond = 1e3;
	var durationMinute = 6e4;
	var durationHour = 36e5;
	var durationDay = 864e5;
	var durationWeek = 6048e5;

	var second = newInterval(function(date) {
	  date.setTime(Math.floor(date / durationSecond) * durationSecond);
	}, function(date, step) {
	  date.setTime(+date + step * durationSecond);
	}, function(start, end) {
	  return (end - start) / durationSecond;
	}, function(date) {
	  return date.getUTCSeconds();
	});

	var seconds = second.range;

	var minute = newInterval(function(date) {
	  date.setTime(Math.floor(date / durationMinute) * durationMinute);
	}, function(date, step) {
	  date.setTime(+date + step * durationMinute);
	}, function(start, end) {
	  return (end - start) / durationMinute;
	}, function(date) {
	  return date.getMinutes();
	});

	var minutes = minute.range;

	var hour = newInterval(function(date) {
	  var offset = date.getTimezoneOffset() * durationMinute % durationHour;
	  if (offset < 0) offset += durationHour;
	  date.setTime(Math.floor((+date - offset) / durationHour) * durationHour + offset);
	}, function(date, step) {
	  date.setTime(+date + step * durationHour);
	}, function(start, end) {
	  return (end - start) / durationHour;
	}, function(date) {
	  return date.getHours();
	});

	var hours = hour.range;

	var day = newInterval(function(date) {
	  date.setHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setDate(date.getDate() + step);
	}, function(start, end) {
	  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
	}, function(date) {
	  return date.getDate() - 1;
	});

	var days = day.range;

	function weekday(i) {
	  return newInterval(function(date) {
	    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
	    date.setHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setDate(date.getDate() + step * 7);
	  }, function(start, end) {
	    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
	  });
	}

	var sunday = weekday(0);
	var monday = weekday(1);
	var tuesday = weekday(2);
	var wednesday = weekday(3);
	var thursday = weekday(4);
	var friday = weekday(5);
	var saturday = weekday(6);

	var sundays = sunday.range;
	var mondays = monday.range;
	var tuesdays = tuesday.range;
	var wednesdays = wednesday.range;
	var thursdays = thursday.range;
	var fridays = friday.range;
	var saturdays = saturday.range;

	var month = newInterval(function(date) {
	  date.setDate(1);
	  date.setHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setMonth(date.getMonth() + step);
	}, function(start, end) {
	  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
	}, function(date) {
	  return date.getMonth();
	});

	var months = month.range;

	var year = newInterval(function(date) {
	  date.setMonth(0, 1);
	  date.setHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setFullYear(date.getFullYear() + step);
	}, function(start, end) {
	  return end.getFullYear() - start.getFullYear();
	}, function(date) {
	  return date.getFullYear();
	});

	// An optimized implementation for this simple case.
	year.every = function(k) {
	  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
	    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
	    date.setMonth(0, 1);
	    date.setHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setFullYear(date.getFullYear() + step * k);
	  });
	};

	var years = year.range;

	var utcMinute = newInterval(function(date) {
	  date.setUTCSeconds(0, 0);
	}, function(date, step) {
	  date.setTime(+date + step * durationMinute);
	}, function(start, end) {
	  return (end - start) / durationMinute;
	}, function(date) {
	  return date.getUTCMinutes();
	});

	var utcMinutes = utcMinute.range;

	var utcHour = newInterval(function(date) {
	  date.setUTCMinutes(0, 0, 0);
	}, function(date, step) {
	  date.setTime(+date + step * durationHour);
	}, function(start, end) {
	  return (end - start) / durationHour;
	}, function(date) {
	  return date.getUTCHours();
	});

	var utcHours = utcHour.range;

	var utcDay = newInterval(function(date) {
	  date.setUTCHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setUTCDate(date.getUTCDate() + step);
	}, function(start, end) {
	  return (end - start) / durationDay;
	}, function(date) {
	  return date.getUTCDate() - 1;
	});

	var utcDays = utcDay.range;

	function utcWeekday(i) {
	  return newInterval(function(date) {
	    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
	    date.setUTCHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setUTCDate(date.getUTCDate() + step * 7);
	  }, function(start, end) {
	    return (end - start) / durationWeek;
	  });
	}

	var utcSunday = utcWeekday(0);
	var utcMonday = utcWeekday(1);
	var utcTuesday = utcWeekday(2);
	var utcWednesday = utcWeekday(3);
	var utcThursday = utcWeekday(4);
	var utcFriday = utcWeekday(5);
	var utcSaturday = utcWeekday(6);

	var utcSundays = utcSunday.range;
	var utcMondays = utcMonday.range;
	var utcTuesdays = utcTuesday.range;
	var utcWednesdays = utcWednesday.range;
	var utcThursdays = utcThursday.range;
	var utcFridays = utcFriday.range;
	var utcSaturdays = utcSaturday.range;

	var utcMonth = newInterval(function(date) {
	  date.setUTCDate(1);
	  date.setUTCHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setUTCMonth(date.getUTCMonth() + step);
	}, function(start, end) {
	  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
	}, function(date) {
	  return date.getUTCMonth();
	});

	var utcMonths = utcMonth.range;

	var utcYear = newInterval(function(date) {
	  date.setUTCMonth(0, 1);
	  date.setUTCHours(0, 0, 0, 0);
	}, function(date, step) {
	  date.setUTCFullYear(date.getUTCFullYear() + step);
	}, function(start, end) {
	  return end.getUTCFullYear() - start.getUTCFullYear();
	}, function(date) {
	  return date.getUTCFullYear();
	});

	// An optimized implementation for this simple case.
	utcYear.every = function(k) {
	  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
	    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
	    date.setUTCMonth(0, 1);
	    date.setUTCHours(0, 0, 0, 0);
	  }, function(date, step) {
	    date.setUTCFullYear(date.getUTCFullYear() + step * k);
	  });
	};

	var utcYears = utcYear.range;

	exports.timeInterval = newInterval;
	exports.timeMillisecond = millisecond;
	exports.timeMilliseconds = milliseconds;
	exports.utcMillisecond = millisecond;
	exports.utcMilliseconds = milliseconds;
	exports.timeSecond = second;
	exports.timeSeconds = seconds;
	exports.utcSecond = second;
	exports.utcSeconds = seconds;
	exports.timeMinute = minute;
	exports.timeMinutes = minutes;
	exports.timeHour = hour;
	exports.timeHours = hours;
	exports.timeDay = day;
	exports.timeDays = days;
	exports.timeWeek = sunday;
	exports.timeWeeks = sundays;
	exports.timeSunday = sunday;
	exports.timeSundays = sundays;
	exports.timeMonday = monday;
	exports.timeMondays = mondays;
	exports.timeTuesday = tuesday;
	exports.timeTuesdays = tuesdays;
	exports.timeWednesday = wednesday;
	exports.timeWednesdays = wednesdays;
	exports.timeThursday = thursday;
	exports.timeThursdays = thursdays;
	exports.timeFriday = friday;
	exports.timeFridays = fridays;
	exports.timeSaturday = saturday;
	exports.timeSaturdays = saturdays;
	exports.timeMonth = month;
	exports.timeMonths = months;
	exports.timeYear = year;
	exports.timeYears = years;
	exports.utcMinute = utcMinute;
	exports.utcMinutes = utcMinutes;
	exports.utcHour = utcHour;
	exports.utcHours = utcHours;
	exports.utcDay = utcDay;
	exports.utcDays = utcDays;
	exports.utcWeek = utcSunday;
	exports.utcWeeks = utcSundays;
	exports.utcSunday = utcSunday;
	exports.utcSundays = utcSundays;
	exports.utcMonday = utcMonday;
	exports.utcMondays = utcMondays;
	exports.utcTuesday = utcTuesday;
	exports.utcTuesdays = utcTuesdays;
	exports.utcWednesday = utcWednesday;
	exports.utcWednesdays = utcWednesdays;
	exports.utcThursday = utcThursday;
	exports.utcThursdays = utcThursdays;
	exports.utcFriday = utcFriday;
	exports.utcFridays = utcFridays;
	exports.utcSaturday = utcSaturday;
	exports.utcSaturdays = utcSaturdays;
	exports.utcMonth = utcMonth;
	exports.utcMonths = utcMonths;
	exports.utcYear = utcYear;
	exports.utcYears = utcYears;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-time-format/ Version 2.1.1. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports, __webpack_require__(11)) :
		typeof define === 'function' && define.amd ? define(['exports', 'd3-time'], factory) :
		(factory((global.d3 = global.d3 || {}),global.d3));
	}(this, (function (exports,d3Time) { 'use strict';

	function localDate(d) {
	  if (0 <= d.y && d.y < 100) {
	    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
	    date.setFullYear(d.y);
	    return date;
	  }
	  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
	}

	function utcDate(d) {
	  if (0 <= d.y && d.y < 100) {
	    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
	    date.setUTCFullYear(d.y);
	    return date;
	  }
	  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
	}

	function newYear(y) {
	  return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
	}

	function formatLocale(locale) {
	  var locale_dateTime = locale.dateTime,
	      locale_date = locale.date,
	      locale_time = locale.time,
	      locale_periods = locale.periods,
	      locale_weekdays = locale.days,
	      locale_shortWeekdays = locale.shortDays,
	      locale_months = locale.months,
	      locale_shortMonths = locale.shortMonths;

	  var periodRe = formatRe(locale_periods),
	      periodLookup = formatLookup(locale_periods),
	      weekdayRe = formatRe(locale_weekdays),
	      weekdayLookup = formatLookup(locale_weekdays),
	      shortWeekdayRe = formatRe(locale_shortWeekdays),
	      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
	      monthRe = formatRe(locale_months),
	      monthLookup = formatLookup(locale_months),
	      shortMonthRe = formatRe(locale_shortMonths),
	      shortMonthLookup = formatLookup(locale_shortMonths);

	  var formats = {
	    "a": formatShortWeekday,
	    "A": formatWeekday,
	    "b": formatShortMonth,
	    "B": formatMonth,
	    "c": null,
	    "d": formatDayOfMonth,
	    "e": formatDayOfMonth,
	    "f": formatMicroseconds,
	    "H": formatHour24,
	    "I": formatHour12,
	    "j": formatDayOfYear,
	    "L": formatMilliseconds,
	    "m": formatMonthNumber,
	    "M": formatMinutes,
	    "p": formatPeriod,
	    "Q": formatUnixTimestamp,
	    "s": formatUnixTimestampSeconds,
	    "S": formatSeconds,
	    "u": formatWeekdayNumberMonday,
	    "U": formatWeekNumberSunday,
	    "V": formatWeekNumberISO,
	    "w": formatWeekdayNumberSunday,
	    "W": formatWeekNumberMonday,
	    "x": null,
	    "X": null,
	    "y": formatYear,
	    "Y": formatFullYear,
	    "Z": formatZone,
	    "%": formatLiteralPercent
	  };

	  var utcFormats = {
	    "a": formatUTCShortWeekday,
	    "A": formatUTCWeekday,
	    "b": formatUTCShortMonth,
	    "B": formatUTCMonth,
	    "c": null,
	    "d": formatUTCDayOfMonth,
	    "e": formatUTCDayOfMonth,
	    "f": formatUTCMicroseconds,
	    "H": formatUTCHour24,
	    "I": formatUTCHour12,
	    "j": formatUTCDayOfYear,
	    "L": formatUTCMilliseconds,
	    "m": formatUTCMonthNumber,
	    "M": formatUTCMinutes,
	    "p": formatUTCPeriod,
	    "Q": formatUnixTimestamp,
	    "s": formatUnixTimestampSeconds,
	    "S": formatUTCSeconds,
	    "u": formatUTCWeekdayNumberMonday,
	    "U": formatUTCWeekNumberSunday,
	    "V": formatUTCWeekNumberISO,
	    "w": formatUTCWeekdayNumberSunday,
	    "W": formatUTCWeekNumberMonday,
	    "x": null,
	    "X": null,
	    "y": formatUTCYear,
	    "Y": formatUTCFullYear,
	    "Z": formatUTCZone,
	    "%": formatLiteralPercent
	  };

	  var parses = {
	    "a": parseShortWeekday,
	    "A": parseWeekday,
	    "b": parseShortMonth,
	    "B": parseMonth,
	    "c": parseLocaleDateTime,
	    "d": parseDayOfMonth,
	    "e": parseDayOfMonth,
	    "f": parseMicroseconds,
	    "H": parseHour24,
	    "I": parseHour24,
	    "j": parseDayOfYear,
	    "L": parseMilliseconds,
	    "m": parseMonthNumber,
	    "M": parseMinutes,
	    "p": parsePeriod,
	    "Q": parseUnixTimestamp,
	    "s": parseUnixTimestampSeconds,
	    "S": parseSeconds,
	    "u": parseWeekdayNumberMonday,
	    "U": parseWeekNumberSunday,
	    "V": parseWeekNumberISO,
	    "w": parseWeekdayNumberSunday,
	    "W": parseWeekNumberMonday,
	    "x": parseLocaleDate,
	    "X": parseLocaleTime,
	    "y": parseYear,
	    "Y": parseFullYear,
	    "Z": parseZone,
	    "%": parseLiteralPercent
	  };

	  // These recursive directive definitions must be deferred.
	  formats.x = newFormat(locale_date, formats);
	  formats.X = newFormat(locale_time, formats);
	  formats.c = newFormat(locale_dateTime, formats);
	  utcFormats.x = newFormat(locale_date, utcFormats);
	  utcFormats.X = newFormat(locale_time, utcFormats);
	  utcFormats.c = newFormat(locale_dateTime, utcFormats);

	  function newFormat(specifier, formats) {
	    return function(date) {
	      var string = [],
	          i = -1,
	          j = 0,
	          n = specifier.length,
	          c,
	          pad,
	          format;

	      if (!(date instanceof Date)) date = new Date(+date);

	      while (++i < n) {
	        if (specifier.charCodeAt(i) === 37) {
	          string.push(specifier.slice(j, i));
	          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
	          else pad = c === "e" ? " " : "0";
	          if (format = formats[c]) c = format(date, pad);
	          string.push(c);
	          j = i + 1;
	        }
	      }

	      string.push(specifier.slice(j, i));
	      return string.join("");
	    };
	  }

	  function newParse(specifier, newDate) {
	    return function(string) {
	      var d = newYear(1900),
	          i = parseSpecifier(d, specifier, string += "", 0),
	          week, day;
	      if (i != string.length) return null;

	      // If a UNIX timestamp is specified, return it.
	      if ("Q" in d) return new Date(d.Q);

	      // The am-pm flag is 0 for AM, and 1 for PM.
	      if ("p" in d) d.H = d.H % 12 + d.p * 12;

	      // Convert day-of-week and week-of-year to day-of-year.
	      if ("V" in d) {
	        if (d.V < 1 || d.V > 53) return null;
	        if (!("w" in d)) d.w = 1;
	        if ("Z" in d) {
	          week = utcDate(newYear(d.y)), day = week.getUTCDay();
	          week = day > 4 || day === 0 ? d3Time.utcMonday.ceil(week) : d3Time.utcMonday(week);
	          week = d3Time.utcDay.offset(week, (d.V - 1) * 7);
	          d.y = week.getUTCFullYear();
	          d.m = week.getUTCMonth();
	          d.d = week.getUTCDate() + (d.w + 6) % 7;
	        } else {
	          week = newDate(newYear(d.y)), day = week.getDay();
	          week = day > 4 || day === 0 ? d3Time.timeMonday.ceil(week) : d3Time.timeMonday(week);
	          week = d3Time.timeDay.offset(week, (d.V - 1) * 7);
	          d.y = week.getFullYear();
	          d.m = week.getMonth();
	          d.d = week.getDate() + (d.w + 6) % 7;
	        }
	      } else if ("W" in d || "U" in d) {
	        if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
	        day = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
	        d.m = 0;
	        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
	      }

	      // If a time zone is specified, all fields are interpreted as UTC and then
	      // offset according to the specified time zone.
	      if ("Z" in d) {
	        d.H += d.Z / 100 | 0;
	        d.M += d.Z % 100;
	        return utcDate(d);
	      }

	      // Otherwise, all fields are in local time.
	      return newDate(d);
	    };
	  }

	  function parseSpecifier(d, specifier, string, j) {
	    var i = 0,
	        n = specifier.length,
	        m = string.length,
	        c,
	        parse;

	    while (i < n) {
	      if (j >= m) return -1;
	      c = specifier.charCodeAt(i++);
	      if (c === 37) {
	        c = specifier.charAt(i++);
	        parse = parses[c in pads ? specifier.charAt(i++) : c];
	        if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
	      } else if (c != string.charCodeAt(j++)) {
	        return -1;
	      }
	    }

	    return j;
	  }

	  function parsePeriod(d, string, i) {
	    var n = periodRe.exec(string.slice(i));
	    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseShortWeekday(d, string, i) {
	    var n = shortWeekdayRe.exec(string.slice(i));
	    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseWeekday(d, string, i) {
	    var n = weekdayRe.exec(string.slice(i));
	    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseShortMonth(d, string, i) {
	    var n = shortMonthRe.exec(string.slice(i));
	    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseMonth(d, string, i) {
	    var n = monthRe.exec(string.slice(i));
	    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
	  }

	  function parseLocaleDateTime(d, string, i) {
	    return parseSpecifier(d, locale_dateTime, string, i);
	  }

	  function parseLocaleDate(d, string, i) {
	    return parseSpecifier(d, locale_date, string, i);
	  }

	  function parseLocaleTime(d, string, i) {
	    return parseSpecifier(d, locale_time, string, i);
	  }

	  function formatShortWeekday(d) {
	    return locale_shortWeekdays[d.getDay()];
	  }

	  function formatWeekday(d) {
	    return locale_weekdays[d.getDay()];
	  }

	  function formatShortMonth(d) {
	    return locale_shortMonths[d.getMonth()];
	  }

	  function formatMonth(d) {
	    return locale_months[d.getMonth()];
	  }

	  function formatPeriod(d) {
	    return locale_periods[+(d.getHours() >= 12)];
	  }

	  function formatUTCShortWeekday(d) {
	    return locale_shortWeekdays[d.getUTCDay()];
	  }

	  function formatUTCWeekday(d) {
	    return locale_weekdays[d.getUTCDay()];
	  }

	  function formatUTCShortMonth(d) {
	    return locale_shortMonths[d.getUTCMonth()];
	  }

	  function formatUTCMonth(d) {
	    return locale_months[d.getUTCMonth()];
	  }

	  function formatUTCPeriod(d) {
	    return locale_periods[+(d.getUTCHours() >= 12)];
	  }

	  return {
	    format: function(specifier) {
	      var f = newFormat(specifier += "", formats);
	      f.toString = function() { return specifier; };
	      return f;
	    },
	    parse: function(specifier) {
	      var p = newParse(specifier += "", localDate);
	      p.toString = function() { return specifier; };
	      return p;
	    },
	    utcFormat: function(specifier) {
	      var f = newFormat(specifier += "", utcFormats);
	      f.toString = function() { return specifier; };
	      return f;
	    },
	    utcParse: function(specifier) {
	      var p = newParse(specifier, utcDate);
	      p.toString = function() { return specifier; };
	      return p;
	    }
	  };
	}

	var pads = {"-": "", "_": " ", "0": "0"};
	var numberRe = /^\s*\d+/;
	var percentRe = /^%/;
	var requoteRe = /[\\^$*+?|[\]().{}]/g;

	function pad(value, fill, width) {
	  var sign = value < 0 ? "-" : "",
	      string = (sign ? -value : value) + "",
	      length = string.length;
	  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
	}

	function requote(s) {
	  return s.replace(requoteRe, "\\$&");
	}

	function formatRe(names) {
	  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
	}

	function formatLookup(names) {
	  var map = {}, i = -1, n = names.length;
	  while (++i < n) map[names[i].toLowerCase()] = i;
	  return map;
	}

	function parseWeekdayNumberSunday(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 1));
	  return n ? (d.w = +n[0], i + n[0].length) : -1;
	}

	function parseWeekdayNumberMonday(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 1));
	  return n ? (d.u = +n[0], i + n[0].length) : -1;
	}

	function parseWeekNumberSunday(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.U = +n[0], i + n[0].length) : -1;
	}

	function parseWeekNumberISO(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.V = +n[0], i + n[0].length) : -1;
	}

	function parseWeekNumberMonday(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.W = +n[0], i + n[0].length) : -1;
	}

	function parseFullYear(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 4));
	  return n ? (d.y = +n[0], i + n[0].length) : -1;
	}

	function parseYear(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
	}

	function parseZone(d, string, i) {
	  var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
	  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
	}

	function parseMonthNumber(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
	}

	function parseDayOfMonth(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.d = +n[0], i + n[0].length) : -1;
	}

	function parseDayOfYear(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 3));
	  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
	}

	function parseHour24(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.H = +n[0], i + n[0].length) : -1;
	}

	function parseMinutes(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.M = +n[0], i + n[0].length) : -1;
	}

	function parseSeconds(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 2));
	  return n ? (d.S = +n[0], i + n[0].length) : -1;
	}

	function parseMilliseconds(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 3));
	  return n ? (d.L = +n[0], i + n[0].length) : -1;
	}

	function parseMicroseconds(d, string, i) {
	  var n = numberRe.exec(string.slice(i, i + 6));
	  return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
	}

	function parseLiteralPercent(d, string, i) {
	  var n = percentRe.exec(string.slice(i, i + 1));
	  return n ? i + n[0].length : -1;
	}

	function parseUnixTimestamp(d, string, i) {
	  var n = numberRe.exec(string.slice(i));
	  return n ? (d.Q = +n[0], i + n[0].length) : -1;
	}

	function parseUnixTimestampSeconds(d, string, i) {
	  var n = numberRe.exec(string.slice(i));
	  return n ? (d.Q = (+n[0]) * 1000, i + n[0].length) : -1;
	}

	function formatDayOfMonth(d, p) {
	  return pad(d.getDate(), p, 2);
	}

	function formatHour24(d, p) {
	  return pad(d.getHours(), p, 2);
	}

	function formatHour12(d, p) {
	  return pad(d.getHours() % 12 || 12, p, 2);
	}

	function formatDayOfYear(d, p) {
	  return pad(1 + d3Time.timeDay.count(d3Time.timeYear(d), d), p, 3);
	}

	function formatMilliseconds(d, p) {
	  return pad(d.getMilliseconds(), p, 3);
	}

	function formatMicroseconds(d, p) {
	  return formatMilliseconds(d, p) + "000";
	}

	function formatMonthNumber(d, p) {
	  return pad(d.getMonth() + 1, p, 2);
	}

	function formatMinutes(d, p) {
	  return pad(d.getMinutes(), p, 2);
	}

	function formatSeconds(d, p) {
	  return pad(d.getSeconds(), p, 2);
	}

	function formatWeekdayNumberMonday(d) {
	  var day = d.getDay();
	  return day === 0 ? 7 : day;
	}

	function formatWeekNumberSunday(d, p) {
	  return pad(d3Time.timeSunday.count(d3Time.timeYear(d), d), p, 2);
	}

	function formatWeekNumberISO(d, p) {
	  var day = d.getDay();
	  d = (day >= 4 || day === 0) ? d3Time.timeThursday(d) : d3Time.timeThursday.ceil(d);
	  return pad(d3Time.timeThursday.count(d3Time.timeYear(d), d) + (d3Time.timeYear(d).getDay() === 4), p, 2);
	}

	function formatWeekdayNumberSunday(d) {
	  return d.getDay();
	}

	function formatWeekNumberMonday(d, p) {
	  return pad(d3Time.timeMonday.count(d3Time.timeYear(d), d), p, 2);
	}

	function formatYear(d, p) {
	  return pad(d.getFullYear() % 100, p, 2);
	}

	function formatFullYear(d, p) {
	  return pad(d.getFullYear() % 10000, p, 4);
	}

	function formatZone(d) {
	  var z = d.getTimezoneOffset();
	  return (z > 0 ? "-" : (z *= -1, "+"))
	      + pad(z / 60 | 0, "0", 2)
	      + pad(z % 60, "0", 2);
	}

	function formatUTCDayOfMonth(d, p) {
	  return pad(d.getUTCDate(), p, 2);
	}

	function formatUTCHour24(d, p) {
	  return pad(d.getUTCHours(), p, 2);
	}

	function formatUTCHour12(d, p) {
	  return pad(d.getUTCHours() % 12 || 12, p, 2);
	}

	function formatUTCDayOfYear(d, p) {
	  return pad(1 + d3Time.utcDay.count(d3Time.utcYear(d), d), p, 3);
	}

	function formatUTCMilliseconds(d, p) {
	  return pad(d.getUTCMilliseconds(), p, 3);
	}

	function formatUTCMicroseconds(d, p) {
	  return formatUTCMilliseconds(d, p) + "000";
	}

	function formatUTCMonthNumber(d, p) {
	  return pad(d.getUTCMonth() + 1, p, 2);
	}

	function formatUTCMinutes(d, p) {
	  return pad(d.getUTCMinutes(), p, 2);
	}

	function formatUTCSeconds(d, p) {
	  return pad(d.getUTCSeconds(), p, 2);
	}

	function formatUTCWeekdayNumberMonday(d) {
	  var dow = d.getUTCDay();
	  return dow === 0 ? 7 : dow;
	}

	function formatUTCWeekNumberSunday(d, p) {
	  return pad(d3Time.utcSunday.count(d3Time.utcYear(d), d), p, 2);
	}

	function formatUTCWeekNumberISO(d, p) {
	  var day = d.getUTCDay();
	  d = (day >= 4 || day === 0) ? d3Time.utcThursday(d) : d3Time.utcThursday.ceil(d);
	  return pad(d3Time.utcThursday.count(d3Time.utcYear(d), d) + (d3Time.utcYear(d).getUTCDay() === 4), p, 2);
	}

	function formatUTCWeekdayNumberSunday(d) {
	  return d.getUTCDay();
	}

	function formatUTCWeekNumberMonday(d, p) {
	  return pad(d3Time.utcMonday.count(d3Time.utcYear(d), d), p, 2);
	}

	function formatUTCYear(d, p) {
	  return pad(d.getUTCFullYear() % 100, p, 2);
	}

	function formatUTCFullYear(d, p) {
	  return pad(d.getUTCFullYear() % 10000, p, 4);
	}

	function formatUTCZone() {
	  return "+0000";
	}

	function formatLiteralPercent() {
	  return "%";
	}

	function formatUnixTimestamp(d) {
	  return +d;
	}

	function formatUnixTimestampSeconds(d) {
	  return Math.floor(+d / 1000);
	}

	var locale;





	defaultLocale({
	  dateTime: "%x, %X",
	  date: "%-m/%-d/%Y",
	  time: "%-I:%M:%S %p",
	  periods: ["AM", "PM"],
	  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	});

	function defaultLocale(definition) {
	  locale = formatLocale(definition);
	  exports.timeFormat = locale.format;
	  exports.timeParse = locale.parse;
	  exports.utcFormat = locale.utcFormat;
	  exports.utcParse = locale.utcParse;
	  return locale;
	}

	var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

	function formatIsoNative(date) {
	  return date.toISOString();
	}

	var formatIso = Date.prototype.toISOString
	    ? formatIsoNative
	    : exports.utcFormat(isoSpecifier);

	function parseIsoNative(string) {
	  var date = new Date(string);
	  return isNaN(date) ? null : date;
	}

	var parseIso = +new Date("2000-01-01T00:00:00.000Z")
	    ? parseIsoNative
	    : exports.utcParse(isoSpecifier);

	exports.timeFormatDefaultLocale = defaultLocale;
	exports.timeFormatLocale = formatLocale;
	exports.isoFormat = formatIso;
	exports.isoParse = parseIso;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	// https://d3js.org/d3-geo-projection/ Version 2.3.2. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports, __webpack_require__(3), __webpack_require__(4)) :
		typeof define === 'function' && define.amd ? define(['exports', 'd3-geo', 'd3-array'], factory) :
		(factory((global.d3 = global.d3 || {}),global.d3,global.d3));
	}(this, (function (exports,d3Geo,d3Array) { 'use strict';

	var abs = Math.abs;
	var atan = Math.atan;
	var atan2 = Math.atan2;

	var cos = Math.cos;
	var exp = Math.exp;
	var floor = Math.floor;
	var log = Math.log;
	var max = Math.max;
	var min = Math.min;
	var pow = Math.pow;
	var round = Math.round;
	var sign = Math.sign || function(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
	var sin = Math.sin;
	var tan = Math.tan;

	var epsilon = 1e-6;
	var epsilon2 = 1e-12;
	var pi = Math.PI;
	var halfPi = pi / 2;
	var quarterPi = pi / 4;
	var sqrt1_2 = Math.SQRT1_2;
	var sqrt2 = sqrt(2);
	var sqrtPi = sqrt(pi);
	var tau = pi * 2;
	var degrees = 180 / pi;
	var radians = pi / 180;

	function sinci(x) {
	  return x ? x / Math.sin(x) : 1;
	}

	function asin(x) {
	  return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
	}

	function acos(x) {
	  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
	}

	function sqrt(x) {
	  return x > 0 ? Math.sqrt(x) : 0;
	}

	function tanh(x) {
	  x = exp(2 * x);
	  return (x - 1) / (x + 1);
	}

	function sinh(x) {
	  return (exp(x) - exp(-x)) / 2;
	}

	function cosh(x) {
	  return (exp(x) + exp(-x)) / 2;
	}

	function arsinh(x) {
	  return log(x + sqrt(x * x + 1));
	}

	function arcosh(x) {
	  return log(x + sqrt(x * x - 1));
	}

	function airyRaw(beta) {
	  var tanBeta_2 = tan(beta / 2),
	      b = 2 * log(cos(beta / 2)) / (tanBeta_2 * tanBeta_2);

	  function forward(x, y) {
	    var cosx = cos(x),
	        cosy = cos(y),
	        siny = sin(y),
	        cosz = cosy * cosx,
	        k = -((1 - cosz ? log((1 + cosz) / 2) / (1 - cosz) : -0.5) + b / (1 + cosz));
	    return [k * cosy * sin(x), k * siny];
	  }

	  forward.invert = function(x, y) {
	    var r = sqrt(x * x + y * y),
	        z = -beta / 2,
	        i = 50, delta;
	    if (!r) return [0, 0];
	    do {
	      var z_2 = z / 2,
	          cosz_2 = cos(z_2),
	          sinz_2 = sin(z_2),
	          tanz_2 = tan(z_2),
	          lnsecz_2 = log(1 / cosz_2);
	      z -= delta = (2 / tanz_2 * lnsecz_2 - b * tanz_2 - r) / (-lnsecz_2 / (sinz_2 * sinz_2) + 1 - b / (2 * cosz_2 * cosz_2));
	    } while (abs(delta) > epsilon && --i > 0);
	    var sinz = sin(z);
	    return [atan2(x * sinz, r * cos(z)), asin(y * sinz / r)];
	  };

	  return forward;
	}

	var airy = function() {
	  var beta = halfPi,
	      m = d3Geo.geoProjectionMutator(airyRaw),
	      p = m(beta);

	  p.radius = function(_) {
	    return arguments.length ? m(beta = _ * radians) : beta * degrees;
	  };

	  return p
	      .scale(179.976)
	      .clipAngle(147);
	};

	function aitoffRaw(x, y) {
	  var cosy = cos(y), sincia = sinci(acos(cosy * cos(x /= 2)));
	  return [2 * cosy * sin(x) * sincia, sin(y) * sincia];
	}

	// Abort if [x, y] is not within an ellipse centered at [0, 0] with
	// semi-major axis pi and semi-minor axis pi/2.
	aitoffRaw.invert = function(x, y) {
	  if (x * x + 4 * y * y > pi * pi + epsilon) return;
	  var x1 = x, y1 = y, i = 25;
	  do {
	    var sinx = sin(x1),
	        sinx_2 = sin(x1 / 2),
	        cosx_2 = cos(x1 / 2),
	        siny = sin(y1),
	        cosy = cos(y1),
	        sin_2y = sin(2 * y1),
	        sin2y = siny * siny,
	        cos2y = cosy * cosy,
	        sin2x_2 = sinx_2 * sinx_2,
	        c = 1 - cos2y * cosx_2 * cosx_2,
	        e = c ? acos(cosy * cosx_2) * sqrt(f = 1 / c) : f = 0,
	        f,
	        fx = 2 * e * cosy * sinx_2 - x,
	        fy = e * siny - y,
	        dxdx = f * (cos2y * sin2x_2 + e * cosy * cosx_2 * sin2y),
	        dxdy = f * (0.5 * sinx * sin_2y - e * 2 * siny * sinx_2),
	        dydx = f * 0.25 * (sin_2y * sinx_2 - e * siny * cos2y * sinx),
	        dydy = f * (sin2y * cosx_2 + e * sin2x_2 * cosy),
	        z = dxdy * dydx - dydy * dxdx;
	    if (!z) break;
	    var dx = (fy * dxdy - fx * dydy) / z,
	        dy = (fx * dydx - fy * dxdx) / z;
	    x1 -= dx, y1 -= dy;
	  } while ((abs(dx) > epsilon || abs(dy) > epsilon) && --i > 0);
	  return [x1, y1];
	};

	var aitoff = function() {
	  return d3Geo.geoProjection(aitoffRaw)
	      .scale(152.63);
	};

	function armadilloRaw(phi0) {
	  var sinPhi0 = sin(phi0),
	      cosPhi0 = cos(phi0),
	      sPhi0 = phi0 >= 0 ? 1 : -1,
	      tanPhi0 = tan(sPhi0 * phi0),
	      k = (1 + sinPhi0 - cosPhi0) / 2;

	  function forward(lambda, phi) {
	    var cosPhi = cos(phi),
	        cosLambda = cos(lambda /= 2);
	    return [
	      (1 + cosPhi) * sin(lambda),
	      (sPhi0 * phi > -atan2(cosLambda, tanPhi0) - 1e-3 ? 0 : -sPhi0 * 10) + k + sin(phi) * cosPhi0 - (1 + cosPhi) * sinPhi0 * cosLambda // TODO D3 core should allow null or [NaN, NaN] to be returned.
	    ];
	  }

	  forward.invert = function(x, y) {
	    var lambda = 0,
	        phi = 0,
	        i = 50;
	    do {
	      var cosLambda = cos(lambda),
	          sinLambda = sin(lambda),
	          cosPhi = cos(phi),
	          sinPhi = sin(phi),
	          A = 1 + cosPhi,
	          fx = A * sinLambda - x,
	          fy = k + sinPhi * cosPhi0 - A * sinPhi0 * cosLambda - y,
	          dxdLambda = A * cosLambda / 2,
	          dxdPhi = -sinLambda * sinPhi,
	          dydLambda = sinPhi0 * A * sinLambda / 2,
	          dydPhi = cosPhi0 * cosPhi + sinPhi0 * cosLambda * sinPhi,
	          denominator = dxdPhi * dydLambda - dydPhi * dxdLambda,
	          dLambda = (fy * dxdPhi - fx * dydPhi) / denominator / 2,
	          dPhi = (fx * dydLambda - fy * dxdLambda) / denominator;
	      lambda -= dLambda, phi -= dPhi;
	    } while ((abs(dLambda) > epsilon || abs(dPhi) > epsilon) && --i > 0);
	    return sPhi0 * phi > -atan2(cos(lambda), tanPhi0) - 1e-3 ? [lambda * 2, phi] : null;
	  };

	  return forward;
	}

	var armadillo = function() {
	  var phi0 = 20 * radians,
	      sPhi0 = phi0 >= 0 ? 1 : -1,
	      tanPhi0 = tan(sPhi0 * phi0),
	      m = d3Geo.geoProjectionMutator(armadilloRaw),
	      p = m(phi0),
	      stream_ = p.stream;

	  p.parallel = function(_) {
	    if (!arguments.length) return phi0 * degrees;
	    tanPhi0 = tan((sPhi0 = (phi0 = _ * radians) >= 0 ? 1 : -1) * phi0);
	    return m(phi0);
	  };

	  p.stream = function(stream) {
	    var rotate = p.rotate(),
	        rotateStream = stream_(stream),
	        sphereStream = (p.rotate([0, 0]), stream_(stream));
	    p.rotate(rotate);
	    rotateStream.sphere = function() {
	      sphereStream.polygonStart(), sphereStream.lineStart();
	      for (var lambda = sPhi0 * -180; sPhi0 * lambda < 180; lambda += sPhi0 * 90) sphereStream.point(lambda, sPhi0 * 90);
	      while (sPhi0 * (lambda -= phi0) >= -180) { // TODO precision?
	        sphereStream.point(lambda, sPhi0 * -atan2(cos(lambda * radians / 2), tanPhi0) * degrees);
	      }
	      sphereStream.lineEnd(), sphereStream.polygonEnd();
	    };
	    return rotateStream;
	  };

	  return p
	      .scale(218.695)
	      .center([0, 28.0974]);
	};

	function augustRaw(lambda, phi) {
	  var tanPhi = tan(phi / 2),
	      k = sqrt(1 - tanPhi * tanPhi),
	      c = 1 + k * cos(lambda /= 2),
	      x = sin(lambda) * k / c,
	      y = tanPhi / c,
	      x2 = x * x,
	      y2 = y * y;
	  return [
	    4 / 3 * x * (3 + x2 - 3 * y2),
	    4 / 3 * y * (3 + 3 * x2 - y2)
	  ];
	}

	augustRaw.invert = function(x, y) {
	  x *= 3 / 8, y *= 3 / 8;
	  if (!x && abs(y) > 1) return null;
	  var x2 = x * x,
	      y2 = y * y,
	      s = 1 + x2 + y2,
	      sin3Eta = sqrt((s - sqrt(s * s - 4 * y * y)) / 2),
	      eta = asin(sin3Eta) / 3,
	      xi = sin3Eta ? arcosh(abs(y / sin3Eta)) / 3 : arsinh(abs(x)) / 3,
	      cosEta = cos(eta),
	      coshXi = cosh(xi),
	      d = coshXi * coshXi - cosEta * cosEta;
	  return [
	    sign(x) * 2 * atan2(sinh(xi) * cosEta, 0.25 - d),
	    sign(y) * 2 * atan2(coshXi * sin(eta), 0.25 + d)
	  ];
	};

	var august = function() {
	  return d3Geo.geoProjection(augustRaw)
	      .scale(66.1603);
	};

	var sqrt8 = sqrt(8);
	var phi0 = log(1 + sqrt2);

	function bakerRaw(lambda, phi) {
	  var phi0 = abs(phi);
	  return phi0 < quarterPi
	      ? [lambda, log(tan(quarterPi + phi / 2))]
	      : [lambda * cos(phi0) * (2 * sqrt2 - 1 / sin(phi0)), sign(phi) * (2 * sqrt2 * (phi0 - quarterPi) - log(tan(phi0 / 2)))];
	}

	bakerRaw.invert = function(x, y) {
	  if ((y0 = abs(y)) < phi0) return [x, 2 * atan(exp(y)) - halfPi];
	  var phi = quarterPi, i = 25, delta, y0;
	  do {
	    var cosPhi_2 = cos(phi / 2), tanPhi_2 = tan(phi / 2);
	    phi -= delta = (sqrt8 * (phi - quarterPi) - log(tanPhi_2) - y0) / (sqrt8 - cosPhi_2 * cosPhi_2 / (2 * tanPhi_2));
	  } while (abs(delta) > epsilon2 && --i > 0);
	  return [x / (cos(phi) * (sqrt8 - 1 / sin(phi))), sign(y) * phi];
	};

	var baker = function() {
	  return d3Geo.geoProjection(bakerRaw)
	      .scale(112.314);
	};

	function berghausRaw(lobes) {
	  var k = 2 * pi / lobes;

	  function forward(lambda, phi) {
	    var p = d3Geo.geoAzimuthalEquidistantRaw(lambda, phi);
	    if (abs(lambda) > halfPi) { // back hemisphere
	      var theta = atan2(p[1], p[0]),
	          r = sqrt(p[0] * p[0] + p[1] * p[1]),
	          theta0 = k * round((theta - halfPi) / k) + halfPi,
	          alpha = atan2(sin(theta -= theta0), 2 - cos(theta)); // angle relative to lobe end
	      theta = theta0 + asin(pi / r * sin(alpha)) - alpha;
	      p[0] = r * cos(theta);
	      p[1] = r * sin(theta);
	    }
	    return p;
	  }

	  forward.invert = function(x, y) {
	    var r = sqrt(x * x + y * y);
	    if (r > halfPi) {
	      var theta = atan2(y, x),
	          theta0 = k * round((theta - halfPi) / k) + halfPi,
	          s = theta > theta0 ? -1 : 1,
	          A = r * cos(theta0 - theta),
	          cotAlpha = 1 / tan(s * acos((A - pi) / sqrt(pi * (pi - 2 * A) + r * r)));
	      theta = theta0 + 2 * atan((cotAlpha + s * sqrt(cotAlpha * cotAlpha - 3)) / 3);
	      x = r * cos(theta), y = r * sin(theta);
	    }
	    return d3Geo.geoAzimuthalEquidistantRaw.invert(x, y);
	  };

	  return forward;
	}

	var berghaus = function() {
	  var lobes = 5,
	      m = d3Geo.geoProjectionMutator(berghausRaw),
	      p = m(lobes),
	      projectionStream = p.stream,
	      epsilon$$1 = 1e-2,
	      cr = -cos(epsilon$$1 * radians),
	      sr = sin(epsilon$$1 * radians);

	  p.lobes = function(_) {
	    return arguments.length ? m(lobes = +_) : lobes;
	  };

	  p.stream = function(stream) {
	    var rotate = p.rotate(),
	        rotateStream = projectionStream(stream),
	        sphereStream = (p.rotate([0, 0]), projectionStream(stream));
	    p.rotate(rotate);
	    rotateStream.sphere = function() {
	      sphereStream.polygonStart(), sphereStream.lineStart();
	      for (var i = 0, delta = 360 / lobes, delta0 = 2 * pi / lobes, phi = 90 - 180 / lobes, phi0 = halfPi; i < lobes; ++i, phi -= delta, phi0 -= delta0) {
	        sphereStream.point(atan2(sr * cos(phi0), cr) * degrees, asin(sr * sin(phi0)) * degrees);
	        if (phi < -90) {
	          sphereStream.point(-90, -180 - phi - epsilon$$1);
	          sphereStream.point(-90, -180 - phi + epsilon$$1);
	        } else {
	          sphereStream.point(90, phi + epsilon$$1);
	          sphereStream.point(90, phi - epsilon$$1);
	        }
	      }
	      sphereStream.lineEnd(), sphereStream.polygonEnd();
	    };
	    return rotateStream;
	  };

	  return p
	      .scale(87.8076)
	      .center([0, 17.1875])
	      .clipAngle(180 - 1e-3);
	};

	function hammerRaw(A, B) {
	  if (arguments.length < 2) B = A;
	  if (B === 1) return d3Geo.geoAzimuthalEqualAreaRaw;
	  if (B === Infinity) return hammerQuarticAuthalicRaw;

	  function forward(lambda, phi) {
	    var coordinates = d3Geo.geoAzimuthalEqualAreaRaw(lambda / B, phi);
	    coordinates[0] *= A;
	    return coordinates;
	  }

	  forward.invert = function(x, y) {
	    var coordinates = d3Geo.geoAzimuthalEqualAreaRaw.invert(x / A, y);
	    coordinates[0] *= B;
	    return coordinates;
	  };

	  return forward;
	}

	function hammerQuarticAuthalicRaw(lambda, phi) {
	  return [
	    lambda * cos(phi) / cos(phi /= 2),
	    2 * sin(phi)
	  ];
	}

	hammerQuarticAuthalicRaw.invert = function(x, y) {
	  var phi = 2 * asin(y / 2);
	  return [
	    x * cos(phi / 2) / cos(phi),
	    phi
	  ];
	};

	var hammer = function() {
	  var B = 2,
	      m = d3Geo.geoProjectionMutator(hammerRaw),
	      p = m(B);

	  p.coefficient = function(_) {
	    if (!arguments.length) return B;
	    return m(B = +_);
	  };

	  return p
	    .scale(169.529);
	};

	// Bertin 1953 as a modified Briesemeister
	// https://bl.ocks.org/Fil/5b9ee9636dfb6ffa53443c9006beb642
	function bertin1953Raw() {
	  var hammer$$1 = hammerRaw(1.68, 2),
	      fu = 1.4, k = 12;

	  return function(lambda, phi) {

	    if (lambda + phi < -fu) {
	      var u = (lambda - phi + 1.6) * (lambda + phi + fu) / 8;
	      lambda += u;
	      phi -= 0.8 * u * sin(phi + pi / 2);
	    }

	    var r = hammer$$1(lambda, phi);

	    var d = (1 - cos(lambda * phi)) / k;

	    if (r[1] < 0) {
	      r[0] *= 1 + d;
	    }
	    if (r[1] > 0) {
	      r[1] *= 1 + d / 1.5 * r[0] * r[0];
	    }

	    return r;
	  };
	}

	var bertin = function() {
	  var p = d3Geo.geoProjection(bertin1953Raw());

	  p.rotate([-16.5, -42]);
	  delete p.rotate;

	  return p
	    .scale(176.57)
	    .center([7.93, 0.09]);
	};

	function mollweideBromleyTheta(cp, phi) {
	  var cpsinPhi = cp * sin(phi), i = 30, delta;
	  do phi -= delta = (phi + sin(phi) - cpsinPhi) / (1 + cos(phi));
	  while (abs(delta) > epsilon && --i > 0);
	  return phi / 2;
	}

	function mollweideBromleyRaw(cx, cy, cp) {

	  function forward(lambda, phi) {
	    return [cx * lambda * cos(phi = mollweideBromleyTheta(cp, phi)), cy * sin(phi)];
	  }

	  forward.invert = function(x, y) {
	    return y = asin(y / cy), [x / (cx * cos(y)), asin((2 * y + sin(2 * y)) / cp)];
	  };

	  return forward;
	}

	var mollweideRaw = mollweideBromleyRaw(sqrt2 / halfPi, sqrt2, pi);

	var mollweide = function() {
	  return d3Geo.geoProjection(mollweideRaw)
	      .scale(169.529);
	};

	var k = 2.00276;
	var w = 1.11072;

	function boggsRaw(lambda, phi) {
	  var theta = mollweideBromleyTheta(pi, phi);
	  return [k * lambda / (1 / cos(phi) + w / cos(theta)), (phi + sqrt2 * sin(theta)) / k];
	}

	boggsRaw.invert = function(x, y) {
	  var ky = k * y, theta = y < 0 ? -quarterPi : quarterPi, i = 25, delta, phi;
	  do {
	    phi = ky - sqrt2 * sin(theta);
	    theta -= delta = (sin(2 * theta) + 2 * theta - pi * sin(phi)) / (2 * cos(2 * theta) + 2 + pi * cos(phi) * sqrt2 * cos(theta));
	  } while (abs(delta) > epsilon && --i > 0);
	  phi = ky - sqrt2 * sin(theta);
	  return [x * (1 / cos(phi) + w / cos(theta)) / k, phi];
	};

	var boggs = function() {
	  return d3Geo.geoProjection(boggsRaw)
	      .scale(160.857);
	};

	var parallel1 = function(projectAt) {
	  var phi0 = 0,
	      m = d3Geo.geoProjectionMutator(projectAt),
	      p = m(phi0);

	  p.parallel = function(_) {
	    return arguments.length ? m(phi0 = _ * radians) : phi0 * degrees;
	  };

	  return p;
	};

	function sinusoidalRaw(lambda, phi) {
	  return [lambda * cos(phi), phi];
	}

	sinusoidalRaw.invert = function(x, y) {
	  return [x / cos(y), y];
	};

	var sinusoidal = function() {
	  return d3Geo.geoProjection(sinusoidalRaw)
	      .scale(152.63);
	};

	function bonneRaw(phi0) {
	  if (!phi0) return sinusoidalRaw;
	  var cotPhi0 = 1 / tan(phi0);

	  function forward(lambda, phi) {
	    var rho = cotPhi0 + phi0 - phi,
	        e = rho ? lambda * cos(phi) / rho : rho;
	    return [rho * sin(e), cotPhi0 - rho * cos(e)];
	  }

	  forward.invert = function(x, y) {
	    var rho = sqrt(x * x + (y = cotPhi0 - y) * y),
	        phi = cotPhi0 + phi0 - rho;
	    return [rho / cos(phi) * atan2(x, y), phi];
	  };

	  return forward;
	}

	var bonne = function() {
	  return parallel1(bonneRaw)
	      .scale(123.082)
	      .center([0, 26.1441])
	      .parallel(45);
	};

	function bottomleyRaw(sinPsi) {

	  function forward(lambda, phi) {
	    var rho = halfPi - phi,
	        eta = rho ? lambda * sinPsi * sin(rho) / rho : rho;
	    return [rho * sin(eta) / sinPsi, halfPi - rho * cos(eta)];
	  }

	  forward.invert = function(x, y) {
	    var x1 = x * sinPsi,
	        y1 = halfPi - y,
	        rho = sqrt(x1 * x1 + y1 * y1),
	        eta = atan2(x1, y1);
	    return [(rho ? rho / sin(rho) : 1) * eta / sinPsi, halfPi - rho];
	  };

	  return forward;
	}

	var bottomley = function() {
	  var sinPsi = 0.5,
	      m = d3Geo.geoProjectionMutator(bottomleyRaw),
	      p = m(sinPsi);

	  p.fraction = function(_) {
	    return arguments.length ? m(sinPsi = +_) : sinPsi;
	  };

	  return p
	      .scale(158.837);
	};

	var bromleyRaw = mollweideBromleyRaw(1, 4 / pi, pi);

	var bromley = function() {
	  return d3Geo.geoProjection(bromleyRaw)
	      .scale(152.63);
	};

	// Azimuthal distance.
	function distance(dPhi, c1, s1, c2, s2, dLambda) {
	  var cosdLambda = cos(dLambda), r;
	  if (abs(dPhi) > 1 || abs(dLambda) > 1) {
	    r = acos(s1 * s2 + c1 * c2 * cosdLambda);
	  } else {
	    var sindPhi = sin(dPhi / 2), sindLambda = sin(dLambda / 2);
	    r = 2 * asin(sqrt(sindPhi * sindPhi + c1 * c2 * sindLambda * sindLambda));
	  }
	  return abs(r) > epsilon ? [r, atan2(c2 * sin(dLambda), c1 * s2 - s1 * c2 * cosdLambda)] : [0, 0];
	}

	// Angle opposite a, and contained between sides of lengths b and c.
	function angle(b, c, a) {
	  return acos((b * b + c * c - a * a) / (2 * b * c));
	}

	// Normalize longitude.
	function longitude(lambda) {
	  return lambda - 2 * pi * floor((lambda + pi) / (2 * pi));
	}

	function chamberlinRaw(p0, p1, p2) {
	  var points = [
	    [p0[0], p0[1], sin(p0[1]), cos(p0[1])],
	    [p1[0], p1[1], sin(p1[1]), cos(p1[1])],
	    [p2[0], p2[1], sin(p2[1]), cos(p2[1])]
	  ];

	  for (var a = points[2], b, i = 0; i < 3; ++i, a = b) {
	    b = points[i];
	    a.v = distance(b[1] - a[1], a[3], a[2], b[3], b[2], b[0] - a[0]);
	    a.point = [0, 0];
	  }

	  var beta0 = angle(points[0].v[0], points[2].v[0], points[1].v[0]),
	      beta1 = angle(points[0].v[0], points[1].v[0], points[2].v[0]),
	      beta2 = pi - beta0;

	  points[2].point[1] = 0;
	  points[0].point[0] = -(points[1].point[0] = points[0].v[0] / 2);

	  var mean = [
	    points[2].point[0] = points[0].point[0] + points[2].v[0] * cos(beta0),
	    2 * (points[0].point[1] = points[1].point[1] = points[2].v[0] * sin(beta0))
	  ];

	  function forward(lambda, phi) {
	    var sinPhi = sin(phi),
	        cosPhi = cos(phi),
	        v = new Array(3), i;

	    // Compute distance and azimuth from control points.
	    for (i = 0; i < 3; ++i) {
	      var p = points[i];
	      v[i] = distance(phi - p[1], p[3], p[2], cosPhi, sinPhi, lambda - p[0]);
	      if (!v[i][0]) return p.point;
	      v[i][1] = longitude(v[i][1] - p.v[1]);
	    }

	    // Arithmetic mean of interception points.
	    var point = mean.slice();
	    for (i = 0; i < 3; ++i) {
	      var j = i == 2 ? 0 : i + 1;
	      var a = angle(points[i].v[0], v[i][0], v[j][0]);
	      if (v[i][1] < 0) a = -a;

	      if (!i) {
	        point[0] += v[i][0] * cos(a);
	        point[1] -= v[i][0] * sin(a);
	      } else if (i == 1) {
	        a = beta1 - a;
	        point[0] -= v[i][0] * cos(a);
	        point[1] -= v[i][0] * sin(a);
	      } else {
	        a = beta2 - a;
	        point[0] += v[i][0] * cos(a);
	        point[1] += v[i][0] * sin(a);
	      }
	    }

	    point[0] /= 3, point[1] /= 3;
	    return point;
	  }

	  return forward;
	}

	function pointRadians(p) {
	  return p[0] *= radians, p[1] *= radians, p;
	}

	function chamberlinAfrica() {
	  return chamberlin([0, 22], [45, 22], [22.5, -22])
	      .scale(380)
	      .center([22.5, 2]);
	}

	function chamberlin(p0, p1, p2) { // TODO order matters!
	  var c = d3Geo.geoCentroid({type: "MultiPoint", coordinates: [p0, p1, p2]}),
	      R = [-c[0], -c[1]],
	      r = d3Geo.geoRotation(R),
	      p = d3Geo.geoProjection(chamberlinRaw(pointRadians(r(p0)), pointRadians(r(p1)), pointRadians(r(p2)))).rotate(R),
	      center = p.center;

	  delete p.rotate;

	  p.center = function(_) {
	    return arguments.length ? center(r(_)) : r.invert(center());
	  };

	  return p
	      .clipAngle(90);
	}

	function collignonRaw(lambda, phi) {
	  var alpha = sqrt(1 - sin(phi));
	  return [(2 / sqrtPi) * lambda * alpha, sqrtPi * (1 - alpha)];
	}

	collignonRaw.invert = function(x, y) {
	  var lambda = (lambda = y / sqrtPi - 1) * lambda;
	  return [lambda > 0 ? x * sqrt(pi / lambda) / 2 : 0, asin(1 - lambda)];
	};

	var collignon = function() {
	  return d3Geo.geoProjection(collignonRaw)
	      .scale(95.6464)
	      .center([0, 30]);
	};

	function craigRaw(phi0) {
	  var tanPhi0 = tan(phi0);

	  function forward(lambda, phi) {
	    return [lambda, (lambda ? lambda / sin(lambda) : 1) * (sin(phi) * cos(lambda) - tanPhi0 * cos(phi))];
	  }

	  forward.invert = tanPhi0 ? function(x, y) {
	    if (x) y *= sin(x) / x;
	    var cosLambda = cos(x);
	    return [x, 2 * atan2(sqrt(cosLambda * cosLambda + tanPhi0 * tanPhi0 - y * y) - cosLambda, tanPhi0 - y)];
	  } : function(x, y) {
	    return [x, asin(x ? y * tan(x) / x : y)];
	  };

	  return forward;
	}

	var craig = function() {
	  return parallel1(craigRaw)
	      .scale(249.828)
	      .clipAngle(90);
	};

	var sqrt3 = sqrt(3);

	function crasterRaw(lambda, phi) {
	  return [sqrt3 * lambda * (2 * cos(2 * phi / 3) - 1) / sqrtPi, sqrt3 * sqrtPi * sin(phi / 3)];
	}

	crasterRaw.invert = function(x, y) {
	  var phi = 3 * asin(y / (sqrt3 * sqrtPi));
	  return [sqrtPi * x / (sqrt3 * (2 * cos(2 * phi / 3) - 1)), phi];
	};

	var craster = function() {
	  return d3Geo.geoProjection(crasterRaw)
	      .scale(156.19);
	};

	function cylindricalEqualAreaRaw(phi0) {
	  var cosPhi0 = cos(phi0);

	  function forward(lambda, phi) {
	    return [lambda * cosPhi0, sin(phi) / cosPhi0];
	  }

	  forward.invert = function(x, y) {
	    return [x / cosPhi0, asin(y * cosPhi0)];
	  };

	  return forward;
	}

	var cylindricalEqualArea = function() {
	  return parallel1(cylindricalEqualAreaRaw)
	      .parallel(38.58) // acos(sqrt(width / height / pi)) * radians
	      .scale(195.044); // width / (sqrt(width / height / pi) * 2 * pi)
	};

	function cylindricalStereographicRaw(phi0) {
	  var cosPhi0 = cos(phi0);

	  function forward(lambda, phi) {
	    return [lambda * cosPhi0, (1 + cosPhi0) * tan(phi / 2)];
	  }

	  forward.invert = function(x, y) {
	    return [x / cosPhi0, atan(y / (1 + cosPhi0)) * 2];
	  };

	  return forward;
	}

	var cylindricalStereographic = function() {
	  return parallel1(cylindricalStereographicRaw)
	      .scale(124.75);
	};

	function eckert1Raw(lambda, phi) {
	  var alpha = sqrt(8 / (3 * pi));
	  return [
	    alpha * lambda * (1 - abs(phi) / pi),
	    alpha * phi
	  ];
	}

	eckert1Raw.invert = function(x, y) {
	  var alpha = sqrt(8 / (3 * pi)),
	      phi = y / alpha;
	  return [
	    x / (alpha * (1 - abs(phi) / pi)),
	    phi
	  ];
	};

	var eckert1 = function() {
	  return d3Geo.geoProjection(eckert1Raw)
	      .scale(165.664);
	};

	function eckert2Raw(lambda, phi) {
	  var alpha = sqrt(4 - 3 * sin(abs(phi)));
	  return [
	    2 / sqrt(6 * pi) * lambda * alpha,
	    sign(phi) * sqrt(2 * pi / 3) * (2 - alpha)
	  ];
	}

	eckert2Raw.invert = function(x, y) {
	  var alpha = 2 - abs(y) / sqrt(2 * pi / 3);
	  return [
	    x * sqrt(6 * pi) / (2 * alpha),
	    sign(y) * asin((4 - alpha * alpha) / 3)
	  ];
	};

	var eckert2 = function() {
	  return d3Geo.geoProjection(eckert2Raw)
	      .scale(165.664);
	};

	function eckert3Raw(lambda, phi) {
	  var k = sqrt(pi * (4 + pi));
	  return [
	    2 / k * lambda * (1 + sqrt(1 - 4 * phi * phi / (pi * pi))),
	    4 / k * phi
	  ];
	}

	eckert3Raw.invert = function(x, y) {
	  var k = sqrt(pi * (4 + pi)) / 2;
	  return [
	    x * k / (1 + sqrt(1 - y * y * (4 + pi) / (4 * pi))),
	    y * k / 2
	  ];
	};

	var eckert3 = function() {
	  return d3Geo.geoProjection(eckert3Raw)
	      .scale(180.739);
	};

	function eckert4Raw(lambda, phi) {
	  var k = (2 + halfPi) * sin(phi);
	  phi /= 2;
	  for (var i = 0, delta = Infinity; i < 10 && abs(delta) > epsilon; i++) {
	    var cosPhi = cos(phi);
	    phi -= delta = (phi + sin(phi) * (cosPhi + 2) - k) / (2 * cosPhi * (1 + cosPhi));
	  }
	  return [
	    2 / sqrt(pi * (4 + pi)) * lambda * (1 + cos(phi)),
	    2 * sqrt(pi / (4 + pi)) * sin(phi)
	  ];
	}

	eckert4Raw.invert = function(x, y) {
	  var A = y * sqrt((4 + pi) / pi) / 2,
	      k = asin(A),
	      c = cos(k);
	  return [
	    x / (2 / sqrt(pi * (4 + pi)) * (1 + c)),
	    asin((k + A * (c + 2)) / (2 + halfPi))
	  ];
	};

	var eckert4 = function() {
	  return d3Geo.geoProjection(eckert4Raw)
	      .scale(180.739);
	};

	function eckert5Raw(lambda, phi) {
	  return [
	    lambda * (1 + cos(phi)) / sqrt(2 + pi),
	    2 * phi / sqrt(2 + pi)
	  ];
	}

	eckert5Raw.invert = function(x, y) {
	  var k = sqrt(2 + pi),
	      phi = y * k / 2;
	  return [
	    k * x / (1 + cos(phi)),
	    phi
	  ];
	};

	var eckert5 = function() {
	  return d3Geo.geoProjection(eckert5Raw)
	      .scale(173.044);
	};

	function eckert6Raw(lambda, phi) {
	  var k = (1 + halfPi) * sin(phi);
	  for (var i = 0, delta = Infinity; i < 10 && abs(delta) > epsilon; i++) {
	    phi -= delta = (phi + sin(phi) - k) / (1 + cos(phi));
	  }
	  k = sqrt(2 + pi);
	  return [
	    lambda * (1 + cos(phi)) / k,
	    2 * phi / k
	  ];
	}

	eckert6Raw.invert = function(x, y) {
	  var j = 1 + halfPi,
	      k = sqrt(j / 2);
	  return [
	    x * 2 * k / (1 + cos(y *= k)),
	    asin((y + sin(y)) / j)
	  ];
	};

	var eckert6 = function() {
	  return d3Geo.geoProjection(eckert6Raw)
	      .scale(173.044);
	};

	var eisenlohrK = 3 + 2 * sqrt2;

	function eisenlohrRaw(lambda, phi) {
	  var s0 = sin(lambda /= 2),
	      c0 = cos(lambda),
	      k = sqrt(cos(phi)),
	      c1 = cos(phi /= 2),
	      t = sin(phi) / (c1 + sqrt2 * c0 * k),
	      c = sqrt(2 / (1 + t * t)),
	      v = sqrt((sqrt2 * c1 + (c0 + s0) * k) / (sqrt2 * c1 + (c0 - s0) * k));
	  return [
	    eisenlohrK * (c * (v - 1 / v) - 2 * log(v)),
	    eisenlohrK * (c * t * (v + 1 / v) - 2 * atan(t))
	  ];
	}

	eisenlohrRaw.invert = function(x, y) {
	  if (!(p = augustRaw.invert(x / 1.2, y * 1.065))) return null;
	  var lambda = p[0], phi = p[1], i = 20, p;
	  x /= eisenlohrK, y /= eisenlohrK;
	  do {
	    var _0 = lambda / 2,
	        _1 = phi / 2,
	        s0 = sin(_0),
	        c0 = cos(_0),
	        s1 = sin(_1),
	        c1 = cos(_1),
	        cos1 = cos(phi),
	        k = sqrt(cos1),
	        t = s1 / (c1 + sqrt2 * c0 * k),
	        t2 = t * t,
	        c = sqrt(2 / (1 + t2)),
	        v0 = (sqrt2 * c1 + (c0 + s0) * k),
	        v1 = (sqrt2 * c1 + (c0 - s0) * k),
	        v2 = v0 / v1,
	        v = sqrt(v2),
	        vm1v = v - 1 / v,
	        vp1v = v + 1 / v,
	        fx = c * vm1v - 2 * log(v) - x,
	        fy = c * t * vp1v - 2 * atan(t) - y,
	        deltatDeltaLambda = s1 && sqrt1_2 * k * s0 * t2 / s1,
	        deltatDeltaPhi = (sqrt2 * c0 * c1 + k) / (2 * (c1 + sqrt2 * c0 * k) * (c1 + sqrt2 * c0 * k) * k),
	        deltacDeltat = -0.5 * t * c * c * c,
	        deltacDeltaLambda = deltacDeltat * deltatDeltaLambda,
	        deltacDeltaPhi = deltacDeltat * deltatDeltaPhi,
	        A = (A = 2 * c1 + sqrt2 * k * (c0 - s0)) * A * v,
	        deltavDeltaLambda = (sqrt2 * c0 * c1 * k + cos1) / A,
	        deltavDeltaPhi = -(sqrt2 * s0 * s1) / (k * A),
	        deltaxDeltaLambda = vm1v * deltacDeltaLambda - 2 * deltavDeltaLambda / v + c * (deltavDeltaLambda + deltavDeltaLambda / v2),
	        deltaxDeltaPhi = vm1v * deltacDeltaPhi - 2 * deltavDeltaPhi / v + c * (deltavDeltaPhi + deltavDeltaPhi / v2),
	        deltayDeltaLambda = t * vp1v * deltacDeltaLambda - 2 * deltatDeltaLambda / (1 + t2) + c * vp1v * deltatDeltaLambda + c * t * (deltavDeltaLambda - deltavDeltaLambda / v2),
	        deltayDeltaPhi = t * vp1v * deltacDeltaPhi - 2 * deltatDeltaPhi / (1 + t2) + c * vp1v * deltatDeltaPhi + c * t * (deltavDeltaPhi - deltavDeltaPhi / v2),
	        denominator = deltaxDeltaPhi * deltayDeltaLambda - deltayDeltaPhi * deltaxDeltaLambda;
	    if (!denominator) break;
	    var deltaLambda = (fy * deltaxDeltaPhi - fx * deltayDeltaPhi) / denominator,
	        deltaPhi = (fx * deltayDeltaLambda - fy * deltaxDeltaLambda) / denominator;
	    lambda -= deltaLambda;
	    phi = max(-halfPi, min(halfPi, phi - deltaPhi));
	  } while ((abs(deltaLambda) > epsilon || abs(deltaPhi) > epsilon) && --i > 0);
	  return abs(abs(phi) - halfPi) < epsilon ? [0, phi] : i && [lambda, phi];
	};

	var eisenlohr = function() {
	  return d3Geo.geoProjection(eisenlohrRaw)
	      .scale(62.5271);
	};

	var faheyK = cos(35 * radians);

	function faheyRaw(lambda, phi) {
	  var t = tan(phi / 2);
	  return [lambda * faheyK * sqrt(1 - t * t), (1 + faheyK) * t];
	}

	faheyRaw.invert = function(x, y) {
	  var t = y / (1 + faheyK);
	  return [x && x / (faheyK * sqrt(1 - t * t)), 2 * atan(t)];
	};

	var fahey = function() {
	  return d3Geo.geoProjection(faheyRaw)
	      .scale(137.152);
	};

	function foucautRaw(lambda, phi) {
	  var k = phi / 2, cosk = cos(k);
	  return [ 2 * lambda / sqrtPi * cos(phi) * cosk * cosk, sqrtPi * tan(k)];
	}

	foucautRaw.invert = function(x, y) {
	  var k = atan(y / sqrtPi), cosk = cos(k), phi = 2 * k;
	  return [x * sqrtPi / 2 / (cos(phi) * cosk * cosk), phi];
	};

	var foucaut = function() {
	  return d3Geo.geoProjection(foucautRaw)
	      .scale(135.264);
	};

	function gilbertForward(point) {
	  return [point[0] / 2, asin(tan(point[1] / 2 * radians)) * degrees];
	}

	function gilbertInvert(point) {
	  return [point[0] * 2, 2 * atan(sin(point[1] * radians)) * degrees];
	}

	var gilbert = function(projectionType) {
	  if (projectionType == null) projectionType = d3Geo.geoOrthographic;
	  var projection = projectionType(),
	      equirectangular = d3Geo.geoEquirectangular().scale(degrees).precision(0).clipAngle(null).translate([0, 0]); // antimeridian cutting

	  function gilbert(point) {
	    return projection(gilbertForward(point));
	  }

	  if (projection.invert) gilbert.invert = function(point) {
	    return gilbertInvert(projection.invert(point));
	  };

	  gilbert.stream = function(stream) {
	    var s1 = projection.stream(stream), s0 = equirectangular.stream({
	      point: function(lambda, phi) { s1.point(lambda / 2, asin(tan(-phi / 2 * radians)) * degrees); },
	      lineStart: function() { s1.lineStart(); },
	      lineEnd: function() { s1.lineEnd(); },
	      polygonStart: function() { s1.polygonStart(); },
	      polygonEnd: function() { s1.polygonEnd(); }
	    });
	    s0.sphere = s1.sphere;
	    return s0;
	  };

	  function property(name) {
	    gilbert[name] = function(_) {
	      return arguments.length ? (projection[name](_), gilbert) : projection[name]();
	    };
	  }

	  gilbert.rotate = function(_) {
	    return arguments.length ? (equirectangular.rotate(_), gilbert) : equirectangular.rotate();
	  };

	  gilbert.center = function(_) {
	    return arguments.length ? (projection.center(gilbertForward(_)), gilbert) : gilbertInvert(projection.center());
	  };

	  property("clipAngle");
	  property("clipExtent");
	  property("scale");
	  property("translate");
	  property("precision");

	  return gilbert
	      .scale(249.5);
	};

	function gingeryRaw(rho, n) {
	  var k = 2 * pi / n,
	      rho2 = rho * rho;

	  function forward(lambda, phi) {
	    var p = d3Geo.geoAzimuthalEquidistantRaw(lambda, phi),
	        x = p[0],
	        y = p[1],
	        r2 = x * x + y * y;

	    if (r2 > rho2) {
	      var r = sqrt(r2),
	          theta = atan2(y, x),
	          theta0 = k * round(theta / k),
	          alpha = theta - theta0,
	          rhoCosAlpha = rho * cos(alpha),
	          k_ = (rho * sin(alpha) - alpha * sin(rhoCosAlpha)) / (halfPi - rhoCosAlpha),
	          s_ = gingeryLength(alpha, k_),
	          e = (pi - rho) / gingeryIntegrate(s_, rhoCosAlpha, pi);

	      x = r;
	      var i = 50, delta;
	      do {
	        x -= delta = (rho + gingeryIntegrate(s_, rhoCosAlpha, x) * e - r) / (s_(x) * e);
	      } while (abs(delta) > epsilon && --i > 0);

	      y = alpha * sin(x);
	      if (x < halfPi) y -= k_ * (x - halfPi);

	      var s = sin(theta0),
	          c = cos(theta0);
	      p[0] = x * c - y * s;
	      p[1] = x * s + y * c;
	    }
	    return p;
	  }

	  forward.invert = function(x, y) {
	    var r2 = x * x + y * y;
	    if (r2 > rho2) {
	      var r = sqrt(r2),
	          theta = atan2(y, x),
	          theta0 = k * round(theta / k),
	          dTheta = theta - theta0;

	      x = r * cos(dTheta);
	      y = r * sin(dTheta);

	      var x_halfPi = x - halfPi,
	          sinx = sin(x),
	          alpha = y / sinx,
	          delta = x < halfPi ? Infinity : 0,
	          i = 10;

	      while (true) {
	        var rhosinAlpha = rho * sin(alpha),
	            rhoCosAlpha = rho * cos(alpha),
	            sinRhoCosAlpha = sin(rhoCosAlpha),
	            halfPi_RhoCosAlpha = halfPi - rhoCosAlpha,
	            k_ = (rhosinAlpha - alpha * sinRhoCosAlpha) / halfPi_RhoCosAlpha,
	            s_ = gingeryLength(alpha, k_);

	        if (abs(delta) < epsilon2 || !--i) break;

	        alpha -= delta = (alpha * sinx - k_ * x_halfPi - y) / (
	          sinx - x_halfPi * 2 * (
	            halfPi_RhoCosAlpha * (rhoCosAlpha + alpha * rhosinAlpha * cos(rhoCosAlpha) - sinRhoCosAlpha) -
	            rhosinAlpha * (rhosinAlpha - alpha * sinRhoCosAlpha)
	          ) / (halfPi_RhoCosAlpha * halfPi_RhoCosAlpha));
	      }
	      r = rho + gingeryIntegrate(s_, rhoCosAlpha, x) * (pi - rho) / gingeryIntegrate(s_, rhoCosAlpha, pi);
	      theta = theta0 + alpha;
	      x = r * cos(theta);
	      y = r * sin(theta);
	    }
	    return d3Geo.geoAzimuthalEquidistantRaw.invert(x, y);
	  };

	  return forward;
	}

	function gingeryLength(alpha, k) {
	  return function(x) {
	    var y_ = alpha * cos(x);
	    if (x < halfPi) y_ -= k;
	    return sqrt(1 + y_ * y_);
	  };
	}

	// Numerical integration: trapezoidal rule.
	function gingeryIntegrate(f, a, b) {
	  var n = 50,
	      h = (b - a) / n,
	      s = f(a) + f(b);
	  for (var i = 1, x = a; i < n; ++i) s += 2 * f(x += h);
	  return s * 0.5 * h;
	}

	var gingery = function() {
	  var n = 6,
	      rho = 30 * radians,
	      cRho = cos(rho),
	      sRho = sin(rho),
	      m = d3Geo.geoProjectionMutator(gingeryRaw),
	      p = m(rho, n),
	      stream_ = p.stream,
	      epsilon$$1 = 1e-2,
	      cr = -cos(epsilon$$1 * radians),
	      sr = sin(epsilon$$1 * radians);

	  p.radius = function(_) {
	    if (!arguments.length) return rho * degrees;
	    cRho = cos(rho = _ * radians);
	    sRho = sin(rho);
	    return m(rho, n);
	  };

	  p.lobes = function(_) {
	    if (!arguments.length) return n;
	    return m(rho, n = +_);
	  };

	  p.stream = function(stream) {
	    var rotate = p.rotate(),
	        rotateStream = stream_(stream),
	        sphereStream = (p.rotate([0, 0]), stream_(stream));
	    p.rotate(rotate);
	    rotateStream.sphere = function() {
	      sphereStream.polygonStart(), sphereStream.lineStart();
	      for (var i = 0, delta = 2 * pi / n, phi = 0; i < n; ++i, phi -= delta) {
	        sphereStream.point(atan2(sr * cos(phi), cr) * degrees, asin(sr * sin(phi)) * degrees);
	        sphereStream.point(atan2(sRho * cos(phi - delta / 2), cRho) * degrees, asin(sRho * sin(phi - delta / 2)) * degrees);
	      }
	      sphereStream.lineEnd(), sphereStream.polygonEnd();
	    };
	    return rotateStream;
	  };

	  return p
	      .rotate([90, -40])
	      .scale(91.7095)
	      .clipAngle(180 - 1e-3);
	};

	var ginzburgPolyconicRaw = function(a, b, c, d, e, f, g, h) {
	  if (arguments.length < 8) h = 0;

	  function forward(lambda, phi) {
	    if (!phi) return [a * lambda / pi, 0];
	    var phi2 = phi * phi,
	        xB = a + phi2 * (b + phi2 * (c + phi2 * d)),
	        yB = phi * (e - 1 + phi2 * (f - h + phi2 * g)),
	        m = (xB * xB + yB * yB) / (2 * yB),
	        alpha = lambda * asin(xB / m) / pi;
	    return [m * sin(alpha), phi * (1 + phi2 * h) + m * (1 - cos(alpha))];
	  }

	  forward.invert = function(x, y) {
	    var lambda = pi * x / a,
	        phi = y,
	        deltaLambda, deltaPhi, i = 50;
	    do {
	      var phi2 = phi * phi,
	          xB = a + phi2 * (b + phi2 * (c + phi2 * d)),
	          yB = phi * (e - 1 + phi2 * (f - h + phi2 * g)),
	          p = xB * xB + yB * yB,
	          q = 2 * yB,
	          m = p / q,
	          m2 = m * m,
	          dAlphadLambda = asin(xB / m) / pi,
	          alpha = lambda * dAlphadLambda,
	          xB2 = xB * xB,
	          dxBdPhi = (2 * b + phi2 * (4 * c + phi2 * 6 * d)) * phi,
	          dyBdPhi = e + phi2 * (3 * f + phi2 * 5 * g),
	          dpdPhi = 2 * (xB * dxBdPhi + yB * (dyBdPhi - 1)),
	          dqdPhi = 2 * (dyBdPhi - 1),
	          dmdPhi = (dpdPhi * q - p * dqdPhi) / (q * q),
	          cosAlpha = cos(alpha),
	          sinAlpha = sin(alpha),
	          mcosAlpha = m * cosAlpha,
	          msinAlpha = m * sinAlpha,
	          dAlphadPhi = ((lambda / pi) * (1 / sqrt(1 - xB2 / m2)) * (dxBdPhi * m - xB * dmdPhi)) / m2,
	          fx = msinAlpha - x,
	          fy = phi * (1 + phi2 * h) + m - mcosAlpha - y,
	          deltaxDeltaPhi = dmdPhi * sinAlpha + mcosAlpha * dAlphadPhi,
	          deltaxDeltaLambda = mcosAlpha * dAlphadLambda,
	          deltayDeltaPhi = 1 + dmdPhi - (dmdPhi * cosAlpha - msinAlpha * dAlphadPhi),
	          deltayDeltaLambda = msinAlpha * dAlphadLambda,
	          denominator = deltaxDeltaPhi * deltayDeltaLambda - deltayDeltaPhi * deltaxDeltaLambda;
	      if (!denominator) break;
	      lambda -= deltaLambda = (fy * deltaxDeltaPhi - fx * deltayDeltaPhi) / denominator;
	      phi -= deltaPhi = (fx * deltayDeltaLambda - fy * deltaxDeltaLambda) / denominator;
	    } while ((abs(deltaLambda) > epsilon || abs(deltaPhi) > epsilon) && --i > 0);
	    return [lambda, phi];
	  };

	  return forward;
	};

	var ginzburg4Raw = ginzburgPolyconicRaw(2.8284, -1.6988, 0.75432, -0.18071, 1.76003, -0.38914, 0.042555);

	var ginzburg4 = function() {
	  return d3Geo.geoProjection(ginzburg4Raw)
	      .scale(149.995);
	};

	var ginzburg5Raw = ginzburgPolyconicRaw(2.583819, -0.835827, 0.170354, -0.038094, 1.543313, -0.411435,0.082742);

	var ginzburg5 = function() {
	  return d3Geo.geoProjection(ginzburg5Raw)
	      .scale(153.93);
	};

	var ginzburg6Raw = ginzburgPolyconicRaw(5 / 6 * pi, -0.62636, -0.0344, 0, 1.3493, -0.05524, 0, 0.045);

	var ginzburg6 = function() {
	  return d3Geo.geoProjection(ginzburg6Raw)
	      .scale(130.945);
	};

	function ginzburg8Raw(lambda, phi) {
	  var lambda2 = lambda * lambda,
	      phi2 = phi * phi;
	  return [
	    lambda * (1 - 0.162388 * phi2) * (0.87 - 0.000952426 * lambda2 * lambda2),
	    phi * (1 + phi2 / 12)
	  ];
	}

	ginzburg8Raw.invert = function(x, y) {
	  var lambda = x,
	      phi = y,
	      i = 50, delta;
	  do {
	    var phi2 = phi * phi;
	    phi -= delta = (phi * (1 + phi2 / 12) - y) / (1 + phi2 / 4);
	  } while (abs(delta) > epsilon && --i > 0);
	  i = 50;
	  x /= 1 -0.162388 * phi2;
	  do {
	    var lambda4 = (lambda4 = lambda * lambda) * lambda4;
	    lambda -= delta = (lambda * (0.87 - 0.000952426 * lambda4) - x) / (0.87 - 0.00476213 * lambda4);
	  } while (abs(delta) > epsilon && --i > 0);
	  return [lambda, phi];
	};

	var ginzburg8 = function() {
	  return d3Geo.geoProjection(ginzburg8Raw)
	      .scale(131.747);
	};

	var ginzburg9Raw = ginzburgPolyconicRaw(2.6516, -0.76534, 0.19123, -0.047094, 1.36289, -0.13965,0.031762);

	var ginzburg9 = function() {
	  return d3Geo.geoProjection(ginzburg9Raw)
	      .scale(131.087);
	};

	var squareRaw = function(project) {
	  var dx = project(halfPi, 0)[0] - project(-halfPi, 0)[0];

	  function projectSquare(lambda, phi) {
	    var s = lambda > 0 ? -0.5 : 0.5,
	        point = project(lambda + s * pi, phi);
	    point[0] -= s * dx;
	    return point;
	  }

	  if (project.invert) projectSquare.invert = function(x, y) {
	    var s = x > 0 ? -0.5 : 0.5,
	        location = project.invert(x + s * dx, y),
	        lambda = location[0] - s * pi;
	    if (lambda < -pi) lambda += 2 * pi;
	    else if (lambda > pi) lambda -= 2 * pi;
	    location[0] = lambda;
	    return location;
	  };

	  return projectSquare;
	};

	function gringortenRaw(lambda, phi) {
	  var sLambda = sign(lambda),
	      sPhi = sign(phi),
	      cosPhi = cos(phi),
	      x = cos(lambda) * cosPhi,
	      y = sin(lambda) * cosPhi,
	      z = sin(sPhi * phi);
	  lambda = abs(atan2(y, z));
	  phi = asin(x);
	  if (abs(lambda - halfPi) > epsilon) lambda %= halfPi;
	  var point = gringortenHexadecant(lambda > pi / 4 ? halfPi - lambda : lambda, phi);
	  if (lambda > pi / 4) z = point[0], point[0] = -point[1], point[1] = -z;
	  return (point[0] *= sLambda, point[1] *= -sPhi, point);
	}

	gringortenRaw.invert = function(x, y) {
	  if (abs(x) > 1) x = sign(x) * 2 - x;
	  if (abs(y) > 1) y = sign(y) * 2 - y;
	  var sx = sign(x),
	      sy = sign(y),
	      x0 = -sx * x,
	      y0 = -sy * y,
	      t = y0 / x0 < 1,
	      p = gringortenHexadecantInvert(t ? y0 : x0, t ? x0 : y0),
	      lambda = p[0],
	      phi = p[1],
	      cosPhi = cos(phi);
	  if (t) lambda = -halfPi - lambda;
	  return [sx * (atan2(sin(lambda) * cosPhi, -sin(phi)) + pi), sy * asin(cos(lambda) * cosPhi)];
	};

	function gringortenHexadecant(lambda, phi) {
	  if (phi === halfPi) return [0, 0];

	  var sinPhi = sin(phi),
	      r = sinPhi * sinPhi,
	      r2 = r * r,
	      j = 1 + r2,
	      k = 1 + 3 * r2,
	      q = 1 - r2,
	      z = asin(1 / sqrt(j)),
	      v = q + r * j * z,
	      p2 = (1 - sinPhi) / v,
	      p = sqrt(p2),
	      a2 = p2 * j,
	      a = sqrt(a2),
	      h = p * q,
	      x,
	      i;

	  if (lambda === 0) return [0, -(h + r * a)];

	  var cosPhi = cos(phi),
	      secPhi = 1 / cosPhi,
	      drdPhi = 2 * sinPhi * cosPhi,
	      dvdPhi = (-3 * r + z * k) * drdPhi,
	      dp2dPhi = (-v * cosPhi - (1 - sinPhi) * dvdPhi) / (v * v),
	      dpdPhi = (0.5 * dp2dPhi) / p,
	      dhdPhi = q * dpdPhi - 2 * r * p * drdPhi,
	      dra2dPhi = r * j * dp2dPhi + p2 * k * drdPhi,
	      mu = -secPhi * drdPhi,
	      nu = -secPhi * dra2dPhi,
	      zeta = -2 * secPhi * dhdPhi,
	      lambda1 = 4 * lambda / pi,
	      delta;

	  // Slower but accurate bisection method.
	  if (lambda > 0.222 * pi || phi < pi / 4 && lambda > 0.175 * pi) {
	    x = (h + r * sqrt(a2 * (1 + r2) - h * h)) / (1 + r2);
	    if (lambda > pi / 4) return [x, x];
	    var x1 = x, x0 = 0.5 * x;
	    x = 0.5 * (x0 + x1), i = 50;
	    do {
	      var g = sqrt(a2 - x * x),
	          f = (x * (zeta + mu * g) + nu * asin(x / a)) - lambda1;
	      if (!f) break;
	      if (f < 0) x0 = x;
	      else x1 = x;
	      x = 0.5 * (x0 + x1);
	    } while (abs(x1 - x0) > epsilon && --i > 0);
	  }

	  // Newton-Raphson.
	  else {
	    x = epsilon, i = 25;
	    do {
	      var x2 = x * x,
	          g2 = sqrt(a2 - x2),
	          zetaMug = zeta + mu * g2,
	          f2 = x * zetaMug + nu * asin(x / a) - lambda1,
	          df = zetaMug + (nu - mu * x2) / g2;
	      x -= delta = g2 ? f2 / df : 0;
	    } while (abs(delta) > epsilon && --i > 0);
	  }

	  return [x, -h - r * sqrt(a2 - x * x)];
	}

	function gringortenHexadecantInvert(x, y) {
	  var x0 = 0,
	      x1 = 1,
	      r = 0.5,
	      i = 50;

	  while (true) {
	    var r2 = r * r,
	        sinPhi = sqrt(r),
	        z = asin(1 / sqrt(1 + r2)),
	        v = (1 - r2) + r * (1 + r2) * z,
	        p2 = (1 - sinPhi) / v,
	        p = sqrt(p2),
	        a2 = p2 * (1 + r2),
	        h = p * (1 - r2),
	        g2 = a2 - x * x,
	        g = sqrt(g2),
	        y0 = y + h + r * g;
	    if (abs(x1 - x0) < epsilon2 || --i === 0 || y0 === 0) break;
	    if (y0 > 0) x0 = r;
	    else x1 = r;
	    r = 0.5 * (x0 + x1);
	  }

	  if (!i) return null;

	  var phi = asin(sinPhi),
	      cosPhi = cos(phi),
	      secPhi = 1 / cosPhi,
	      drdPhi = 2 * sinPhi * cosPhi,
	      dvdPhi = (-3 * r + z * (1 + 3 * r2)) * drdPhi,
	      dp2dPhi = (-v * cosPhi - (1 - sinPhi) * dvdPhi) / (v * v),
	      dpdPhi = 0.5 * dp2dPhi / p,
	      dhdPhi = (1 - r2) * dpdPhi - 2 * r * p * drdPhi,
	      zeta = -2 * secPhi * dhdPhi,
	      mu = -secPhi * drdPhi,
	      nu = -secPhi * (r * (1 + r2) * dp2dPhi + p2 * (1 + 3 * r2) * drdPhi);

	  return [pi / 4 * (x * (zeta + mu * g) + nu * asin(x / sqrt(a2))), phi];
	}

	var gringorten = function() {
	  return d3Geo.geoProjection(squareRaw(gringortenRaw))
	      .scale(239.75);
	};

	// Returns [sn, cn, dn](u + iv|m).
	function ellipticJi(u, v, m) {
	  var a, b, c;
	  if (!u) {
	    b = ellipticJ(v, 1 - m);
	    return [
	      [0, b[0] / b[1]],
	      [1 / b[1], 0],
	      [b[2] / b[1], 0]
	    ];
	  }
	  a = ellipticJ(u, m);
	  if (!v) return [[a[0], 0], [a[1], 0], [a[2], 0]];
	  b = ellipticJ(v, 1 - m);
	  c = b[1] * b[1] + m * a[0] * a[0] * b[0] * b[0];
	  return [
	    [a[0] * b[2] / c, a[1] * a[2] * b[0] * b[1] / c],
	    [a[1] * b[1] / c, -a[0] * a[2] * b[0] * b[2] / c],
	    [a[2] * b[1] * b[2] / c, -m * a[0] * a[1] * b[0] / c]
	  ];
	}

	// Returns [sn, cn, dn, ph](u|m).
	function ellipticJ(u, m) {
	  var ai, b, phi, t, twon;
	  if (m < epsilon) {
	    t = sin(u);
	    b = cos(u);
	    ai = m * (u - t * b) / 4;
	    return [
	      t - ai * b,
	      b + ai * t,
	      1 - m * t * t / 2,
	      u - ai
	    ];
	  }
	  if (m >= 1 - epsilon) {
	    ai = (1 - m) / 4;
	    b = cosh(u);
	    t = tanh(u);
	    phi = 1 / b;
	    twon = b * sinh(u);
	    return [
	      t + ai * (twon - u) / (b * b),
	      phi - ai * t * phi * (twon - u),
	      phi + ai * t * phi * (twon + u),
	      2 * atan(exp(u)) - halfPi + ai * (twon - u) / b
	    ];
	  }

	  var a = [1, 0, 0, 0, 0, 0, 0, 0, 0],
	      c = [sqrt(m), 0, 0, 0, 0, 0, 0, 0, 0],
	      i = 0;
	  b = sqrt(1 - m);
	  twon = 1;

	  while (abs(c[i] / a[i]) > epsilon && i < 8) {
	    ai = a[i++];
	    c[i] = (ai - b) / 2;
	    a[i] = (ai + b) / 2;
	    b = sqrt(ai * b);
	    twon *= 2;
	  }

	  phi = twon * a[i] * u;
	  do {
	    t = c[i] * sin(b = phi) / a[i];
	    phi = (asin(t) + phi) / 2;
	  } while (--i);

	  return [sin(phi), t = cos(phi), t / cos(phi - b), phi];
	}

	// Calculate F(phi+iPsi|m).
	// See Abramowitz and Stegun, 17.4.11.
	function ellipticFi(phi, psi, m) {
	  var r = abs(phi),
	      i = abs(psi),
	      sinhPsi = sinh(i);
	  if (r) {
	    var cscPhi = 1 / sin(r),
	        cotPhi2 = 1 / (tan(r) * tan(r)),
	        b = -(cotPhi2 + m * (sinhPsi * sinhPsi * cscPhi * cscPhi) - 1 + m),
	        c = (m - 1) * cotPhi2,
	        cotLambda2 = (-b + sqrt(b * b - 4 * c)) / 2;
	    return [
	      ellipticF(atan(1 / sqrt(cotLambda2)), m) * sign(phi),
	      ellipticF(atan(sqrt((cotLambda2 / cotPhi2 - 1) / m)), 1 - m) * sign(psi)
	    ];
	  }
	  return [
	    0,
	    ellipticF(atan(sinhPsi), 1 - m) * sign(psi)
	  ];
	}

	// Calculate F(phi|m) where m = k² = sin²α.
	// See Abramowitz and Stegun, 17.6.7.
	function ellipticF(phi, m) {
	  if (!m) return phi;
	  if (m === 1) return log(tan(phi / 2 + quarterPi));
	  var a = 1,
	      b = sqrt(1 - m),
	      c = sqrt(m);
	  for (var i = 0; abs(c) > epsilon; i++) {
	    if (phi % pi) {
	      var dPhi = atan(b * tan(phi) / a);
	      if (dPhi < 0) dPhi += pi;
	      phi += dPhi + ~~(phi / pi) * pi;
	    } else phi += phi;
	    c = (a + b) / 2;
	    b = sqrt(a * b);
	    c = ((a = c) - b) / 2;
	  }
	  return phi / (pow(2, i) * a);
	}

	function guyouRaw(lambda, phi) {
	  var k_ = (sqrt2 - 1) / (sqrt2 + 1),
	      k = sqrt(1 - k_ * k_),
	      K = ellipticF(halfPi, k * k),
	      f = -1,
	      psi = log(tan(pi / 4 + abs(phi) / 2)),
	      r = exp(f * psi) / sqrt(k_),
	      at = guyouComplexAtan(r * cos(f * lambda), r * sin(f * lambda)),
	      t = ellipticFi(at[0], at[1], k * k);
	  return [-t[1], (phi >= 0 ? 1 : -1) * (0.5 * K - t[0])];
	}

	function guyouComplexAtan(x, y) {
	  var x2 = x * x,
	      y_1 = y + 1,
	      t = 1 - x2 - y * y;
	  return [
	   0.5 * ((x >= 0 ? halfPi : -halfPi) - atan2(t, 2 * x)),
	    -0.25 * log(t * t + 4 * x2) +0.5 * log(y_1 * y_1 + x2)
	  ];
	}

	function guyouComplexDivide(a, b) {
	  var denominator = b[0] * b[0] + b[1] * b[1];
	  return [
	    (a[0] * b[0] + a[1] * b[1]) / denominator,
	    (a[1] * b[0] - a[0] * b[1]) / denominator
	  ];
	}

	guyouRaw.invert = function(x, y) {
	  var k_ = (sqrt2 - 1) / (sqrt2 + 1),
	      k = sqrt(1 - k_ * k_),
	      K = ellipticF(halfPi, k * k),
	      f = -1,
	      j = ellipticJi(0.5 * K - y, -x, k * k),
	      tn = guyouComplexDivide(j[0], j[1]),
	      lambda = atan2(tn[1], tn[0]) / f;
	  return [
	    lambda,
	    2 * atan(exp(0.5 / f * log(k_ * tn[0] * tn[0] + k_ * tn[1] * tn[1]))) - halfPi
	  ];
	};

	var guyou = function() {
	  return d3Geo.geoProjection(squareRaw(guyouRaw))
	      .scale(151.496);
	};

	function hammerRetroazimuthalRaw(phi0) {
	  var sinPhi0 = sin(phi0),
	      cosPhi0 = cos(phi0),
	      rotate = hammerRetroazimuthalRotation(phi0);

	  rotate.invert = hammerRetroazimuthalRotation(-phi0);

	  function forward(lambda, phi) {
	    var p = rotate(lambda, phi);
	    lambda = p[0], phi = p[1];
	    var sinPhi = sin(phi),
	        cosPhi = cos(phi),
	        cosLambda = cos(lambda),
	        z = acos(sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLambda),
	        sinz = sin(z),
	        K = abs(sinz) > epsilon ? z / sinz : 1;
	    return [
	      K * cosPhi0 * sin(lambda),
	      (abs(lambda) > halfPi ? K : -K) // rotate for back hemisphere
	        * (sinPhi0 * cosPhi - cosPhi0 * sinPhi * cosLambda)
	    ];
	  }

	  forward.invert = function(x, y) {
	    var rho = sqrt(x * x + y * y),
	        sinz = -sin(rho),
	        cosz = cos(rho),
	        a = rho * cosz,
	        b = -y * sinz,
	        c = rho * sinPhi0,
	        d = sqrt(a * a + b * b - c * c),
	        phi = atan2(a * c + b * d, b * c - a * d),
	        lambda = (rho > halfPi ? -1 : 1) * atan2(x * sinz, rho * cos(phi) * cosz + y * sin(phi) * sinz);
	    return rotate.invert(lambda, phi);
	  };

	  return forward;
	}

	// Latitudinal rotation by phi0.
	// Temporary hack until D3 supports arbitrary small-circle clipping origins.
	function hammerRetroazimuthalRotation(phi0) {
	  var sinPhi0 = sin(phi0),
	      cosPhi0 = cos(phi0);

	  return function(lambda, phi) {
	    var cosPhi = cos(phi),
	        x = cos(lambda) * cosPhi,
	        y = sin(lambda) * cosPhi,
	        z = sin(phi);
	    return [
	      atan2(y, x * cosPhi0 - z * sinPhi0),
	      asin(z * cosPhi0 + x * sinPhi0)
	    ];
	  };
	}

	var hammerRetroazimuthal = function() {
	  var phi0 = 0,
	      m = d3Geo.geoProjectionMutator(hammerRetroazimuthalRaw),
	      p = m(phi0),
	      rotate_ = p.rotate,
	      stream_ = p.stream,
	      circle = d3Geo.geoCircle();

	  p.parallel = function(_) {
	    if (!arguments.length) return phi0 * degrees;
	    var r = p.rotate();
	    return m(phi0 = _ * radians).rotate(r);
	  };

	  // Temporary hack; see hammerRetroazimuthalRotation.
	  p.rotate = function(_) {
	    if (!arguments.length) return (_ = rotate_.call(p), _[1] += phi0 * degrees, _);
	    rotate_.call(p, [_[0], _[1] - phi0 * degrees]);
	    circle.center([-_[0], -_[1]]);
	    return p;
	  };

	  p.stream = function(stream) {
	    stream = stream_(stream);
	    stream.sphere = function() {
	      stream.polygonStart();
	      var epsilon$$1 = 1e-2,
	          ring = circle.radius(90 - epsilon$$1)().coordinates[0],
	          n = ring.length - 1,
	          i = -1,
	          p;
	      stream.lineStart();
	      while (++i < n) stream.point((p = ring[i])[0], p[1]);
	      stream.lineEnd();
	      ring = circle.radius(90 + epsilon$$1)().coordinates[0];
	      n = ring.length - 1;
	      stream.lineStart();
	      while (--i >= 0) stream.point((p = ring[i])[0], p[1]);
	      stream.lineEnd();
	      stream.polygonEnd();
	    };
	    return stream;
	  };

	  return p
	      .scale(79.4187)
	      .parallel(45)
	      .clipAngle(180 - 1e-3);
	};

	var healpixParallel = 41 + 48 / 36 + 37 / 3600;
	var healpixLambert = cylindricalEqualAreaRaw(0);

	function healpixRaw(H) {
	  var phi0 = healpixParallel * radians,
	      dx = collignonRaw(pi, phi0)[0] - collignonRaw(-pi, phi0)[0],
	      y0 = healpixLambert(0, phi0)[1],
	      y1 = collignonRaw(0, phi0)[1],
	      dy1 = sqrtPi - y1,
	      k = tau / H,
	      w = 4 / tau,
	      h = y0 + (dy1 * dy1 * 4) / tau;

	  function forward(lambda, phi) {
	    var point,
	        phi2 = abs(phi);
	    if (phi2 > phi0) {
	      var i = min(H - 1, max(0, floor((lambda + pi) / k)));
	      lambda += pi * (H - 1) / H - i * k;
	      point = collignonRaw(lambda, phi2);
	      point[0] = point[0] * tau / dx - tau * (H - 1) / (2 * H) + i * tau / H;
	      point[1] = y0 + (point[1] - y1) * 4 * dy1 / tau;
	      if (phi < 0) point[1] = -point[1];
	    } else {
	      point = healpixLambert(lambda, phi);
	    }
	    point[0] *= w, point[1] /= h;
	    return point;
	  }

	  forward.invert = function(x, y) {
	    x /= w, y *= h;
	    var y2 = abs(y);
	    if (y2 > y0) {
	      var i = min(H - 1, max(0, floor((x + pi) / k)));
	      x = (x + pi * (H - 1) / H - i * k) * dx / tau;
	      var point = collignonRaw.invert(x, 0.25 * (y2 - y0) * tau / dy1 + y1);
	      point[0] -= pi * (H - 1) / H - i * k;
	      if (y < 0) point[1] = -point[1];
	      return point;
	    }
	    return healpixLambert.invert(x, y);
	  };

	  return forward;
	}

	function sphere(step) {
	  return {
	    type: "Polygon",
	    coordinates: [
	      d3Array.range(-180, 180 + step / 2, step).map(function(x, i) { return [x, i & 1 ? 90 - 1e-6 : healpixParallel]; })
	      .concat(d3Array.range(180, -180 - step / 2, -step).map(function(x, i) { return [x, i & 1 ? -90 + 1e-6 : -healpixParallel]; }))
	    ]
	  };
	}

	var healpix = function() {
	  var H = 4,
	      m = d3Geo.geoProjectionMutator(healpixRaw),
	      p = m(H),
	      stream_ = p.stream;

	  p.lobes = function(_) {
	    return arguments.length ? m(H = +_) : H;
	  };

	  p.stream = function(stream) {
	    var rotate = p.rotate(),
	        rotateStream = stream_(stream),
	        sphereStream = (p.rotate([0, 0]), stream_(stream));
	    p.rotate(rotate);
	    rotateStream.sphere = function() { d3Geo.geoStream(sphere(180 / H), sphereStream); };
	    return rotateStream;
	  };

	  return p
	      .scale(239.75);
	};

	function hillRaw(K) {
	  var L = 1 + K,
	      sinBt = sin(1 / L),
	      Bt = asin(sinBt),
	      A = 2 * sqrt(pi / (B = pi + 4 * Bt * L)),
	      B,
	      rho0 = 0.5 * A * (L + sqrt(K * (2 + K))),
	      K2 = K * K,
	      L2 = L * L;

	  function forward(lambda, phi) {
	    var t = 1 - sin(phi),
	        rho,
	        omega;
	    if (t && t < 2) {
	      var theta = halfPi - phi, i = 25, delta;
	      do {
	        var sinTheta = sin(theta),
	            cosTheta = cos(theta),
	            Bt_Bt1 = Bt + atan2(sinTheta, L - cosTheta),
	            C = 1 + L2 - 2 * L * cosTheta;
	        theta -= delta = (theta - K2 * Bt - L * sinTheta + C * Bt_Bt1 -0.5 * t * B) / (2 * L * sinTheta * Bt_Bt1);
	      } while (abs(delta) > epsilon2 && --i > 0);
	      rho = A * sqrt(C);
	      omega = lambda * Bt_Bt1 / pi;
	    } else {
	      rho = A * (K + t);
	      omega = lambda * Bt / pi;
	    }
	    return [
	      rho * sin(omega),
	      rho0 - rho * cos(omega)
	    ];
	  }

	  forward.invert = function(x, y) {
	    var rho2 = x * x + (y -= rho0) * y,
	        cosTheta = (1 + L2 - rho2 / (A * A)) / (2 * L),
	        theta = acos(cosTheta),
	        sinTheta = sin(theta),
	        Bt_Bt1 = Bt + atan2(sinTheta, L - cosTheta);
	    return [
	      asin(x / sqrt(rho2)) * pi / Bt_Bt1,
	      asin(1 - 2 * (theta - K2 * Bt - L * sinTheta + (1 + L2 - 2 * L * cosTheta) * Bt_Bt1) / B)
	    ];
	  };

	  return forward;
	}

	var hill = function() {
	  var K = 1,
	      m = d3Geo.geoProjectionMutator(hillRaw),
	      p = m(K);

	  p.ratio = function(_) {
	    return arguments.length ? m(K = +_) : K;
	  };

	  return p
	      .scale(167.774)
	      .center([0, 18.67]);
	};

	var sinuMollweidePhi = 0.7109889596207567;

	var sinuMollweideY = 0.0528035274542;

	function sinuMollweideRaw(lambda, phi) {
	  return phi > -sinuMollweidePhi
	      ? (lambda = mollweideRaw(lambda, phi), lambda[1] += sinuMollweideY, lambda)
	      : sinusoidalRaw(lambda, phi);
	}

	sinuMollweideRaw.invert = function(x, y) {
	  return y > -sinuMollweidePhi
	      ? mollweideRaw.invert(x, y - sinuMollweideY)
	      : sinusoidalRaw.invert(x, y);
	};

	var sinuMollweide = function() {
	  return d3Geo.geoProjection(sinuMollweideRaw)
	      .rotate([-20, -55])
	      .scale(164.263)
	      .center([0, -5.4036]);
	};

	function homolosineRaw(lambda, phi) {
	  return abs(phi) > sinuMollweidePhi
	      ? (lambda = mollweideRaw(lambda, phi), lambda[1] -= phi > 0 ? sinuMollweideY : -sinuMollweideY, lambda)
	      : sinusoidalRaw(lambda, phi);
	}

	homolosineRaw.invert = function(x, y) {
	  return abs(y) > sinuMollweidePhi
	      ? mollweideRaw.invert(x, y + (y > 0 ? sinuMollweideY : -sinuMollweideY))
	      : sinusoidalRaw.invert(x, y);
	};

	var homolosine = function() {
	  return d3Geo.geoProjection(homolosineRaw)
	      .scale(152.63);
	};

	function pointEqual(a, b) {
	  return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
	}

	function interpolateLine(coordinates, m) {
	  var i = -1,
	      n = coordinates.length,
	      p0 = coordinates[0],
	      p1,
	      dx,
	      dy,
	      resampled = [];
	  while (++i < n) {
	    p1 = coordinates[i];
	    dx = (p1[0] - p0[0]) / m;
	    dy = (p1[1] - p0[1]) / m;
	    for (var j = 0; j < m; ++j) resampled.push([p0[0] + j * dx, p0[1] + j * dy]);
	    p0 = p1;
	  }
	  resampled.push(p1);
	  return resampled;
	}

	function interpolateSphere(lobes) {
	  var coordinates = [],
	      lobe,
	      lambda0, phi0, phi1,
	      lambda2, phi2,
	      i, n = lobes[0].length;

	  // Northern Hemisphere
	  for (i = 0; i < n; ++i) {
	    lobe = lobes[0][i];
	    lambda0 = lobe[0][0], phi0 = lobe[0][1], phi1 = lobe[1][1];
	    lambda2 = lobe[2][0], phi2 = lobe[2][1];
	    coordinates.push(interpolateLine([
	      [lambda0 + epsilon, phi0 + epsilon],
	      [lambda0 + epsilon, phi1 - epsilon],
	      [lambda2 - epsilon, phi1 - epsilon],
	      [lambda2 - epsilon, phi2 + epsilon]
	    ], 30));
	  }

	  // Southern Hemisphere
	  for (i = lobes[1].length - 1; i >= 0; --i) {
	    lobe = lobes[1][i];
	    lambda0 = lobe[0][0], phi0 = lobe[0][1], phi1 = lobe[1][1];
	    lambda2 = lobe[2][0], phi2 = lobe[2][1];
	    coordinates.push(interpolateLine([
	      [lambda2 - epsilon, phi2 - epsilon],
	      [lambda2 - epsilon, phi1 + epsilon],
	      [lambda0 + epsilon, phi1 + epsilon],
	      [lambda0 + epsilon, phi0 - epsilon]
	    ], 30));
	  }

	  return {
	    type: "Polygon",
	    coordinates: [d3Array.merge(coordinates)]
	  };
	}

	var interrupt = function(project, lobes) {
	  var sphere, bounds;

	  function forward(lambda, phi) {
	    var sign$$1 = phi < 0 ? -1 : +1, lobe = lobes[+(phi < 0)];
	    for (var i = 0, n = lobe.length - 1; i < n && lambda > lobe[i][2][0]; ++i);
	    var p = project(lambda - lobe[i][1][0], phi);
	    p[0] += project(lobe[i][1][0], sign$$1 * phi > sign$$1 * lobe[i][0][1] ? lobe[i][0][1] : phi)[0];
	    return p;
	  }

	  // Assumes mutually exclusive bounding boxes for lobes.
	  if (project.invert) forward.invert = function(x, y) {
	    var bound = bounds[+(y < 0)], lobe = lobes[+(y < 0)];
	    for (var i = 0, n = bound.length; i < n; ++i) {
	      var b = bound[i];
	      if (b[0][0] <= x && x < b[1][0] && b[0][1] <= y && y < b[1][1]) {
	        var p = project.invert(x - project(lobe[i][1][0], 0)[0], y);
	        p[0] += lobe[i][1][0];
	        return pointEqual(forward(p[0], p[1]), [x, y]) ? p : null;
	      }
	    }
	  };

	  var p = d3Geo.geoProjection(forward),
	      stream_ = p.stream;

	  p.stream = function(stream) {
	    var rotate = p.rotate(),
	        rotateStream = stream_(stream),
	        sphereStream = (p.rotate([0, 0]), stream_(stream));
	    p.rotate(rotate);
	    rotateStream.sphere = function() { d3Geo.geoStream(sphere, sphereStream); };
	    return rotateStream;
	  };
	  
	  p.lobes = function(_) {
	    if (!arguments.length) return lobes.map(function(lobe) {
	      return lobe.map(function(l) {
	        return [
	          [l[0][0] * degrees, l[0][1] * degrees],
	          [l[1][0] * degrees, l[1][1] * degrees],
	          [l[2][0] * degrees, l[2][1] * degrees]
	        ];
	      });
	    });

	    sphere = interpolateSphere(_);

	    lobes = _.map(function(lobe) {
	      return lobe.map(function(l) {
	        return [
	          [l[0][0] * radians, l[0][1] * radians],
	          [l[1][0] * radians, l[1][1] * radians],
	          [l[2][0] * radians, l[2][1] * radians]
	        ];
	      });
	    });

	    bounds = lobes.map(function(lobe) {
	      return lobe.map(function(l) {
	        var x0 = project(l[0][0], l[0][1])[0],
	            x1 = project(l[2][0], l[2][1])[0],
	            y0 = project(l[1][0], l[0][1])[1],
	            y1 = project(l[1][0], l[1][1])[1],
	            t;
	        if (y0 > y1) t = y0, y0 = y1, y1 = t;
	        return [[x0, y0], [x1, y1]];
	      });
	    });

	    return p;
	  };

	  if (lobes != null) p.lobes(lobes);

	  return p;
	};

	var lobes = [[ // northern hemisphere
	  [[-180,   0], [-100,  90], [ -40,   0]],
	  [[ -40,   0], [  30,  90], [ 180,   0]]
	], [ // southern hemisphere
	  [[-180,   0], [-160, -90], [-100,   0]],
	  [[-100,   0], [ -60, -90], [ -20,   0]],
	  [[ -20,   0], [  20, -90], [  80,   0]],
	  [[  80,   0], [ 140, -90], [ 180,   0]]
	]];

	var boggs$1 = function() {
	  return interrupt(boggsRaw, lobes)
	      .scale(160.857);
	};

	var lobes$1 = [[ // northern hemisphere
	  [[-180,   0], [-100,  90], [ -40,   0]],
	  [[ -40,   0], [  30,  90], [ 180,   0]]
	], [ // southern hemisphere
	  [[-180,   0], [-160, -90], [-100,   0]],
	  [[-100,   0], [ -60, -90], [ -20,   0]],
	  [[ -20,   0], [  20, -90], [  80,   0]],
	  [[  80,   0], [ 140, -90], [ 180,   0]]
	]];

	var homolosine$1 = function() {
	  return interrupt(homolosineRaw, lobes$1)
	      .scale(152.63);
	};

	var lobes$2 = [[ // northern hemisphere
	  [[-180,   0], [-100,  90], [ -40,   0]],
	  [[ -40,   0], [  30,  90], [ 180,   0]]
	], [ // southern hemisphere
	  [[-180,   0], [-160, -90], [-100,   0]],
	  [[-100,   0], [ -60, -90], [ -20,   0]],
	  [[ -20,   0], [  20, -90], [  80,   0]],
	  [[  80,   0], [ 140, -90], [ 180,   0]]
	]];

	var mollweide$1 = function() {
	  return interrupt(mollweideRaw, lobes$2)
	      .scale(169.529);
	};

	var lobes$3 = [[ // northern hemisphere
	  [[-180,   0], [ -90,  90], [   0,   0]],
	  [[   0,   0], [  90,  90], [ 180,   0]]
	], [ // southern hemisphere
	  [[-180,   0], [ -90, -90], [   0,   0]],
	  [[   0,   0], [  90, -90], [ 180,   0]]
	]];

	var mollweideHemispheres = function() {
	  return interrupt(mollweideRaw, lobes$3)
	      .scale(169.529)
	      .rotate([20, 0]);
	};

	var lobes$4 = [[ // northern hemisphere
	  [[-180,  35], [ -30,  90], [   0,  35]],
	  [[   0,  35], [  30,  90], [ 180,  35]]
	], [ // southern hemisphere
	  [[-180, -10], [-102, -90], [ -65, -10]],
	  [[ -65, -10], [   5, -90], [  77, -10]],
	  [[  77, -10], [ 103, -90], [ 180, -10]]
	]];

	var sinuMollweide$1 = function() {
	  return interrupt(sinuMollweideRaw, lobes$4)
	      .rotate([-20, -55])
	      .scale(164.263)
	      .center([0, -5.4036]);
	};

	var lobes$5 = [[ // northern hemisphere
	  [[-180,   0], [-110,  90], [ -40,   0]],
	  [[ -40,   0], [   0,  90], [  40,   0]],
	  [[  40,   0], [ 110,  90], [ 180,   0]]
	], [ // southern hemisphere
	  [[-180,   0], [-110, -90], [ -40,   0]],
	  [[ -40,   0], [   0, -90], [  40,   0]],
	  [[  40,   0], [ 110, -90], [ 180,   0]]
	]];

	var sinusoidal$1 = function() {
	  return interrupt(sinusoidalRaw, lobes$5)
	      .scale(152.63)
	      .rotate([-20, 0]);
	};

	function kavrayskiy7Raw(lambda, phi) {
	  return [3 / tau * lambda * sqrt(pi * pi / 3 - phi * phi), phi];
	}

	kavrayskiy7Raw.invert = function(x, y) {
	  return [tau / 3 * x / sqrt(pi * pi / 3 - y * y), y];
	};

	var kavrayskiy7 = function() {
	  return d3Geo.geoProjection(kavrayskiy7Raw)
	      .scale(158.837);
	};

	function lagrangeRaw(n) {

	  function forward(lambda, phi) {
	    if (abs(abs(phi) - halfPi) < epsilon) return [0, phi < 0 ? -2 : 2];
	    var sinPhi = sin(phi),
	        v = pow((1 + sinPhi) / (1 - sinPhi), n / 2),
	        c = 0.5 * (v + 1 / v) + cos(lambda *= n);
	    return [
	      2 * sin(lambda) / c,
	      (v - 1 / v) / c
	    ];
	  }

	  forward.invert = function(x, y) {
	    var y0 = abs(y);
	    if (abs(y0 - 2) < epsilon) return x ? null : [0, sign(y) * halfPi];
	    if (y0 > 2) return null;

	    x /= 2, y /= 2;
	    var x2 = x * x,
	        y2 = y * y,
	        t = 2 * y / (1 + x2 + y2); // tanh(nPhi)
	    t = pow((1 + t) / (1 - t), 1 / n);
	    return [
	      atan2(2 * x, 1 - x2 - y2) / n,
	      asin((t - 1) / (t + 1))
	    ];
	  };

	  return forward;
	}

	var lagrange = function() {
	  var n = 0.5,
	      m = d3Geo.geoProjectionMutator(lagrangeRaw),
	      p = m(n);

	  p.spacing = function(_) {
	    return arguments.length ? m(n = +_) : n;
	  };

	  return p
	      .scale(124.75);
	};

	var pi_sqrt2 = pi / sqrt2;

	function larriveeRaw(lambda, phi) {
	  return [
	    lambda * (1 + sqrt(cos(phi))) / 2,
	    phi / (cos(phi / 2) * cos(lambda / 6))
	  ];
	}

	larriveeRaw.invert = function(x, y) {
	  var x0 = abs(x),
	      y0 = abs(y),
	      lambda = epsilon,
	      phi = halfPi;
	  if (y0 < pi_sqrt2) phi *= y0 / pi_sqrt2;
	  else lambda += 6 * acos(pi_sqrt2 / y0);
	  for (var i = 0; i < 25; i++) {
	    var sinPhi = sin(phi),
	        sqrtcosPhi = sqrt(cos(phi)),
	        sinPhi_2 = sin(phi / 2),
	        cosPhi_2 = cos(phi / 2),
	        sinLambda_6 = sin(lambda / 6),
	        cosLambda_6 = cos(lambda / 6),
	        f0 = 0.5 * lambda * (1 + sqrtcosPhi) - x0,
	        f1 = phi / (cosPhi_2 * cosLambda_6) - y0,
	        df0dPhi = sqrtcosPhi ? -0.25 * lambda * sinPhi / sqrtcosPhi : 0,
	        df0dLambda = 0.5 * (1 + sqrtcosPhi),
	        df1dPhi = (1 +0.5 * phi * sinPhi_2 / cosPhi_2) / (cosPhi_2 * cosLambda_6),
	        df1dLambda = (phi / cosPhi_2) * (sinLambda_6 / 6) / (cosLambda_6 * cosLambda_6),
	        denom = df0dPhi * df1dLambda - df1dPhi * df0dLambda,
	        dPhi = (f0 * df1dLambda - f1 * df0dLambda) / denom,
	        dLambda = (f1 * df0dPhi - f0 * df1dPhi) / denom;
	    phi -= dPhi;
	    lambda -= dLambda;
	    if (abs(dPhi) < epsilon && abs(dLambda) < epsilon) break;
	  }
	  return [x < 0 ? -lambda : lambda, y < 0 ? -phi : phi];
	};

	var larrivee = function() {
	  return d3Geo.geoProjection(larriveeRaw)
	      .scale(97.2672);
	};

	function laskowskiRaw(lambda, phi) {
	  var lambda2 = lambda * lambda, phi2 = phi * phi;
	  return [
	    lambda * (0.975534 + phi2 * (-0.119161 + lambda2 * -0.0143059 + phi2 * -0.0547009)),
	    phi * (1.00384 + lambda2 * (0.0802894 + phi2 * -0.02855 + lambda2 * 0.000199025) + phi2 * (0.0998909 + phi2 * -0.0491032))
	  ];
	}

	laskowskiRaw.invert = function(x, y) {
	  var lambda = sign(x) * pi,
	      phi = y / 2,
	      i = 50;
	  do {
	    var lambda2 = lambda * lambda,
	        phi2 = phi * phi,
	        lambdaPhi = lambda * phi,
	        fx = lambda * (0.975534 + phi2 * (-0.119161 + lambda2 * -0.0143059 + phi2 * -0.0547009)) - x,
	        fy = phi * (1.00384 + lambda2 * (0.0802894 + phi2 * -0.02855 + lambda2 * 0.000199025) + phi2 * (0.0998909 + phi2 * -0.0491032)) - y,
	        deltaxDeltaLambda = 0.975534 - phi2 * (0.119161 + 3 * lambda2 * 0.0143059 + phi2 * 0.0547009),
	        deltaxDeltaPhi = -lambdaPhi * (2 * 0.119161 + 4 * 0.0547009 * phi2 + 2 * 0.0143059 * lambda2),
	        deltayDeltaLambda = lambdaPhi * (2 * 0.0802894 + 4 * 0.000199025 * lambda2 + 2 * -0.02855 * phi2),
	        deltayDeltaPhi = 1.00384 + lambda2 * (0.0802894 + 0.000199025 * lambda2) + phi2 * (3 * (0.0998909 - 0.02855 * lambda2) - 5 * 0.0491032 * phi2),
	        denominator = deltaxDeltaPhi * deltayDeltaLambda - deltayDeltaPhi * deltaxDeltaLambda,
	        deltaLambda = (fy * deltaxDeltaPhi - fx * deltayDeltaPhi) / denominator,
	        deltaPhi = (fx * deltayDeltaLambda - fy * deltaxDeltaLambda) / denominator;
	    lambda -= deltaLambda, phi -= deltaPhi;
	  } while ((abs(deltaLambda) > epsilon || abs(deltaPhi) > epsilon) && --i > 0);
	  return i && [lambda, phi];
	};

	var laskowski = function() {
	  return d3Geo.geoProjection(laskowskiRaw)
	      .scale(139.98);
	};

	function littrowRaw(lambda, phi) {
	  return [
	    sin(lambda) / cos(phi),
	    tan(phi) * cos(lambda)
	  ];
	}

	littrowRaw.invert = function(x, y) {
	  var x2 = x * x,
	      y2 = y * y,
	      y2_1 = y2 + 1,
	      x2_y2_1 = x2 + y2_1,
	      cosPhi = x
	          ? sqrt1_2 * sqrt((x2_y2_1 - sqrt(x2_y2_1 * x2_y2_1 - 4 * x2)) / x2)
	          : 1 / sqrt(y2_1);
	  return [
	    asin(x * cosPhi),
	    sign(y) * acos(cosPhi)
	  ];
	};

	var littrow = function() {
	  return d3Geo.geoProjection(littrowRaw)
	      .scale(144.049)
	      .clipAngle(90 - 1e-3);
	};

	function loximuthalRaw(phi0) {
	  var cosPhi0 = cos(phi0),
	      tanPhi0 = tan(quarterPi + phi0 / 2);

	  function forward(lambda, phi) {
	    var y = phi - phi0,
	        x = abs(y) < epsilon ? lambda * cosPhi0
	            : abs(x = quarterPi + phi / 2) < epsilon || abs(abs(x) - halfPi) < epsilon
	            ? 0 : lambda * y / log(tan(x) / tanPhi0);
	    return [x, y];
	  }

	  forward.invert = function(x, y) {
	    var lambda,
	        phi = y + phi0;
	    return [
	      abs(y) < epsilon ? x / cosPhi0
	          : (abs(lambda = quarterPi + phi / 2) < epsilon || abs(abs(lambda) - halfPi) < epsilon) ? 0
	          : x * log(tan(lambda) / tanPhi0) / y,
	      phi
	    ];
	  };

	  return forward;
	}

	var loximuthal = function() {
	  return parallel1(loximuthalRaw)
	      .parallel(40)
	      .scale(158.837);
	};

	function millerRaw(lambda, phi) {
	  return [lambda, 1.25 * log(tan(quarterPi + 0.4 * phi))];
	}

	millerRaw.invert = function(x, y) {
	  return [x, 2.5 * atan(exp(0.8 * y)) - 0.625 * pi];
	};

	var miller = function() {
	  return d3Geo.geoProjection(millerRaw)
	      .scale(108.318);
	};

	function modifiedStereographicRaw(C) {
	  var m = C.length - 1;

	  function forward(lambda, phi) {
	    var cosPhi = cos(phi),
	        k = 2 / (1 + cosPhi * cos(lambda)),
	        zr = k * cosPhi * sin(lambda),
	        zi = k * sin(phi),
	        i = m,
	        w = C[i],
	        ar = w[0],
	        ai = w[1],
	        t;
	    while (--i >= 0) {
	      w = C[i];
	      ar = w[0] + zr * (t = ar) - zi * ai;
	      ai = w[1] + zr * ai + zi * t;
	    }
	    ar = zr * (t = ar) - zi * ai;
	    ai = zr * ai + zi * t;
	    return [ar, ai];
	  }

	  forward.invert = function(x, y) {
	    var i = 20,
	        zr = x,
	        zi = y;
	    do {
	      var j = m,
	          w = C[j],
	          ar = w[0],
	          ai = w[1],
	          br = 0,
	          bi = 0,
	          t;

	      while (--j >= 0) {
	        w = C[j];
	        br = ar + zr * (t = br) - zi * bi;
	        bi = ai + zr * bi + zi * t;
	        ar = w[0] + zr * (t = ar) - zi * ai;
	        ai = w[1] + zr * ai + zi * t;
	      }
	      br = ar + zr * (t = br) - zi * bi;
	      bi = ai + zr * bi + zi * t;
	      ar = zr * (t = ar) - zi * ai - x;
	      ai = zr * ai + zi * t - y;

	      var denominator = br * br + bi * bi, deltar, deltai;
	      zr -= deltar = (ar * br + ai * bi) / denominator;
	      zi -= deltai = (ai * br - ar * bi) / denominator;
	    } while (abs(deltar) + abs(deltai) > epsilon * epsilon && --i > 0);

	    if (i) {
	      var rho = sqrt(zr * zr + zi * zi),
	          c = 2 * atan(rho * 0.5),
	          sinc = sin(c);
	      return [atan2(zr * sinc, rho * cos(c)), rho ? asin(zi * sinc / rho) : 0];
	    }
	  };

	  return forward;
	}

	var alaska = [[0.9972523, 0], [0.0052513, -0.0041175], [0.0074606, 0.0048125], [-0.0153783, -0.1968253], [0.0636871, -0.1408027], [0.3660976, -0.2937382]];
	var gs48 = [[0.98879, 0], [0, 0], [-0.050909, 0], [0, 0], [0.075528, 0]];
	var gs50 = [[0.9842990, 0], [0.0211642, 0.0037608], [-0.1036018, -0.0575102], [-0.0329095, -0.0320119], [0.0499471, 0.1223335], [0.0260460, 0.0899805], [0.0007388, -0.1435792], [0.0075848, -0.1334108], [-0.0216473, 0.0776645], [-0.0225161, 0.0853673]];
	var miller$1 = [[0.9245, 0], [0, 0], [0.01943, 0]];
	var lee = [[0.721316, 0], [0, 0], [-0.00881625, -0.00617325]];

	function modifiedStereographicAlaska() {
	  return modifiedStereographic(alaska, [152, -64])
	      .scale(1500)
	      .center([-160.908, 62.4864])
	      .clipAngle(25);
	}

	function modifiedStereographicGs48() {
	  return modifiedStereographic(gs48, [95, -38])
	      .scale(1000)
	      .clipAngle(55)
	      .center([-96.5563, 38.8675]);
	}

	function modifiedStereographicGs50() {
	  return modifiedStereographic(gs50, [120, -45])
	      .scale(359.513)
	      .clipAngle(55)
	      .center([-117.474, 53.0628]);
	}

	function modifiedStereographicMiller() {
	  return modifiedStereographic(miller$1, [-20, -18])
	      .scale(209.091)
	      .center([20, 16.7214])
	      .clipAngle(82);
	}

	function modifiedStereographicLee() {
	  return modifiedStereographic(lee, [165, 10])
	      .scale(250)
	      .clipAngle(130)
	      .center([-165, -10]);
	}

	function modifiedStereographic(coefficients, rotate) {
	  var p = d3Geo.geoProjection(modifiedStereographicRaw(coefficients)).rotate(rotate).clipAngle(90),
	      r = d3Geo.geoRotation(rotate),
	      center = p.center;

	  delete p.rotate;

	  p.center = function(_) {
	    return arguments.length ? center(r(_)) : r.invert(center());
	  };

	  return p;
	}

	var sqrt6 = sqrt(6);
	var sqrt7 = sqrt(7);

	function mtFlatPolarParabolicRaw(lambda, phi) {
	  var theta = asin(7 * sin(phi) / (3 * sqrt6));
	  return [
	    sqrt6 * lambda * (2 * cos(2 * theta / 3) - 1) / sqrt7,
	    9 * sin(theta / 3) / sqrt7
	  ];
	}

	mtFlatPolarParabolicRaw.invert = function(x, y) {
	  var theta = 3 * asin(y * sqrt7 / 9);
	  return [
	    x * sqrt7 / (sqrt6 * (2 * cos(2 * theta / 3) - 1)),
	    asin(sin(theta) * 3 * sqrt6 / 7)
	  ];
	};

	var mtFlatPolarParabolic = function() {
	  return d3Geo.geoProjection(mtFlatPolarParabolicRaw)
	      .scale(164.859);
	};

	function mtFlatPolarQuarticRaw(lambda, phi) {
	  var k = (1 + sqrt1_2) * sin(phi),
	      theta = phi;
	  for (var i = 0, delta; i < 25; i++) {
	    theta -= delta = (sin(theta / 2) + sin(theta) - k) / (0.5 * cos(theta / 2) + cos(theta));
	    if (abs(delta) < epsilon) break;
	  }
	  return [
	    lambda * (1 + 2 * cos(theta) / cos(theta / 2)) / (3 * sqrt2),
	    2 * sqrt(3) * sin(theta / 2) / sqrt(2 + sqrt2)
	  ];
	}

	mtFlatPolarQuarticRaw.invert = function(x, y) {
	  var sinTheta_2 = y * sqrt(2 + sqrt2) / (2 * sqrt(3)),
	      theta = 2 * asin(sinTheta_2);
	  return [
	    3 * sqrt2 * x / (1 + 2 * cos(theta) / cos(theta / 2)),
	    asin((sinTheta_2 + sin(theta)) / (1 + sqrt1_2))
	  ];
	};

	var mtFlatPolarQuartic = function() {
	  return d3Geo.geoProjection(mtFlatPolarQuarticRaw)
	      .scale(188.209);
	};

	function mtFlatPolarSinusoidalRaw(lambda, phi) {
	  var A = sqrt(6 / (4 + pi)),
	      k = (1 + pi / 4) * sin(phi),
	      theta = phi / 2;
	  for (var i = 0, delta; i < 25; i++) {
	    theta -= delta = (theta / 2 + sin(theta) - k) / (0.5 + cos(theta));
	    if (abs(delta) < epsilon) break;
	  }
	  return [
	    A * (0.5 + cos(theta)) * lambda / 1.5,
	    A * theta
	  ];
	}

	mtFlatPolarSinusoidalRaw.invert = function(x, y) {
	  var A = sqrt(6 / (4 + pi)),
	      theta = y / A;
	  if (abs(abs(theta) - halfPi) < epsilon) theta = theta < 0 ? -halfPi : halfPi;
	  return [
	    1.5 * x / (A * (0.5 + cos(theta))),
	    asin((theta / 2 + sin(theta)) / (1 + pi / 4))
	  ];
	};

	var mtFlatPolarSinusoidal = function() {
	  return d3Geo.geoProjection(mtFlatPolarSinusoidalRaw)
	      .scale(166.518);
	};

	function naturalEarth2Raw(lambda, phi) {
	  var phi2 = phi * phi, phi4 = phi2 * phi2, phi6 = phi2 * phi4;
	  return [
	    lambda * (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6)),
	    phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4))
	  ];
	}

	naturalEarth2Raw.invert = function(x, y) {
	  var phi = y, i = 25, delta, phi2, phi4, phi6;
	  do {
	    phi2 = phi * phi; phi4 = phi2 * phi2;
	    phi -= delta = ((phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4))) - y) /
	      (1.01183 + phi4 * phi4 * ((9 * -0.02625) + (11 * 0.01926) * phi2 + (13 * -0.00396) * phi4));
	  } while (abs(delta) > epsilon2 && --i > 0);
	  phi2 = phi * phi; phi4 = phi2 * phi2; phi6 = phi2 * phi4;
	  return [
	    x / (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6)),
	    phi
	  ];
	};

	var naturalEarth2 = function() {
	  return d3Geo.geoProjection(naturalEarth2Raw)
	      .scale(175.295);
	};

	function nellHammerRaw(lambda, phi) {
	  return [
	    lambda * (1 + cos(phi)) / 2,
	    2 * (phi - tan(phi / 2))
	  ];
	}

	nellHammerRaw.invert = function(x, y) {
	  var p = y / 2;
	  for (var i = 0, delta = Infinity; i < 10 && abs(delta) > epsilon; ++i) {
	    var c = cos(y / 2);
	    y -= delta = (y - tan(y / 2) - p) / (1 - 0.5 / (c * c));
	  }
	  return [
	    2 * x / (1 + cos(y)),
	    y
	  ];
	};

	var nellHammer = function() {
	  return d3Geo.geoProjection(nellHammerRaw)
	      .scale(152.63);
	};

	// Based on Java implementation by Bojan Savric.
	// https://github.com/OSUCartography/JMapProjLib/blob/master/src/com/jhlabs/map/proj/PattersonProjection.java

	var pattersonK1 = 1.0148;
	var pattersonK2 = 0.23185;
	var pattersonK3 = -0.14499;
	var pattersonK4 = 0.02406;
	var pattersonC1 = pattersonK1;
	var pattersonC2 = 5 * pattersonK2;
	var pattersonC3 = 7 * pattersonK3;
	var pattersonC4 = 9 * pattersonK4;
	var pattersonYmax = 1.790857183;

	function pattersonRaw(lambda, phi) {
	  var phi2 = phi * phi;
	  return [
	    lambda,
	    phi * (pattersonK1 + phi2 * phi2 * (pattersonK2 + phi2 * (pattersonK3 + pattersonK4 * phi2)))
	  ];
	}

	pattersonRaw.invert = function(x, y) {
	  if (y > pattersonYmax) y = pattersonYmax;
	  else if (y < -pattersonYmax) y = -pattersonYmax;
	  var yc = y, delta;

	  do { // Newton-Raphson
	    var y2 = yc * yc;
	    yc -= delta = ((yc * (pattersonK1 + y2 * y2 * (pattersonK2 + y2 * (pattersonK3 + pattersonK4 * y2)))) - y) / (pattersonC1 + y2 * y2 * (pattersonC2 + y2 * (pattersonC3 + pattersonC4 * y2)));
	  } while (abs(delta) > epsilon);

	  return [x, yc];
	};

	var patterson = function() {
	  return d3Geo.geoProjection(pattersonRaw)
	      .scale(139.319);
	};

	function polyconicRaw(lambda, phi) {
	  if (abs(phi) < epsilon) return [lambda, 0];
	  var tanPhi = tan(phi),
	      k = lambda * sin(phi);
	  return [
	    sin(k) / tanPhi,
	    phi + (1 - cos(k)) / tanPhi
	  ];
	}

	polyconicRaw.invert = function(x, y) {
	  if (abs(y) < epsilon) return [x, 0];
	  var k = x * x + y * y,
	      phi = y * 0.5,
	      i = 10, delta;
	  do {
	    var tanPhi = tan(phi),
	        secPhi = 1 / cos(phi),
	        j = k - 2 * y * phi + phi * phi;
	    phi -= delta = (tanPhi * j + 2 * (phi - y)) / (2 + j * secPhi * secPhi + 2 * (phi - y) * tanPhi);
	  } while (abs(delta) > epsilon && --i > 0);
	  tanPhi = tan(phi);
	  return [
	    (abs(y) < abs(phi + 1 / tanPhi) ? asin(x * tanPhi) : sign(x) * (acos(abs(x * tanPhi)) + halfPi)) / sin(phi),
	    phi
	  ];
	};

	var polyconic = function() {
	  return d3Geo.geoProjection(polyconicRaw)
	      .scale(103.74);
	};

	// Note: 6-element arrays are used to denote the 3x3 affine transform matrix:
	// [a, b, c,
	//  d, e, f,
	//  0, 0, 1] - this redundant row is left out.

	// Transform matrix for [a0, a1] -> [b0, b1].
	var matrix = function(a, b) {
	  var u = subtract(a[1], a[0]),
	      v = subtract(b[1], b[0]),
	      phi = angle$1(u, v),
	      s = length(u) / length(v);

	  return multiply([
	    1, 0, a[0][0],
	    0, 1, a[0][1]
	  ], multiply([
	    s, 0, 0,
	    0, s, 0
	  ], multiply([
	    cos(phi), sin(phi), 0,
	    -sin(phi), cos(phi), 0
	  ], [
	    1, 0, -b[0][0],
	    0, 1, -b[0][1]
	  ])));
	};

	// Inverts a transform matrix.
	function inverse(m) {
	  var k = 1 / (m[0] * m[4] - m[1] * m[3]);
	  return [
	    k * m[4], -k * m[1], k * (m[1] * m[5] - m[2] * m[4]),
	    -k * m[3], k * m[0], k * (m[2] * m[3] - m[0] * m[5])
	  ];
	}

	// Multiplies two 3x2 matrices.
	function multiply(a, b) {
	  return [
	    a[0] * b[0] + a[1] * b[3],
	    a[0] * b[1] + a[1] * b[4],
	    a[0] * b[2] + a[1] * b[5] + a[2],
	    a[3] * b[0] + a[4] * b[3],
	    a[3] * b[1] + a[4] * b[4],
	    a[3] * b[2] + a[4] * b[5] + a[5]
	  ];
	}

	// Subtracts 2D vectors.
	function subtract(a, b) {
	  return [a[0] - b[0], a[1] - b[1]];
	}

	// Magnitude of a 2D vector.
	function length(v) {
	  return sqrt(v[0] * v[0] + v[1] * v[1]);
	}

	// Angle between two 2D vectors.
	function angle$1(a, b) {
	  return atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
	}

	// Creates a polyhedral projection.
	//  * root: a spanning tree of polygon faces.  Nodes are automatically
	//    augmented with a transform matrix.
	//  * face: a function that returns the appropriate node for a given {lambda, phi}
	//    point (radians).
	//  * r: rotation angle for final polyhedral net.  Defaults to -pi / 6 (for
	//    butterflies).
	var polyhedral = function(root, face, r) {

	  r = r == null ? -pi / 6 : r; // TODO automate

	  recurse(root, {transform: [
	    cos(r), sin(r), 0,
	    -sin(r), cos(r), 0
	  ]});

	  function recurse(node, parent) {
	    node.edges = faceEdges(node.face);
	    // Find shared edge.
	    if (parent.face) {
	      var shared = node.shared = sharedEdge(node.face, parent.face),
	          m = matrix(shared.map(parent.project), shared.map(node.project));
	      node.transform = parent.transform ? multiply(parent.transform, m) : m;
	      // Replace shared edge in parent edges array.
	      var edges = parent.edges;
	      for (var i = 0, n = edges.length; i < n; ++i) {
	        if (pointEqual$1(shared[0], edges[i][1]) && pointEqual$1(shared[1], edges[i][0])) edges[i] = node;
	        if (pointEqual$1(shared[0], edges[i][0]) && pointEqual$1(shared[1], edges[i][1])) edges[i] = node;
	      }
	      edges = node.edges;
	      for (i = 0, n = edges.length; i < n; ++i) {
	        if (pointEqual$1(shared[0], edges[i][0]) && pointEqual$1(shared[1], edges[i][1])) edges[i] = parent;
	        if (pointEqual$1(shared[0], edges[i][1]) && pointEqual$1(shared[1], edges[i][0])) edges[i] = parent;
	      }
	    } else {
	      node.transform = parent.transform;
	    }
	    if (node.children) {
	      node.children.forEach(function(child) {
	        recurse(child, node);
	      });
	    }
	    return node;
	  }

	  function forward(lambda, phi) {
	    var node = face(lambda, phi),
	        point = node.project([lambda * degrees, phi * degrees]),
	        t;
	    if (t = node.transform) {
	      return [
	        t[0] * point[0] + t[1] * point[1] + t[2],
	        -(t[3] * point[0] + t[4] * point[1] + t[5])
	      ];
	    }
	    point[1] = -point[1];
	    return point;
	  }

	  // Naive inverse!  A faster solution would use bounding boxes, or even a
	  // polygonal quadtree.
	  if (hasInverse(root)) forward.invert = function(x, y) {
	    var coordinates = faceInvert(root, [x, -y]);
	    return coordinates && (coordinates[0] *= radians, coordinates[1] *= radians, coordinates);
	  };

	  function faceInvert(node, coordinates) {
	    var invert = node.project.invert,
	        t = node.transform,
	        point = coordinates;
	    if (t) {
	      t = inverse(t);
	      point = [
	        t[0] * point[0] + t[1] * point[1] + t[2],
	        (t[3] * point[0] + t[4] * point[1] + t[5])
	      ];
	    }
	    if (invert && node === faceDegrees(p = invert(point))) return p;
	    var p,
	        children = node.children;
	    for (var i = 0, n = children && children.length; i < n; ++i) {
	      if (p = faceInvert(children[i], coordinates)) return p;
	    }
	  }

	  function faceDegrees(coordinates) {
	    return face(coordinates[0] * radians, coordinates[1] * radians);
	  }

	  var proj = d3Geo.geoProjection(forward),
	      stream_ = proj.stream;

	  proj.stream = function(stream) {
	    var rotate = proj.rotate(),
	        rotateStream = stream_(stream),
	        sphereStream = (proj.rotate([0, 0]), stream_(stream));
	    proj.rotate(rotate);
	    rotateStream.sphere = function() {
	      sphereStream.polygonStart();
	      sphereStream.lineStart();
	      outline(sphereStream, root);
	      sphereStream.lineEnd();
	      sphereStream.polygonEnd();
	    };
	    return rotateStream;
	  };

	  return proj;
	};

	function outline(stream, node, parent) {
	  var point,
	      edges = node.edges,
	      n = edges.length,
	      edge,
	      multiPoint = {type: "MultiPoint", coordinates: node.face},
	      notPoles = node.face.filter(function(d) { return abs(d[1]) !== 90; }),
	      b = d3Geo.geoBounds({type: "MultiPoint", coordinates: notPoles}),
	      inside = false,
	      j = -1,
	      dx = b[1][0] - b[0][0];
	  // TODO
	  var c = dx === 180 || dx === 360
	      ? [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]
	      : d3Geo.geoCentroid(multiPoint);
	  // First find the shared edge…
	  if (parent) while (++j < n) {
	    if (edges[j] === parent) break;
	  }
	  ++j;
	  for (var i = 0; i < n; ++i) {
	    edge = edges[(i + j) % n];
	    if (Array.isArray(edge)) {
	      if (!inside) {
	        stream.point((point = d3Geo.geoInterpolate(edge[0], c)(epsilon))[0], point[1]);
	        inside = true;
	      }
	      stream.point((point = d3Geo.geoInterpolate(edge[1], c)(epsilon))[0], point[1]);
	    } else {
	      inside = false;
	      if (edge !== parent) outline(stream, edge, node);
	    }
	  }
	}

	// Tests equality of two spherical points.
	function pointEqual$1(a, b) {
	  return a && b && a[0] === b[0] && a[1] === b[1];
	}

	// Finds a shared edge given two clockwise polygons.
	function sharedEdge(a, b) {
	  var x, y, n = a.length, found = null;
	  for (var i = 0; i < n; ++i) {
	    x = a[i];
	    for (var j = b.length; --j >= 0;) {
	      y = b[j];
	      if (x[0] === y[0] && x[1] === y[1]) {
	        if (found) return [found, x];
	        found = x;
	      }
	    }
	  }
	}

	// Converts an array of n face vertices to an array of n + 1 edges.
	function faceEdges(face) {
	  var n = face.length,
	      edges = [];
	  for (var a = face[n - 1], i = 0; i < n; ++i) edges.push([a, a = face[i]]);
	  return edges;
	}

	function hasInverse(node) {
	  return node.project.invert || node.children && node.children.some(hasInverse);
	}

	// TODO generate on-the-fly to avoid external modification.
	var octahedron = [
	  [0, 90],
	  [-90, 0], [0, 0], [90, 0], [180, 0],
	  [0, -90]
	];

	var octahedron$1 = [
	  [0, 2, 1],
	  [0, 3, 2],
	  [5, 1, 2],
	  [5, 2, 3],
	  [0, 1, 4],
	  [0, 4, 3],
	  [5, 4, 1],
	  [5, 3, 4]
	].map(function(face) {
	  return face.map(function(i) {
	    return octahedron[i];
	  });
	});

	var butterfly = function(faceProjection) {

	  faceProjection = faceProjection || function(face) {
	    var c = d3Geo.geoCentroid({type: "MultiPoint", coordinates: face});
	    return d3Geo.geoGnomonic().scale(1).translate([0, 0]).rotate([-c[0], -c[1]]);
	  };

	  var faces = octahedron$1.map(function(face) {
	    return {face: face, project: faceProjection(face)};
	  });

	  [-1, 0, 0, 1, 0, 1, 4, 5].forEach(function(d, i) {
	    var node = faces[d];
	    node && (node.children || (node.children = [])).push(faces[i]);
	  });

	  return polyhedral(faces[0], function(lambda, phi) {
	        return faces[lambda < -pi / 2 ? phi < 0 ? 6 : 4
	            : lambda < 0 ? phi < 0 ? 2 : 0
	            : lambda < pi / 2 ? phi < 0 ? 3 : 1
	            : phi < 0 ? 7 : 5];
	      })
	      .scale(101.858)
	      .center([0, 45]);
	};

	var kx = 2 / sqrt(3);

	function collignonK(a, b) {
	  var p = collignonRaw(a, b);
	  return [p[0] * kx, p[1]];
	}

	collignonK.invert = function(x,y) {
	  return collignonRaw.invert(x / kx, y);
	};

	var collignon$1 = function(faceProjection) {

	  faceProjection = faceProjection || function(face) {
	    var c = d3Geo.geoCentroid({type: "MultiPoint", coordinates: face});
	    return d3Geo.geoProjection(collignonK).translate([0, 0]).scale(1).rotate(c[1] > 0 ? [-c[0], 0] : [180 - c[0], 180]);
	  };

	  var faces = octahedron$1.map(function(face) {
	    return {face: face, project: faceProjection(face)};
	  });

	  [-1, 0, 0, 1, 0, 1, 4, 5].forEach(function(d, i) {
	    var node = faces[d];
	    node && (node.children || (node.children = [])).push(faces[i]);
	  });

	  return polyhedral(faces[0], function(lambda, phi) {
	        return faces[lambda < -pi / 2 ? phi < 0 ? 6 : 4
	            : lambda < 0 ? phi < 0 ? 2 : 0
	            : lambda < pi / 2 ? phi < 0 ? 3 : 1
	            : phi < 0 ? 7 : 5];
	      })
	      .scale(121.906)
	      .center([0, 48.5904]);
	};

	var waterman = function(faceProjection) {

	  faceProjection = faceProjection || function(face) {
	    var c = face.length === 6 ? d3Geo.geoCentroid({type: "MultiPoint", coordinates: face}) : face[0];
	    return d3Geo.geoGnomonic().scale(1).translate([0, 0]).rotate([-c[0], -c[1]]);
	  };

	  var w5 = octahedron$1.map(function(face) {
	    var xyz = face.map(cartesian),
	        n = xyz.length,
	        a = xyz[n - 1],
	        b,
	        hexagon = [];
	    for (var i = 0; i < n; ++i) {
	      b = xyz[i];
	      hexagon.push(spherical([
	        a[0] * 0.9486832980505138 + b[0] * 0.31622776601683794,
	        a[1] * 0.9486832980505138 + b[1] * 0.31622776601683794,
	        a[2] * 0.9486832980505138 + b[2] * 0.31622776601683794
	      ]), spherical([
	        b[0] * 0.9486832980505138 + a[0] * 0.31622776601683794,
	        b[1] * 0.9486832980505138 + a[1] * 0.31622776601683794,
	        b[2] * 0.9486832980505138 + a[2] * 0.31622776601683794
	      ]));
	      a = b;
	    }
	    return hexagon;
	  });

	  var cornerNormals = [];

	  var parents = [-1, 0, 0, 1, 0, 1, 4, 5];

	  w5.forEach(function(hexagon, j) {
	    var face = octahedron$1[j],
	        n = face.length,
	        normals = cornerNormals[j] = [];
	    for (var i = 0; i < n; ++i) {
	      w5.push([
	        face[i],
	        hexagon[(i * 2 + 2) % (2 * n)],
	        hexagon[(i * 2 + 1) % (2 * n)]
	      ]);
	      parents.push(j);
	      normals.push(cross(
	        cartesian(hexagon[(i * 2 + 2) % (2 * n)]),
	        cartesian(hexagon[(i * 2 + 1) % (2 * n)])
	      ));
	    }
	  });

	  var faces = w5.map(function(face) {
	    return {
	      project: faceProjection(face),
	      face: face
	    };
	  });

	  parents.forEach(function(d, i) {
	    var parent = faces[d];
	    parent && (parent.children || (parent.children = [])).push(faces[i]);
	  });

	  function face(lambda, phi) {
	    var cosphi = cos(phi),
	        p = [cosphi * cos(lambda), cosphi * sin(lambda), sin(phi)];

	    var hexagon = lambda < -pi / 2 ? phi < 0 ? 6 : 4
	        : lambda < 0 ? phi < 0 ? 2 : 0
	        : lambda < pi / 2 ? phi < 0 ? 3 : 1
	        : phi < 0 ? 7 : 5;

	    var n = cornerNormals[hexagon];

	    return faces[dot(n[0], p) < 0 ? 8 + 3 * hexagon
	        : dot(n[1], p) < 0 ? 8 + 3 * hexagon + 1
	        : dot(n[2], p) < 0 ? 8 + 3 * hexagon + 2
	        : hexagon];
	  }

	  return polyhedral(faces[0], face)
	      .scale(110.625)
	      .center([0,45]);
	};

	function dot(a, b) {
	  for (var i = 0, n = a.length, s = 0; i < n; ++i) s += a[i] * b[i];
	  return s;
	}

	function cross(a, b) {
	  return [
	    a[1] * b[2] - a[2] * b[1],
	    a[2] * b[0] - a[0] * b[2],
	    a[0] * b[1] - a[1] * b[0]
	  ];
	}

	// Converts 3D Cartesian to spherical coordinates (degrees).
	function spherical(cartesian) {
	  return [
	    atan2(cartesian[1], cartesian[0]) * degrees,
	    asin(max(-1, min(1, cartesian[2]))) * degrees
	  ];
	}

	// Converts spherical coordinates (degrees) to 3D Cartesian.
	function cartesian(coordinates) {
	  var lambda = coordinates[0] * radians,
	      phi = coordinates[1] * radians,
	      cosphi = cos(phi);
	  return [
	    cosphi * cos(lambda),
	    cosphi * sin(lambda),
	    sin(phi)
	  ];
	}

	var noop = function() {};

	var clockwise = function(ring) {
	  if ((n = ring.length) < 4) return false;
	  var i = 0,
	      n,
	      area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
	  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
	  return area <= 0;
	};

	var contains = function(ring, point) {
	  var x = point[0],
	      y = point[1],
	      contains = false;
	  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
	    var pi = ring[i], xi = pi[0], yi = pi[1],
	        pj = ring[j], xj = pj[0], yj = pj[1];
	    if (((yi > y) ^ (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) contains = !contains;
	  }
	  return contains;
	};

	var index = function(object, projection) {
	  var stream = projection.stream, project;
	  if (!stream) throw new Error("invalid projection");
	  switch (object && object.type) {
	    case "Feature": project = projectFeature; break;
	    case "FeatureCollection": project = projectFeatureCollection; break;
	    default: project = projectGeometry; break;
	  }
	  return project(object, stream);
	};

	function projectFeatureCollection(o, stream) {
	  return {
	    type: "FeatureCollection",
	    features: o.features.map(function(f) {
	      return projectFeature(f, stream);
	    })
	  };
	}

	function projectFeature(o, stream) {
	  return {
	    type: "Feature",
	    id: o.id,
	    properties: o.properties,
	    geometry: projectGeometry(o.geometry, stream)
	  };
	}

	function projectGeometryCollection(o, stream) {
	  return {
	    type: "GeometryCollection",
	    geometries: o.geometries.map(function(o) {
	      return projectGeometry(o, stream);
	    })
	  };
	}

	function projectGeometry(o, stream) {
	  if (!o) return null;
	  if (o.type === "GeometryCollection") return projectGeometryCollection(o, stream);
	  var sink;
	  switch (o.type) {
	    case "Point": sink = sinkPoint; break;
	    case "MultiPoint": sink = sinkPoint; break;
	    case "LineString": sink = sinkLine; break;
	    case "MultiLineString": sink = sinkLine; break;
	    case "Polygon": sink = sinkPolygon; break;
	    case "MultiPolygon": sink = sinkPolygon; break;
	    case "Sphere": sink = sinkPolygon; break;
	    default: return null;
	  }
	  d3Geo.geoStream(o, stream(sink));
	  return sink.result();
	}

	var points = [];
	var lines = [];

	var sinkPoint = {
	  point: function(x, y) {
	    points.push([x, y]);
	  },
	  result: function() {
	    var result = !points.length ? null
	        : points.length < 2 ? {type: "Point", coordinates: points[0]}
	        : {type: "MultiPoint", coordinates: points};
	    points = [];
	    return result;
	  }
	};

	var sinkLine = {
	  lineStart: noop,
	  point: function(x, y) {
	    points.push([x, y]);
	  },
	  lineEnd: function() {
	    if (points.length) lines.push(points), points = [];
	  },
	  result: function() {
	    var result = !lines.length ? null
	        : lines.length < 2 ? {type: "LineString", coordinates: lines[0]}
	        : {type: "MultiLineString", coordinates: lines};
	    lines = [];
	    return result;
	  }
	};

	var sinkPolygon = {
	  polygonStart: noop,
	  lineStart: noop,
	  point: function(x, y) {
	    points.push([x, y]);
	  },
	  lineEnd: function() {
	    var n = points.length;
	    if (n) {
	      do points.push(points[0].slice()); while (++n < 4);
	      lines.push(points), points = [];
	    }
	  },
	  polygonEnd: noop,
	  result: function() {
	    if (!lines.length) return null;
	    var polygons = [],
	        holes = [];

	    // https://github.com/d3/d3/issues/1558
	    lines.forEach(function(ring) {
	      if (clockwise(ring)) polygons.push([ring]);
	      else holes.push(ring);
	    });

	    holes.forEach(function(hole) {
	      var point = hole[0];
	      polygons.some(function(polygon) {
	        if (contains(polygon[0], point)) {
	          polygon.push(hole);
	          return true;
	        }
	      }) || polygons.push([hole]);
	    });

	    lines = [];

	    return !polygons.length ? null
	        : polygons.length > 1 ? {type: "MultiPolygon", coordinates: polygons}
	        : {type: "Polygon", coordinates: polygons[0]};
	  }
	};

	var quincuncial = function(project) {
	  var dx = project(halfPi, 0)[0] - project(-halfPi, 0)[0];

	  function projectQuincuncial(lambda, phi) {
	    var t = abs(lambda) < halfPi,
	        p = project(t ? lambda : lambda > 0 ? lambda - pi : lambda + pi, phi),
	        x = (p[0] - p[1]) * sqrt1_2,
	        y = (p[0] + p[1]) * sqrt1_2;
	    if (t) return [x, y];
	    var d = dx * sqrt1_2,
	        s = x > 0 ^ y > 0 ? -1 : 1;
	    return [s * x - sign(y) * d, s * y - sign(x) * d];
	  }

	  if (project.invert) projectQuincuncial.invert = function(x0, y0) {
	    var x = (x0 + y0) * sqrt1_2,
	        y = (y0 - x0) * sqrt1_2,
	        t = abs(x) < 0.5 * dx && abs(y) < 0.5 * dx;

	    if (!t) {
	      var d = dx * sqrt1_2,
	          s = x > 0 ^ y > 0 ? -1 : 1,
	          x1 = -s * x0 + (y > 0 ? 1 : -1) * d,
	          y1 = -s * y0 + (x > 0 ? 1 : -1) * d;
	      x = (-x1 - y1) * sqrt1_2;
	      y = (x1 - y1) * sqrt1_2;
	    }

	    var p = project.invert(x, y);
	    if (!t) p[0] += x > 0 ? pi : -pi;
	    return p;
	  };

	  return d3Geo.geoProjection(projectQuincuncial)
	      .rotate([-90, -90, 45])
	      .clipAngle(180 - 1e-3);
	};

	var gringorten$1 = function() {
	  return quincuncial(gringortenRaw)
	      .scale(176.423);
	};

	var peirce = function() {
	  return quincuncial(guyouRaw)
	      .scale(111.48);
	};

	var quantize = function(input, digits) {
	  if (!(0 <= (digits = +digits) && digits <= 20)) throw new Error("invalid digits");

	  function quantizePoint(input) {
	    var n = input.length, i = 2, output = new Array(n);
	    output[0] = +input[0].toFixed(digits);
	    output[1] = +input[1].toFixed(digits);
	    while (i < n) output[i] = input[i], ++i;
	    return output;
	  }

	  function quantizePoints(input) {
	    return input.map(quantizePoint);
	  }

	  function quantizePolygon(input) {
	    return input.map(quantizePoints);
	  }

	  function quantizeGeometry(input) {
	    if (input == null) return input;
	    var output;
	    switch (input.type) {
	      case "GeometryCollection": output = {type: "GeometryCollection", geometries: input.geometries.map(quantizeGeometry)}; break;
	      case "Point": output = {type: "Point", coordinates: quantizePoint(input.coordinates)}; break;
	      case "MultiPoint": case "LineString": output = {type: input.type, coordinates: quantizePoints(input.coordinates)}; break;
	      case "MultiLineString": case "Polygon": output = {type: input.type, coordinates: quantizePolygon(input.coordinates)}; break;
	      case "MultiPolygon": output = {type: "MultiPolygon", coordinates: input.coordinates.map(quantizePolygon)}; break;
	      default: return input;
	    }
	    if (input.bbox != null) output.bbox = input.bbox;
	    return output;
	  }

	  function quantizeFeature(input) {
	    var output = {type: "Feature", properties: input.properties, geometry: quantizeGeometry(input.geometry)};
	    if (input.id != null) output.id = input.id;
	    if (input.bbox != null) output.bbox = input.bbox;
	    return output;
	  }

	  if (input != null) switch (input.type) {
	    case "Feature": return quantizeFeature(input);
	    case "FeatureCollection": {
	      var output = {type: "FeatureCollection", features: input.features.map(quantizeFeature)};
	      if (input.bbox != null) output.bbox = input.bbox;
	      return output;
	    }
	    default: return quantizeGeometry(input);
	  }

	  return input;
	};

	function rectangularPolyconicRaw(phi0) {
	  var sinPhi0 = sin(phi0);

	  function forward(lambda, phi) {
	    var A = sinPhi0 ? tan(lambda * sinPhi0 / 2) / sinPhi0 : lambda / 2;
	    if (!phi) return [2 * A, -phi0];
	    var E = 2 * atan(A * sin(phi)),
	        cotPhi = 1 / tan(phi);
	    return [
	      sin(E) * cotPhi,
	      phi + (1 - cos(E)) * cotPhi - phi0
	    ];
	  }

	  // TODO return null for points outside outline.
	  forward.invert = function(x, y) {
	    if (abs(y += phi0) < epsilon) return [sinPhi0 ? 2 * atan(sinPhi0 * x / 2) / sinPhi0 : x, 0];
	    var k = x * x + y * y,
	        phi = 0,
	        i = 10, delta;
	    do {
	      var tanPhi = tan(phi),
	          secPhi = 1 / cos(phi),
	          j = k - 2 * y * phi + phi * phi;
	      phi -= delta = (tanPhi * j + 2 * (phi - y)) / (2 + j * secPhi * secPhi + 2 * (phi - y) * tanPhi);
	    } while (abs(delta) > epsilon && --i > 0);
	    var E = x * (tanPhi = tan(phi)),
	        A = tan(abs(y) < abs(phi + 1 / tanPhi) ? asin(E) * 0.5 : acos(E) * 0.5 + pi / 4) / sin(phi);
	    return [
	      sinPhi0 ? 2 * atan(sinPhi0 * A) / sinPhi0 : 2 * A,
	      phi
	    ];
	  };

	  return forward;
	}

	var rectangularPolyconic = function() {
	  return parallel1(rectangularPolyconicRaw)
	      .scale(131.215);
	};

	var K = [
	  [0.9986, -0.062],
	  [1.0000, 0.0000],
	  [0.9986, 0.0620],
	  [0.9954, 0.1240],
	  [0.9900, 0.1860],
	  [0.9822, 0.2480],
	  [0.9730, 0.3100],
	  [0.9600, 0.3720],
	  [0.9427, 0.4340],
	  [0.9216, 0.4958],
	  [0.8962, 0.5571],
	  [0.8679, 0.6176],
	  [0.8350, 0.6769],
	  [0.7986, 0.7346],
	  [0.7597, 0.7903],
	  [0.7186, 0.8435],
	  [0.6732, 0.8936],
	  [0.6213, 0.9394],
	  [0.5722, 0.9761],
	  [0.5322, 1.0000]
	];

	K.forEach(function(d) {
	  d[1] *= 1.0144;
	});

	function robinsonRaw(lambda, phi) {
	  var i = min(18, abs(phi) * 36 / pi),
	      i0 = floor(i),
	      di = i - i0,
	      ax = (k = K[i0])[0],
	      ay = k[1],
	      bx = (k = K[++i0])[0],
	      by = k[1],
	      cx = (k = K[min(19, ++i0)])[0],
	      cy = k[1],
	      k;
	  return [
	    lambda * (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2),
	    (phi > 0 ? halfPi : -halfPi) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2)
	  ];
	}

	robinsonRaw.invert = function(x, y) {
	  var yy = y / halfPi,
	      phi = yy * 90,
	      i = min(18, abs(phi / 5)),
	      i0 = max(0, floor(i));
	  do {
	    var ay = K[i0][1],
	        by = K[i0 + 1][1],
	        cy = K[min(19, i0 + 2)][1],
	        u = cy - ay,
	        v = cy - 2 * by + ay,
	        t = 2 * (abs(yy) - by) / u,
	        c = v / u,
	        di = t * (1 - c * t * (1 - 2 * c * t));
	    if (di >= 0 || i0 === 1) {
	      phi = (y >= 0 ? 5 : -5) * (di + i);
	      var j = 50, delta;
	      do {
	        i = min(18, abs(phi) / 5);
	        i0 = floor(i);
	        di = i - i0;
	        ay = K[i0][1];
	        by = K[i0 + 1][1];
	        cy = K[min(19, i0 + 2)][1];
	        phi -= (delta = (y >= 0 ? halfPi : -halfPi) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2) - y) * degrees;
	      } while (abs(delta) > epsilon2 && --j > 0);
	      break;
	    }
	  } while (--i0 >= 0);
	  var ax = K[i0][0],
	      bx = K[i0 + 1][0],
	      cx = K[min(19, i0 + 2)][0];
	  return [
	    x / (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2),
	    phi * radians
	  ];
	};

	var robinson = function() {
	  return d3Geo.geoProjection(robinsonRaw)
	      .scale(152.63);
	};

	function satelliteVerticalRaw(P) {
	  function forward(lambda, phi) {
	    var cosPhi = cos(phi),
	        k = (P - 1) / (P - cosPhi * cos(lambda));
	    return [
	      k * cosPhi * sin(lambda),
	      k * sin(phi)
	    ];
	  }

	  forward.invert = function(x, y) {
	    var rho2 = x * x + y * y,
	        rho = sqrt(rho2),
	        sinc = (P - sqrt(1 - rho2 * (P + 1) / (P - 1))) / ((P - 1) / rho + rho / (P - 1));
	    return [
	      atan2(x * sinc, rho * sqrt(1 - sinc * sinc)),
	      rho ? asin(y * sinc / rho) : 0
	    ];
	  };

	  return forward;
	}

	function satelliteRaw(P, omega) {
	  var vertical = satelliteVerticalRaw(P);
	  if (!omega) return vertical;
	  var cosOmega = cos(omega),
	      sinOmega = sin(omega);

	  function forward(lambda, phi) {
	    var coordinates = vertical(lambda, phi),
	        y = coordinates[1],
	        A = y * sinOmega / (P - 1) + cosOmega;
	    return [
	      coordinates[0] * cosOmega / A,
	      y / A
	    ];
	  }

	  forward.invert = function(x, y) {
	    var k = (P - 1) / (P - 1 - y * sinOmega);
	    return vertical.invert(k * x, k * y * cosOmega);
	  };

	  return forward;
	}

	var satellite = function() {
	  var distance = 2,
	      omega = 0,
	      m = d3Geo.geoProjectionMutator(satelliteRaw),
	      p = m(distance, omega);

	  // As a multiple of radius.
	  p.distance = function(_) {
	    if (!arguments.length) return distance;
	    return m(distance = +_, omega);
	  };

	  p.tilt = function(_) {
	    if (!arguments.length) return omega * degrees;
	    return m(distance, omega = _ * radians);
	  };

	  return p
	      .scale(432.147)
	      .clipAngle(acos(1 / distance) * degrees - 1e-6);
	};

	var epsilon$1 = 1e-4;
	var epsilonInverse = 1e4;
	var x0 = -180;
	var x0e = x0 + epsilon$1;
	var x1 = 180;
	var x1e = x1 - epsilon$1;
	var y0 = -90;
	var y0e = y0 + epsilon$1;
	var y1 = 90;
	var y1e = y1 - epsilon$1;

	function nonempty(coordinates) {
	  return coordinates.length > 0;
	}

	function quantize$1(x) {
	  return Math.floor(x * epsilonInverse) / epsilonInverse;
	}

	function normalizePoint(y) {
	  return y === y0 || y === y1 ? [0, y] : [x0, quantize$1(y)]; // pole or antimeridian?
	}

	function clampPoint(p) {
	  var x = p[0], y = p[1], clamped = false;
	  if (x <= x0e) x = x0, clamped = true;
	  else if (x >= x1e) x = x1, clamped = true;
	  if (y <= y0e) y = y0, clamped = true;
	  else if (y >= y1e) y = y1, clamped = true;
	  return clamped ? [x, y] : p;
	}

	function clampPoints(points) {
	  return points.map(clampPoint);
	}

	// For each ring, detect where it crosses the antimeridian or pole.
	function extractFragments(rings, polygon, fragments) {
	  for (var j = 0, m = rings.length; j < m; ++j) {
	    var ring = rings[j].slice();

	    // By default, assume that this ring doesn’t need any stitching.
	    fragments.push({index: -1, polygon: polygon, ring: ring});

	    for (var i = 0, n = ring.length; i < n; ++i) {
	      var point = ring[i],
	          x = point[0],
	          y = point[1];

	      // If this is an antimeridian or polar point…
	      if (x <= x0e || x >= x1e || y <= y0e || y >= y1e) {
	        ring[i] = clampPoint(point);

	        // Advance through any antimeridian or polar points…
	        for (var k = i + 1; k < n; ++k) {
	          var pointk = ring[k],
	              xk = pointk[0],
	              yk = pointk[1];
	          if (xk > x0e && xk < x1e && yk > y0e && yk < y1e) break;
	        }

	        // If this was just a single antimeridian or polar point,
	        // we don’t need to cut this ring into a fragment;
	        // we can just leave it as-is.
	        if (k === i + 1) continue;

	        // Otherwise, if this is not the first point in the ring,
	        // cut the current fragment so that it ends at the current point.
	        // The current point is also normalized for later joining.
	        if (i) {
	          var fragmentBefore = {index: -1, polygon: polygon, ring: ring.slice(0, i + 1)};
	          fragmentBefore.ring[fragmentBefore.ring.length - 1] = normalizePoint(y);
	          fragments[fragments.length - 1] = fragmentBefore;
	        }

	        // If the ring started with an antimeridian fragment,
	        // we can ignore that fragment entirely.
	        else fragments.pop();

	        // If the remainder of the ring is an antimeridian fragment,
	        // move on to the next ring.
	        if (k >= n) break;

	        // Otherwise, add the remaining ring fragment and continue.
	        fragments.push({index: -1, polygon: polygon, ring: ring = ring.slice(k - 1)});
	        ring[0] = normalizePoint(ring[0][1]);
	        i = -1;
	        n = ring.length;
	      }
	    }
	  }
	}

	// Now stitch the fragments back together into rings.
	function stitchFragments(fragments) {
	  var i, n = fragments.length;

	  // To connect the fragments start-to-end, create a simple index by end.
	  var fragmentByStart = {},
	      fragmentByEnd = {},
	      fragment,
	      start,
	      startFragment,
	      end,
	      endFragment;

	  // For each fragment…
	  for (i = 0; i < n; ++i) {
	    fragment = fragments[i];
	    start = fragment.ring[0];
	    end = fragment.ring[fragment.ring.length - 1];

	    // If this fragment is closed, add it as a standalone ring.
	    if (start[0] === end[0] && start[1] === end[1]) {
	      fragment.polygon.push(fragment.ring);
	      fragments[i] = null;
	      continue;
	    }

	    fragment.index = i;
	    fragmentByStart[start] = fragmentByEnd[end] = fragment;
	  }

	  // For each open fragment…
	  for (i = 0; i < n; ++i) {
	    fragment = fragments[i];
	    if (fragment) {
	      start = fragment.ring[0];
	      end = fragment.ring[fragment.ring.length - 1];
	      startFragment = fragmentByEnd[start];
	      endFragment = fragmentByStart[end];

	      delete fragmentByStart[start];
	      delete fragmentByEnd[end];

	      // If this fragment is closed, add it as a standalone ring.
	      if (start[0] === end[0] && start[1] === end[1]) {
	        fragment.polygon.push(fragment.ring);
	        continue;
	      }

	      if (startFragment) {
	        delete fragmentByEnd[start];
	        delete fragmentByStart[startFragment.ring[0]];
	        startFragment.ring.pop(); // drop the shared coordinate
	        fragments[startFragment.index] = null;
	        fragment = {index: -1, polygon: startFragment.polygon, ring: startFragment.ring.concat(fragment.ring)};

	        if (startFragment === endFragment) {
	          // Connect both ends to this single fragment to create a ring.
	          fragment.polygon.push(fragment.ring);
	        } else {
	          fragment.index = n++;
	          fragments.push(fragmentByStart[fragment.ring[0]] = fragmentByEnd[fragment.ring[fragment.ring.length - 1]] = fragment);
	        }
	      } else if (endFragment) {
	        delete fragmentByStart[end];
	        delete fragmentByEnd[endFragment.ring[endFragment.ring.length - 1]];
	        fragment.ring.pop(); // drop the shared coordinate
	        fragment = {index: n++, polygon: endFragment.polygon, ring: fragment.ring.concat(endFragment.ring)};
	        fragments[endFragment.index] = null;
	        fragments.push(fragmentByStart[fragment.ring[0]] = fragmentByEnd[fragment.ring[fragment.ring.length - 1]] = fragment);
	      } else {
	        fragment.ring.push(fragment.ring[0]); // close ring
	        fragment.polygon.push(fragment.ring);
	      }
	    }
	  }
	}

	function stitchFeature(input) {
	  var output = {type: "Feature", geometry: stitchGeometry(input.geometry)};
	  if (input.id != null) output.id = input.id;
	  if (input.bbox != null) output.bbox = input.bbox;
	  if (input.properties != null) output.properties = input.properties;
	  return output;
	}

	function stitchGeometry(input) {
	  if (input == null) return input;
	  var output, fragments, i, n;
	  switch (input.type) {
	    case "GeometryCollection": output = {type: "GeometryCollection", geometries: input.geometries.map(stitchGeometry)}; break;
	    case "Point": output = {type: "Point", coordinates: clampPoint(input.coordinates)}; break;
	    case "MultiPoint": case "LineString": output = {type: input.type, coordinates: clampPoints(input.coordinates)}; break;
	    case "MultiLineString": output = {type: "MultiLineString", coordinates: input.coordinates.map(clampPoints)}; break;
	    case "Polygon": {
	      var polygon = [];
	      extractFragments(input.coordinates, polygon, fragments = []);
	      stitchFragments(fragments);
	      output = {type: "Polygon", coordinates: polygon};
	      break;
	    }
	    case "MultiPolygon": {
	      fragments = [], i = -1, n = input.coordinates.length;
	      var polygons = new Array(n);
	      while (++i < n) extractFragments(input.coordinates[i], polygons[i] = [], fragments);
	      stitchFragments(fragments);
	      output = {type: "MultiPolygon", coordinates: polygons.filter(nonempty)};
	      break;
	    }
	    default: return input;
	  }
	  if (input.bbox != null) output.bbox = input.bbox;
	  return output;
	}

	var stitch = function(input) {
	  if (input == null) return input;
	  switch (input.type) {
	    case "Feature": return stitchFeature(input);
	    case "FeatureCollection": {
	      var output = {type: "FeatureCollection", features: input.features.map(stitchFeature)};
	      if (input.bbox != null) output.bbox = input.bbox;
	      return output;
	    }
	    default: return stitchGeometry(input);
	  }
	};

	function timesRaw(lambda, phi) {
	  var t = tan(phi / 2),
	      s = sin(quarterPi * t);
	  return [
	    lambda * (0.74482 - 0.34588 * s * s),
	    1.70711 * t
	  ];
	}

	timesRaw.invert = function(x, y) {
	  var t = y / 1.70711,
	      s = sin(quarterPi * t);
	  return [
	    x / (0.74482 - 0.34588 * s * s),
	    2 * atan(t)
	  ];
	};

	var times = function() {
	  return d3Geo.geoProjection(timesRaw)
	      .scale(146.153);
	};

	// Compute the origin as the midpoint of the two reference points.
	// Rotate one of the reference points by the origin.
	// Apply the spherical law of sines to compute gamma rotation.
	var twoPoint = function(raw, p0, p1) {
	  var i = d3Geo.geoInterpolate(p0, p1),
	      o = i(0.5),
	      a = d3Geo.geoRotation([-o[0], -o[1]])(p0),
	      b = i.distance / 2,
	      y = -asin(sin(a[1] * radians) / sin(b)),
	      R = [-o[0], -o[1], -(a[0] > 0 ? pi - y : y) * degrees],
	      p = d3Geo.geoProjection(raw(b)).rotate(R),
	      r = d3Geo.geoRotation(R),
	      center = p.center;

	  delete p.rotate;

	  p.center = function(_) {
	    return arguments.length ? center(r(_)) : r.invert(center());
	  };

	  return p
	      .clipAngle(90);
	};

	function twoPointAzimuthalRaw(d) {
	  var cosd = cos(d);

	  function forward(lambda, phi) {
	    var coordinates = d3Geo.geoGnomonicRaw(lambda, phi);
	    coordinates[0] *= cosd;
	    return coordinates;
	  }

	  forward.invert = function(x, y) {
	    return d3Geo.geoGnomonicRaw.invert(x / cosd, y);
	  };

	  return forward;
	}

	function twoPointAzimuthalUsa() {
	  return twoPointAzimuthal([-158, 21.5], [-77, 39])
	      .clipAngle(60)
	      .scale(400);
	}

	function twoPointAzimuthal(p0, p1) {
	  return twoPoint(twoPointAzimuthalRaw, p0, p1);
	}

	// TODO clip to ellipse
	function twoPointEquidistantRaw(z0) {
	  if (!(z0 *= 2)) return d3Geo.geoAzimuthalEquidistantRaw;
	  var lambdaa = -z0 / 2,
	      lambdab = -lambdaa,
	      z02 = z0 * z0,
	      tanLambda0 = tan(lambdab),
	      S = 0.5 / sin(lambdab);

	  function forward(lambda, phi) {
	    var za = acos(cos(phi) * cos(lambda - lambdaa)),
	        zb = acos(cos(phi) * cos(lambda - lambdab)),
	        ys = phi < 0 ? -1 : 1;
	    za *= za, zb *= zb;
	    return [
	      (za - zb) / (2 * z0),
	      ys * sqrt(4 * z02 * zb - (z02 - za + zb) * (z02 - za + zb)) / (2 * z0)
	    ];
	  }

	  forward.invert = function(x, y) {
	    var y2 = y * y,
	        cosza = cos(sqrt(y2 + (t = x + lambdaa) * t)),
	        coszb = cos(sqrt(y2 + (t = x + lambdab) * t)),
	        t,
	        d;
	    return [
	      atan2(d = cosza - coszb, t = (cosza + coszb) * tanLambda0),
	      (y < 0 ? -1 : 1) * acos(sqrt(t * t + d * d) * S)
	    ];
	  };

	  return forward;
	}

	function twoPointEquidistantUsa() {
	  return twoPointEquidistant([-158, 21.5], [-77, 39])
	      .clipAngle(130)
	      .scale(122.571);
	}

	function twoPointEquidistant(p0, p1) {
	  return twoPoint(twoPointEquidistantRaw, p0, p1);
	}

	function vanDerGrintenRaw(lambda, phi) {
	  if (abs(phi) < epsilon) return [lambda, 0];
	  var sinTheta = abs(phi / halfPi),
	      theta = asin(sinTheta);
	  if (abs(lambda) < epsilon || abs(abs(phi) - halfPi) < epsilon) return [0, sign(phi) * pi * tan(theta / 2)];
	  var cosTheta = cos(theta),
	      A = abs(pi / lambda - lambda / pi) / 2,
	      A2 = A * A,
	      G = cosTheta / (sinTheta + cosTheta - 1),
	      P = G * (2 / sinTheta - 1),
	      P2 = P * P,
	      P2_A2 = P2 + A2,
	      G_P2 = G - P2,
	      Q = A2 + G;
	  return [
	    sign(lambda) * pi * (A * G_P2 + sqrt(A2 * G_P2 * G_P2 - P2_A2 * (G * G - P2))) / P2_A2,
	    sign(phi) * pi * (P * Q - A * sqrt((A2 + 1) * P2_A2 - Q * Q)) / P2_A2
	  ];
	}

	vanDerGrintenRaw.invert = function(x, y) {
	  if (abs(y) < epsilon) return [x, 0];
	  if (abs(x) < epsilon) return [0, halfPi * sin(2 * atan(y / pi))];
	  var x2 = (x /= pi) * x,
	      y2 = (y /= pi) * y,
	      x2_y2 = x2 + y2,
	      z = x2_y2 * x2_y2,
	      c1 = -abs(y) * (1 + x2_y2),
	      c2 = c1 - 2 * y2 + x2,
	      c3 = -2 * c1 + 1 + 2 * y2 + z,
	      d = y2 / c3 + (2 * c2 * c2 * c2 / (c3 * c3 * c3) - 9 * c1 * c2 / (c3 * c3)) / 27,
	      a1 = (c1 - c2 * c2 / (3 * c3)) / c3,
	      m1 = 2 * sqrt(-a1 / 3),
	      theta1 = acos(3 * d / (a1 * m1)) / 3;
	  return [
	    pi * (x2_y2 - 1 + sqrt(1 + 2 * (x2 - y2) + z)) / (2 * x),
	    sign(y) * pi * (-m1 * cos(theta1 + pi / 3) - c2 / (3 * c3))
	  ];
	};

	var vanDerGrinten = function() {
	  return d3Geo.geoProjection(vanDerGrintenRaw)
	      .scale(79.4183);
	};

	function vanDerGrinten2Raw(lambda, phi) {
	  if (abs(phi) < epsilon) return [lambda, 0];
	  var sinTheta = abs(phi / halfPi),
	      theta = asin(sinTheta);
	  if (abs(lambda) < epsilon || abs(abs(phi) - halfPi) < epsilon) return [0, sign(phi) * pi * tan(theta / 2)];
	  var cosTheta = cos(theta),
	      A = abs(pi / lambda - lambda / pi) / 2,
	      A2 = A * A,
	      x1 = cosTheta * (sqrt(1 + A2) - A * cosTheta) / (1 + A2 * sinTheta * sinTheta);
	  return [
	    sign(lambda) * pi * x1,
	    sign(phi) * pi * sqrt(1 - x1 * (2 * A + x1))
	  ];
	}

	vanDerGrinten2Raw.invert = function(x, y) {
	  if (!x) return [0, halfPi * sin(2 * atan(y / pi))];
	  var x1 = abs(x / pi),
	      A = (1 - x1 * x1 - (y /= pi) * y) / (2 * x1),
	      A2 = A * A,
	      B = sqrt(A2 + 1);
	  return [
	    sign(x) * pi * (B - A),
	    sign(y) * halfPi * sin(2 * atan2(sqrt((1 - 2 * A * x1) * (A + B) - x1), sqrt(B + A + x1)))
	  ];
	};

	var vanDerGrinten2 = function() {
	  return d3Geo.geoProjection(vanDerGrinten2Raw)
	      .scale(79.4183);
	};

	function vanDerGrinten3Raw(lambda, phi) {
	  if (abs(phi) < epsilon) return [lambda, 0];
	  var sinTheta = phi / halfPi,
	      theta = asin(sinTheta);
	  if (abs(lambda) < epsilon || abs(abs(phi) - halfPi) < epsilon) return [0, pi * tan(theta / 2)];
	  var A = (pi / lambda - lambda / pi) / 2,
	      y1 = sinTheta / (1 + cos(theta));
	  return [
	    pi * (sign(lambda) * sqrt(A * A + 1 - y1 * y1) - A),
	    pi * y1
	  ];
	}

	vanDerGrinten3Raw.invert = function(x, y) {
	  if (!y) return [x, 0];
	  var y1 = y / pi,
	      A = (pi * pi * (1 - y1 * y1) - x * x) / (2 * pi * x);
	  return [
	    x ? pi * (sign(x) * sqrt(A * A + 1) - A) : 0,
	    halfPi * sin(2 * atan(y1))
	  ];
	};

	var vanDerGrinten3 = function() {
	  return d3Geo.geoProjection(vanDerGrinten3Raw)
	        .scale(79.4183);
	};

	function vanDerGrinten4Raw(lambda, phi) {
	  if (!phi) return [lambda, 0];
	  var phi0 = abs(phi);
	  if (!lambda || phi0 === halfPi) return [0, phi];
	  var B = phi0 / halfPi,
	      B2 = B * B,
	      C = (8 * B - B2 * (B2 + 2) - 5) / (2 * B2 * (B - 1)),
	      C2 = C * C,
	      BC = B * C,
	      B_C2 = B2 + C2 + 2 * BC,
	      B_3C = B + 3 * C,
	      lambda0 = lambda / halfPi,
	      lambda1 = lambda0 + 1 / lambda0,
	      D = sign(abs(lambda) - halfPi) * sqrt(lambda1 * lambda1 - 4),
	      D2 = D * D,
	      F = B_C2 * (B2 + C2 * D2 - 1) + (1 - B2) * (B2 * (B_3C * B_3C + 4 * C2) + 12 * BC * C2 + 4 * C2 * C2),
	      x1 = (D * (B_C2 + C2 - 1) + 2 * sqrt(F)) / (4 * B_C2 + D2);
	  return [
	    sign(lambda) * halfPi * x1,
	    sign(phi) * halfPi * sqrt(1 + D * abs(x1) - x1 * x1)
	  ];
	}

	vanDerGrinten4Raw.invert = function(x, y) {
	  var delta;
	  if (!x || !y) return [x, y];
	  y /= pi;
	  var x1 = sign(x) * x / halfPi,
	      D = (x1 * x1 - 1 + 4 * y * y) / abs(x1),
	      D2 = D * D,
	      B = 2 * y,
	      i = 50;
	  do {
	    var B2 = B * B,
	        C = (8 * B - B2 * (B2 + 2) - 5) / (2 * B2 * (B - 1)),
	        C_ = (3 * B - B2 * B - 10) / (2 * B2 * B),
	        C2 = C * C,
	        BC = B * C,
	        B_C = B + C,
	        B_C2 = B_C * B_C,
	        B_3C = B + 3 * C,
	        F = B_C2 * (B2 + C2 * D2 - 1) + (1 - B2) * (B2 * (B_3C * B_3C + 4 * C2) + C2 * (12 * BC + 4 * C2)),
	        F_ = -2 * B_C * (4 * BC * C2 + (1 - 4 * B2 + 3 * B2 * B2) * (1 + C_) + C2 * (-6 + 14 * B2 - D2 + (-8 + 8 * B2 - 2 * D2) * C_) + BC * (-8 + 12 * B2 + (-10 + 10 * B2 - D2) * C_)),
	        sqrtF = sqrt(F),
	        f = D * (B_C2 + C2 - 1) + 2 * sqrtF - x1 * (4 * B_C2 + D2),
	        f_ = D * (2 * C * C_ + 2 * B_C * (1 + C_)) + F_ / sqrtF - 8 * B_C * (D * (-1 + C2 + B_C2) + 2 * sqrtF) * (1 + C_) / (D2 + 4 * B_C2);
	    B -= delta = f / f_;
	  } while (delta > epsilon && --i > 0);
	  return [
	    sign(x) * (sqrt(D * D + 4) + D) * pi / 4,
	    halfPi * B
	  ];
	};

	var vanDerGrinten4 = function() {
	  return d3Geo.geoProjection(vanDerGrinten4Raw)
	      .scale(127.16);
	};

	var A = 4 * pi + 3 * sqrt(3);
	var B = 2 * sqrt(2 * pi * sqrt(3) / A);

	var wagner4Raw = mollweideBromleyRaw(B * sqrt(3) / pi, B, A / 6);

	var wagner4 = function() {
	  return d3Geo.geoProjection(wagner4Raw)
	      .scale(176.84);
	};

	function wagner6Raw(lambda, phi) {
	  return [lambda * sqrt(1 - 3 * phi * phi / (pi * pi)), phi];
	}

	wagner6Raw.invert = function(x, y) {
	  return [x / sqrt(1 - 3 * y * y / (pi * pi)), y];
	};

	var wagner6 = function() {
	  return d3Geo.geoProjection(wagner6Raw)
	      .scale(152.63);
	};

	function wagner7Raw(lambda, phi) {
	  var s = 0.90631 * sin(phi),
	      c0 = sqrt(1 - s * s),
	      c1 = sqrt(2 / (1 + c0 * cos(lambda /= 3)));
	  return [
	    2.66723 * c0 * c1 * sin(lambda),
	    1.24104 * s * c1
	  ];
	}

	wagner7Raw.invert = function(x, y) {
	  var t1 = x / 2.66723,
	      t2 = y / 1.24104,
	      p = sqrt(t1 * t1 + t2 * t2),
	      c = 2 * asin(p / 2);
	  return [
	    3 * atan2(x * tan(c), 2.66723 * p),
	    p && asin(y * sin(c) / (1.24104 * 0.90631 * p))
	  ];
	};

	var wagner7 = function() {
	  return d3Geo.geoProjection(wagner7Raw)
	      .scale(172.632);
	};

	function wiechelRaw(lambda, phi) {
	  var cosPhi = cos(phi),
	      sinPhi = cos(lambda) * cosPhi,
	      sin1_Phi = 1 - sinPhi,
	      cosLambda = cos(lambda = atan2(sin(lambda) * cosPhi, -sin(phi))),
	      sinLambda = sin(lambda);
	  cosPhi = sqrt(1 - sinPhi * sinPhi);
	  return [
	    sinLambda * cosPhi - cosLambda * sin1_Phi,
	    -cosLambda * cosPhi - sinLambda * sin1_Phi
	  ];
	}

	wiechelRaw.invert = function(x, y) {
	  var w = (x * x + y * y) / -2,
	      k = sqrt(-w * (2 + w)),
	      b = y * w + x * k,
	      a = x * w - y * k,
	      D = sqrt(a * a + b * b);
	  return [
	    atan2(k * b, D * (1 + w)),
	    D ? -asin(k * a / D) : 0
	  ];
	};

	var wiechel = function() {
	  return d3Geo.geoProjection(wiechelRaw)
	      .rotate([0, -90, 45])
	      .scale(124.75)
	      .clipAngle(180 - 1e-3);
	};

	function winkel3Raw(lambda, phi) {
	  var coordinates = aitoffRaw(lambda, phi);
	  return [
	    (coordinates[0] + lambda / halfPi) / 2,
	    (coordinates[1] + phi) / 2
	  ];
	}

	winkel3Raw.invert = function(x, y) {
	  var lambda = x, phi = y, i = 25;
	  do {
	    var cosphi = cos(phi),
	        sinphi = sin(phi),
	        sin_2phi = sin(2 * phi),
	        sin2phi = sinphi * sinphi,
	        cos2phi = cosphi * cosphi,
	        sinlambda = sin(lambda),
	        coslambda_2 = cos(lambda / 2),
	        sinlambda_2 = sin(lambda / 2),
	        sin2lambda_2 = sinlambda_2 * sinlambda_2,
	        C = 1 - cos2phi * coslambda_2 * coslambda_2,
	        E = C ? acos(cosphi * coslambda_2) * sqrt(F = 1 / C) : F = 0,
	        F,
	        fx = 0.5 * (2 * E * cosphi * sinlambda_2 + lambda / halfPi) - x,
	        fy = 0.5 * (E * sinphi + phi) - y,
	        dxdlambda = 0.5 * F * (cos2phi * sin2lambda_2 + E * cosphi * coslambda_2 * sin2phi) + 0.5 / halfPi,
	        dxdphi = F * (sinlambda * sin_2phi / 4 - E * sinphi * sinlambda_2),
	        dydlambda = 0.125 * F * (sin_2phi * sinlambda_2 - E * sinphi * cos2phi * sinlambda),
	        dydphi = 0.5 * F * (sin2phi * coslambda_2 + E * sin2lambda_2 * cosphi) + 0.5,
	        denominator = dxdphi * dydlambda - dydphi * dxdlambda,
	        dlambda = (fy * dxdphi - fx * dydphi) / denominator,
	        dphi = (fx * dydlambda - fy * dxdlambda) / denominator;
	    lambda -= dlambda, phi -= dphi;
	  } while ((abs(dlambda) > epsilon || abs(dphi) > epsilon) && --i > 0);
	  return [lambda, phi];
	};

	var winkel3 = function() {
	  return d3Geo.geoProjection(winkel3Raw)
	      .scale(158.837);
	};

	exports.geoAiry = airy;
	exports.geoAiryRaw = airyRaw;
	exports.geoAitoff = aitoff;
	exports.geoAitoffRaw = aitoffRaw;
	exports.geoArmadillo = armadillo;
	exports.geoArmadilloRaw = armadilloRaw;
	exports.geoAugust = august;
	exports.geoAugustRaw = augustRaw;
	exports.geoBaker = baker;
	exports.geoBakerRaw = bakerRaw;
	exports.geoBerghaus = berghaus;
	exports.geoBerghausRaw = berghausRaw;
	exports.geoBertin1953 = bertin;
	exports.geoBertin1953Raw = bertin1953Raw;
	exports.geoBoggs = boggs;
	exports.geoBoggsRaw = boggsRaw;
	exports.geoBonne = bonne;
	exports.geoBonneRaw = bonneRaw;
	exports.geoBottomley = bottomley;
	exports.geoBottomleyRaw = bottomleyRaw;
	exports.geoBromley = bromley;
	exports.geoBromleyRaw = bromleyRaw;
	exports.geoChamberlin = chamberlin;
	exports.geoChamberlinRaw = chamberlinRaw;
	exports.geoChamberlinAfrica = chamberlinAfrica;
	exports.geoCollignon = collignon;
	exports.geoCollignonRaw = collignonRaw;
	exports.geoCraig = craig;
	exports.geoCraigRaw = craigRaw;
	exports.geoCraster = craster;
	exports.geoCrasterRaw = crasterRaw;
	exports.geoCylindricalEqualArea = cylindricalEqualArea;
	exports.geoCylindricalEqualAreaRaw = cylindricalEqualAreaRaw;
	exports.geoCylindricalStereographic = cylindricalStereographic;
	exports.geoCylindricalStereographicRaw = cylindricalStereographicRaw;
	exports.geoEckert1 = eckert1;
	exports.geoEckert1Raw = eckert1Raw;
	exports.geoEckert2 = eckert2;
	exports.geoEckert2Raw = eckert2Raw;
	exports.geoEckert3 = eckert3;
	exports.geoEckert3Raw = eckert3Raw;
	exports.geoEckert4 = eckert4;
	exports.geoEckert4Raw = eckert4Raw;
	exports.geoEckert5 = eckert5;
	exports.geoEckert5Raw = eckert5Raw;
	exports.geoEckert6 = eckert6;
	exports.geoEckert6Raw = eckert6Raw;
	exports.geoEisenlohr = eisenlohr;
	exports.geoEisenlohrRaw = eisenlohrRaw;
	exports.geoFahey = fahey;
	exports.geoFaheyRaw = faheyRaw;
	exports.geoFoucaut = foucaut;
	exports.geoFoucautRaw = foucautRaw;
	exports.geoGilbert = gilbert;
	exports.geoGingery = gingery;
	exports.geoGingeryRaw = gingeryRaw;
	exports.geoGinzburg4 = ginzburg4;
	exports.geoGinzburg4Raw = ginzburg4Raw;
	exports.geoGinzburg5 = ginzburg5;
	exports.geoGinzburg5Raw = ginzburg5Raw;
	exports.geoGinzburg6 = ginzburg6;
	exports.geoGinzburg6Raw = ginzburg6Raw;
	exports.geoGinzburg8 = ginzburg8;
	exports.geoGinzburg8Raw = ginzburg8Raw;
	exports.geoGinzburg9 = ginzburg9;
	exports.geoGinzburg9Raw = ginzburg9Raw;
	exports.geoGringorten = gringorten;
	exports.geoGringortenRaw = gringortenRaw;
	exports.geoGuyou = guyou;
	exports.geoGuyouRaw = guyouRaw;
	exports.geoHammer = hammer;
	exports.geoHammerRaw = hammerRaw;
	exports.geoHammerRetroazimuthal = hammerRetroazimuthal;
	exports.geoHammerRetroazimuthalRaw = hammerRetroazimuthalRaw;
	exports.geoHealpix = healpix;
	exports.geoHealpixRaw = healpixRaw;
	exports.geoHill = hill;
	exports.geoHillRaw = hillRaw;
	exports.geoHomolosine = homolosine;
	exports.geoHomolosineRaw = homolosineRaw;
	exports.geoInterrupt = interrupt;
	exports.geoInterruptedBoggs = boggs$1;
	exports.geoInterruptedHomolosine = homolosine$1;
	exports.geoInterruptedMollweide = mollweide$1;
	exports.geoInterruptedMollweideHemispheres = mollweideHemispheres;
	exports.geoInterruptedSinuMollweide = sinuMollweide$1;
	exports.geoInterruptedSinusoidal = sinusoidal$1;
	exports.geoKavrayskiy7 = kavrayskiy7;
	exports.geoKavrayskiy7Raw = kavrayskiy7Raw;
	exports.geoLagrange = lagrange;
	exports.geoLagrangeRaw = lagrangeRaw;
	exports.geoLarrivee = larrivee;
	exports.geoLarriveeRaw = larriveeRaw;
	exports.geoLaskowski = laskowski;
	exports.geoLaskowskiRaw = laskowskiRaw;
	exports.geoLittrow = littrow;
	exports.geoLittrowRaw = littrowRaw;
	exports.geoLoximuthal = loximuthal;
	exports.geoLoximuthalRaw = loximuthalRaw;
	exports.geoMiller = miller;
	exports.geoMillerRaw = millerRaw;
	exports.geoModifiedStereographic = modifiedStereographic;
	exports.geoModifiedStereographicRaw = modifiedStereographicRaw;
	exports.geoModifiedStereographicAlaska = modifiedStereographicAlaska;
	exports.geoModifiedStereographicGs48 = modifiedStereographicGs48;
	exports.geoModifiedStereographicGs50 = modifiedStereographicGs50;
	exports.geoModifiedStereographicMiller = modifiedStereographicMiller;
	exports.geoModifiedStereographicLee = modifiedStereographicLee;
	exports.geoMollweide = mollweide;
	exports.geoMollweideRaw = mollweideRaw;
	exports.geoMtFlatPolarParabolic = mtFlatPolarParabolic;
	exports.geoMtFlatPolarParabolicRaw = mtFlatPolarParabolicRaw;
	exports.geoMtFlatPolarQuartic = mtFlatPolarQuartic;
	exports.geoMtFlatPolarQuarticRaw = mtFlatPolarQuarticRaw;
	exports.geoMtFlatPolarSinusoidal = mtFlatPolarSinusoidal;
	exports.geoMtFlatPolarSinusoidalRaw = mtFlatPolarSinusoidalRaw;
	exports.geoNaturalEarth = d3Geo.geoNaturalEarth1;
	exports.geoNaturalEarthRaw = d3Geo.geoNaturalEarth1Raw;
	exports.geoNaturalEarth2 = naturalEarth2;
	exports.geoNaturalEarth2Raw = naturalEarth2Raw;
	exports.geoNellHammer = nellHammer;
	exports.geoNellHammerRaw = nellHammerRaw;
	exports.geoPatterson = patterson;
	exports.geoPattersonRaw = pattersonRaw;
	exports.geoPolyconic = polyconic;
	exports.geoPolyconicRaw = polyconicRaw;
	exports.geoPolyhedral = polyhedral;
	exports.geoPolyhedralButterfly = butterfly;
	exports.geoPolyhedralCollignon = collignon$1;
	exports.geoPolyhedralWaterman = waterman;
	exports.geoProject = index;
	exports.geoGringortenQuincuncial = gringorten$1;
	exports.geoPeirceQuincuncial = peirce;
	exports.geoPierceQuincuncial = peirce;
	exports.geoQuantize = quantize;
	exports.geoQuincuncial = quincuncial;
	exports.geoRectangularPolyconic = rectangularPolyconic;
	exports.geoRectangularPolyconicRaw = rectangularPolyconicRaw;
	exports.geoRobinson = robinson;
	exports.geoRobinsonRaw = robinsonRaw;
	exports.geoSatellite = satellite;
	exports.geoSatelliteRaw = satelliteRaw;
	exports.geoSinuMollweide = sinuMollweide;
	exports.geoSinuMollweideRaw = sinuMollweideRaw;
	exports.geoSinusoidal = sinusoidal;
	exports.geoSinusoidalRaw = sinusoidalRaw;
	exports.geoStitch = stitch;
	exports.geoTimes = times;
	exports.geoTimesRaw = timesRaw;
	exports.geoTwoPointAzimuthal = twoPointAzimuthal;
	exports.geoTwoPointAzimuthalRaw = twoPointAzimuthalRaw;
	exports.geoTwoPointAzimuthalUsa = twoPointAzimuthalUsa;
	exports.geoTwoPointEquidistant = twoPointEquidistant;
	exports.geoTwoPointEquidistantRaw = twoPointEquidistantRaw;
	exports.geoTwoPointEquidistantUsa = twoPointEquidistantUsa;
	exports.geoVanDerGrinten = vanDerGrinten;
	exports.geoVanDerGrintenRaw = vanDerGrintenRaw;
	exports.geoVanDerGrinten2 = vanDerGrinten2;
	exports.geoVanDerGrinten2Raw = vanDerGrinten2Raw;
	exports.geoVanDerGrinten3 = vanDerGrinten3;
	exports.geoVanDerGrinten3Raw = vanDerGrinten3Raw;
	exports.geoVanDerGrinten4 = vanDerGrinten4;
	exports.geoVanDerGrinten4Raw = vanDerGrinten4Raw;
	exports.geoWagner4 = wagner4;
	exports.geoWagner4Raw = wagner4Raw;
	exports.geoWagner6 = wagner6;
	exports.geoWagner6Raw = wagner6Raw;
	exports.geoWagner7 = wagner7;
	exports.geoWagner7Raw = wagner7Raw;
	exports.geoWiechel = wiechel;
	exports.geoWiechelRaw = wiechelRaw;
	exports.geoWinkel3 = winkel3;
	exports.geoWinkel3Raw = winkel3Raw;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ }),
/* 14 */
/***/ (function(module, exports) {

	/**
	 * A rendering context that can be used with d3-geo to convert geoJSON
	 * into data that can be used by THREE.js.  To do this, it implements
	 * the d3-geo required subset of the CanvasRenderingContext2D API.
	 *
	 * @param shapePath a THREE.ShapePath that will hold the rendered data
	 * @constructor
	 * @see https://github.com/d3/d3-geo#path_context
	 */
	function ThreeJSRenderContext(shapePath) {
	  this.shapePath = shapePath;
	}

	ThreeJSRenderContext.prototype.beginPath = function beginPath () {
	  // no-op
	};

	ThreeJSRenderContext.prototype.moveTo = function moveTo (x, y) {
	  this.shapePath.moveTo(x, y);
	};

	ThreeJSRenderContext.prototype.lineTo = function lineTo (x, y) {
	  this.shapePath.lineTo(x, y);
	};

	ThreeJSRenderContext.prototype.arc = function arc (x, y, radius, startAngle, endAngle) {
	  this.shapePath.currentPath.arc(x, y, radius, startAngle, endAngle);
	};

	ThreeJSRenderContext.prototype.closePath = function closePath () {
	  this.shapePath.currentPath.closePath();
	};

	/**
	 * Exports the data stored in this context into an array of Shapes.
	 * By default solid shapes are defined clockwise (CW) and holes are
	 * defined counterclockwise (CCW). If isCCW is set to true, then those
	 * are flipped. If the parameter noHoles is set to true then all paths
	 * are set as solid shapes and isCCW is ignored.
	 *
	 * The isCCW flag is important when rendering topoJSON vs. geoJSON.  For
	 * features smaller than a hemisphere, topoJSON uses clockwise shapes while
	 * geoJSON uses counterclockwise shapes.  For features larger than a
	 * hemisphere (such as oceans), the opposite is true.
	 *
	 * @param isCCW changes how solids and holes are generated
	 * @param noHoles whether or not to generate holes
	 * @return {Array} of THREE.Shape objects
	 * @see https://github.com/d3/d3-geo for a summary of winding order convention
	 */
	ThreeJSRenderContext.prototype.toShapes = function toShapes (isCCW, noHoles) {
	  return this.shapePath.toShapes(isCCW, noHoles);
	};

	/**
	 * Exports the data stored in this context into an array of vertices.  Each
	 * vertex takes up three positions in the array so it is optimized to populate
	 * a THREE.BufferGeometry.
	 *
	 * @return {Array} of numbers
	 */
	ThreeJSRenderContext.prototype.toVertices = function toVertices () {
	  var verticesForShape = [];
	  this.shapePath.subPaths.forEach(function (path) {
	    path.curves.forEach(function (curve) {
	      if (curve.isLineCurve) {
	        verticesForShape.push(curve.v1.x);
	        verticesForShape.push(curve.v1.y);
	        verticesForShape.push(0);
	        verticesForShape.push(curve.v2.x);
	        verticesForShape.push(curve.v2.y);
	        verticesForShape.push(0);
	      } else {
	        curve.getPoints().forEach(function (point) {
	          verticesForShape.push(point.x);
	          verticesForShape.push(point.y);
	          verticesForShape.push(0);
	        });
	      }
	    });
	  });
	  return verticesForShape;
	};

	module.exports = {
	  ThreeJSRenderContext: ThreeJSRenderContext
	};


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	// https://github.com/topojson/topojson-client Version 3.0.0. Copyright 2017 Mike Bostock.
	(function (global, factory) {
		 true ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.topojson = global.topojson || {})));
	}(this, (function (exports) { 'use strict';

	var identity = function(x) {
	  return x;
	};

	var transform = function(transform) {
	  if (transform == null) return identity;
	  var x0,
	      y0,
	      kx = transform.scale[0],
	      ky = transform.scale[1],
	      dx = transform.translate[0],
	      dy = transform.translate[1];
	  return function(input, i) {
	    if (!i) x0 = y0 = 0;
	    var j = 2, n = input.length, output = new Array(n);
	    output[0] = (x0 += input[0]) * kx + dx;
	    output[1] = (y0 += input[1]) * ky + dy;
	    while (j < n) output[j] = input[j], ++j;
	    return output;
	  };
	};

	var bbox = function(topology) {
	  var t = transform(topology.transform), key,
	      x0 = Infinity, y0 = x0, x1 = -x0, y1 = -x0;

	  function bboxPoint(p) {
	    p = t(p);
	    if (p[0] < x0) x0 = p[0];
	    if (p[0] > x1) x1 = p[0];
	    if (p[1] < y0) y0 = p[1];
	    if (p[1] > y1) y1 = p[1];
	  }

	  function bboxGeometry(o) {
	    switch (o.type) {
	      case "GeometryCollection": o.geometries.forEach(bboxGeometry); break;
	      case "Point": bboxPoint(o.coordinates); break;
	      case "MultiPoint": o.coordinates.forEach(bboxPoint); break;
	    }
	  }

	  topology.arcs.forEach(function(arc) {
	    var i = -1, n = arc.length, p;
	    while (++i < n) {
	      p = t(arc[i], i);
	      if (p[0] < x0) x0 = p[0];
	      if (p[0] > x1) x1 = p[0];
	      if (p[1] < y0) y0 = p[1];
	      if (p[1] > y1) y1 = p[1];
	    }
	  });

	  for (key in topology.objects) {
	    bboxGeometry(topology.objects[key]);
	  }

	  return [x0, y0, x1, y1];
	};

	var reverse = function(array, n) {
	  var t, j = array.length, i = j - n;
	  while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
	};

	var feature = function(topology, o) {
	  return o.type === "GeometryCollection"
	      ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
	      : feature$1(topology, o);
	};

	function feature$1(topology, o) {
	  var id = o.id,
	      bbox = o.bbox,
	      properties = o.properties == null ? {} : o.properties,
	      geometry = object(topology, o);
	  return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
	      : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
	      : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
	}

	function object(topology, o) {
	  var transformPoint = transform(topology.transform),
	      arcs = topology.arcs;

	  function arc(i, points) {
	    if (points.length) points.pop();
	    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
	      points.push(transformPoint(a[k], k));
	    }
	    if (i < 0) reverse(points, n);
	  }

	  function point(p) {
	    return transformPoint(p);
	  }

	  function line(arcs) {
	    var points = [];
	    for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
	    if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
	    return points;
	  }

	  function ring(arcs) {
	    var points = line(arcs);
	    while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
	    return points;
	  }

	  function polygon(arcs) {
	    return arcs.map(ring);
	  }

	  function geometry(o) {
	    var type = o.type, coordinates;
	    switch (type) {
	      case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
	      case "Point": coordinates = point(o.coordinates); break;
	      case "MultiPoint": coordinates = o.coordinates.map(point); break;
	      case "LineString": coordinates = line(o.arcs); break;
	      case "MultiLineString": coordinates = o.arcs.map(line); break;
	      case "Polygon": coordinates = polygon(o.arcs); break;
	      case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
	      default: return null;
	    }
	    return {type: type, coordinates: coordinates};
	  }

	  return geometry(o);
	}

	var stitch = function(topology, arcs) {
	  var stitchedArcs = {},
	      fragmentByStart = {},
	      fragmentByEnd = {},
	      fragments = [],
	      emptyIndex = -1;

	  // Stitch empty arcs first, since they may be subsumed by other arcs.
	  arcs.forEach(function(i, j) {
	    var arc = topology.arcs[i < 0 ? ~i : i], t;
	    if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
	      t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
	    }
	  });

	  arcs.forEach(function(i) {
	    var e = ends(i),
	        start = e[0],
	        end = e[1],
	        f, g;

	    if (f = fragmentByEnd[start]) {
	      delete fragmentByEnd[f.end];
	      f.push(i);
	      f.end = end;
	      if (g = fragmentByStart[end]) {
	        delete fragmentByStart[g.start];
	        var fg = g === f ? f : f.concat(g);
	        fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
	      } else {
	        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
	      }
	    } else if (f = fragmentByStart[end]) {
	      delete fragmentByStart[f.start];
	      f.unshift(i);
	      f.start = start;
	      if (g = fragmentByEnd[start]) {
	        delete fragmentByEnd[g.end];
	        var gf = g === f ? f : g.concat(f);
	        fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
	      } else {
	        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
	      }
	    } else {
	      f = [i];
	      fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
	    }
	  });

	  function ends(i) {
	    var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
	    if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
	    else p1 = arc[arc.length - 1];
	    return i < 0 ? [p1, p0] : [p0, p1];
	  }

	  function flush(fragmentByEnd, fragmentByStart) {
	    for (var k in fragmentByEnd) {
	      var f = fragmentByEnd[k];
	      delete fragmentByStart[f.start];
	      delete f.start;
	      delete f.end;
	      f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
	      fragments.push(f);
	    }
	  }

	  flush(fragmentByEnd, fragmentByStart);
	  flush(fragmentByStart, fragmentByEnd);
	  arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

	  return fragments;
	};

	var mesh = function(topology) {
	  return object(topology, meshArcs.apply(this, arguments));
	};

	function meshArcs(topology, object$$1, filter) {
	  var arcs, i, n;
	  if (arguments.length > 1) arcs = extractArcs(topology, object$$1, filter);
	  else for (i = 0, arcs = new Array(n = topology.arcs.length); i < n; ++i) arcs[i] = i;
	  return {type: "MultiLineString", arcs: stitch(topology, arcs)};
	}

	function extractArcs(topology, object$$1, filter) {
	  var arcs = [],
	      geomsByArc = [],
	      geom;

	  function extract0(i) {
	    var j = i < 0 ? ~i : i;
	    (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
	  }

	  function extract1(arcs) {
	    arcs.forEach(extract0);
	  }

	  function extract2(arcs) {
	    arcs.forEach(extract1);
	  }

	  function extract3(arcs) {
	    arcs.forEach(extract2);
	  }

	  function geometry(o) {
	    switch (geom = o, o.type) {
	      case "GeometryCollection": o.geometries.forEach(geometry); break;
	      case "LineString": extract1(o.arcs); break;
	      case "MultiLineString": case "Polygon": extract2(o.arcs); break;
	      case "MultiPolygon": extract3(o.arcs); break;
	    }
	  }

	  geometry(object$$1);

	  geomsByArc.forEach(filter == null
	      ? function(geoms) { arcs.push(geoms[0].i); }
	      : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });

	  return arcs;
	}

	function planarRingArea(ring) {
	  var i = -1, n = ring.length, a, b = ring[n - 1], area = 0;
	  while (++i < n) a = b, b = ring[i], area += a[0] * b[1] - a[1] * b[0];
	  return Math.abs(area); // Note: doubled area!
	}

	var merge = function(topology) {
	  return object(topology, mergeArcs.apply(this, arguments));
	};

	function mergeArcs(topology, objects) {
	  var polygonsByArc = {},
	      polygons = [],
	      groups = [];

	  objects.forEach(geometry);

	  function geometry(o) {
	    switch (o.type) {
	      case "GeometryCollection": o.geometries.forEach(geometry); break;
	      case "Polygon": extract(o.arcs); break;
	      case "MultiPolygon": o.arcs.forEach(extract); break;
	    }
	  }

	  function extract(polygon) {
	    polygon.forEach(function(ring) {
	      ring.forEach(function(arc) {
	        (polygonsByArc[arc = arc < 0 ? ~arc : arc] || (polygonsByArc[arc] = [])).push(polygon);
	      });
	    });
	    polygons.push(polygon);
	  }

	  function area(ring) {
	    return planarRingArea(object(topology, {type: "Polygon", arcs: [ring]}).coordinates[0]);
	  }

	  polygons.forEach(function(polygon) {
	    if (!polygon._) {
	      var group = [],
	          neighbors = [polygon];
	      polygon._ = 1;
	      groups.push(group);
	      while (polygon = neighbors.pop()) {
	        group.push(polygon);
	        polygon.forEach(function(ring) {
	          ring.forEach(function(arc) {
	            polygonsByArc[arc < 0 ? ~arc : arc].forEach(function(polygon) {
	              if (!polygon._) {
	                polygon._ = 1;
	                neighbors.push(polygon);
	              }
	            });
	          });
	        });
	      }
	    }
	  });

	  polygons.forEach(function(polygon) {
	    delete polygon._;
	  });

	  return {
	    type: "MultiPolygon",
	    arcs: groups.map(function(polygons) {
	      var arcs = [], n;

	      // Extract the exterior (unique) arcs.
	      polygons.forEach(function(polygon) {
	        polygon.forEach(function(ring) {
	          ring.forEach(function(arc) {
	            if (polygonsByArc[arc < 0 ? ~arc : arc].length < 2) {
	              arcs.push(arc);
	            }
	          });
	        });
	      });

	      // Stitch the arcs into one or more rings.
	      arcs = stitch(topology, arcs);

	      // If more than one ring is returned,
	      // at most one of these rings can be the exterior;
	      // choose the one with the greatest absolute area.
	      if ((n = arcs.length) > 1) {
	        for (var i = 1, k = area(arcs[0]), ki, t; i < n; ++i) {
	          if ((ki = area(arcs[i])) > k) {
	            t = arcs[0], arcs[0] = arcs[i], arcs[i] = t, k = ki;
	          }
	        }
	      }

	      return arcs;
	    })
	  };
	}

	var bisect = function(a, x) {
	  var lo = 0, hi = a.length;
	  while (lo < hi) {
	    var mid = lo + hi >>> 1;
	    if (a[mid] < x) lo = mid + 1;
	    else hi = mid;
	  }
	  return lo;
	};

	var neighbors = function(objects) {
	  var indexesByArc = {}, // arc index -> array of object indexes
	      neighbors = objects.map(function() { return []; });

	  function line(arcs, i) {
	    arcs.forEach(function(a) {
	      if (a < 0) a = ~a;
	      var o = indexesByArc[a];
	      if (o) o.push(i);
	      else indexesByArc[a] = [i];
	    });
	  }

	  function polygon(arcs, i) {
	    arcs.forEach(function(arc) { line(arc, i); });
	  }

	  function geometry(o, i) {
	    if (o.type === "GeometryCollection") o.geometries.forEach(function(o) { geometry(o, i); });
	    else if (o.type in geometryType) geometryType[o.type](o.arcs, i);
	  }

	  var geometryType = {
	    LineString: line,
	    MultiLineString: polygon,
	    Polygon: polygon,
	    MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }
	  };

	  objects.forEach(geometry);

	  for (var i in indexesByArc) {
	    for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {
	      for (var k = j + 1; k < m; ++k) {
	        var ij = indexes[j], ik = indexes[k], n;
	        if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);
	        if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);
	      }
	    }
	  }

	  return neighbors;
	};

	var untransform = function(transform) {
	  if (transform == null) return identity;
	  var x0,
	      y0,
	      kx = transform.scale[0],
	      ky = transform.scale[1],
	      dx = transform.translate[0],
	      dy = transform.translate[1];
	  return function(input, i) {
	    if (!i) x0 = y0 = 0;
	    var j = 2,
	        n = input.length,
	        output = new Array(n),
	        x1 = Math.round((input[0] - dx) / kx),
	        y1 = Math.round((input[1] - dy) / ky);
	    output[0] = x1 - x0, x0 = x1;
	    output[1] = y1 - y0, y0 = y1;
	    while (j < n) output[j] = input[j], ++j;
	    return output;
	  };
	};

	var quantize = function(topology, transform) {
	  if (topology.transform) throw new Error("already quantized");

	  if (!transform || !transform.scale) {
	    if (!((n = Math.floor(transform)) >= 2)) throw new Error("n must be ≥2");
	    box = topology.bbox || bbox(topology);
	    var x0 = box[0], y0 = box[1], x1 = box[2], y1 = box[3], n;
	    transform = {scale: [x1 - x0 ? (x1 - x0) / (n - 1) : 1, y1 - y0 ? (y1 - y0) / (n - 1) : 1], translate: [x0, y0]};
	  } else {
	    box = topology.bbox;
	  }

	  var t = untransform(transform), box, key, inputs = topology.objects, outputs = {};

	  function quantizePoint(point) {
	    return t(point);
	  }

	  function quantizeGeometry(input) {
	    var output;
	    switch (input.type) {
	      case "GeometryCollection": output = {type: "GeometryCollection", geometries: input.geometries.map(quantizeGeometry)}; break;
	      case "Point": output = {type: "Point", coordinates: quantizePoint(input.coordinates)}; break;
	      case "MultiPoint": output = {type: "MultiPoint", coordinates: input.coordinates.map(quantizePoint)}; break;
	      default: return input;
	    }
	    if (input.id != null) output.id = input.id;
	    if (input.bbox != null) output.bbox = input.bbox;
	    if (input.properties != null) output.properties = input.properties;
	    return output;
	  }

	  function quantizeArc(input) {
	    var i = 0, j = 1, n = input.length, p, output = new Array(n); // pessimistic
	    output[0] = t(input[0], 0);
	    while (++i < n) if ((p = t(input[i], i))[0] || p[1]) output[j++] = p; // non-coincident points
	    if (j === 1) output[j++] = [0, 0]; // an arc must have at least two points
	    output.length = j;
	    return output;
	  }

	  for (key in inputs) outputs[key] = quantizeGeometry(inputs[key]);

	  return {
	    type: "Topology",
	    bbox: box,
	    transform: transform,
	    objects: outputs,
	    arcs: topology.arcs.map(quantizeArc)
	  };
	};

	exports.bbox = bbox;
	exports.feature = feature;
	exports.mesh = mesh;
	exports.meshArcs = meshArcs;
	exports.merge = merge;
	exports.mergeArcs = mergeArcs;
	exports.neighbors = neighbors;
	exports.quantize = quantize;
	exports.transform = transform;
	exports.untransform = untransform;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));


/***/ })
/******/ ]);