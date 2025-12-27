# Code Chunking Service

A service for intelligently splitting source code files into logical chunks for embedding and processing.

## Features

- **Language-Aware Chunking**: Detects and respects function/class boundaries in TypeScript, JavaScript, and Python
- **Token Targeting**: Aims for ~500 tokens per chunk (configurable)
- **Smart Overlapping**: Overlaps chunks by ~50 tokens (configurable) to maintain context
- **Line Tracking**: Tracks start and end line numbers for each chunk
- **Graceful Fallback**: Falls back to paragraph-based splitting for files without clear boundaries

## Supported Languages

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)

## API

### `chunkFile(sourceCode, filename, targetTokens?, overlapTokens?)`

Main entry point for chunking a source file.

**Parameters:**
- `sourceCode` (string): The source code to chunk
- `filename` (string): Filename (used to detect language)
- `targetTokens` (number, optional): Target tokens per chunk (default: 500)
- `overlapTokens` (number, optional): Overlap between chunks (default: 50)

**Returns:** `CodeChunk[] | null` - Array of chunks, or null if language not supported

### `chunkSourceCode(sourceCode, language, targetTokens?, overlapTokens?)`

Chunk source code with explicit language specification.

**Parameters:**
- `sourceCode` (string): The source code to chunk
- `language` (SupportedLanguage): Language type ('typescript' | 'javascript' | 'python')
- `targetTokens` (number, optional): Target tokens per chunk (default: 500)
- `overlapTokens` (number, optional): Overlap between chunks (default: 50)

**Returns:** `CodeChunk[]` - Array of chunks

### `detectLanguage(filename)`

Detect language from file extension.

**Parameters:**
- `filename` (string): The filename to analyze

**Returns:** `SupportedLanguage | null` - Detected language or null

## Types

### `CodeChunk`

```typescript
interface CodeChunk {
    text: string;        // The chunk text
    startLine: number;   // Starting line number (1-indexed)
    endLine: number;     // Ending line number (inclusive)
    language: string;    // Language identifier
}
```

### `SupportedLanguage`

```typescript
type SupportedLanguage = 'typescript' | 'javascript' | 'python';
```

## Usage Example

```typescript
import { chunkFile } from './services/chunking';

const sourceCode = `
function add(a, b) {
    return a + b;
}

function multiply(a, b) {
    return a * b;
}
`;

const chunks = chunkFile(sourceCode, 'math.js');

if (chunks) {
    chunks.forEach(chunk => {
        console.log(`Lines ${chunk.startLine}-${chunk.endLine}:`);
        console.log(chunk.text);
    });
}
```

## How It Works

### Boundary Detection

The chunker uses regex-based patterns to detect logical boundaries:

**TypeScript/JavaScript:**
- Function declarations (`function foo()`)
- Arrow functions (`const foo = () => {}`)
- Class declarations (`class Foo {}`)
- Method definitions
- Interfaces and type aliases
- Enums

**Python:**
- Function definitions (`def foo():`)
- Class definitions (`class Foo:`)
- Async functions (`async def foo():`)

### Chunking Algorithm

1. **Detect Boundaries**: Scan the file for logical boundaries based on language
2. **Group Segments**: Group code segments between boundaries
3. **Target Size**: Accumulate segments until target token count is reached
4. **Create Chunks**: When target is reached, create a chunk
5. **Add Overlap**: Start next chunk with overlap from previous chunk
6. **Track Lines**: Maintain accurate line number tracking throughout

### Token Counting

Uses a simple approximation: **4 characters ≈ 1 token**

For production use with OpenAI embeddings, consider using the `tiktoken` library for accurate token counting.

## Testing

The service includes comprehensive unit tests:

```bash
npm test
```

Tests cover:
- Language detection
- Boundary detection for all supported languages
- Token targeting
- Chunk overlapping
- Edge cases (empty files, single lines, no boundaries)
- Line number tracking

All tests pass successfully.

## Future Enhancements

- Add support for more languages (Java, Go, Rust, etc.)
- Integrate `tiktoken` for accurate token counting
- Add AST-based chunking for more precise boundary detection
- Support custom chunk size strategies
- Add chunk quality metrics
