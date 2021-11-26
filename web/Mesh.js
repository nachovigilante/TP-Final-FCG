class Mesh {
    constructor(vertPos, gl) {
        this.gl = gl;
        this.numTris = vertPos.length / 3;

        this.vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertPos, gl.STATIC_DRAW);
    }

    prepare(prog) {
        this.prog = prog;
		this.location_pos = this.gl.getAttribLocation(this.prog, 'pos');
    }

    draw() {
        const { gl } = this;

		gl.useProgram(this.prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.vertexAttribPointer(this.location_pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.location_pos);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTris);

        gl.disableVertexAttribArray(this.location_pos);
    }
}
