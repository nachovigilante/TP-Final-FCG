class Renderer {
    constructor(canvas) {
        this.canvas = canvas;

        const gl = (this.gl = canvas.getContext("webgl", { antialias: false, depth: true }));
        if (!gl) {
            alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
            return;
        }

        canvas.oncontextmenu = () => false;

        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.DEPTH_TEST);

        this.resize();
        
		// 1. Compilamos el programa de shaders
        this.prog = InitShaderProgram(shaderVS, shaderFS, gl);
        
		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        
		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.pos = gl.getAttribLocation(this.prog, 'pos');
    }

    resize() {
        const { canvas, gl } = this;

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = pixelRatio * canvas.clientWidth;
        canvas.height = pixelRatio * canvas.clientHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    draw(matrixMVP, meshes) {
        const { canvas, gl } = this;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);

        for(const mesh of meshes) {
            mesh.prepare(this.prog);
            mesh.draw();
        }
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
    vertCoord = mvp * vec4(pos, 1.0);
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
    vec3 C = vec3(1.0, 0.0, 1.0);
    gl_FragColor = vec4(C, 1.0);
}

`;
