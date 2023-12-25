# Project-P2: Crowd Crush Prevention

## Overview
This research project, created by Group cs-23-SW-2-15 at Aalborg University (AAU), focuses on the simulation of crowd crush scenarios. Using vanilla JavaScript and a custom-built flow field algorithm, the project provides a grid-based framework for users to create, save, and load various simulation layouts. The purpose of this work is to raise awareness and demonstrate the consequences of uncontrolled crowd movements in constrained spaces.

**Disclaimer:** The group is not liable for any damages to property, injuries to people, or deaths related to any inaccuracies of this project.

## Features
**Custom Layouts:** Users can draw walls on a grid-based framework and also erase them. This interaction is performed by holding down the mouse. If the mouse is held on a wall, the wall gets erased; if on an empty space, a wall is drawn.

**Entrances and Exits:** Multiple entrances can be created for agent spawning. The spawn rate is balanced according to the sizes of these entrance points. Currently, there is support only for unidirectional movement, meaning agents move from the entrance to the exit without any reverse flow.

**Customized Flow Field Algorithm:** Inspired by various sources, our team developed a unique flow field algorithm that directs the movement of the agents.

**Collision Detection:** A built-in mechanism prevents agents from colliding, ensuring more realistic crowd movement.

## Technical Details
- **Development Environment:** Visual Studio Code.
- **Programming Language:** Vanilla JavaScript.
- **Server-side Functionality:** This allows for saving and loading of user-created simulation layouts.

## Usage
To run this node app:
```
npm run start
```
The app will start and be accessible on port 8080.

## Future Work
- Integration of bidirectional movement to simulate more complex scenarios.
- Enhancement of the flow field algorithm for optimal crowd movement.