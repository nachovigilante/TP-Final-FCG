importScripts("Native.js");

console.log("Worker ready");

function generate_chunk(x, y, z, params, noise_params, validIndex) {
    // alocar memoria de antemano
    let indexNumAddress = Module._malloc(4);
    let vertNumAddress = Module._malloc(4);
    let indexAddress = Module._malloc(80000000 * 3);
    let vertAddress = Module._malloc(80000000 * 3);
    let normAddress = Module._malloc(80000000 * 3);
    let colorAddress = Module._malloc(80000000 * 3);
    let texAddress = Module._malloc(80000000 * 3);
    let noiseParams = Module._malloc(1000 * 4);
    Module.HEAPF32.set(noise_params, noiseParams / 4);

    // generar
    Module._generate_mesh(indexNumAddress, vertNumAddress, indexAddress, vertAddress, normAddress, colorAddress, texAddress, x, y, z, ...params, noiseParams);

    // extraer buffers
    let numVerts = Module.HEAP32[vertNumAddress / 4];
    let numIndices = Module.HEAP32[indexNumAddress / 4];
    let indexBuffer = Module.HEAP32.slice(indexAddress / 4, indexAddress / 4 + numIndices);
    let vertBuffer = Module.HEAPF32.slice(vertAddress / 4, vertAddress / 4 + numVerts * 3);
    let normBuffer = Module.HEAPF32.slice(normAddress / 4, normAddress / 4 + numVerts * 3);
    let colorBuffer = Module.HEAPF32.slice(colorAddress / 4, colorAddress / 4 + numVerts * 4);
    let texBuffer = Module.HEAPF32.slice(texAddress / 4, texAddress / 4 + numVerts);

    // liberar
    Module._free(vertNumAddress);
    Module._free(indexNumAddress);
    Module._free(indexAddress);
    Module._free(vertAddress);
    Module._free(normAddress);
    Module._free(colorAddress);
    Module._free(texAddress);
    Module._free(noiseParams);

    return {
        x: x,
        y: y,
        z: z,
        indexBuffer,
        vertBuffer,
        normBuffer,
        colorBuffer,
        texBuffer,
        validIndex,
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
    console.log("Runtime initialized", Module);
    self.postMessage("ready");
}
