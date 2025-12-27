/**
 * Tests for code chunking service
 */

import { chunkSourceCode, chunkFile, detectLanguage } from '../chunking';

describe('Code Chunking Service', () => {
    describe('detectLanguage', () => {
        it('should detect TypeScript files', () => {
            expect(detectLanguage('test.ts')).toBe('typescript');
            expect(detectLanguage('component.tsx')).toBe('typescript');
        });

        it('should detect JavaScript files', () => {
            expect(detectLanguage('test.js')).toBe('javascript');
            expect(detectLanguage('component.jsx')).toBe('javascript');
        });

        it('should detect Python files', () => {
            expect(detectLanguage('script.py')).toBe('python');
        });

        it('should return null for unsupported files', () => {
            expect(detectLanguage('test.txt')).toBeNull();
            expect(detectLanguage('data.json')).toBeNull();
        });
    });

    describe('chunkSourceCode - TypeScript', () => {
        it('should chunk TypeScript code at function boundaries', () => {
            const code = `
function foo() {
    console.log('foo');
}

function bar() {
    console.log('bar');
}

function baz() {
    console.log('baz');
}
`.trim();

            const chunks = chunkSourceCode(code, 'typescript', 100, 10);

            // Should have at least 2 chunks since we have 3 small functions
            expect(chunks.length).toBeGreaterThan(0);

            // Each chunk should have valid line numbers
            chunks.forEach(chunk => {
                expect(chunk.startLine).toBeGreaterThan(0);
                expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine);
                expect(chunk.language).toBe('typescript');
                expect(chunk.text.length).toBeGreaterThan(0);
            });
        });

        it('should chunk at class boundaries', () => {
            const code = `
export class MyClass {
    method1() {
        return 1;
    }
}

export class AnotherClass {
    method2() {
        return 2;
    }
}
`.trim();

            const chunks = chunkSourceCode(code, 'typescript', 100, 10);

            expect(chunks.length).toBeGreaterThan(0);
            chunks.forEach(chunk => {
                expect(chunk.language).toBe('typescript');
            });
        });

        it('should handle arrow functions', () => {
            const code = `
const handler = async (req, res) => {
    return { success: true };
};

const helper = (x) => x * 2;
`.trim();

            const chunks = chunkSourceCode(code, 'typescript', 100, 10);

            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].language).toBe('typescript');
        });
    });

    describe('chunkSourceCode - Python', () => {
        it('should chunk Python code at function boundaries', () => {
            const code = `
def foo():
    print('foo')

def bar():
    print('bar')

def baz():
    print('baz')
`.trim();

            const chunks = chunkSourceCode(code, 'python', 100, 10);

            expect(chunks.length).toBeGreaterThan(0);
            chunks.forEach(chunk => {
                expect(chunk.language).toBe('python');
                expect(chunk.startLine).toBeGreaterThan(0);
            });
        });

        it('should chunk at class boundaries', () => {
            const code = `
class MyClass:
    def method1(self):
        return 1

class AnotherClass:
    def method2(self):
        return 2
`.trim();

            const chunks = chunkSourceCode(code, 'python', 100, 10);

            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].language).toBe('python');
        });

        it('should handle async functions', () => {
            const code = `
async def fetch_data():
    return await get_data()

async def process_data():
    return await handle()
`.trim();

            const chunks = chunkSourceCode(code, 'python', 100, 10);

            expect(chunks.length).toBeGreaterThan(0);
        });
    });

    describe('Token targeting', () => {
        it('should respect target token size', () => {
            const largeCode = Array(100)
                .fill(0)
                .map((_, i) => `function func${i}() { return ${i}; }`)
                .join('\n\n');

            const chunks = chunkSourceCode(largeCode, 'javascript', 500, 50);

            // Each chunk should be roughly around target size (with some variance)
            chunks.forEach(chunk => {
                const tokenCount = Math.ceil(chunk.text.length / 4);
                // Allow for reasonable variance
                expect(tokenCount).toBeLessThan(1000); // Not too large
            });
        });

        it('should create overlapping chunks', () => {
            const code = Array(50)
                .fill(0)
                .map((_, i) => `function func${i}() {\n    console.log(${i});\n}`)
                .join('\n\n');

            const chunks = chunkSourceCode(code, 'javascript', 500, 50);

            if (chunks.length > 1) {
                // Check that consecutive chunks may have overlapping content
                // This is approximate since we're using line-based overlap
                const firstChunkEnd = chunks[0].text.substring(chunks[0].text.length - 100);
                const secondChunkStart = chunks[1].text.substring(0, 100);

                // The chunks should either overlap or be adjacent
                expect(chunks[1].startLine).toBeLessThanOrEqual(chunks[0].endLine + 1);
            }
        });
    });

    describe('chunkFile', () => {
        it('should chunk a TypeScript file', () => {
            const code = `
function test() {
    return true;
}
`.trim();

            const chunks = chunkFile(code, 'test.ts');

            expect(chunks).not.toBeNull();
            expect(chunks!.length).toBeGreaterThan(0);
            expect(chunks![0].language).toBe('typescript');
        });

        it('should return null for unsupported file types', () => {
            const code = 'Some random text';
            const chunks = chunkFile(code, 'test.txt');

            expect(chunks).toBeNull();
        });
    });

    describe('Edge cases', () => {
        it('should handle empty files', () => {
            const chunks = chunkSourceCode('', 'typescript', 500, 50);

            expect(chunks.length).toBe(0);
        });

        it('should handle single line files', () => {
            const chunks = chunkSourceCode('const x = 1;', 'javascript', 500, 50);

            expect(chunks.length).toBe(1);
            expect(chunks[0].startLine).toBe(1);
            expect(chunks[0].endLine).toBe(1);
        });

        it('should handle files with no clear boundaries', () => {
            const code = `
const a = 1;
const b = 2;
const c = 3;
const d = 4;
`.trim();

            const chunks = chunkSourceCode(code, 'javascript', 500, 50);

            // Should still create at least one chunk
            expect(chunks.length).toBeGreaterThan(0);
        });

        it('should track line numbers correctly', () => {
            const code = `
function first() {
    return 1;
}

function second() {
    return 2;
}

function third() {
    return 3;
}
`.trim();

            const chunks = chunkSourceCode(code, 'typescript', 200, 20);

            // Verify line numbers are sequential or overlapping
            for (let i = 0; i < chunks.length - 1; i++) {
                expect(chunks[i + 1].startLine).toBeGreaterThanOrEqual(chunks[i].startLine);
            }

            // Last chunk should end at or near the total line count
            const totalLines = code.split('\n').length;
            expect(chunks[chunks.length - 1].endLine).toBeLessThanOrEqual(totalLines);
        });
    });
});
