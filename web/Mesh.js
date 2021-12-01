class Mesh {
    constructor(indexBuffer, vertPos, normPos, colorPos, texPos, gl) {
        this.gl = gl;
        this.numIdxs = indexBuffer.length;

        this.index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW);

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
        this.gl.deleteBuffer(this.index_buffer);
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
        gl.vertexAttribPointer(this.location_tex, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.location_tex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

        gl.drawElements(gl.TRIANGLES, this.numIdxs, gl.UNSIGNED_INT, 0);

        gl.disableVertexAttribArray(this.location_pos);
        gl.disableVertexAttribArray(this.location_normal);
        gl.disableVertexAttribArray(this.color_buffer);
        gl.disableVertexAttribArray(this.texture_buffer);
    }
}
