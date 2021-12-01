class Mesh {
    constructor(vertPos, normPos, colorPos, texPos, gl) {
        this.gl = gl;
        this.numTris = vertPos.length / 3;

        this.vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertPos, gl.STATIC_DRAW);
        
        this.normal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, normPos, gl.STATIC_DRAW);
        
        this.color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorPos, gl.STATIC_DRAW);

        this.texture_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, texPos, gl.STATIC_DRAW);
    }

    destroy() {
        this.gl.deleteBuffer(this.vertex_buffer);
        this.gl.deleteBuffer(this.normal_buffer);
        this.gl.deleteBuffer(this.color_buffer);
        this.gl.deleteBuffer(this.texture_buffer);
    }

    prepare(prog) {
        this.prog = prog;
		this.location_pos = this.gl.getAttribLocation(this.prog, 'pos');
		this.location_normal = this.gl.getAttribLocation(this.prog, 'normal');
        this.location_color = this.gl.getAttribLocation(this.prog, 'color');
        this.location_tex = this.gl.getAttribLocation(this.prog, 'texture');
    }

    draw() {
        const { gl } = this;

		gl.useProgram(this.prog);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.vertexAttribPointer(this.location_pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.location_pos);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        gl.vertexAttribPointer(this.location_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.location_normal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.vertexAttribPointer(this.location_color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.location_color);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_buffer);
        gl.vertexAttribPointer(this.location_tex + 0, 3, gl.FLOAT, false, 36, 0);
        gl.vertexAttribPointer(this.location_tex + 1, 3, gl.FLOAT, false, 36, 12);
        gl.vertexAttribPointer(this.location_tex + 2, 3, gl.FLOAT, false, 36, 24);
        gl.enableVertexAttribArray(this.location_tex);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTris);

        gl.disableVertexAttribArray(this.location_pos);
        gl.disableVertexAttribArray(this.location_normal);
    }
}
