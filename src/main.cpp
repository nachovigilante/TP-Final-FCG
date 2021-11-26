#include <iostream>

#include "FastNoiseLite.h"
#include "triangulation.h"
#include <vector>

using namespace std;

extern "C" {
    int generate(float* data, float param1) {

        return 2 * param1;
    }
}

typedef struct {
    int x;
    int y;
    int z;
} Vertex;

typedef struct {
   Vertex p[3];
} Triangle;

typedef struct {
   Vertex p[8];
   double val[8];
} Gridcell;

Vertex VertexInterp(double isolevel, Vertex p1, Vertex p2, double valp1, double valp2){
    double mu;
    Vertex p;

    if (abs(isolevel-valp1) < 0.00001)
        return(p1);
    if (abs(isolevel-valp2) < 0.00001)
        return(p2);
    if (abs(valp1-valp2) < 0.00001)
        return(p1);
    
    mu = (isolevel - valp1) / (valp2 - valp1);
    p.x = p1.x + mu * (p2.x - p1.x);
    p.y = p1.y + mu * (p2.y - p1.y);
    p.z = p1.z + mu * (p2.z - p1.z);

    return(p);
}

void reconstructCube(Gridcell grid, double isolevel, Triangle* triangles, int* numTriangles) {
    int cubeIndex = 0;
    
    // Busco qué vertices están dentro del cubo
    // y determino el índice en edgeTable
    if (grid.val[0] < isolevel) cubeIndex |= 1;
    if (grid.val[1] < isolevel) cubeIndex |= 2;
    if (grid.val[2] < isolevel) cubeIndex |= 4;
    if (grid.val[3] < isolevel) cubeIndex |= 8;
    if (grid.val[4] < isolevel) cubeIndex |= 16;
    if (grid.val[5] < isolevel) cubeIndex |= 32;
    if (grid.val[6] < isolevel) cubeIndex |= 64;
    if (grid.val[7] < isolevel) cubeIndex |= 128;

    // Si no hay ningún vertice dentro del cubo, no hago nada
    if (edgeTable[cubeIndex] == 0) return;

    // Si hay alguno, busco los triangulos
    int edge = edgeTable[cubeIndex];
    Vertex vertexList[12];

    // Escribo los vertices en el arreglo
    if (edge & 1)
        vertexList[0] = VertexInterp(isolevel, grid.p[0], grid.p[1], grid.val[0], grid.val[1]);
    if (edge & 2)
        vertexList[1] = VertexInterp(isolevel, grid.p[1], grid.p[2], grid.val[1], grid.val[2]);
    if (edge & 4)
        vertexList[2] = VertexInterp(isolevel, grid.p[2], grid.p[3], grid.val[2], grid.val[3]);
    if (edge & 8)
        vertexList[3] = VertexInterp(isolevel, grid.p[3], grid.p[0], grid.val[3], grid.val[0]);
    if (edge & 16)
        vertexList[4] = VertexInterp(isolevel, grid.p[4], grid.p[5], grid.val[4], grid.val[5]);
    if (edge & 32)
        vertexList[5] = VertexInterp(isolevel, grid.p[5], grid.p[6], grid.val[5], grid.val[6]);
    if (edge & 64)
        vertexList[6] = VertexInterp(isolevel, grid.p[6], grid.p[7], grid.val[6], grid.val[7]);
    if (edge & 128)
        vertexList[7] = VertexInterp(isolevel, grid.p[7], grid.p[4], grid.val[7], grid.val[4]);
    if (edge & 256)
        vertexList[8] = VertexInterp(isolevel, grid.p[0], grid.p[4], grid.val[0], grid.val[4]);
    if (edge & 512)
        vertexList[9] = VertexInterp(isolevel, grid.p[1], grid.p[5], grid.val[1], grid.val[5]);
    if (edge & 1024)
        vertexList[10] = VertexInterp(isolevel, grid.p[2], grid.p[6], grid.val[2], grid.val[6]);
    if (edge & 2048)
        vertexList[11] = VertexInterp(isolevel, grid.p[3], grid.p[7], grid.val[3], grid.val[7]);

    // Genero los triangulos
    for (int i = 0; triTable[cubeIndex][i] != -1; i += 3) {
        triangles[*numTriangles].p[0] = vertexList[triTable[cubeIndex][i]];
        triangles[*numTriangles].p[1] = vertexList[triTable[cubeIndex][i+1]];
        triangles[*numTriangles].p[2] = vertexList[triTable[cubeIndex][i+2]];
        (*numTriangles)++;
    }
}

int main() {
    const int minX = 0, minY = 0, maxX = 100, maxY = 100;
    const double isolevel = 0.0;

    vector<vector<vector<float>>> grid;
    grid.resize(maxX - minX);
    for (int x = 0; x < maxX - minX; x++) {
        grid[x].resize(maxY - minY);
        for (int y = 0; y < maxY - minY; y++) {
            grid[x][y].resize(maxY - minY);
            for (int z = 0; z < maxY - minY; z++) {
                grid[x][y][z] = rand();
            }
        }
    }
    
    

    return 0;
}