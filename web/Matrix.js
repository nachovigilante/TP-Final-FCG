function ProjectionMatrix(c, z, fov_angle=60) {
    var r = c.width / c.height;
    var n = (z - 1.74);
    const min_n = 0.001;
    if ( n < min_n ) n = min_n;
    var f = (z + 1.74);
    var fov = 3.145 * fov_angle / 180;
    var s = 1 / Math.tan( fov/2 );
    return [
        s/r, 0, 0, 0,
        0, s, 0, 0,
        0, 0, (n+f)/(f-n), 1,
        0, 0, -2*n*f/(f-n), 0
    ];
}

// Multiplica 2 matrices y devuelve A*B.
// Los argumentos y el resultado son arreglos que representan matrices en orden column-major
function MatrixMultSingle(A, B) {
	var C = [];
	for ( var i=0; i<4; ++i ) 
	{
		for ( var j=0; j<4; ++j ) 
		{
			var v = 0;
			for ( var k=0; k<4; ++k ) 
			{
				v += A[j+4*k] * B[k+4*i];
			}

			C.push(v);
		}
	}
	return C;
}

function MatrixMult(...matrices) {
    var result = matrices[0];
    for ( var i=1; i<matrices.length; ++i ) {
        result = MatrixMultSingle(result, matrices[i]);
    }
    return result;
}

function TranslationMatrix(tX, tY, tZ) {
	return [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		tX, tY, tZ, 1
	];
}

function RotationMatrix(rotationX, rotationY) {
	var rotX = [
		1,0,0,0, 
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0,-Math.sin(rotationX), Math.cos(rotationX), 0,
		0,0,0,1 
	];

	var rotY = [
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0, 
		0,1,0,0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0,0,0,1 
	];

	return MatrixMult(rotX, rotY);
}

function ScaleMatrix(scaleX, scaleY, scaleZ) {
    return [
        scaleX, 0, 0, 0,
        0, scaleY, 0, 0,
        0, 0, scaleZ, 0,
        0, 0, 0, 1
    ];
}