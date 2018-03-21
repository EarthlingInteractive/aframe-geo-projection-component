AFRAME.registerComponent('chest', {
	schema: {
		open: {
			default: false
		},
		dimension: {
			default: 1
		},
		lidThickness: {
			default: 0.1
		}
	},

	update: function () {
		var object3D = this.el.object3D;
		var data = this.data;
		this.el.setAttribute('position', this.el.components.position.data);

		// var boxBottom = document.createElement('a-box');
		// boxBottom.setAttribute('position', this.el.components.position.data);
		// boxBottom.setAttribute('width', data.dimension);
		// boxBottom.setAttribute('height', data.dimension);
		// boxBottom.setAttribute('depth', data.dimension);
		// boxBottom.setAttribute('src', 'assets/tessellated/wood-planks-01.jpg');
		// boxBottom.setAttribute('material', { shader: 'flat' });
		// boxBottom.setAttribute('static-body', true);
		// boxBottom.setAttribute('physics-body', { mass: 100 });

		var boxBack = document.createElement('a-box');
		boxBack.setAttribute('position', this.el.components.position.data);
		boxBack.setAttribute('width', data.dimension);
		boxBack.setAttribute('height', data.dimension);
		boxBack.setAttribute('depth', data.dimension);
		boxBack.setAttribute('src', 'assets/tessellated/wood-planks-01.jpg');
		boxBack.setAttribute('material', { shader: 'flat' });
		boxBack.setAttribute('static-body', true);
		boxBack.setAttribute('physics-body', { mass: 10000 });

		
		var boxLid = document.createElement('a-box');
		boxLid.setAttribute('material', { shader: 'flat', src: 'assets/tessellated/wood-planks-01.jpg', rotation: { x: 0, y: 90, z: 0 } });
		boxLid.setAttribute('width', data.dimension);
		boxLid.setAttribute('height', data.lidThickness);
		boxLid.setAttribute('depth', data.dimension);
		boxLid.setAttribute('dynamic-body', true);
		boxLid.setAttribute('physics-body', { mass: 1 });
		boxLid.setAttribute('constraint', { 
			type: 'hinge',
			target: boxBack,
			axis: { x: 0, y: 0, z: data.dimension },
			targetAxis: { x: 0, y: 0, z: data.dimension },
			pivot: { x: -data.dimension / 2, y: -0.05, z: 0 },
			targetPivot: { x: -data.dimension / 2, y: data.dimension / 2, z: 0 }
		});

		//this.boxBottom = boxBottom;
		this.boxBack = boxBack;
		this.boxLid = boxLid;

		//this.el.appendChild(this.boxBottom);
		this.el.appendChild(this.boxBack);
		this.el.appendChild(this.boxLid);
	},

	tick: function() {
		//console.log('yo');
		var pos = this.data.position;

		//this.el.setAttribute(data)
	}
});