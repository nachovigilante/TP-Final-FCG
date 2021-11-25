#include <iostream>

#include "FastNoiseLite.h"

extern "C" {
    int generate(float* data, float param1) {
        return 2 * param1;
    }
}

int main() {
    return 0;
}