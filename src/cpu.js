class CPU { 
    constructor() {
        this.memory = new Uint8Array(4096); // 4kB of memory
        this.registers  = new Uint8Array(16); // 16 8-bit registers
        this.indexRegister = 0; // 16-bit index register

        this.delayTimer = 0; // 8-bit delay timer
        this.soundTimer = 0; // 8-bit sound timer

        this.programCounter = 0x200; // 16-bit program counter
        this.stackPointer = 0; // 8-bit stack pointer

        this.stack = new Uint16Array(16); // 16-level stack
    }
}