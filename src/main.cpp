#include <iostream>
#include <vector>
#include "FastNoiseLite.h"
#include "triangulation.h"

using namespace std;

struct Vertex{
    float x;
    float y;
    float z;
};

Vertex operator-(Vertex a, Vertex b) {
    Vertex c;
    c.x = a.x - b.x;
    c.y = a.y - b.y;
    c.z = a.z - b.z;
    return c;
}

struct Triangle{
   Vertex p[3];
};

struct Gridcell{
   Vertex p[8];
   float val[8];
};

Vertex crossProduct(Vertex A, Vertex B) {
    Vertex C;
    C.x = A.y * B.z - A.z * B.y;
    C.y = A.z * B.x - A.x * B.z;
    C.z = A.x * B.y - A.y * B.x;
    return C;
}

Vertex normalize(Vertex V) {
    float length = sqrt(V.x * V.x + V.y * V.y + V.z * V.z);
    Vertex N;
    N.x = V.x / length;
    N.y = V.y / length;
    N.z = V.z / length;
    return N;
}


Vertex vertexInterp(float isolevel, Vertex p1, Vertex p2, float v1, float v2){
    float mu;
    Vertex p;

    if (abs(isolevel-v1) < 0.00001 || abs(v1-v2) < 0.00001)
        return(p1);
    if (abs(isolevel-v2) < 0.00001)
        return(p2);
    
    mu = (isolevel - v1) / (v2 - v1);
    p.x = p1.x + mu * (p2.x - p1.x);
    p.y = p1.y + mu * (p2.y - p1.y);
    p.z = p1.z + mu * (p2.z - p1.z);

    return(p);
}

void marchingCubes(Gridcell cell, float isolevel, Triangle* triangles, Vertex* normals, int* numTriangles) {
    int cubeIndex = 0;
    
    // Busco qué vertices están dentro del cubo
    // y determino el índice en edgeTable
    if (cell.val[0] < isolevel) cubeIndex |= 1;
    if (cell.val[1] < isolevel) cubeIndex |= 2;
    if (cell.val[2] < isolevel) cubeIndex |= 4;
    if (cell.val[3] < isolevel) cubeIndex |= 8;
    if (cell.val[4] < isolevel) cubeIndex |= 16;
    if (cell.val[5] < isolevel) cubeIndex |= 32;
    if (cell.val[6] < isolevel) cubeIndex |= 64;
    if (cell.val[7] < isolevel) cubeIndex |= 128;

    // Si no hay ningún vertice dentro del cubo, no hago nada
    if (edgeTable[cubeIndex] == 0) return;

    // Si hay alguno, busco los triangulos
    int edge = edgeTable[cubeIndex];
    Vertex vertexList[12];

    // Escribo los vertices en el arreglo
    if (edge & 1)
        vertexList[0] = vertexInterp(isolevel, cell.p[0], cell.p[1], cell.val[0], cell.val[1]);
    if (edge & 2)
        vertexList[1] = vertexInterp(isolevel, cell.p[1], cell.p[2], cell.val[1], cell.val[2]);
    if (edge & 4)
        vertexList[2] = vertexInterp(isolevel, cell.p[2], cell.p[3], cell.val[2], cell.val[3]);
    if (edge & 8)
        vertexList[3] = vertexInterp(isolevel, cell.p[3], cell.p[0], cell.val[3], cell.val[0]);
    if (edge & 16)
        vertexList[4] = vertexInterp(isolevel, cell.p[4], cell.p[5], cell.val[4], cell.val[5]);
    if (edge & 32)
        vertexList[5] = vertexInterp(isolevel, cell.p[5], cell.p[6], cell.val[5], cell.val[6]);
    if (edge & 64)
        vertexList[6] = vertexInterp(isolevel, cell.p[6], cell.p[7], cell.val[6], cell.val[7]);
    if (edge & 128)
        vertexList[7] = vertexInterp(isolevel, cell.p[7], cell.p[4], cell.val[7], cell.val[4]);
    if (edge & 256)
        vertexList[8] = vertexInterp(isolevel, cell.p[0], cell.p[4], cell.val[0], cell.val[4]);
    if (edge & 512)
        vertexList[9] = vertexInterp(isolevel, cell.p[1], cell.p[5], cell.val[1], cell.val[5]);
    if (edge & 1024)
        vertexList[10] = vertexInterp(isolevel, cell.p[2], cell.p[6], cell.val[2], cell.val[6]);
    if (edge & 2048)
        vertexList[11] = vertexInterp(isolevel, cell.p[3], cell.p[7], cell.val[3], cell.val[7]);

    // Genero los triangulos
    for (int i = 0; triTable[cubeIndex][i] != -1; i += 3) {
        triangles[*numTriangles].p[0] = vertexList[triTable[cubeIndex][i]];
        triangles[*numTriangles].p[1] = vertexList[triTable[cubeIndex][i+1]];
        triangles[*numTriangles].p[2] = vertexList[triTable[cubeIndex][i+2]];
        
        Vertex normal = crossProduct(triangles[*numTriangles].p[1] - triangles[*numTriangles].p[0], triangles[*numTriangles].p[2] - triangles[*numTriangles].p[0]);
        normalize(normal);
        normals[*numTriangles] = normal;
        (*numTriangles)++;
    }
}

extern "C" {
    int generate(float* trianglesArray, float* normalsArray, float param1) {
        const int min = 0, max = 10;
        const float isolevel = 0.8;

        vector<vector<vector<float>>> pointCloud;
        pointCloud.resize(max - min);
        for (int x = 0; x < max - min; x++) {
            pointCloud[x].resize(max - min);
            for (int y = 0; y < max - min; y++) {
                pointCloud[x][y].resize(max - min);
                for (int z = 0; z < max - min; z++) {
                    pointCloud[x][y][z] = (rand() % 1000) / 1000.0f;
                }
            }
        }

        int numTriangles = 0;
        Triangle* triangles = new Triangle[(max - min) * (max - min) * (max - min) * 5];
        Vertex* normals = new Vertex[(max - min) * (max - min) * (max - min) * 5];

        for (int x = 0; x < max - min - 1; x++) {
            for (int y = 0; y < max - min - 1; y++) {
                for (int z = 0; z < max - min - 1; z++) {
                    Gridcell cell;
                    cell.p[0].x = x;
                    cell.p[0].y = y;
                    cell.p[0].z = z;
                    cell.p[1].x = x + 1;
                    cell.p[1].y = y;
                    cell.p[1].z = z;
                    cell.p[2].x = x + 1;
                    cell.p[2].y = y;
                    cell.p[2].z = z + 1;
                    cell.p[3].x = x;
                    cell.p[3].y = y;
                    cell.p[3].z = z + 1;
                    cell.p[4].x = x;
                    cell.p[4].y = y + 1;
                    cell.p[4].z = z;
                    cell.p[5].x = x + 1;
                    cell.p[5].y = y + 1;
                    cell.p[5].z = z;
                    cell.p[6].x = x + 1;
                    cell.p[6].y = y + 1;
                    cell.p[6].z = z + 1;
                    cell.p[7].x = x;
                    cell.p[7].y = y + 1;
                    cell.p[7].z = z + 1;
                    cell.val[0] = pointCloud[x][y][z];
                    cell.val[1] = pointCloud[x + 1][y][z];
                    cell.val[2] = pointCloud[x + 1][y][z + 1];
                    cell.val[3] = pointCloud[x][y][z + 1];
                    cell.val[4] = pointCloud[x][y + 1][z];
                    cell.val[5] = pointCloud[x + 1][y + 1][z];
                    cell.val[6] = pointCloud[x + 1][y + 1][z + 1];
                    cell.val[7] = pointCloud[x][y + 1][z + 1];
                    marchingCubes(cell, isolevel, triangles, normals, &numTriangles);
                }
            }
        }

        // Escribo los triangulos en el arreglo
        for (int i = 0; i < numTriangles; i++) {
            trianglesArray[i * 9 + 0] = triangles[i].p[0].x;
            trianglesArray[i * 9 + 1] = triangles[i].p[0].y;
            trianglesArray[i * 9 + 2] = triangles[i].p[0].z;
            trianglesArray[i * 9 + 3] = triangles[i].p[1].x;
            trianglesArray[i * 9 + 4] = triangles[i].p[1].y;
            trianglesArray[i * 9 + 5] = triangles[i].p[1].z;
            trianglesArray[i * 9 + 6] = triangles[i].p[2].x;
            trianglesArray[i * 9 + 7] = triangles[i].p[2].y;
            trianglesArray[i * 9 + 8] = triangles[i].p[2].z;

            normalsArray[i * 9 + 0] = normals[i].x;
            normalsArray[i * 9 + 1] = normals[i].y;
            normalsArray[i * 9 + 2] = normals[i].z;
            normalsArray[i * 9 + 3] = normals[i].x;
            normalsArray[i * 9 + 4] = normals[i].y;
            normalsArray[i * 9 + 5] = normals[i].z;
            normalsArray[i * 9 + 6] = normals[i].x;
            normalsArray[i * 9 + 7] = normals[i].y;
            normalsArray[i * 9 + 8] = normals[i].z;
        }

        return numTriangles * 3;
    }
}

int main() {
    float* trianglesArray = (float*)malloc(100 * 100 * 100 * 1000);
    float* normalsArray = (float*)malloc(100 * 100 * 100 * 1000);
    int numTriangles = generate(trianglesArray, normalsArray, 0.0);
    cout << "Numero de triangulos: " << numTriangles << endl;

    return 0;
}
