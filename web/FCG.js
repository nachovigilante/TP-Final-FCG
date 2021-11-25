
const canvas = document.getElementById('canvas');
const gui = new dat.GUI({name: 'My GUI'});

const terrain_params = {
    param1: 42,
    param2: 69,
};

gui.add(terrain_params, 'param1', 0, 100);
gui.add(terrain_params, 'param2', 0, 100);


console.log(canvas);

Module.onRuntimeInitialized = () => {
    
    console.log(Module._generate(0, 7));
};
