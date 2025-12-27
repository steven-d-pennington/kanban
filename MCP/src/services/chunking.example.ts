/**
 * Example usage of the code chunking service
 */

import { chunkFile, chunkSourceCode, CodeChunk } from './chunking.js';

// Example 1: Chunk a TypeScript file
const tsCode = `
export class Calculator {
    add(a: number, b: number): number {
        return a + b;
    }

    subtract(a: number, b: number): number {
        return a - b;
    }
}

export function multiply(a: number, b: number): number {
    return a * b;
}

export function divide(a: number, b: number): number {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return a / b;
}
`;

const chunks = chunkFile(tsCode, 'calculator.ts', 500, 50);
console.log('Chunks from TypeScript file:', chunks);

// Example 2: Chunk Python code
const pythonCode = `
class Calculator:
    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("Division by zero")
    return a / b
`;

const pyChunks = chunkSourceCode(pythonCode, 'python', 300, 30);
console.log('Chunks from Python code:', pyChunks);

// Example 3: Process each chunk
if (chunks) {
    chunks.forEach((chunk: CodeChunk, index: number) => {
        console.log(`\nChunk ${index + 1}:`);
        console.log(`  Lines: ${chunk.startLine}-${chunk.endLine}`);
        console.log(`  Language: ${chunk.language}`);
        console.log(`  Text length: ${chunk.text.length} chars`);
        console.log(`  Approx tokens: ${Math.ceil(chunk.text.length / 4)}`);
    });
}
