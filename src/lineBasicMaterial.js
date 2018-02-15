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
