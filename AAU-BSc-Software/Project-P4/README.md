# Project-P4: TinyCell Compiler

## Overview

This project, developed by a team and I at Aalborg University, introduces the "TinyCell" compiler. The primary goal of this project is to translate a custom syntax, designed using ANTLR, into Arduino C for deployment on Arduino boards. The integration of the Arduino CLI streamlines the compilation and flashing processes, making it easier to work with Arduino hardware.

## Key Features

**Design and Implementation:** The project consists of three main components:

- **Executable Console (P4.TinyCell):** A command-line interface for users to interact with the compiler.
- **Shared DLL (P4.TinyCell.Shared):** A dynamic-link library containing shared functionalities used across the project.
- **Testing Suite (P4.TinyCell.Tests):** A comprehensive set of tests to ensure the reliability and robustness of the compiler.

**Extensive Testing:** The project includes over 249 unit, integration, and acceptance tests, ensuring that the software performs reliably under various conditions.

**Advanced Features:**

- **Lexer and Parser:** Developed from .g4 files using ANTLR, enabling the translation of custom syntax to Arduino C.
- **Custom AST and Visitor Pattern:** Implemented a custom Abstract Syntax Tree (AST) and used the visitor pattern for type checking and code generation.
- **Arduino CLI Integration:** Embedded the Arduino CLI into the project, allowing direct compilation of Arduino C code to binary and facilitating operations such as flashing the code onto Arduino boards.

## Technical Details

- **Development Environment:** Visual Studio.
- **Programming Languages and Tools:** C#, ANTLR, xUnit, Arduino CLI.

## Usage

To use the TinyCell compiler, follow these steps:

1. Open a Command Line Interface (CLI).
2. Run the compiler with the following command:
   `./tcc <input_file>`
   Replace `<input_file>` with the name of your file, which should have either a `.txt` or `.tc` extension.

**Note for Linux Users:** The compiler should be run using `sudo` due to certain permission issues. Additionally, commands like "monitor" and "upload" that require an Arduino board will only be functional if a compatible board is connected to your computer.

## Future Work

- Enhancement of the lexer and parser for more complex syntax support.
- Expansion of the testing suite to cover additional edge cases and scenarios.
- Integration of support for additional microcontroller platforms beyond Arduino.
