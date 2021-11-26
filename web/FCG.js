const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl", { antialias: false, depth: true });
const gui = new dat.GUI({ name: "My GUI" });

const terrain_params = {
    size: 50,
    isolevel: 0.42,
    generate,
};

gui.add(terrain_params, "size", 10, 100).onChange(generate);
gui.add(terrain_params, "isolevel", 0, 1).onChange(generate);


if (!gl) {
    alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
    crash;
}

const renderer = new Renderer(canvas, gl);
let meshes = [];
let dirty = true;

function generate() {
    for(const mesh of meshes) {
        mesh.destroy();
    }
    meshes = [];

    let vertAddress = Module._malloc(80000000 * 10);
    let normAddress = Module._malloc(80000000 * 10);
    let numVerts = Module._generate_mesh(vertAddress, normAddress, terrain_params.size, terrain_params.isolevel);
    let vertBuffer = Module.HEAPF32.subarray(vertAddress / 4, vertAddress / 4 + numVerts * 3);
    let normBuffer = Module.HEAPF32.subarray(normAddress / 4, normAddress / 4 + numVerts * 3);
    meshes.push(new Mesh(vertBuffer, normBuffer, renderer.gl));
    Module._free(vertAddress);
    Module._free(normAddress);

    dirty = true;
}

let rotX = 0, rotY = 0, transZ = 3;

window.onresize = () => {
    renderer.resize();
    dirty = true;
};
Module.onRuntimeInitialized = () => {
    // Evento de zoom (ruedita)
    canvas.zoom = function (s) {
        transZ *= s / canvas.height + 1;
        dirty = true;
    };
    canvas.onwheel = (event) => canvas.zoom(0.3 * event.deltaY);

    // Evento de click
    canvas.onmousedown = function (event) {
        var cx = event.clientX;
        var cy = event.clientY;
        if (event.ctrlKey) {
            canvas.onmousemove = function (event) {
                canvas.zoom(5 * (event.clientY - cy));
                cy = event.clientY;
            };
        } else {
            // Si se mueve el mouse, actualizo las matrices de rotación
            canvas.onmousemove = function (event) {
                rotY += ((cx - event.clientX) / canvas.width) * 5;
                rotX += ((cy - event.clientY) / canvas.height) * 5;
                cx = event.clientX;
                cy = event.clientY;
                dirty = true;
            };
        }
    };

    canvas.onmouseup = canvas.onmouseleave = () => canvas.onmousemove = null;
    canvas.oncontextmenu = () => false;

    function frame() {
        // con esto evitamos renderizar cosas innecesarias
        if (dirty) {
            const perspectiveMatrix = ProjectionMatrix(canvas, -10);
            const mv = GetModelViewMatrix(0, 0, transZ, rotX, rotY);
            const mvp = MatrixMult(perspectiveMatrix, mv);
            
            renderer.draw(mvp, meshes);

            dirty = false;
        }
        requestAnimationFrame(frame);
    }

    generate();
    frame();
};
