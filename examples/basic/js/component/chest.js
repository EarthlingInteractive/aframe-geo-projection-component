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
		console.log(data);


		var ts = (new Date()).getTime()

		console.log(this.el.components);

		this.el.setAttribute('position', this.el.components.position.data);
		
		//this.el.setAttribute('dynamic-body', true);

		var boxBottom = document.createElement('a-box');
		boxBottom.setAttribute('position', this.el.components.position.data);
		boxBottom.setAttribute('width', data.dimension);
		boxBottom.setAttribute('height', data.dimension);
		boxBottom.setAttribute('depth', data.dimension);
		boxBottom.setAttribute('src', 'assets/tessellated/wood-planks-01.jpg');
		boxBottom.setAttribute('material', { shader: 'flat' });
		boxBottom.setAttribute('id', `boxBottom${ts}`);
		boxBottom.setAttribute('static-body', true);
		boxBottom.setAttribute('physics-body', { mass: 100 });

		
		var boxLid = document.createElement('a-box');
		boxLid.setAttribute('material', { shader: 'flat', src: 'assets/tessellated/wood-planks-01.jpg', rotation: { x: 0, y: 90, z: 0 } });
		boxLid.setAttribute('width', data.dimension);
		boxLid.setAttribute('height', data.lidThickness);
		boxLid.setAttribute('depth', data.dimension);
		boxLid.setAttribute('id', `boxLid${ts}`);
		boxLid.setAttribute('dynamic-body', true);
		boxBottom.setAttribute('physics-body', { mass: 1 });
		boxLid.setAttribute('constraint', { 
			type: 'hinge',
			target: `#boxBottom${ts}`,
			axis: { x: 0, y: 0, z: data.dimension },
			targetAxis: { x: 0, y: 0, z: data.dimension },
			//pivot: { x: -data.dimension / 2, y: Math.max(0.05, -data.dimension * 0.01) + data.lidThickness, z: 0 },
			pivot: { x: -data.dimension / 2, y: -0.05, z: 0 },
			targetPivot: { x: -data.dimension / 2, y: data.dimension / 2, z: 0 }
			// axis: { x: 0, y: 0, z: 1 },
			// targetAxis: { x: 0, y: 0, z: 1 },
			// pivot: { x: -0.5, y: -0.05, z: 0 },
			// targetPivot: { x: -0.5, y: 0.5, z: 0 }
		});
		
		// <a-entity id="box1" position="0 1 -2">
		// 	<a-text value="Hinge" position="0 1.5 0" align="center"></a-text>
		// 	<a-box id="hinge-target" position="0 0.5 0" color="#777" static-body></a-box>
		// 	<a-box id="lid" height="0.1"
		// 			color="#F00"
		// 			dynamic-body
		// 			constraint="type: hinge;
		// 						target: #hinge-target;
		// 						axis: 0 0 1;
		// 						targetAxis: 0 0 1;
		// 						pivot: -0.5 -0.05 0;
		// 						targetPivot: -0.5 0.5 0;">
		// 	</a-box>
		// </a-entity>

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