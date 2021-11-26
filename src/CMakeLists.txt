cmake_minimum_required(VERSION 3.16)
project(FCG)

set(CMAKE_CXX_STANDARD 14)

include_directories(../deps/FastNoiseLite/Cpp)

add_executable(Native main.cpp)

if(EMSCRIPTEN)
    target_link_libraries(Native "-s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS=['_generate_mesh','_malloc','_free'] -o ../web/Native.js")
endif()
