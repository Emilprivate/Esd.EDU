cmake_minimum_required(VERSION 3.24)
project(Aalborg_University_Homework C)

set(CMAKE_C_STANDARD 11)

add_executable(Handin1 "Imperative-Programming/Hand-in-assignments/handin1.c")
add_executable(Handin2 "Imperative-Programming/Hand-in-assignments/handin2.c")
add_executable(Handin3 "Imperative-Programming/Hand-in-assignments/handin3.c")
add_executable(Handin4 "Imperative-Programming/Hand-in-assignments/handin4.c")
add_executable(Handin5 "Imperative-Programming/Hand-in-assignments/handin5.c")

add_executable(Miniproject1 "Imperative-Programming/Miniprojects/miniproject1.c")
add_executable(Miniproject2 "Imperative-Programming/Miniprojects/miniproject2.c")
add_executable(Miniproject3 "Imperative-Programming/Miniprojects/miniproject3.c")

file(COPY Imperative-Programming/Miniprojects/Ressources/ DESTINATION "${CMAKE_BINARY_DIR}")
