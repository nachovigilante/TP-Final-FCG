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
        this.mvp_loc = gl.getUniformLocation(this.prog, "mvp");
        this.invalid_loc = gl.getUniformLocation(this.prog, "invalid");

        // attributes
        this.pos = gl.getAttribLocation(this.prog, "pos");
    }

    resize() {
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = pixelRatio * canvas.clientWidth;
        canvas.height = pixelRatio * canvas.clientHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    drawMesh(matrixMVP, mesh, invalid) {
        const { canvas, gl } = this;

        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvp_loc, false, matrixMVP);
        gl.uniform1f(this.invalid_loc, invalid ? 1 : 0);
        
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

uniform float invalid;

void main()
{
    vec3 C = normCoord;
    if(invalid > 0.5) {
        // C *= 0.2;
    }
    gl_FragColor = vec4(C, 1.0);
}
`;
