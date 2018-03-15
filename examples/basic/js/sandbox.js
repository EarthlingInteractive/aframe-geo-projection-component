var sceneBounds = { x: 10, y: 10, z: 10 };
var attributes = ['geometry', 'position', 'color', 'dynamic-body', 'static-body', 'src'];
var tesselatedTextures = [
	// 'grass.jpg',
	'grey-cement-pavers.jpg',
	'mars-rock.jpg',
	'water-01.jpg',
	'brick-01.jpg',
	'ivy.jpg',
	'hedge.jpg',
	'wood-planks-01.jpg',
	'wood-parquet-01.jpg'
];
var positionRange = {
	x: [-40, 40],
	y: [100, 1000],
	z: [-40, 40]
};
var shapeGeoms = {
	sphere: {
		radius: [0.25, 8]
	},
	box: {
		width: [0.25, 6],
		depth: [0.25, 6],
		height: [0.25, 6]
	},
	cylinder: {
		radius: [0.25, 4],
		height: [1, 8]
	},
	cone: {
		radiusTop: [0.25, 6],
		radiusButtom: [0.25, 6],
		height: [1, 8]
	},
	dodecahedron: {
		radius: [0.25, 8]
	},
	octahedron: {
		radius: [0.25, 8]
	},
	tetrahedron: {
		radius: [0.25, 8]
	},
	torus: {
		radius: [2, 8],
		radiusTubular: [0.25, 3]
	},
	torusKnot: {
		radius: [2, 8],
		radiusTubular: [0.25, 3],
		p: Math.floor((Math.random() * 4) + 2),
		q: Math.floor((Math.random() * 4) + 2)
	}
};

var Shape = function(options) {
	if (typeof options === 'undefined') {
		options = {};
	}
	Object.assign(this, options);

	var shapeTypes = Object.keys(shapeGeoms);

	if (typeof this.type === 'undefined') {
		this.type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
	}

	if (typeof this.color === 'undefined' && typeof this.src === 'undefined') {
		if (Math.random() < 0.1) {
			this.color = '#'+Math.floor(Math.random()*16777215).toString(16);
		} else {
			var src = tesselatedTextures[Math.floor(Math.random() * tesselatedTextures.length)];
			this.src = `assets/tessellated/${src}`;
		}
	}

	if (typeof this.position === 'undefined') {
		this.position = {};
		Object.keys(positionRange).forEach(k => {
			this.position[k] = (Math.random() * positionRange[k][1] - positionRange[k][0]) + positionRange[k][0]
		});
	}

	if (typeof this.geometry === 'undefined') {
		var props = shapeGeoms[this.type];
		this.geometry = {};
		Object.keys(props).forEach(k => {
			this.geometry[k] = (Math.random() * props[k][1] - props[k][0]) + props[k][0]
		});
	}

	if (typeof this['static-body'] === 'undefined' && typeof this['dynamic-body'] === 'undefined') {
		this['dynamic-body'] = {
			mass: 1.5,
			linearDamping: 0.005
		};
	}
};

var CreateAFRameEntity = function(t, $scene) {
	var $shape = document.createElement(`a-${t.type}`);
	Object.keys(t)
		.filter(k => attributes.includes(k))
		.forEach(k => {
			$shape.setAttribute(k, t[k])
		});
	
	$scene.appendChild($shape);
	return $shape;
}

var things = [
	{
		type: 'sphere',
		geometry: {
			radius: 0.5
		},
		position: {
			x: 2,
			y: 1.25,
			z: -6
		},
		color: '#228944',
		'dynamic-body': {
			mass: 1.5,
			linearDamping: 0.005
		}
	}
];

var $scene = document.querySelector('a-scene');

var cnt = 0;
while (cnt++ < 100) {
	var t = new Shape();
	(function() {
		var $shape = CreateAFRameEntity(t, $scene);
		var shapeInterval = ((Math.random() * 2) + 1) * 1000;
		var shapeImpulse = (Math.random() * 10) + 40
		var doBump = () => {
			if (typeof $shape.body !== 'undefined') {
				var y = $shape.body.position.y;
				if (y < 5 && y > -5) {
					try {
						//console.log($shape.body);
						
						$shape.body.applyImpulse(
							new CANNON.Vec3(0, shapeImpulse, 0)
						);
					} catch (ex) {
						//console.log(ex);
					}
				} else if (y < -5) {
					t = new Shape();
					$scene.removeChild($shape)
					$shape = CreateAFRameEntity(t, $scene); //document.createElement(`a-${t.type}`);
				}
			}
			setTimeout(doBump, shapeInterval);
		};
		
		//console.log(t, $shape);
		setTimeout(doBump, shapeInterval);
	})();
}