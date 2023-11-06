# Chip-8 Emulator

## Overview

Chip 8 is an interpreted minimalist programming langauge for use on the RCA COSMAC VIP computer. It features only 4kB of memory and can use 36 instructions. Chip 8 was very popular in the 1970s and 1980s and nowadays is only used for learning how to make emulators.

This project is heavily based on the incredible information provided at <http://devernay.free.fr/hacks/chip8/C8TECH10.HTM>.

## Background on Chip-8

### Memory

Chip-8 features 4kB of memory (4096 bytes). All of this memory is actually RAM and is writeable. Chip-8 programs can and will modify themselves. The index register and the program counter address a maximum of 4096 addresses which is 12 bit in binary. This means that these registers can point to or reference memory locations within the 4kB of memory available in the Chip-8 system.

The first 512 bytes, from 0x000 to 0x1FF are where the original interpreter was located and is not for use for programs. Most Chip-8 progras start at 0x200. 0x200 to 0xFFF is for everything else but typically at the very start, you'd want to also space some space for important data such as the font.

#### Font

For Chip-8, we'd typically want to have some set font that we can constantly call back to visualize numbers and the alphabet. Here is a commonly used font shown in bytes:

``` assembly
0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
0x20, 0x60, 0x20, 0x20, 0x70, // 1
0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
0x90, 0x90, 0xF0, 0x10, 0x10, // 4
0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
0xF0, 0x10, 0x20, 0x40, 0x40, // 7
0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
0xF0, 0x90, 0xF0, 0x90, 0x90, // A
0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
0xF0, 0x80, 0x80, 0x80, 0xF0, // C
0xE0, 0x90, 0x90, 0x90, 0xE0, // D
0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
0xF0, 0x80, 0xF0, 0x80, 0x80  // F
```

### Registers

Registers are used to hold an instruction, storage address or any kind of data (ie bits or individual characters) that is used in the program. Registers are necessary for manipulating data and performing calculations. There are different types of registers that serve different purposes. Chip-8 features a few different types of registers that are important.

The index register is used to store memory addresses. The index register is 16 bits wide and can store any value from 0x000 to 0xFFF. The index register is typically used to store memory addresses so that the program can access them later. The index register is also used for some instructions that involve bit manipulation.

Chip-8 also features 16 8-bit general purpose 8-bit registers which are numbered from 0 to F hexadecimal labeled with `V0` to `VF`. The `VF` register is typically a flag by some instructions and thus you should avoid using it.

Chip-8 has 2 special purpose 8-bit registers for delay and sound. When these are non-zero, they are automatically decremented at a rate of 60Hz. The system's buzzer sounds whenever the sound timer reaches 0.

We'll also have some "pseudo-registers" which aren't accessible to Chip-8 programs. These are the program counter and the stack pointer. The program counter is 16 bits wide and can store any value from 0x000 to 0xFFF. The program counter is used to store the currently executing address. Since the first 1FF bits are reserved, the program counter starts at 200. The stack pointer is 8 bits wide and can store any value from 0x00 to 0xFF. The stack pointer is used to point to the topmost level of the stack. The stack is used to store return addresses when subroutines are called. Chip-8 allows for up to 16 levels of nested subroutines.

#### Summary of Registers

| Name | Type | Description |
| ---- | ---- | ----------- |
| V0-VF | 8-bit | General purpose registers |
| I | 16-bit | Index register |
| DT | 8-bit | Delay timer register |
| ST | 8-bit | Sound timer register |
| PC | 16-bit | Program counter |
| SP | 8-bit | Stack pointer |

### Keyboard

The computers which originally used Chip-8 had a 16-key hexadecimal keypad with the following layout:

``` assembly
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ C │
│ 4 │ 5 │ 6 │ D │
│ 7 │ 8 │ 9 │ E │
│ A │ 0 │ B │ F │
└───┴───┴───┴───┘
```

For Chip-8 running on modern PCs, we can map the keys to the following:

``` assembly
┌───┬───┬───┬───┐
| 1 | 2 | 3 | 4 |
| Q | W | E | R |
| A | S | D | F |
| Z | X | C | V |
└───┴───┴───┴───┘
```

### Display and Graphics

Chip-8 uses a monochromatic 64 wide and 32 tall display which has each pixel either on or off. The graphics are drawn to the screen solely by drawing sprites which are 8 pixels wide and 1 to 15 pixels tall. Sprites are drawn to the screen by XORing the sprite data with the data already on the screen. If this causes any pixels to be erased, the `VF` register is set to 1, otherwise it is set to 0. This is used for collision detection.

### Timers and Sound

Chip-8 features 2 timers, a delay and a sound timer. The delay timer is active whenever the delay timer register is not zero and this timer subtracts 1 from the value of the delay timer register at the rate of 60Hz. The sound timer is active whenever the sound timer register is not zero and this timer subtracts 1 from the value of the sound timer register at the rate of 60Hz. Whenever the sound timer register reaches 0, the system buzzer sounds. The sound produced only has one tone.

## Creating the Emulator

### CPU

With all the information we've gained prior, we can start off by setting up the CPU class. The CPU class will be the main class that will be used to run the Chip-8 program. The CPU class will have the following properties:

``` javascript
class CPU { 
    constructor() {
        this.memory = new Uint8Array(4096); // 4kB of memory
        this.V = new Uint8Array(16); // 16 8-bit registers
        this.I = 0; // 16-bit index register

        this.delayTimer = 0; // 8-bit delay timer
        this.soundTimer = 0; // 8-bit sound timer

        this.pc = 0x200; // 16-bit program counter
        this.sp = 0; // 8-bit stack pointer

        this.stack = new Uint16Array(16); // 16-level stack
    }
}
```
