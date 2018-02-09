## aframe-geo-projection-component

[![Version](http://img.shields.io/npm/v/aframe-geo-projection-component.svg?style=flat-square)](https://npmjs.org/package/aframe-geo-projection-component)
[![License](http://img.shields.io/npm/l/aframe-geo-projection-component.svg?style=flat-square)](https://npmjs.org/package/aframe-geo-projection-component)

An A-Frame component for creating maps in VR using d3-geo projections

For [A-Frame](https://aframe.io).

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| src      | path to a GeoJson asset | None              |
| width      | width of the plane on which to project the map | 1              |
| height      | height of the plane on which to project the map | 1              |
| projection | the name of a projection from d3-geo or d3-geo-projection | geoIdentity |
| meshType | how to render the map; supported types are: "line" for line segements or "shape" for flat shapes | line |

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.7.1/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-geo-projection-component/dist/aframe-geo-projection-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-assets>
    <a-asset-item id="json-world" src="https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson" />
    </a-assets>

    <a-entity geo-projection="
                src: #json-world;
                projection: geoStereographic;
                height: 10;
                width: 20;
              "
    ></a-entity>
  </a-scene>
</body>
```

#### npm

Install via npm:

```bash
npm install aframe-geo-projection-component
```

Then require and use.

```js
require('aframe');
require('aframe-geo-projection-component');
```
