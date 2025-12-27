/**
 * Code chunking service for splitting source files into logical chunks for embedding.
 *
 * Implements intelligent chunking that:
 * - Splits at function/class boundaries for TS/JS/Python
 * - Targets ~500 tokens per chunk
 * - Overlaps chunks by ~50 tokens for continuity
 * - Tracks start_line and end_line for each chunk
 */

export interface CodeChunk {
    text: string;
    startLine: number;
    endLine: number;
    language: string;
}

export type SupportedLanguage = 'typescript' | 'javascript' | 'python';

/**
 * Approximate token count (4 chars = 1 token).
 * For more accuracy, consider using tiktoken library.
 */
function approximateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Detect logical boundaries in TypeScript/JavaScript code.
 * Looks for function declarations, class declarations, and method definitions.
 */
function detectTsJsBoundaries(lines: string[]): number[] {
    const boundaries: number[] = [0]; // Always start at line 0

    const patterns = [
        /^\s*(export\s+)?(async\s+)?function\s+/,           // function declarations
        /^\s*(export\s+)?(default\s+)?class\s+/,            // class declarations
        /^\s*(public|private|protected|static)?\s*(async\s+)?[\w]+\s*\([^)]*\)\s*[\{:]/,  // methods
        /^\s*const\s+\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>/,  // arrow functions
        /^\s*interface\s+\w+/,                              // interfaces
        /^\s*type\s+\w+/,                                   // type aliases
        /^\s*enum\s+\w+/,                                   // enums
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
            if (pattern.test(line)) {
                boundaries.push(i);
                break;
            }
        }
    }

    return boundaries;
}

/**
 * Detect logical boundaries in Python code.
 * Looks for function and class definitions.
 */
function detectPythonBoundaries(lines: string[]): number[] {
    const boundaries: number[] = [0]; // Always start at line 0

    const patterns = [
        /^def\s+\w+/,           // function definitions
        /^class\s+\w+/,         // class definitions
        /^async\s+def\s+\w+/,   // async function definitions
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
            if (pattern.test(line)) {
                boundaries.push(i);
                break;
            }
        }
    }

    return boundaries;
}

/**
 * For files without clear boundaries, split on double newlines.
 */
function detectGenericBoundaries(lines: string[]): number[] {
    const boundaries: number[] = [0];

    for (let i = 0; i < lines.length - 1; i++) {
        // Look for blank lines followed by non-blank lines
        if (lines[i].trim() === '' && lines[i + 1].trim() !== '') {
            boundaries.push(i + 1);
        }
    }

    // If no boundaries found, use fixed intervals
    if (boundaries.length === 1) {
        const interval = Math.max(10, Math.floor(lines.length / 10));
        for (let i = interval; i < lines.length; i += interval) {
            boundaries.push(i);
        }
    }

    return boundaries;
}

/**
 * Detect boundaries based on language.
 */
function detectBoundaries(lines: string[], language: SupportedLanguage): number[] {
    switch (language) {
        case 'typescript':
        case 'javascript':
            return detectTsJsBoundaries(lines);
        case 'python':
            return detectPythonBoundaries(lines);
        default:
            return detectGenericBoundaries(lines);
    }
}

/**
 * Split source code into chunks at logical boundaries.
 *
 * @param sourceCode - The source code to chunk
 * @param language - The programming language
 * @param targetTokens - Target number of tokens per chunk (default 500)
 * @param overlapTokens - Number of tokens to overlap between chunks (default 50)
 * @returns Array of code chunks
 */
export function chunkSourceCode(
    sourceCode: string,
    language: SupportedLanguage,
    targetTokens: number = 500,
    overlapTokens: number = 50
): CodeChunk[] {
    // Handle empty input
    if (!sourceCode || sourceCode.trim() === '') {
        return [];
    }

    const lines = sourceCode.split('\n');
    const chunks: CodeChunk[] = [];

    // Detect logical boundaries
    const boundaries = detectBoundaries(lines, language);
    boundaries.push(lines.length); // Add end boundary

    let currentChunkStart = 0;
    let currentChunkLines: string[] = [];
    let currentTokenCount = 0;

    for (let i = 0; i < boundaries.length - 1; i++) {
        const boundaryStart = boundaries[i];
        const boundaryEnd = boundaries[i + 1];
        const segmentLines = lines.slice(boundaryStart, boundaryEnd);
        const segmentText = segmentLines.join('\n');
        const segmentTokens = approximateTokenCount(segmentText);

        // If adding this segment would exceed target, save current chunk
        if (currentTokenCount > 0 && currentTokenCount + segmentTokens > targetTokens) {
            // Save the current chunk
            chunks.push({
                text: currentChunkLines.join('\n'),
                startLine: currentChunkStart + 1, // 1-indexed
                endLine: currentChunkStart + currentChunkLines.length,
                language,
            });

            // Start new chunk with overlap
            const overlapStart = Math.max(0, currentChunkLines.length - Math.ceil(overlapTokens * 4 / 50)); // rough line estimate
            currentChunkLines = currentChunkLines.slice(overlapStart);
            currentChunkStart = currentChunkStart + overlapStart;
            currentTokenCount = approximateTokenCount(currentChunkLines.join('\n'));
        }

        // Add the segment to current chunk
        currentChunkLines.push(...segmentLines);
        currentTokenCount += segmentTokens;
    }

    // Save the last chunk if any lines remain
    if (currentChunkLines.length > 0) {
        chunks.push({
            text: currentChunkLines.join('\n'),
            startLine: currentChunkStart + 1, // 1-indexed
            endLine: currentChunkStart + currentChunkLines.length,
            language,
        });
    }

    // Handle edge case: empty file
    if (chunks.length === 0 && lines.length > 0) {
        chunks.push({
            text: sourceCode,
            startLine: 1,
            endLine: lines.length,
            language,
        });
    }

    return chunks;
}

/**
 * Detect language from file extension.
 */
export function detectLanguage(filename: string): SupportedLanguage | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'py':
            return 'python';
        default:
            return null;
    }
}

/**
 * Main entry point for chunking a source file.
 *
 * @param sourceCode - The source code to chunk
 * @param filename - The filename (used to detect language)
 * @param targetTokens - Target number of tokens per chunk (default 500)
 * @param overlapTokens - Number of tokens to overlap between chunks (default 50)
 * @returns Array of code chunks, or null if language not supported
 */
export function chunkFile(
    sourceCode: string,
    filename: string,
    targetTokens: number = 500,
    overlapTokens: number = 50
): CodeChunk[] | null {
    const language = detectLanguage(filename);
    if (!language) {
        return null;
    }
    return chunkSourceCode(sourceCode, language, targetTokens, overlapTokens);
}
