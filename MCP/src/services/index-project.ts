/**
 * Project Indexing Service
 *
 * Indexes an entire codebase by:
 * - Discovering files using glob patterns
 * - Respecting .gitignore rules
 * - Chunking source files
 * - Generating embeddings for each chunk
 * - Storing embeddings in the database
 * - Tracking indexing status
 */

import fg from 'fast-glob';
import ignore from 'ignore';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { chunkFile, CodeChunk } from './chunking.js';
import { generateEmbeddingsBatch } from '../embedding.js';
import { supabase } from '../db.js';

export interface IndexProjectOptions {
    project_id: string;
    repo_path: string;
    patterns?: string[];
    batch_size?: number;
}

export interface IndexProjectResult {
    files_processed: number;
    chunks_created: number;
    duration_ms: number;
    status: 'success' | 'error';
    error?: string;
}

// Default glob patterns for supported file types
const DEFAULT_PATTERNS = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.py',
    '**/*.md'
];

// Directories and files to always skip
const ALWAYS_SKIP = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/__pycache__/**',
    '**/*.min.js',
    '**/*.map'
];

/**
 * Calculate hash of file content for change detection
 */
function calculateFileHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Read and parse .gitignore file
 */
async function loadGitignore(repoPath: string): Promise<ReturnType<typeof ignore>> {
    const ig = ignore();

    try {
        const gitignorePath = path.join(repoPath, '.gitignore');
        const content = await fs.readFile(gitignorePath, 'utf-8');
        ig.add(content);
    } catch (error) {
        // .gitignore doesn't exist or can't be read - that's ok
    }

    // Always ignore common patterns
    ig.add(ALWAYS_SKIP.map(p => p.replace(/\*\*/g, '').replace(/\*/g, '')));

    return ig;
}

/**
 * Check if file is binary
 */
async function isBinaryFile(filePath: string): Promise<boolean> {
    try {
        const buffer = await fs.readFile(filePath);
        const chunk = buffer.slice(0, 512);

        // Check for null bytes which indicate binary
        for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === 0) {
                return true;
            }
        }

        return false;
    } catch (error) {
        return true; // If we can't read it, treat as binary
    }
}

/**
 * Discover files to index
 */
async function discoverFiles(
    repoPath: string,
    patterns: string[],
    ig: ReturnType<typeof ignore>
): Promise<string[]> {
    const files = await fg(patterns, {
        cwd: repoPath,
        absolute: true,
        ignore: ALWAYS_SKIP,
        dot: false
    });

    // Filter using .gitignore rules
    const relativePaths = files.map(f => path.relative(repoPath, f));
    const filteredRelative = relativePaths.filter(p => !ig.ignores(p));
    const filteredAbsolute = filteredRelative.map(p => path.join(repoPath, p));

    // Filter out binary files
    const textFiles: string[] = [];
    for (const file of filteredAbsolute) {
        if (!(await isBinaryFile(file))) {
            textFiles.push(file);
        }
    }

    return textFiles;
}

/**
 * Process a single file: read, chunk, and prepare for embedding
 */
async function processFile(
    filePath: string,
    repoPath: string,
    projectId: string
): Promise<{ chunks: CodeChunk[], fileHash: string, relativePath: string } | null> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const fileHash = calculateFileHash(content);
        const relativePath = path.relative(repoPath, filePath);
        const fileName = path.basename(filePath);

        // Chunk the file
        const chunks = chunkFile(content, fileName);

        if (!chunks || chunks.length === 0) {
            // File type not supported or empty file
            return null;
        }

        return {
            chunks,
            fileHash,
            relativePath
        };
    } catch (error: any) {
        console.error(`Error processing file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Store embeddings in database (batch insert)
 */
async function storeEmbeddings(
    projectId: string,
    filePath: string,
    fileHash: string,
    chunks: CodeChunk[],
    embeddings: number[][]
): Promise<void> {
    // First, delete existing embeddings for this file
    await supabase
        .from('code_embeddings')
        .delete()
        .eq('project_id', projectId)
        .eq('file_path', filePath);

    // Prepare batch insert data
    const records = chunks.map((chunk, index) => ({
        project_id: projectId,
        file_path: filePath,
        chunk_index: index,
        chunk_text: chunk.text,
        chunk_start_line: chunk.startLine,
        chunk_end_line: chunk.endLine,
        language: chunk.language,
        file_hash: fileHash,
        embedding: `[${embeddings[index].join(',')}]`
    }));

    // Batch insert
    const { error } = await supabase
        .from('code_embeddings')
        .insert(records);

    if (error) {
        throw new Error(`Failed to insert embeddings: ${error.message}`);
    }
}

/**
 * Update or create code index status
 */
async function updateIndexStatus(
    projectId: string,
    repoPath: string,
    status: 'indexing' | 'completed' | 'failed',
    filesProcessed: number,
    chunksCreated: number,
    error?: string
): Promise<void> {
    // Check if status record exists
    const { data: existing } = await supabase
        .from('code_index_status')
        .select('id')
        .eq('project_id', projectId)
        .eq('repo_path', repoPath)
        .single();

    const record = {
        project_id: projectId,
        repo_path: repoPath,
        status,
        total_files: filesProcessed,
        total_chunks: chunksCreated,
        last_indexed_at: new Date().toISOString(),
        error_message: error || null
    };

    if (existing) {
        // Update existing record
        await supabase
            .from('code_index_status')
            .update(record)
            .eq('id', existing.id);
    } else {
        // Insert new record
        await supabase
            .from('code_index_status')
            .insert(record);
    }
}

/**
 * Main function to index a project
 */
export async function indexProject(options: IndexProjectOptions): Promise<IndexProjectResult> {
    const startTime = Date.now();
    const {
        project_id,
        repo_path,
        patterns = DEFAULT_PATTERNS,
        batch_size = 50
    } = options;

    let filesProcessed = 0;
    let chunksCreated = 0;

    try {
        // Verify project exists
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', project_id)
            .single();

        if (projectError || !project) {
            throw new Error(`Project not found: ${project_id}`);
        }

        // Verify repo path exists
        try {
            await fs.access(repo_path);
        } catch (error) {
            throw new Error(`Repository path not found: ${repo_path}`);
        }

        // Update status to indexing
        await updateIndexStatus(project_id, repo_path, 'indexing', 0, 0);

        // Load .gitignore
        const ig = await loadGitignore(repo_path);

        // Discover files
        const files = await discoverFiles(repo_path, patterns, ig);
        console.log(`Found ${files.length} files to index`);

        // Process files in batches
        let allChunksToEmbed: { chunk: CodeChunk; projectId: string; filePath: string; fileHash: string }[] = [];

        for (const file of files) {
            const result = await processFile(file, repo_path, project_id);

            if (result) {
                filesProcessed++;

                // Add chunks to the batch queue
                for (const chunk of result.chunks) {
                    allChunksToEmbed.push({
                        chunk,
                        projectId: project_id,
                        filePath: result.relativePath,
                        fileHash: result.fileHash
                    });
                }

                // Process batch when it reaches batch_size
                if (allChunksToEmbed.length >= batch_size) {
                    await processBatch(allChunksToEmbed);
                    chunksCreated += allChunksToEmbed.length;
                    allChunksToEmbed = [];
                }
            }
        }

        // Process remaining chunks
        if (allChunksToEmbed.length > 0) {
            await processBatch(allChunksToEmbed);
            chunksCreated += allChunksToEmbed.length;
        }

        const duration = Date.now() - startTime;

        // Update status to completed
        await updateIndexStatus(project_id, repo_path, 'completed', filesProcessed, chunksCreated);

        return {
            files_processed: filesProcessed,
            chunks_created: chunksCreated,
            duration_ms: duration,
            status: 'success'
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;

        // Update status to failed
        await updateIndexStatus(project_id, repo_path, 'failed', filesProcessed, chunksCreated, error.message);

        return {
            files_processed: filesProcessed,
            chunks_created: chunksCreated,
            duration_ms: duration,
            status: 'error',
            error: error.message
        };
    }
}

/**
 * Process a batch of chunks: generate embeddings and store
 */
async function processBatch(
    batch: { chunk: CodeChunk; projectId: string; filePath: string; fileHash: string }[]
): Promise<void> {
    if (batch.length === 0) return;

    // Extract texts for embedding
    const texts = batch.map(item => item.chunk.text);

    // Generate embeddings in batch
    const embeddings = await generateEmbeddingsBatch(texts);

    // Group by file for efficient storage
    const fileGroups = new Map<string, {
        projectId: string;
        filePath: string;
        fileHash: string;
        chunks: CodeChunk[];
        embeddings: number[][];
    }>();

    batch.forEach((item, index) => {
        const key = `${item.projectId}:${item.filePath}`;

        if (!fileGroups.has(key)) {
            fileGroups.set(key, {
                projectId: item.projectId,
                filePath: item.filePath,
                fileHash: item.fileHash,
                chunks: [],
                embeddings: []
            });
        }

        const group = fileGroups.get(key)!;
        group.chunks.push(item.chunk);
        group.embeddings.push(embeddings[index]);
    });

    // Store each file's embeddings
    for (const group of fileGroups.values()) {
        await storeEmbeddings(
            group.projectId,
            group.filePath,
            group.fileHash,
            group.chunks,
            group.embeddings
        );
    }
}
