AFRAME.registerComponent('chest', {
	schema: {
		open: {
			default: false
		},
		width: {
			default: 4
		},
		height: {
			default: 4
		},
		depth: {
			default: 4
		},
		lidThickness: {
			default: 0.5
		}
	},

	update: function () {
		var object3D = this.el.object3D;

		var data = this.data;
		console.log(data);


		var ts = (new Date()).getTime()
		// this.width = data.width;
		// this.height = data.height;
		// this.depth = data.depth;

		console.log(this.el.components);

		this.el.setAttribute('position', this.el.components.position.data);
		
		//this.el.setAttribute('dynamic-body', true);

		var boxBottom = document.createElement('a-box');
		boxBottom.setAttribute('position', { x: 0, y: 4, z: 0 });
		boxBottom.setAttribute('width', data.width);
		boxBottom.setAttribute('height', data.height);
		boxBottom.setAttribute('depth', data.depth);
		boxBottom.setAttribute('src', 'assets/tessellated/wood-planks-01.jpg');
		boxBottom.setAttribute('id', `boxBottom${ts}`);
		boxBottom.setAttribute('dynamic-body', true);

		
		var boxLid = document.createElement('a-box');
		boxLid.setAttribute('position', { x: 0, y: 4.5, z: 0 });
		boxLid.setAttribute('src', 'assets/tessellated/wood-parquet-01.jpg');
		boxLid.setAttribute('width', data.width);
		boxLid.setAttribute('height', data.lidThickness);
		boxLid.setAttribute('depth', data.depth);
		boxLid.setAttribute('id', `boxLid${ts}`);
		boxLid.setAttribute('dynamic-body', true);
		boxLid.setAttribute('constraint', { 
			target: `#boxBottom${ts}`,
			type: 'hinge',
			pivot: { x: -5, y: -5, z: 0 },
			axis: { x: 0, y: 0, z: 0 },
			targetAxis: { x: 0, y: 5, z: 0 }
		});
		
		this.boxBottom = boxBottom;
		this.boxLid = boxLid;

		this.el.appendChild(this.boxBottom);
		this.el.appendChild(this.boxLid);
	},

	tick: function() {
		//console.log('yo');
		var pos = this.data.position;

		//this.el.setAttribute(data)
	}
});