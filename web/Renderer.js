class Renderer {
    constructor(canvas, gl) {
        this.canvas = canvas;
        this.gl = gl;

        this.init();
    }

    init() {
        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        this.resize();

        this.prog = InitShaderProgram(shaderVS, shaderFS, gl);

        // uniforms
        this.mvp_loc = gl.getUniformLocation(this.prog, "mvp");
        this.m_loc = gl.getUniformLocation(this.prog, "m");
        this.invalid_loc = gl.getUniformLocation(this.prog, "invalid");
        this.sampler_loc = gl.getUniformLocation(this.prog, "texGPU");

        // attributes
        this.pos = gl.getAttribLocation(this.prog, "pos");
        this.uv = gl.getAttribLocation(this.prog, "uv");


        // textures
        
        this.tex_id=0;
        let img = new Image();
        img.src = "texture.png";
        img.onload = () => {
            console.log(img);

            this.tex_id = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.tex_id);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            gl.generateMipmap( gl.TEXTURE_2D );
            console.log("texture loaded");
        };
    }

    resize() {
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = pixelRatio * canvas.clientWidth;
        canvas.height = pixelRatio * canvas.clientHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    drawMesh(matrixM, matrixMVP, mesh, invalid) {
        const { canvas, gl } = this;

        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvp_loc, false, matrixMVP);
        gl.uniformMatrix4fv(this.m_loc, false, matrixM);
        gl.uniform1f(this.invalid_loc, invalid ? 1 : 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex_id);
        gl.uniform1i(this.sampler_loc,0);
        
        mesh.prepare(this.prog);
        mesh.draw();
    }
}

const shaderVS = `
precision mediump float;

attribute vec3 pos;
attribute vec3 normal;
attribute vec2 uv;
attribute vec4 color;

uniform mat4 mvp;
uniform mat4 m;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;
varying vec4 colCoord;

void main()
{
    texCoord = uv;
    normCoord = normal;
    vertCoord = m * vec4(pos,1.0);
    colCoord = color;
    gl_Position = mvp * vec4(pos,1.0);
}
`;

const shaderFS = `
precision mediump float;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;
varying vec4 colCoord;

uniform float invalid;
uniform sampler2D texGPU;

void main()
{
    vec3 l = normalize(vec3(0.5, 0.3, 0.2));
    vec3 v = normalize(vertCoord.xyz);
    vec3 n = normCoord;
    
    float cosTita = dot(n, l);
    vec3 r = 2.0 * cosTita * n - l;
    float cosSigma = dot(r, v);

    n = abs(n);
    n /= dot(n, vec3(1.0, 1.0, 1.0));

    vec4 color = texture2D(texGPU, vertCoord.xy) + texture2D(texGPU, vertCoord.xz) + texture2D(texGPU, vertCoord.zy);

    vec3 Kdif = color.rgb;
    vec3 Kspec = vec3(1.0);
    vec3 Kamb = Kdif;
    vec3 I = vec3(1.0);
    float Ia = 0.08;

    vec3 C = vec3(0.0);
    C += I * max(0.0, cosTita) * Kdif;
    C += Ia * Kamb;

    gl_FragColor = vec4(C, 1.0);
}
`;
