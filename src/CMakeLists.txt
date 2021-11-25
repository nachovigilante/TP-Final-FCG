cmake_minimum_required(VERSION 3.16)
project(FCG)

set(CMAKE_CXX_STANDARD 14)

add_executable(Native main.cpp)

target_link_libraries(Native "-s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS=['_main'] -o ../web/Native.js")
