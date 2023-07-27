cmake_minimum_required(VERSION 3.0)
project(Aalborg-University-Projects C)

set(CMAKE_C_STANDARD 11)

add_subdirectory(Prototypes)
add_subdirectory(Solution)

enable_testing()
add_subdirectory(Test)