importScripts("Native.js");

console.log("Worker ready");

function generate_chunk(x, y, z, params, validIndex) {
    // alocar memoria de antemano
    let vertAddress = Module._malloc(80000000 * 10);
    let normAddress = Module._malloc(80000000 * 10);

    // generar
    let numVerts = Module._generate_mesh(vertAddress, normAddress, x, y, z, ...params);

    // extraer buffers
    let vertBuffer = Module.HEAPF32.slice(vertAddress / 4, vertAddress / 4 + numVerts * 3);
    let normBuffer = Module.HEAPF32.slice(normAddress / 4, normAddress / 4 + numVerts * 3);

    // liberar
    Module._free(vertAddress);
    Module._free(normAddress);

    return {
        x: x,
        y: y,
        z: z,
        vertBuffer,
        normBuffer,
        validIndex
    };
}

self.onmessage = (ev) => {
    const data = ev.data;
    console.time("generate_chunk");
    const result = generate_chunk(data.x, data.y, data.z, data.params, data.validIndex);
    console.timeEnd("generate_chunk");
    self.postMessage(result);
};

Module.onRuntimeInitialized = () => {
    console.log("Runtime initialized");
    self.postMessage("ready");
}
