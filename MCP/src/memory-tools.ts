/**
 * Memory/RAG MCP Tools
 * Provides semantic code search and project memory for agents
 */

import { SupabaseClient } from '@supabase/supabase-js';
import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { generateEmbedding, generateEmbeddingsBatch } from './embedding.js';
import { chunkFile, detectLanguage, CodeChunk } from './chunker.js';

/**
 * Read .kanban.json config from a repository to get project_id
 */
async function getProjectIdFromRepo(repoPath: string): Promise<string | null> {
    try {
        const configPath = path.join(repoPath, '.kanban.json');
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        return config.project_id || null;
    } catch {
        return null;
    }
}

/**
 * Resolve project_id from args or .kanban.json config
 */
async function resolveProjectId(args: { project_id?: string; repo_path?: string }): Promise<string> {
    if (args.project_id) {
        return args.project_id;
    }
    if (args.repo_path) {
        const projectId = await getProjectIdFromRepo(args.repo_path);
        if (projectId) {
            return projectId;
        }
    }
    throw new Error('project_id is required. Either provide it directly or create a .kanban.json file in the repo root with {"project_id": "your-uuid"}');
}

// Memory types
const MEMORY_TYPES = [
    'decision',
    'pattern',
    'convention',
    'lesson',
    'architecture',
    'warning',
    'preference',
] as const;

type MemoryType = typeof MEMORY_TYPES[number];

// Tool definitions for MCP
export const memoryToolDefinitions = [
    {
        name: "index_project",
        description: "Index a codebase for semantic search. Scans files, chunks them, and generates embeddings. If .kanban.json exists in repo root, project_id is auto-detected.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project (optional if .kanban.json exists in repo)",
                },
                repo_path: {
                    type: "string",
                    description: "Absolute path to the repository",
                },
                file_patterns: {
                    type: "array",
                    items: { type: "string" },
                    description: "Glob patterns for files to index (default: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.md'])",
                },
                incremental: {
                    type: "boolean",
                    description: "Only index changed files (default: true)",
                },
            },
            required: ["repo_path"],
        },
    },
    {
        name: "search_codebase",
        description: "Search the codebase semantically using natural language queries.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project",
                },
                query: {
                    type: "string",
                    description: "Natural language search query",
                },
                file_types: {
                    type: "array",
                    items: { type: "string" },
                    description: "Filter by file types (e.g., ['typescript', 'python'])",
                },
                directories: {
                    type: "array",
                    items: { type: "string" },
                    description: "Filter by directories (e.g., ['src/components'])",
                },
                limit: {
                    type: "number",
                    description: "Maximum results to return (default: 10, max: 50)",
                },
                similarity_threshold: {
                    type: "number",
                    description: "Minimum similarity score 0-1 (default: 0.5)",
                },
            },
            required: ["project_id", "query"],
        },
    },
    {
        name: "add_memory",
        description: "Store a learned decision, pattern, or convention for future reference.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project",
                },
                memory_type: {
                    type: "string",
                    description: "Type of memory",
                    enum: MEMORY_TYPES,
                },
                title: {
                    type: "string",
                    description: "Brief title for the memory",
                },
                content: {
                    type: "string",
                    description: "Detailed content of the memory",
                },
                source_work_item_id: {
                    type: "string",
                    description: "UUID of the work item this memory came from (optional)",
                },
                is_global: {
                    type: "boolean",
                    description: "Make this memory visible across all projects (default: false)",
                },
            },
            required: ["project_id", "memory_type", "title", "content"],
        },
    },
    {
        name: "search_memories",
        description: "Search project memories semantically.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project",
                },
                query: {
                    type: "string",
                    description: "Natural language search query",
                },
                memory_types: {
                    type: "array",
                    items: { type: "string", enum: MEMORY_TYPES },
                    description: "Filter by memory types",
                },
                include_global: {
                    type: "boolean",
                    description: "Include global memories (default: true)",
                },
                limit: {
                    type: "number",
                    description: "Maximum results to return (default: 10)",
                },
            },
            required: ["project_id", "query"],
        },
    },
    {
        name: "recall_context",
        description: "Get relevant context for a work item (code snippets, memories, related items).",
        inputSchema: {
            type: "object",
            properties: {
                work_item_id: {
                    type: "string",
                    description: "UUID of the work item to get context for",
                },
                code_limit: {
                    type: "number",
                    description: "Max code snippets (default: 5)",
                },
                memory_limit: {
                    type: "number",
                    description: "Max memories (default: 5)",
                },
                related_limit: {
                    type: "number",
                    description: "Max related work items (default: 5)",
                },
            },
            required: ["work_item_id"],
        },
    },
    {
        name: "update_index",
        description: "Incrementally update the code index for changed files. If .kanban.json exists in repo root, project_id is auto-detected.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project (optional if .kanban.json exists in repo)",
                },
                repo_path: {
                    type: "string",
                    description: "Absolute path to the repository",
                },
                files: {
                    type: "array",
                    items: { type: "string" },
                    description: "Files that changed (relative paths)",
                },
                deleted_files: {
                    type: "array",
                    items: { type: "string" },
                    description: "Files that were deleted (relative paths)",
                },
            },
            required: ["repo_path"],
        },
    },
];

/**
 * Generate file hash for change detection
 */
function hashFile(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Index a project's codebase
 */
export async function indexProject(
    supabase: SupabaseClient,
    args: {
        project_id?: string;
        repo_path: string;
        file_patterns?: string[];
        incremental?: boolean;
    }
): Promise<{ files_processed: number; chunks_created: number; duration_ms: number }> {
    const startTime = Date.now();
    const project_id = await resolveProjectId(args);
    const {
        repo_path,
        file_patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.md'],
        incremental = true,
    } = args;

    // Update status to indexing
    await supabase.from('code_index_status').upsert({
        project_id,
        status: 'indexing',
        updated_at: new Date().toISOString(),
    });

    try {
        // Get existing file hashes if incremental
        const existingHashes = new Map<string, string>();
        if (incremental) {
            const { data } = await supabase
                .from('code_embeddings')
                .select('file_path, file_hash')
                .eq('project_id', project_id);

            if (data) {
                for (const row of data) {
                    existingHashes.set(row.file_path, row.file_hash);
                }
            }
        }

        // Find files to index
        const files = await fg(file_patterns, {
            cwd: repo_path,
            ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/*.min.js'],
            absolute: false,
        });

        let filesProcessed = 0;
        let chunksCreated = 0;

        // Process files in batches
        const BATCH_SIZE = 20;
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const chunksToEmbed: { chunk: CodeChunk; filePath: string; fileHash: string }[] = [];

            for (const file of batch) {
                const fullPath = path.join(repo_path, file);
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const fileHash = hashFile(content);

                    // Skip if unchanged (incremental mode)
                    if (incremental && existingHashes.get(file) === fileHash) {
                        continue;
                    }

                    // Chunk the file
                    const chunks = chunkFile(file, content);
                    if (!chunks) continue; // Unsupported file type

                    // Delete old chunks for this file
                    await supabase
                        .from('code_embeddings')
                        .delete()
                        .eq('project_id', project_id)
                        .eq('file_path', file);

                    for (const chunk of chunks) {
                        chunksToEmbed.push({ chunk, filePath: file, fileHash });
                    }
                    filesProcessed++;
                } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                }
            }

            // Generate embeddings in batch
            if (chunksToEmbed.length > 0) {
                const texts = chunksToEmbed.map(c => c.chunk.text);
                const embeddings = await generateEmbeddingsBatch(texts);

                // Insert chunks with embeddings
                const rows = chunksToEmbed.map((c, idx) => ({
                    project_id,
                    file_path: c.filePath,
                    chunk_index: c.chunk.chunkIndex,
                    chunk_text: c.chunk.text,
                    embedding: `[${embeddings[idx].join(',')}]`,
                    file_hash: c.fileHash,
                    language: c.chunk.language,
                    start_line: c.chunk.startLine,
                    end_line: c.chunk.endLine,
                }));

                const { error } = await supabase.from('code_embeddings').insert(rows);
                if (error) {
                    console.error('Error inserting embeddings:', error);
                } else {
                    chunksCreated += rows.length;
                }
            }
        }

        // Update status to complete
        await supabase.from('code_index_status').upsert({
            project_id,
            status: 'complete',
            files_indexed: filesProcessed,
            chunks_created: chunksCreated,
            last_indexed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: null,
        });

        return {
            files_processed: filesProcessed,
            chunks_created: chunksCreated,
            duration_ms: Date.now() - startTime,
        };
    } catch (error: any) {
        // Update status to error
        await supabase.from('code_index_status').upsert({
            project_id,
            status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString(),
        });
        throw error;
    }
}

/**
 * Search codebase semantically
 */
export async function searchCodebase(
    supabase: SupabaseClient,
    args: {
        project_id: string;
        query: string;
        file_types?: string[];
        directories?: string[];
        limit?: number;
        similarity_threshold?: number;
    }
): Promise<any[]> {
    const {
        project_id,
        query,
        file_types = null,
        directories = null,
        limit = 10,
        similarity_threshold = 0.5,
    } = args;

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Call the database function
    const { data, error } = await supabase.rpc('search_codebase', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        p_project_id: project_id,
        p_limit: Math.min(limit, 50),
        p_file_types: file_types,
        p_directories: directories,
        p_similarity_threshold: similarity_threshold,
    });

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
        file_path: row.file_path,
        chunk_text: row.chunk_text,
        start_line: row.start_line,
        end_line: row.end_line,
        language: row.language,
        similarity: Math.round(row.similarity * 1000) / 10, // Convert to percentage with 1 decimal
    }));
}

/**
 * Add a memory to the project
 */
export async function addMemory(
    supabase: SupabaseClient,
    args: {
        project_id: string;
        memory_type: string;
        title: string;
        content: string;
        source_work_item_id?: string;
        is_global?: boolean;
        created_by_agent?: string;
    }
): Promise<any> {
    const {
        project_id,
        memory_type,
        title,
        content,
        source_work_item_id,
        is_global = false,
        created_by_agent = 'unknown',
    } = args;

    // Validate memory type
    if (!MEMORY_TYPES.includes(memory_type as MemoryType)) {
        throw new Error(`Invalid memory_type. Must be one of: ${MEMORY_TYPES.join(', ')}`);
    }

    // Generate embedding for title + content
    const textToEmbed = `${title}\n\n${content}`;
    const embedding = await generateEmbedding(textToEmbed);

    const insertData: any = {
        project_id,
        memory_type,
        title,
        content,
        embedding: `[${embedding.join(',')}]`,
        is_global,
        created_by_agent,
    };

    if (source_work_item_id) {
        insertData.source_work_item_id = source_work_item_id;
    }

    const { data, error } = await supabase
        .from('project_memory')
        .insert(insertData)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Search memories semantically
 */
export async function searchMemories(
    supabase: SupabaseClient,
    args: {
        project_id: string;
        query: string;
        memory_types?: string[];
        include_global?: boolean;
        limit?: number;
    }
): Promise<any[]> {
    const {
        project_id,
        query,
        memory_types = null,
        include_global = true,
        limit = 10,
    } = args;

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Call the database function
    const { data, error } = await supabase.rpc('search_memories', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        p_project_id: project_id,
        p_limit: limit,
        p_memory_types: memory_types,
        p_include_global: include_global,
        p_similarity_threshold: 0.5,
    });

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
        id: row.id,
        memory_type: row.memory_type,
        title: row.title,
        content: row.content,
        source_work_item_id: row.source_work_item_id,
        created_by_agent: row.created_by_agent,
        is_global: row.is_global,
        created_at: row.created_at,
        similarity: Math.round(row.similarity * 1000) / 10,
    }));
}

/**
 * Recall context for a work item
 */
export async function recallContext(
    supabase: SupabaseClient,
    args: {
        work_item_id: string;
        code_limit?: number;
        memory_limit?: number;
        related_limit?: number;
    }
): Promise<{
    query_used: string;
    code_snippets: any[];
    memories: any[];
    related_work_items: any[];
}> {
    const {
        work_item_id,
        code_limit = 5,
        memory_limit = 5,
        related_limit = 5,
    } = args;

    // Fetch the work item
    const { data: workItem, error: workItemError } = await supabase
        .from('work_items')
        .select('*')
        .eq('id', work_item_id)
        .single();

    if (workItemError) throw new Error(workItemError.message);
    if (!workItem) throw new Error('Work item not found');

    // Build search query from title and description
    const searchQuery = `${workItem.title}\n${workItem.description || ''}`.slice(0, 1000);

    // Run searches in parallel
    const [codeResults, memoryResults, relatedItems] = await Promise.all([
        // Search codebase
        searchCodebase(supabase, {
            project_id: workItem.project_id,
            query: searchQuery,
            limit: code_limit,
        }).catch(() => []),

        // Search memories
        searchMemories(supabase, {
            project_id: workItem.project_id,
            query: searchQuery,
            limit: memory_limit,
        }).catch(() => []),

        // Find related work items (by keywords/type)
        (async () => {
            try {
                const res = await supabase
                    .from('work_items')
                    .select('id, title, type, status, description')
                    .eq('project_id', workItem.project_id)
                    .neq('id', work_item_id)
                    .in('status', ['done', 'review'])
                    .order('completed_at', { ascending: false })
                    .limit(related_limit);
                return res.data || [];
            } catch {
                return [];
            }
        })(),
    ]);

    return {
        query_used: searchQuery,
        code_snippets: codeResults,
        memories: memoryResults,
        related_work_items: relatedItems,
    };
}

/**
 * Update index incrementally for changed files
 */
export async function updateIndex(
    supabase: SupabaseClient,
    args: {
        project_id?: string;
        repo_path: string;
        files?: string[];
        deleted_files?: string[];
    }
): Promise<{ updated: number; deleted: number }> {
    const project_id = await resolveProjectId(args);
    const {
        repo_path,
        files = [],
        deleted_files = [],
    } = args;

    let updated = 0;
    let deleted = 0;

    // Handle deleted files
    for (const file of deleted_files) {
        const { error } = await supabase
            .from('code_embeddings')
            .delete()
            .eq('project_id', project_id)
            .eq('file_path', file);

        if (!error) deleted++;
    }

    // Handle changed files
    for (const file of files) {
        const fullPath = path.join(repo_path, file);
        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const fileHash = hashFile(content);

            // Check if file hash changed
            const { data: existing } = await supabase
                .from('code_embeddings')
                .select('file_hash')
                .eq('project_id', project_id)
                .eq('file_path', file)
                .limit(1);

            if (existing && existing.length > 0 && existing[0].file_hash === fileHash) {
                continue; // File unchanged
            }

            // Delete old chunks
            await supabase
                .from('code_embeddings')
                .delete()
                .eq('project_id', project_id)
                .eq('file_path', file);

            // Chunk and embed
            const chunks = chunkFile(file, content);
            if (!chunks) continue;

            const texts = chunks.map(c => c.text);
            const embeddings = await generateEmbeddingsBatch(texts);

            const rows = chunks.map((chunk, idx) => ({
                project_id,
                file_path: file,
                chunk_index: chunk.chunkIndex,
                chunk_text: chunk.text,
                embedding: `[${embeddings[idx].join(',')}]`,
                file_hash: fileHash,
                language: chunk.language,
                start_line: chunk.startLine,
                end_line: chunk.endLine,
            }));

            const { error } = await supabase.from('code_embeddings').insert(rows);
            if (!error) updated++;
        } catch (error) {
            console.error(`Error updating file ${file}:`, error);
        }
    }

    // Update index status
    await supabase.from('code_index_status').upsert({
        project_id,
        last_indexed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    return { updated, deleted };
}

/**
 * Execute a memory tool by name
 */
export async function executeMemoryTool(
    supabase: SupabaseClient,
    name: string,
    args: Record<string, unknown>
): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
    try {
        let result: any;

        switch (name) {
            case 'index_project':
                result = await indexProject(supabase, args as any);
                return {
                    content: [{
                        type: 'text',
                        text: `Indexing complete!\n\nFiles processed: ${result.files_processed}\nChunks created: ${result.chunks_created}\nDuration: ${result.duration_ms}ms`,
                    }],
                };

            case 'search_codebase':
                result = await searchCodebase(supabase, args as any);
                return {
                    content: [{
                        type: 'text',
                        text: result.length > 0
                            ? `Found ${result.length} results:\n\n${result.map((r: any) =>
                                `**${r.file_path}** (${r.start_line}-${r.end_line}) - ${r.similarity}% match\n\`\`\`${r.language}\n${r.chunk_text.slice(0, 500)}${r.chunk_text.length > 500 ? '...' : ''}\n\`\`\``
                            ).join('\n\n')}`
                            : 'No results found.',
                    }],
                };

            case 'add_memory':
                result = await addMemory(supabase, args as any);
                return {
                    content: [{
                        type: 'text',
                        text: `Memory added successfully!\n\nID: ${result.id}\nType: ${result.memory_type}\nTitle: ${result.title}`,
                    }],
                };

            case 'search_memories':
                result = await searchMemories(supabase, args as any);
                return {
                    content: [{
                        type: 'text',
                        text: result.length > 0
                            ? `Found ${result.length} memories:\n\n${result.map((r: any) =>
                                `**[${r.memory_type}] ${r.title}** (${r.similarity}% match)\n${r.content.slice(0, 300)}${r.content.length > 300 ? '...' : ''}`
                            ).join('\n\n')}`
                            : 'No memories found.',
                    }],
                };

            case 'recall_context':
                result = await recallContext(supabase, args as any);
                const contextParts = [];
                if (result.code_snippets.length > 0) {
                    contextParts.push(`## Code Snippets (${result.code_snippets.length})\n${result.code_snippets.map((c: any) =>
                        `- ${c.file_path}:${c.start_line} (${c.similarity}%)`
                    ).join('\n')}`);
                }
                if (result.memories.length > 0) {
                    contextParts.push(`## Memories (${result.memories.length})\n${result.memories.map((m: any) =>
                        `- [${m.memory_type}] ${m.title}`
                    ).join('\n')}`);
                }
                if (result.related_work_items.length > 0) {
                    contextParts.push(`## Related Work Items (${result.related_work_items.length})\n${result.related_work_items.map((w: any) =>
                        `- [${w.type}] ${w.title} (${w.status})`
                    ).join('\n')}`);
                }
                return {
                    content: [{
                        type: 'text',
                        text: contextParts.length > 0
                            ? `Context for work item:\n\n${contextParts.join('\n\n')}`
                            : 'No context found.',
                    }],
                };

            case 'update_index':
                result = await updateIndex(supabase, args as any);
                return {
                    content: [{
                        type: 'text',
                        text: `Index updated!\n\nFiles updated: ${result.updated}\nFiles deleted: ${result.deleted}`,
                    }],
                };

            default:
                throw new Error(`Unknown memory tool: ${name}`);
        }
    } catch (error: any) {
        return {
            content: [{ type: 'text', text: `Error: ${error.message}` }],
            isError: true,
        };
    }
}
