class Renderer {
    constructor(canvas, gl) {
        this.canvas = canvas;
        this.gl = gl;

        this.init();
    }

    init() {
        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.DEPTH_TEST);
        this.resize();

        this.prog = InitShaderProgram(shaderVS, shaderFS, gl);

        // uniforms
        this.mvp = gl.getUniformLocation(this.prog, "mvp");

        // attributes
        this.pos = gl.getAttribLocation(this.prog, "pos");
    }

    resize() {
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = pixelRatio * canvas.clientWidth;
        canvas.height = pixelRatio * canvas.clientHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    drawMesh(matrixMVP, mesh) {
        const { canvas, gl } = this;

        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
        
        mesh.prepare(this.prog);
        mesh.draw();
    }
}

const shaderVS = `
precision mediump float;

attribute vec3 pos;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 mvp;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;

void main()
{
    texCoord = uv;
    normCoord = normal;
    vertCoord = vec4(pos, 1.0);
    gl_Position = mvp * vec4(pos,1.0);
}
`;

const shaderFS = `
precision mediump float;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;

void main()
{
    vec3 C = normCoord;
    gl_FragColor = vec4(C, 1.0);
}
`;
