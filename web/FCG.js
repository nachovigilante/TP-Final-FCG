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
    render_distance: 3,
    size: 25,
    isolevel: 0.42,
    seed: 0,
    multiplier: 100,
    noises: []
};

function addNoise(gui, object) {
    gui.add(object, "noiseType", {
        "OpenSimplex2": 0,
        "OpenSimplex2S": 1,
        "Cellular": 2,
        "Perlin": 3,
        "ValueCubic": 4,
        "Value": 5
    }).onChange(invalidateAllChunks);
    gui.add(object, "fractalType", {
        "None": 0,
        "FBm": 1,
        "Ridged": 2,
        "PingPong": 3
    }).onChange(invalidateAllChunks);
    gui.add(object, "frequency", 0, 0.05).onChange(invalidateAllChunks);
    gui.add(object, "octaves", 0, 10).step(1).onChange(invalidateAllChunks);
    gui.add(object, "lacunarity", 0, 10).onChange(invalidateAllChunks);
    gui.add(object, "gain", 0, 1).step(0.1).onChange(invalidateAllChunks);
    gui.add(object, "contribution", 0, 1).onChange(invalidateAllChunks);
    gui.add(object, "mode", {
        "2D": 0,
        "3D": 1
    }).onChange(invalidateAllChunks);

    terrain_params.noises.push(object);
}

gui.add(terrain_params, "render_distance", 2, 5).step(1).onChange(invalidateAllChunks);
gui.add(terrain_params, "size", 10, 50).onChange(invalidateAllChunks);
gui.add(terrain_params, "isolevel", 0, 1).onChange(invalidateAllChunks);
gui.add(terrain_params, "seed", 0, 3000).onChange(invalidateAllChunks);
gui.add(terrain_params, "multiplier", 50, 200).onChange(invalidateAllChunks);

addNoise(gui.addFolder("Cuevas"), {
    noiseType: 3,
    fractalType: 1,
    frequency: 0.005,
    octaves: 2,
    lacunarity: 2.8,
    gain: 0.35,
    contribution: 0,
    mode: 0
});

addNoise(gui.addFolder("Base"), {
    noiseType: 3,
    fractalType: 1,
    frequency: 0.0044,
    octaves: 1,
    lacunarity: 1.5,
    gain: 0.42,
    contribution: 0.5,
    mode: 0
});

addNoise(gui.addFolder("Rugosidad"), {
    noiseType: 3,
    fractalType: 1,
    frequency: 0.013,
    octaves: 7,
    lacunarity: 1.5,
    gain: 0.51,
    contribution: 0.37,
    mode: 0
});

addNoise(gui.addFolder("Picos"), {
    noiseType: 2,
    fractalType: 0,
    frequency: 0.012,
    octaves: 0,
    lacunarity: 0,
    gain: 0,
    contribution: 0.3,
    mode: 0
});

addNoise(gui.addFolder("3D test"), {
    noiseType: 2,
    fractalType: 0,
    frequency: 0.012,
    octaves: 0,
    lacunarity: 0,
    gain: 0,
    contribution: 0.3,
    mode: 1
});


const renderer = new Renderer(canvas, gl);
const boxdrawer = new BoxDrawer(gl);
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
                        d: Math.max(Math.max(Math.abs(x), Math.abs(y)), Math.abs(z)),
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
            terrain_params.seed,
            terrain_params.multiplier,
            terrain_params.noises.length, // num_noises
        ],
        noise_params: terrain_params.noises.reduce((acc, noise) => {
            return [...acc, ...Object.values(noise)];
        }, []),
        validIndex: validIndex,
    });
    working = true;
}

// invocado luego de que un chunk esta listo
function chunkReady(result) {
    const chunk = chunks.find(chunk => chunk.x === result.x && chunk.y === result.y && chunk.z === result.z);
    if(chunk) {
        chunk.validIndex = result.validIndex;
        if(chunk.mesh) {
            // limpiar el mesh anterior
            chunk.mesh.destroy();
        }
        chunk.mesh = new Mesh(result.indexBuffer, result.vertBuffer, result.normBuffer, result.colorBuffer, result.texBuffer, renderer.gl);
        screenDirty = true;
    }
    working = false;
    nextChunk();
}

function frame() {
    stats.begin();
    // con esto evitamos renderizar cosas innecesarias
    if (screenDirty) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        const CamMatrix = MatrixMult(
            ProjectionMatrix(canvas, -10),
            TranslationMatrix(0, 0, transZ),
            RotationMatrix(rotX, rotY)
        );

        for(const chunk of chunks) {
            if(chunk.mesh) {
                const ModelMatrix = TranslationMatrix(2*chunk.x, 2*chunk.y, 2*chunk.z);
                const MVP = MatrixMult(CamMatrix, ModelMatrix);
                renderer.drawMesh(ModelMatrix, MVP, chunk.mesh, chunk.validIndex !== validIndex);
            }
        }

        const S = (terrain_params.render_distance - 1) * 2 + 1;
        boxdrawer.draw(MatrixMult(CamMatrix, ScaleMatrix(S, S, S)));

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
