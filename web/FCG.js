const canvas = document.getElementById("canvas");
const gui = new dat.GUI({ name: "My GUI" });

const terrain_params = {
    param1: 42,
    param2: 69,
    generate,
};

gui.add(terrain_params, "param1", 0, 100);
gui.add(terrain_params, "param2", 0, 100);

Module.onRuntimeInitialized = () => {
    gui.add(terrain_params, "generate");
    generate();
}

const renderer = new Renderer(canvas);

function generate() {
    const boxdrawer = new BoxDrawer(renderer.gl);
    console.log(Module._generate(terrain_params.param1, terrain_params.param2));
    console.log(renderer);

    const pos = [
        -1,-1,-1, // triángulo 1 : comienza
        -1,-1, 1,
        -1, 1, 1, // triángulo 1 : termina
        1, 1,-1, // triángulo 2 : comienza
        -1,-1,-1,
        -1, 1,-1, // triángulo 2 : termina
        1,-1, 1,
        -1,-1,-1,
        1,-1,-1,
        1, 1,-1,
        1,-1,-1,
        -1,-1,-1,
        -1,-1,-1,
        -1, 1, 1,
        -1, 1,-1,
        1,-1, 1,
        -1,-1, 1,
        -1,-1,-1,
        -1, 1, 1,
        -1,-1, 1,
        1,-1, 1,
        1, 1, 1,
        1,-1,-1,
        1, 1,-1,
        1,-1,-1,
        1, 1, 1,
        1,-1, 1,
        1, 1, 1,
        1, 1,-1,
        -1, 1,-1,
        1, 1, 1,
        -1, 1,-1,
        -1, 1, 1,
        1, 1, 1,
        -1, 1, 1,
        1,-1, 1
    ];
    const mesh = new Mesh(pos, renderer.gl);

    var rotX=0, rotY=0, transZ=3, autorot=0;
	const perspectiveMatrix = ProjectionMatrix(canvas, 5);
	const mv  = GetModelViewMatrix(0, 0, 5, 0, 0);
	const mvp = MatrixMult(perspectiveMatrix, mv);

    renderer.draw(mvp, [mesh]);
    boxdrawer.draw(mvp);
}

window.onresize = () => renderer.resize();
