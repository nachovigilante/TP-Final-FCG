#pragma once

struct Vertex {
    float x;
    float y;
    float z;
};

Vertex operator-(const Vertex& a, const Vertex& b) {
    Vertex c;
    c.x = a.x - b.x;
    c.y = a.y - b.y;
    c.z = a.z - b.z;
    return c;
}

Vertex operator+(const Vertex& a, const Vertex& b) {
    Vertex c;
    c.x = a.x + b.x;
    c.y = a.y + b.y;
    c.z = a.z + b.z;
    return c;
}

Vertex operator*(const Vertex& a, const float& b) {
    return { a.x * b, a.y * b, a.z * b };
}

Vertex crossProduct(const Vertex& A, const Vertex& B) {
    Vertex C;
    C.x = A.y * B.z - A.z * B.y;
    C.y = A.z * B.x - A.x * B.z;
    C.z = A.x * B.y - A.y * B.x;
    return C;
}

Vertex normalize(const Vertex& V) {
    float length = sqrt(V.x * V.x + V.y * V.y + V.z * V.z);
    Vertex N;
    N.x = V.x / length;
    N.y = V.y / length;
    N.z = V.z / length;
    return N;
}
