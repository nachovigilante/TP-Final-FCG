#include <iostream>
#include <vector>
#include "FastNoiseLite.h"
#include "vertex.h"
#include "triangulation.h"

using namespace std;

inline Vertex vertexInterp(const float isolevel, const Vertex& p1, const  Vertex& p2, const float v1, const float v2) {
    if (abs(isolevel - v1) < 0.00001 || abs(v1 - v2) < 0.00001)
        return(p1);
    if (abs(isolevel - v2) < 0.00001)
        return(p2);

    float mu = (isolevel - v1) / (v2 - v1);
    return {
        p1.x + mu * (p2.x - p1.x),
        p1.y + mu * (p2.y - p1.y),
        p1.z + mu * (p2.z - p1.z)
    };
}

extern "C" {
    int generate_mesh(Vertex* vertArray, Vertex* normArray, const int CHUNK_X, const int CHUNK_Y, const int CHUNK_Z, const int SIZE, const float isolevel, const float frequency, const int octaves, const float lacunarity, const float gain) {
        FastNoiseLite noise;
        noise.SetNoiseType(FastNoiseLite::NoiseType::NoiseType_Perlin);
        noise.SetFrequency(frequency);
        noise.SetFractalOctaves(octaves);
        noise.SetFractalLacunarity(lacunarity);
        noise.SetFractalGain(gain);

        const float FIXED_BOX_SIZE = 100;
        const int SIZE1 = SIZE + 1;
        const int CELLS = SIZE1 * SIZE1 * SIZE1;
        float* points = (float*)malloc(CELLS * sizeof(float));

        // 1. Generar la nube de puntos
        //for (int x = 0; x < SIZE1; x++) {
        //    for (int y = 0; y < SIZE1; y++) {
        //        for (int z = 0; z < SIZE1; z++) {
        //            float xx = CHUNK_X * FIXED_BOX_SIZE + x * FIXED_BOX_SIZE / SIZE;
        //            float yy = CHUNK_Y * FIXED_BOX_SIZE + y * FIXED_BOX_SIZE / SIZE;
        //            float zz = CHUNK_Z * FIXED_BOX_SIZE + z * FIXED_BOX_SIZE / SIZE;
        //            float val = (noise.GetNoise(xx, yy, zz) + 1.0f) / 2.0f;
        //
        //            points[x * SIZE1 * SIZE1 + y * SIZE1 + z] = val;
        //        }
        //    }
        //}

        // 1. Generar el terreno
        for (int x = 0; x < SIZE1; x++) {
            for (int y = 0; y < SIZE1; y++) {
                for (int z = 0; z < SIZE1; z++) {
                    float xx = CHUNK_X * FIXED_BOX_SIZE + x * FIXED_BOX_SIZE / SIZE;
                    float yy = CHUNK_Y * FIXED_BOX_SIZE + y * FIXED_BOX_SIZE / SIZE;
                    float zz = CHUNK_Z * FIXED_BOX_SIZE + z * FIXED_BOX_SIZE / SIZE;
                    float val = (noise.GetNoise(xx, yy, zz) + 1.0f) / 2.0f;
        
                    points[x * SIZE1 * SIZE1 + y * SIZE1 + z] = -y * 0.2 + val;
                }
            }
        }

        int numVertex = 0;
        float val[8];
        Vertex p[8];
        Vertex vertexList[12];

        // 2. Marching Cubes
        for (int x = 0; x < SIZE; x++) {
            for (int y = 0; y < SIZE; y++) {
                for (int z = 0; z < SIZE; z++) {
                    float xx = x;
                    float yy = y;
                    float zz = z;
                    p[0] = { xx, yy, zz };
                    p[1] = { xx + 1, yy, zz };
                    p[2] = { xx + 1,yy,zz + 1 };
                    p[3] = { xx, yy, zz + 1 };
                    p[4] = { xx, yy + 1, zz };
                    p[5] = { xx + 1, yy + 1, zz };
                    p[6] = { xx + 1, yy + 1, zz + 1 };
                    p[7] = { xx , yy + 1, zz + 1 };

                    int cubeIndex = 0;
                    val[0] = points[(x + 0) * SIZE1 * SIZE1 + (y + 0) * SIZE1 + (z + 0)];
                    val[1] = points[(x + 1) * SIZE1 * SIZE1 + (y + 0) * SIZE1 + (z + 0)];
                    val[2] = points[(x + 1) * SIZE1 * SIZE1 + (y + 0) * SIZE1 + (z + 1)];
                    val[3] = points[(x + 0) * SIZE1 * SIZE1 + (y + 0) * SIZE1 + (z + 1)];
                    val[4] = points[(x + 0) * SIZE1 * SIZE1 + (y + 1) * SIZE1 + (z + 0)];
                    val[5] = points[(x + 1) * SIZE1 * SIZE1 + (y + 1) * SIZE1 + (z + 0)];
                    val[6] = points[(x + 1) * SIZE1 * SIZE1 + (y + 1) * SIZE1 + (z + 1)];
                    val[7] = points[(x + 0) * SIZE1 * SIZE1 + (y + 1) * SIZE1 + (z + 1)];

                    // Busco qué vertices están dentro del cubo
                    // y determino el índice en edgeTable
                    if (val[0] < isolevel) cubeIndex |= 1;
                    if (val[1] < isolevel) cubeIndex |= 2;
                    if (val[2] < isolevel) cubeIndex |= 4;
                    if (val[3] < isolevel) cubeIndex |= 8;
                    if (val[4] < isolevel) cubeIndex |= 16;
                    if (val[5] < isolevel) cubeIndex |= 32;
                    if (val[6] < isolevel) cubeIndex |= 64;
                    if (val[7] < isolevel) cubeIndex |= 128;

                    // Si no hay ningún vertice dentro del cubo, no hago nada
                    if (edgeTable[cubeIndex] == 0) continue;

                    // Si hay alguno, busco los triangulos
                    int edge = edgeTable[cubeIndex];

                    if (edge & 1)
                        vertexList[0] = vertexInterp(isolevel, p[0], p[1], val[0], val[1]);
                    if (edge & 2)
                        vertexList[1] = vertexInterp(isolevel, p[1], p[2], val[1], val[2]);
                    if (edge & 4)
                        vertexList[2] = vertexInterp(isolevel, p[2], p[3], val[2], val[3]);
                    if (edge & 8)
                        vertexList[3] = vertexInterp(isolevel, p[3], p[0], val[3], val[0]);
                    if (edge & 16)
                        vertexList[4] = vertexInterp(isolevel, p[4], p[5], val[4], val[5]);
                    if (edge & 32)
                        vertexList[5] = vertexInterp(isolevel, p[5], p[6], val[5], val[6]);
                    if (edge & 64)
                        vertexList[6] = vertexInterp(isolevel, p[6], p[7], val[6], val[7]);
                    if (edge & 128)
                        vertexList[7] = vertexInterp(isolevel, p[7], p[4], val[7], val[4]);
                    if (edge & 256)
                        vertexList[8] = vertexInterp(isolevel, p[0], p[4], val[0], val[4]);
                    if (edge & 512)
                        vertexList[9] = vertexInterp(isolevel, p[1], p[5], val[1], val[5]);
                    if (edge & 1024)
                        vertexList[10] = vertexInterp(isolevel, p[2], p[6], val[2], val[6]);
                    if (edge & 2048)
                        vertexList[11] = vertexInterp(isolevel, p[3], p[7], val[3], val[7]);

                    // Genero los triangulos
                    for (int i = 0; triTable[cubeIndex][i] != -1; i += 3) {
                        const Vertex& a = vertexList[triTable[cubeIndex][i]];
                        const Vertex& b = vertexList[triTable[cubeIndex][i + 1]];
                        const Vertex& c = vertexList[triTable[cubeIndex][i + 2]];
                        const Vertex normal = normalize(crossProduct(b - a, c - a));

                        normArray[numVertex] = normal;
                        vertArray[numVertex++] = a;
                        normArray[numVertex] = normal;
                        vertArray[numVertex++] = b;
                        normArray[numVertex] = normal;
                        vertArray[numVertex++] = c;
                    }
                }
            }
        }

        const float scale = 2.0f / (float)SIZE;
        const Vertex offset = { 1.0f, 1.0f, 1.0f };
        for (int i = 0; i < numVertex; i++) {
            vertArray[i] = vertArray[i] * scale - offset;
        }

        free(points);

        return numVertex;
    }
}

int main() {
    Vertex* trianglesArray = (Vertex*)malloc(100 * 100 * 100 * 1000);
    Vertex* normalsArray = (Vertex*)malloc(100 * 100 * 100 * 1000);
    int numTriangles = generate_mesh(trianglesArray, normalsArray, 0, 0, 0, 100, 0.5, 0.05, 3, 2.0, 0.5);
    cout << "Numero de triangulos: " << numTriangles << endl;

    return 0;
}
