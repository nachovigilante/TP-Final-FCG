const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl", { antialias: false, depth: true });
if (!gl) {
    alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
    crash;
}

const gui = new dat.GUI();
const stats = new Stats();

stats.domElement.classList.add("stats");
document.body.appendChild(stats.domElement);

const terrain_params = {
    render_distance: 1,
    size: 50,
    isolevel: 0.42,
};

gui.add(terrain_params, "render_distance", 1, 5).step(1).onChange(invalidateAllChunks);
gui.add(terrain_params, "size", 10, 100).onChange(invalidateAllChunks);
gui.add(terrain_params, "isolevel", 0, 1).onChange(invalidateAllChunks);

const renderer = new Renderer(canvas, gl);
const worker = new Worker("WebWorker.js");
let chunks = [];
let validIndex = 1; // los chunks con este indice son validos
let working = false; // si el worker esta trabajando
let screenDirty = true; // si hay que volver a dibujar

// marca todos los chunks como invalidos, hay que volver a generarlos
function invalidateAllChunks() {
    // marcar existentes como invalidos
    validIndex++;
    // sacar los que estan fuera del render distance
    chunks = chunks.filter(chunk => chunk.d < terrain_params.render_distance);
    // crear los que faltan (no es muy elegante, pero it works)
    const D = terrain_params.render_distance - 1;
    for(let x = -D; x <= D; x++) {
        for(let y = -D; y <= D; y++) {
            for(let z = -D; z <= D; z++) {
                if(!chunks.find(chunk => chunk.x === x && chunk.y === y && chunk.z === z)) {
                    chunks.push({
                        x,
                        y,
                        z,
                        d: Math.min(Math.min(Math.abs(x), Math.abs(y)), Math.abs(z)),
                        validIndex: 0,
                    });
                }
            }
        }
    }
    nextChunk();
}

// intenta generar un chunk
function nextChunk() {
    if(working) return;

    // busco el chunk invalido mas cercano al origen
    const closest = chunks.filter(chunk => chunk.validIndex !== validIndex).sort((a, b) => a.d - b.d);
    if(closest.length === 0) return;
    const chunk = closest[0];

    worker.postMessage({
        x: chunk.x,
        y: chunk.y,
        z: chunk.z,
        params: [
            terrain_params.size,
            terrain_params.isolevel,
        ],
        validIndex: validIndex,
    });
    working = true;
}

// invocado luego de que un chunk esta listo
function chunkReady(result) {
    const chunk = chunks.find(chunk => chunk.x === result.x && chunk.y === result.y && chunk.z === result.z);
    chunk.validIndex = result.validIndex;
    if(chunk.mesh) {
        // limpiar el mesh anterior
        chunk.mesh.destroy();
    }
    chunk.mesh = new Mesh(result.vertBuffer, result.normBuffer, renderer.gl);
    screenDirty = true;
    working = false;
    nextChunk();
}

function frame() {
    stats.begin();
    // con esto evitamos renderizar cosas innecesarias
    if (screenDirty) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        let perspectiveMatrix = ProjectionMatrix(canvas, -10);
        perspectiveMatrix = MatrixMult(perspectiveMatrix, GetModelViewMatrix(0, 0, transZ, rotX, rotY));
        
        let i = 0;
        for(const chunk of chunks) {
            if(chunk.mesh) {
                const mv = GetModelViewMatrix(2*chunk.x, 2*chunk.y, 2*chunk.z, 0, 0);
                const mvp = MatrixMult(perspectiveMatrix, mv);
                renderer.draw(mvp, [chunk.mesh]);
            }
        }

        screenDirty = false;
    }
    stats.end();
    requestAnimationFrame(frame);
}

let rotX = 0, rotY = 0, transZ = 3;

window.onresize = () => {
    renderer.resize();
    screenDirty = true;
};
const launch = () => {
    // Evento de zoom (ruedita)
    canvas.zoom = function (s) {
        transZ *= s / canvas.height + 1;
        screenDirty = true;
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
                screenDirty = true;
            };
        }
    };

    canvas.onmouseup = canvas.onmouseleave = () => canvas.onmousemove = null;
    canvas.oncontextmenu = () => false;

    invalidateAllChunks();
    nextChunk();
    frame();
};

worker.onmessage = (ev) => {
    if(ev.data === "ready") {
        launch();
    } else {
        chunkReady(ev.data);
    }
}
