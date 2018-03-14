var sceneBounds = { x: 10, y: 10, z: 10 };
var attributes = ['geometry', 'position', 'color', 'dynamic-body', 'static-body']
var positionRange = {
	x: [-40, 40],
	y: [10, 100],
	z: [-40, 40]
};
var shapeGeoms = {
	sphere: {
		radius: [0.25, 3]
	},
	box: {
		width: [0.25, 4],
		depth: [0.25, 4],
		height: [0.25, 4]
	},
	cylinder: {
		radius: [0.25, 4],
		height: [1, 4]
	},
	cone: {
		topRadius: [0.25, 4],
		bottomRadius: [0.25, 4],
		height: [1, 4]
	},
	dodecahedron: {
		radius: [0.25, 5]
	},
	octahedron: {
		radius: [0.25, 5]
	},
	tetrahedron: {
		radius: [0.25, 5]
	},
	torus: {
		radius: [1, 5],
		radiusTubular: [0.25, 2]
	},
	torusKnot: {
		radius: [1, 5],
		radiusTubular: [0.25, 2],
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

	if (typeof this.color === 'undefined') {
		// https://www.paulirish.com/2009/random-hex-color-code-snippets/
		this.color = '#'+Math.floor(Math.random()*16777215).toString(16);
	}

	if (typeof this.position === 'undefined') {
		this.position = {};
		Object.keys(positionRange).forEach(k => {
			this.position[k] = (Math.random() * positionRange[k][1] - positionRange[k][0]) + positionRange[k][0]
		});
		// this.position = {
		// 	x: (Math.random() * sceneBounds.x * 2) - sceneBounds.x,
		// 	y: (Math.random() * sceneBounds.y * 2) - sceneBounds.y,
		// 	z: (Math.random() * sceneBounds.z * 2) - sceneBounds.z,
		// };
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
while (cnt++ < 50) {
	var t = new Shape();
	(function() {
		var $shape = document.createElement(`a-${t.type}`);
		var shapeInterval = ((Math.random() * 2) + 1) * 1000;
		var shapeImpulse = (Math.random() * 4) + 10
		Object.keys(t)
			.filter(k => attributes.includes(k))
			.forEach(k => {
				$shape.setAttribute(k, t[k])
			})
		var doBump = () => {
			if (typeof $shape.body !== 'undefined') {
				try {
					$shape.body.applyImpulse(
						new CANNON.Vec3(0, shapeImpulse, 0)
					);
				} catch (ex) {
					//console.log(ex);
				}
			}
			setTimeout(doBump, shapeInterval);
		};
		
		console.log(t, $shape);
		$scene.appendChild($shape);
		setTimeout(doBump, shapeInterval);
	})();
}