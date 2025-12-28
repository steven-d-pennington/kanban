/**
 * Code Chunking Algorithm
 * Splits source files into logical chunks for embedding
 */

export interface CodeChunk {
    text: string;
    startLine: number;
    endLine: number;
    language: string;
    chunkIndex: number;
}

// Language detection by file extension
const LANGUAGE_MAP: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.md': 'markdown',
    '.json': 'json',
    '.sql': 'sql',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.yaml': 'yaml',
    '.yml': 'yaml',
};

// Supported languages for smart chunking
const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'python'];

// Target tokens per chunk (4 chars ≈ 1 token)
const TARGET_TOKENS = 500;
const TARGET_CHARS = TARGET_TOKENS * 4;
const OVERLAP_TOKENS = 50;
const OVERLAP_CHARS = OVERLAP_TOKENS * 4;

/**
 * Detect language from file path
 */
export function detectLanguage(filePath: string): string | null {
    const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
    return LANGUAGE_MAP[ext] || null;
}

/**
 * Check if a language supports smart chunking (function/class boundaries)
 */
function supportsSmartChunking(language: string): boolean {
    return SUPPORTED_LANGUAGES.includes(language);
}

/**
 * Find function/class boundaries in TypeScript/JavaScript
 */
function findTSBoundaries(lines: string[]): number[] {
    const boundaries: number[] = [0]; // Always start at line 0

    const patterns = [
        /^(export\s+)?(async\s+)?function\s+\w+/,          // function declarations
        /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/,  // arrow functions
        /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?function/,  // function expressions
        /^(export\s+)?(abstract\s+)?class\s+\w+/,          // class declarations
        /^(export\s+)?interface\s+\w+/,                     // interface declarations
        /^(export\s+)?type\s+\w+/,                          // type declarations
        /^(export\s+)?enum\s+\w+/,                          // enum declarations
    ];

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        for (const pattern of patterns) {
            if (pattern.test(trimmed)) {
                if (i > 0 && !boundaries.includes(i)) {
                    boundaries.push(i);
                }
                break;
            }
        }
    }

    return boundaries.sort((a, b) => a - b);
}

/**
 * Find function/class boundaries in Python
 */
function findPythonBoundaries(lines: string[]): number[] {
    const boundaries: number[] = [0];

    const patterns = [
        /^(async\s+)?def\s+\w+/,     // function definitions
        /^class\s+\w+/,               // class definitions
    ];

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        // Only match at module level (no indentation) or with single indent (methods)
        const indent = lines[i].match(/^(\s*)/)?.[1]?.length || 0;
        if (indent <= 4) {
            for (const pattern of patterns) {
                if (pattern.test(trimmed)) {
                    if (i > 0 && !boundaries.includes(i)) {
                        boundaries.push(i);
                    }
                    break;
                }
            }
        }
    }

    return boundaries.sort((a, b) => a - b);
}

/**
 * Find boundaries based on double newlines (fallback for unsupported languages)
 */
function findGenericBoundaries(lines: string[]): number[] {
    const boundaries: number[] = [0];
    let consecutiveEmpty = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') {
            consecutiveEmpty++;
        } else {
            if (consecutiveEmpty >= 2 && i > 0 && !boundaries.includes(i)) {
                boundaries.push(i);
            }
            consecutiveEmpty = 0;
        }
    }

    return boundaries.sort((a, b) => a - b);
}

/**
 * Get boundaries for a file based on its language
 */
function getBoundaries(lines: string[], language: string): number[] {
    switch (language) {
        case 'typescript':
        case 'javascript':
            return findTSBoundaries(lines);
        case 'python':
            return findPythonBoundaries(lines);
        default:
            return findGenericBoundaries(lines);
    }
}

/**
 * Chunk a file's content into logical units
 */
export function chunkCode(content: string, language: string): CodeChunk[] {
    const lines = content.split('\n');
    const chunks: CodeChunk[] = [];

    if (supportsSmartChunking(language)) {
        // Smart chunking: split at function/class boundaries
        const boundaries = getBoundaries(lines, language);

        for (let i = 0; i < boundaries.length; i++) {
            const startLine = boundaries[i];
            const endLine = i + 1 < boundaries.length ? boundaries[i + 1] - 1 : lines.length - 1;

            const chunkLines = lines.slice(startLine, endLine + 1);
            const chunkText = chunkLines.join('\n');

            // If chunk is too large, split it further
            if (chunkText.length > TARGET_CHARS * 2) {
                const subChunks = splitLargeChunk(chunkLines, startLine, language);
                chunks.push(...subChunks.map((sc, idx) => ({
                    ...sc,
                    chunkIndex: chunks.length + idx,
                })));
            } else if (chunkText.trim().length > 0) {
                chunks.push({
                    text: chunkText,
                    startLine: startLine + 1, // 1-indexed
                    endLine: endLine + 1,     // 1-indexed
                    language,
                    chunkIndex: chunks.length,
                });
            }
        }
    } else {
        // Fallback: split by character count with overlap
        const subChunks = splitBySize(lines, language);
        chunks.push(...subChunks);
    }

    // If no chunks created, create one for the whole file
    if (chunks.length === 0 && content.trim().length > 0) {
        chunks.push({
            text: content,
            startLine: 1,
            endLine: lines.length,
            language,
            chunkIndex: 0,
        });
    }

    return chunks;
}

/**
 * Split a large chunk into smaller pieces
 */
function splitLargeChunk(lines: string[], baseStartLine: number, language: string): Omit<CodeChunk, 'chunkIndex'>[] {
    const chunks: Omit<CodeChunk, 'chunkIndex'>[] = [];
    let currentLines: string[] = [];
    let currentStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
        currentLines.push(lines[i]);
        const currentText = currentLines.join('\n');

        if (currentText.length >= TARGET_CHARS) {
            chunks.push({
                text: currentText,
                startLine: baseStartLine + currentStartLine + 1,
                endLine: baseStartLine + i + 1,
                language,
            });

            // Start new chunk with overlap
            const overlapLines = Math.ceil(OVERLAP_CHARS / (currentText.length / currentLines.length));
            currentStartLine = Math.max(0, i - overlapLines + 1);
            currentLines = lines.slice(currentStartLine, i + 1);
        }
    }

    // Add remaining content
    if (currentLines.length > 0) {
        const text = currentLines.join('\n');
        if (text.trim().length > 0) {
            chunks.push({
                text,
                startLine: baseStartLine + currentStartLine + 1,
                endLine: baseStartLine + lines.length,
                language,
            });
        }
    }

    return chunks;
}

/**
 * Split content by size (for unsupported languages)
 */
function splitBySize(lines: string[], language: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    let currentLines: string[] = [];
    let currentStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
        currentLines.push(lines[i]);
        const currentText = currentLines.join('\n');

        if (currentText.length >= TARGET_CHARS) {
            chunks.push({
                text: currentText,
                startLine: currentStartLine + 1,
                endLine: i + 1,
                language,
                chunkIndex: chunks.length,
            });

            // Start new chunk with overlap
            const overlapLines = Math.ceil(OVERLAP_CHARS / (currentText.length / currentLines.length));
            currentStartLine = Math.max(0, i - overlapLines + 1);
            currentLines = lines.slice(currentStartLine, i + 1);
        }
    }

    // Add remaining content
    if (currentLines.length > 0) {
        const text = currentLines.join('\n');
        if (text.trim().length > 0) {
            chunks.push({
                text,
                startLine: currentStartLine + 1,
                endLine: lines.length,
                language,
                chunkIndex: chunks.length,
            });
        }
    }

    return chunks;
}

/**
 * Chunk a file given its path and content
 */
export function chunkFile(filePath: string, content: string): CodeChunk[] | null {
    const language = detectLanguage(filePath);
    if (!language) {
        return null; // Unsupported file type
    }
    return chunkCode(content, language);
}
