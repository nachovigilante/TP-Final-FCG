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
        this.sampler_loc = [];
        for(let i = 0; i < 9; i++) {
            this.sampler_loc[i] = gl.getUniformLocation(this.prog, "tex" + i);
        }

        // attributes
        this.pos = gl.getAttribLocation(this.prog, "pos");
        this.uv = gl.getAttribLocation(this.prog, "uv");


        // textures
        
        this.tex_id = [];
        for(let i = 0; i < 9; i++) {
            let img = new Image();
            img.src = `./texture/terrain_${i}.jpg`;
            img.onload = () => {
                console.log(img);

                this.tex_id[i] = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this.tex_id[i]);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

                gl.generateMipmap( gl.TEXTURE_2D );
                console.log("texture loaded");
            };
        }
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
        
        for(let i = 0; i < 9; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, this.tex_id[i]);
            gl.uniform1i(this.sampler_loc[i], i);
        }
        
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
attribute float texture;

uniform mat4 mvp;
uniform mat4 m;

varying vec2 texCoord;
varying mat3 texCont;
varying vec3 normCoord;
varying vec4 vertCoord;
varying vec4 colCoord;

mat3 getTextureContribution(int t) {
    mat3 result = mat3(0.0);
    if(t == 0) result[0][0] = 1.0;
    if(t == 1) result[0][1] = 1.0;
    if(t == 2) result[0][2] = 1.0;
    if(t == 3) result[1][0] = 1.0;
    if(t == 4) result[1][1] = 1.0;
    if(t == 5) result[1][2] = 1.0;
    if(t == 6) result[2][0] = 1.0;
    if(t == 7) result[2][1] = 1.0;
    if(t == 8) result[2][2] = 1.0;
    return result;
}

void main()
{
    texCoord = uv;    
    texCont = getTextureContribution(int(texture));
    normCoord = normal;
    vertCoord = m * vec4(pos,1.0);
    colCoord = color;
    gl_Position = mvp * vec4(pos,1.0);
}
`;

const shaderFS = `
precision mediump float;

varying vec2 texCoord;
varying mat3 texCont;
varying vec3 normCoord;
varying vec4 vertCoord;
varying vec4 colCoord;

uniform float invalid;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D tex4;
uniform sampler2D tex5;
uniform sampler2D tex6;
uniform sampler2D tex7;
uniform sampler2D tex8;

vec3 getTextureColor(sampler2D tex, vec3 n) {
    vec4 color = texture2D(tex, vertCoord.xy) * n.z + texture2D(tex, vertCoord.xz) * n.y + texture2D(tex, vertCoord.zy) * n.x;
    return color.rgb;
}

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

    vec3 Kdif =   getTextureColor(tex0, n) * texCont[0][0]
                + getTextureColor(tex1, n) * texCont[0][1]
                + getTextureColor(tex2, n) * texCont[0][2] 
                + getTextureColor(tex3, n) * texCont[1][0]
                + getTextureColor(tex4, n) * texCont[1][1]
                + getTextureColor(tex5, n) * texCont[1][2]
                + getTextureColor(tex6, n) * texCont[2][0]
                + getTextureColor(tex7, n) * texCont[2][1]
                + getTextureColor(tex8, n) * texCont[2][2];

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
