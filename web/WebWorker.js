importScripts("Native.js");

console.log("Worker ready");

function generate_chunk(x, y, z, params, noise_params, validIndex) {
    // alocar memoria de antemano
    let vertAddress = Module._malloc(80000000 * 5);
    let normAddress = Module._malloc(80000000 * 5);
    let colorAddress = Module._malloc(80000000 * 5);
    let noiseParams = Module._malloc(1000 * 4);
    Module.HEAPF32.set(noise_params, noiseParams / 4);

    // generar
    let numVerts = Module._generate_mesh(vertAddress, normAddress, colorAddress, x, y, z, ...params, noiseParams);

    // extraer buffers
    let vertBuffer = Module.HEAPF32.slice(vertAddress / 4, vertAddress / 4 + numVerts * 3);
    let normBuffer = Module.HEAPF32.slice(normAddress / 4, normAddress / 4 + numVerts * 3);
    let colorBuffer = Module.HEAPF32.slice(colorAddress / 4, colorAddress / 4 + numVerts * 4);

    // liberar
    Module._free(vertAddress);
    Module._free(normAddress);
    Module._free(colorAddress);
    Module._free(noiseParams);

    return {
        x: x,
        y: y,
        z: z,
        vertBuffer,
        normBuffer,
        colorBuffer,
        validIndex
    };
}

self.onmessage = (ev) => {
    const data = ev.data;
    console.time("generate_chunk");
    const result = generate_chunk(data.x, data.y, data.z, data.params, data.noise_params, data.validIndex);
    console.timeEnd("generate_chunk");
    self.postMessage(result);
};

Module.onRuntimeInitialized = () => {
    console.log("Runtime initialized");
    self.postMessage("ready");
}
