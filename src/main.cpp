#include <iostream>
#include <vector>
#include "FastNoiseLite.h"
#include "vertex.h"
#include "color.h"
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

float clamp(float x, float min, float max) {
    return x < min ? min : (x > max ? max : x);
}
float mix(float x, float y, float a) {
    return x * (1 - a) + y * a;
}
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

Color colorize(float xx, float yy, float zz) {
    if(yy > 140) {
        return {1, 1, 1, 1};
    } else if(yy > 120) {
        // grey
        return {0.5, 0.5, 0.5, 1};
    } else if(yy > 105) {
        // darker grey
        return {0.25, 0.25, 0.25, 1};
    } else if(yy > 90) {
        // dark green
        return {0, 0.5, 0, 1};
    } else if(yy > 75) {
        // green
        return {0, 1, 0, 1};
    } else if(yy > 60) {
        // light brown
        return {0.5, 0.25, 0, 1};
    } else if(yy > 45) {
        // dark brown
        return {0.5, 0.25, 0, 1};
    } else if(yy > 15) {
        // dark grey
        return {0.25, 0.25, 0.25, 1};
    } else {
        // darker grey
        return {0.25, 0.25, 0.25, 1};
    }
}

float texturize(int yy){
    if(yy > 140) {
        return 0;
    } else if(yy > 120) {
        return 1;
    } else if(yy > 105) {
        return 2;
    } else if(yy > 90) {
        return 3;
    } else if(yy > 75) {
        return 4;
    } else if(yy > 60) {
        return 5;
    } else if(yy > 45) {
        return 6;
    } else if(yy > 15) {
        return 7;
    } else {
        return 8;
    }
}

extern "C" {
    int generate_mesh(Vertex* vertArray, Vertex* normArray, Color* colorArray, float* textureArray, const int CHUNK_X, const int CHUNK_Y, const int CHUNK_Z, const int SIZE, const float isolevel, const int seed, const float multiplier, const int num_noises, const float* params) {
        vector<FastNoiseLite> noises(num_noises);

        for(int i = 0; i < num_noises; i++) {
            FastNoiseLite& noise = noises[i];
            const float* params_offset = params + i * 7;

            noise.SetSeed(seed);
            noise.SetNoiseType(static_cast<FastNoiseLite::NoiseType>((int)params_offset[0]));
            noise.SetFractalType(static_cast<FastNoiseLite::FractalType>((int)params_offset[1]));
            noise.SetFrequency(params_offset[2]);
            noise.SetFractalOctaves((int)params_offset[3]);
            noise.SetFractalLacunarity(params_offset[4]);
            noise.SetFractalGain(params_offset[5]);
        }

        const float FIXED_BOX_SIZE = 100;
        const float OFFSET_Y_WORLD = FIXED_BOX_SIZE * 2;
        const int SIZE1 = SIZE + 1;
        const int CELLS = SIZE1 * SIZE1 * SIZE1;
        float* points = (float*)malloc(CELLS * sizeof(float));

        // 1. Generar las cuevas
        for (int x = 0; x < SIZE1; x++) {
            for (int y = 0; y < SIZE1; y++) {
                for (int z = 0; z < SIZE1; z++) {
                    float xx = CHUNK_X * FIXED_BOX_SIZE + x * FIXED_BOX_SIZE / SIZE;
                    float yy = CHUNK_Y * FIXED_BOX_SIZE + y * FIXED_BOX_SIZE / SIZE;
                    float zz = CHUNK_Z * FIXED_BOX_SIZE + z * FIXED_BOX_SIZE / SIZE;

                    yy -= OFFSET_Y_WORLD;

                    //float caveNoise = (perlinNoise.GetNoise(xx, yy, zz) + 1.0f) / 2.0f;
                    //float terrainPerlinNoise = (perlinNoise.GetNoise(xx, zz) + 1.0f) / 2.0f;
                    //float terrainCellularNoise = (cellularNoise.GetNoise(xx, zz) + 1.0f) / 2.0f;
                    //float valCave = caveNoise;
                    //float valTerrain = terrainPerlinNoise + terrainCellularNoise * 0.5;

                    //valTerrain = (yy - 30.0f - valTerrain * 100.0f) / 100.0f;

                    //float a = clamp(valTerrain, 0, 1);

                    //float val = (1.0f - a) * caveNoise;
                    //float t = clamp(yy / 30.0f, 0, 1);
                    //float val = opSmoothUnion((1.0f - a), caveNoise, 0.75);
                    //float val = perlinNoise.GetNoise(xx, zz) * 100.0f - yy;

                    float coeff = 0;
                    for(int i = 1; i < num_noises; i++) {
                        FastNoiseLite& noise = noises[i];
                        const float* params_offset = params + i * 7;
                        coeff += noise.GetNoise(xx, zz) * params_offset[6];
                    }
                    float a = clamp(coeff - yy / multiplier, 0, 1);

                    // cave noise
                    float caveNoise = (noises[0].GetNoise(xx, yy, zz) + 1.0f) / 2.0f;

                    float val = opSmoothUnion(a, caveNoise, 0.75);

                    points[x * SIZE1 * SIZE1 + y * SIZE1 + z] = val;
                }
            }
        }

        // 2. Generar el terreno
        //for (int x = 0; x < SIZE1; x++) {
        //    for (int y = SIZE1 * 0.6; y < SIZE1; y++) {
        //        for (int z = 0; z < SIZE1; z++) {
        //            float xx = CHUNK_X * FIXED_BOX_SIZE + x * FIXED_BOX_SIZE / SIZE;
        //            float yy = CHUNK_Y * FIXED_BOX_SIZE + y * FIXED_BOX_SIZE / SIZE;
        //            float zz = CHUNK_Z * FIXED_BOX_SIZE + z * FIXED_BOX_SIZE / SIZE;
        //
        //            //float val = (perlinNoise.GetNoise(xx, yy, zz) + 1.0f) / 2.0f;
        //            float val = (perlinNoise.GetNoise(xx, zz) + 1.0f) / 2.0f;
        //            float val2 = (cellularNoise.GetNoise(xx, zz) + 1.0f) / 2.0f;
        //            
        //            points[x * SIZE1 * SIZE1 + y * SIZE1 + z] = y - val * SIZE * 0.3 - val2 * SIZE * 0.2 - SIZE * 0.6;
        //        }
        //    }
        //}

        int numVertex = 0;
        float val[8];
        Vertex p[8];
        Vertex vertexList[12];

        // 4. Marching Cubes
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
                        const Vertex normal = normalize(crossProduct(c - a, b - a));
                        
                        const Color color = colorize(
                            CHUNK_X * FIXED_BOX_SIZE + x * FIXED_BOX_SIZE / SIZE,
                            CHUNK_Y * FIXED_BOX_SIZE + y * FIXED_BOX_SIZE / SIZE,
                            CHUNK_Z * FIXED_BOX_SIZE + z * FIXED_BOX_SIZE / SIZE
                        );

                        //const float texture = texturize(
                        //    CHUNK_Y * FIXED_BOX_SIZE + y * FIXED_BOX_SIZE / SIZE
                        //);

                        const float texture[9] = {
                            1.0f, 0.0f, 0.0f,
                            0.0f, 0.0f, 0.0f,
                            0.0f, 0.0f, 3.0f
                        };

                        normArray[numVertex] = normal;
                        colorArray[numVertex] = color;
                        for(int i = 0; i < 9; i++)
                            textureArray[numVertex * 9 + i] = texture[i];
                        vertArray[numVertex++] = a;

                        normArray[numVertex] = normal;
                        colorArray[numVertex] = color;
                        for(int i = 0; i < 9; i++)
                            textureArray[numVertex * 9 + i] = texture[i];
                        vertArray[numVertex++] = b;

                        normArray[numVertex] = normal;
                        colorArray[numVertex] = color;
                        for(int i = 0; i < 9; i++)
                            textureArray[numVertex * 9 + i] = texture[i];
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
    /*int numTriangles = generate_mesh(trianglesArray, normalsArray, 0, 0, 0, 100, 0.5, 0.05, 3, 2.0, 0.5, 0);
    cout << "Numero de triangulos: " << numTriangles << endl;*/

    return 0;
}
