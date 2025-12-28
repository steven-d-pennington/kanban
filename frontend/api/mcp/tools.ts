import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Generate embeddings using native fetch (more reliable in serverless)
async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    if (!apiKey.startsWith('sk-')) {
        throw new Error(`OPENAI_API_KEY appears invalid (should start with sk-). Got: ${apiKey.slice(0, 10)}...`);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: text.slice(0, 8000 * 4), // Limit to max tokens
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json() as { data: { embedding: number[] }[] };
    return data.data[0].embedding;
}

// Memory types
const MEMORY_TYPES = [
    'decision', 'pattern', 'convention', 'lesson',
    'architecture', 'warning', 'preference',
] as const;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!supabase) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
}

// Tool definitions
export const tools = [
    {
        name: "list_projects",
        description: "List all projects.",
        inputSchema: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    description: "Filter by status (default 'active')",
                    enum: ["active", "archived", "completed"],
                },
            },
        },
    },
    {
        name: "create_project",
        description: "Create a new project.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Name of the project",
                },
                description: {
                    type: "string",
                    description: "Description of the project",
                },
                user_id: {
                    type: "string",
                    description: "UUID of the user who owns this project (for RLS visibility)",
                },
            },
            required: ["name"],
        },
    },
    {
        name: "list_work_items",
        description: "List work items from the Kanban board.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "Filter by project ID",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of items to return (default 10)",
                },
                status: {
                    type: "string",
                    description: "Filter by status (default 'ready')",
                    enum: ["backlog", "todo", "ready", "in_progress", "review", "testing", "done"],
                },
                type: {
                    type: "string",
                    description: "Filter by work item type",
                    enum: ["project_spec", "feature", "prd", "story", "bug", "task"],
                },
            },
        },
    },
    {
        name: "get_work_item",
        description: "Get details of a specific work item by ID.",
        inputSchema: {
            type: "object",
            properties: {
                work_item_id: {
                    type: "string",
                    description: "UUID of the work item",
                },
            },
            required: ["work_item_id"],
        },
    },
    {
        name: "claim_work_item",
        description: "Claim a work item to start working on it.",
        inputSchema: {
            type: "object",
            properties: {
                work_item_id: {
                    type: "string",
                    description: "UUID of the work item to claim",
                },
                agent_type: {
                    type: "string",
                    description: "Type of agent claiming the item (default 'developer')",
                },
            },
            required: ["work_item_id"],
        },
    },
    {
        name: "add_comment",
        description: "Add a comment to a work item.",
        inputSchema: {
            type: "object",
            properties: {
                work_item_id: {
                    type: "string",
                    description: "UUID of the work item",
                },
                content: {
                    type: "string",
                    description: "Comment text",
                },
            },
            required: ["work_item_id", "content"],
        },
    },
    {
        name: "complete_work_item",
        description: "Mark a work item as complete (moves to review).",
        inputSchema: {
            type: "object",
            properties: {
                work_item_id: {
                    type: "string",
                    description: "UUID of the work item",
                },
                summary: {
                    type: "string",
                    description: "Summary of work done",
                },
            },
            required: ["work_item_id"],
        },
    },
    {
        name: "create_work_item",
        description: "Create a new work item in a project.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "UUID of the project",
                },
                title: {
                    type: "string",
                    description: "Title of the work item",
                },
                description: {
                    type: "string",
                    description: "Detailed description",
                },
                type: {
                    type: "string",
                    description: "Type of work item",
                    enum: ["project_spec", "feature", "prd", "story", "bug", "task"],
                },
                parent_id: {
                    type: "string",
                    description: "UUID of parent work item (for creating child items)",
                },
                priority: {
                    type: "string",
                    description: "Priority level (default 'medium')",
                    enum: ["critical", "high", "medium", "low"],
                },
                status: {
                    type: "string",
                    description: "Initial status (default 'ready')",
                    enum: ["backlog", "ready"],
                },
                story_points: {
                    type: "number",
                    description: "Story point estimate",
                    enum: [1, 2, 3, 5, 8, 13, 21],
                },
                labels: {
                    type: "array",
                    items: { type: "string" },
                    description: "Labels/tags for the item",
                },
                metadata: {
                    type: "object",
                    description: "Additional metadata",
                },
                user_id: {
                    type: "string",
                    description: "UUID of the user who created this item (for RLS visibility)",
                },
            },
            required: ["project_id", "title", "type"],
        },
    },
    {
        name: "update_work_item",
        description: "Update an existing work item.",
        inputSchema: {
            type: "object",
            properties: {
                work_item_id: {
                    type: "string",
                    description: "UUID of the work item",
                },
                title: {
                    type: "string",
                    description: "New title",
                },
                description: {
                    type: "string",
                    description: "New description",
                },
                status: {
                    type: "string",
                    description: "New status",
                    enum: ["backlog", "todo", "ready", "in_progress", "review", "testing", "done"],
                },
                priority: {
                    type: "string",
                    description: "New priority",
                    enum: ["critical", "high", "medium", "low"],
                },
                story_points: {
                    type: "number",
                    description: "Story point estimate",
                    enum: [1, 2, 3, 5, 8, 13, 21],
                },
                labels: {
                    type: "array",
                    items: { type: "string" },
                    description: "Labels/tags for the item",
                },
                metadata: {
                    type: "object",
                    description: "Additional metadata to merge",
                },
            },
            required: ["work_item_id"],
        },
    },
    {
        name: "handoff_work_item",
        description: "Complete a work item and optionally create child items for the next agent in the pipeline.",
        inputSchema: {
            type: "object",
            properties: {
                work_item_id: {
                    type: "string",
                    description: "UUID of the work item to complete",
                },
                agent_type: {
                    type: "string",
                    description: "Type of agent completing the work",
                    enum: ["project_manager", "scrum_master", "developer", "code_reviewer", "qa_tester"],
                },
                output: {
                    type: "object",
                    description: "Structured output from the agent's work",
                },
                child_items: {
                    type: "array",
                    description: "Child items to create for the next stage",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            type: { type: "string", enum: ["prd", "story", "task", "bug"] },
                            story_points: { type: "number" },
                            metadata: { type: "object" },
                        },
                        required: ["title", "type"],
                    },
                },
            },
            required: ["work_item_id", "agent_type", "output"],
        },
    },
    // Memory/RAG tools
    {
        name: "index_project",
        description: "Index a codebase for semantic search. NOTE: This tool requires local filesystem access and must be run via the stdio MCP server, not the HTTP API.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: { type: "string", description: "UUID of the project" },
                repo_path: { type: "string", description: "Absolute path to the repository" },
                file_patterns: { type: "array", items: { type: "string" }, description: "Glob patterns for files to index" },
                incremental: { type: "boolean", description: "Only index changed files (default: true)" },
            },
            required: ["project_id", "repo_path"],
        },
    },
    {
        name: "search_codebase",
        description: "Search the codebase semantically using natural language queries.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: { type: "string", description: "UUID of the project" },
                query: { type: "string", description: "Natural language search query" },
                file_types: { type: "array", items: { type: "string" }, description: "Filter by file types (e.g., ['typescript', 'python'])" },
                directories: { type: "array", items: { type: "string" }, description: "Filter by directories" },
                limit: { type: "number", description: "Maximum results to return (default: 10, max: 50)" },
                similarity_threshold: { type: "number", description: "Minimum similarity score 0-1 (default: 0.5)" },
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
                project_id: { type: "string", description: "UUID of the project" },
                memory_type: { type: "string", description: "Type of memory", enum: MEMORY_TYPES },
                title: { type: "string", description: "Brief title for the memory" },
                content: { type: "string", description: "Detailed content of the memory" },
                source_work_item_id: { type: "string", description: "UUID of the work item this memory came from (optional)" },
                is_global: { type: "boolean", description: "Make this memory visible across all projects (default: false)" },
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
                project_id: { type: "string", description: "UUID of the project" },
                query: { type: "string", description: "Natural language search query" },
                memory_types: { type: "array", items: { type: "string", enum: MEMORY_TYPES }, description: "Filter by memory types" },
                include_global: { type: "boolean", description: "Include global memories (default: true)" },
                limit: { type: "number", description: "Maximum results to return (default: 10)" },
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
                work_item_id: { type: "string", description: "UUID of the work item to get context for" },
                code_limit: { type: "number", description: "Max code snippets (default: 5)" },
                memory_limit: { type: "number", description: "Max memories (default: 5)" },
                related_limit: { type: "number", description: "Max related work items (default: 5)" },
            },
            required: ["work_item_id"],
        },
    },
    {
        name: "update_index",
        description: "Incrementally update the code index for changed files. NOTE: This tool requires local filesystem access and must be run via the stdio MCP server, not the HTTP API.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: { type: "string", description: "UUID of the project" },
                repo_path: { type: "string", description: "Absolute path to the repository" },
                files: { type: "array", items: { type: "string" }, description: "Files that changed (relative paths)" },
                deleted_files: { type: "array", items: { type: "string" }, description: "Files that were deleted (relative paths)" },
            },
            required: ["project_id", "repo_path"],
        },
    },
];

// Tool execution handler
export async function executeTool(name: string, args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
    try {
        const db = getSupabase();

        if (name === "list_projects") {
            const status = String(args?.status || "active");

            const { data, error } = await db
                .from("projects")
                .select("*")
                .eq("status", status)
                .order("created_at", { ascending: false });

            if (error) throw new Error(error.message);
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            };
        }

        if (name === "create_project") {
            const name_val = String(args?.name);
            const description = args?.description ? String(args.description) : "";
            const user_id = args?.user_id ? String(args.user_id) : null;

            const insertData: Record<string, unknown> = {
                name: name_val,
                description,
                status: "active",
            };
            if (user_id) insertData.created_by = user_id;

            const { data, error } = await db
                .from("projects")
                .insert(insertData)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return {
                content: [{ type: "text", text: `Project "${data.name}" created successfully.\n\n${JSON.stringify(data, null, 2)}` }],
            };
        }

        if (name === "list_work_items") {
            const limit = Number(args?.limit) || 10;
            const status = args?.status ? String(args.status) : "ready";
            const project_id = args?.project_id ? String(args.project_id) : null;
            const item_type = args?.type ? String(args.type) : null;

            let query = db
                .from("work_items")
                .select("*")
                .eq("status", status)
                .order("priority", { ascending: false })
                .order("created_at", { ascending: true })
                .limit(limit);

            if (project_id) {
                query = query.eq("project_id", project_id);
            }
            if (item_type) {
                query = query.eq("type", item_type);
            }

            const { data, error } = await query;

            if (error) throw new Error(error.message);
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            };
        }

        if (name === "get_work_item") {
            const work_item_id = String(args?.work_item_id);

            const { data, error } = await db
                .from("work_items")
                .select("*")
                .eq("id", work_item_id)
                .single();

            if (error) throw new Error(error.message);
            if (!data) throw new Error("Work item not found");

            // Also fetch comments for this work item
            const { data: comments } = await db
                .from("comments")
                .select("*")
                .eq("work_item_id", work_item_id)
                .order("created_at", { ascending: true });

            return {
                content: [{ type: "text", text: JSON.stringify({ ...data, comments: comments || [] }, null, 2) }],
            };
        }

        if (name === "claim_work_item") {
            const work_item_id = String(args?.work_item_id);
            const agent_type = String(args?.agent_type || "developer");
            const instance_id = `ext-${Date.now()}`;

            const { data, error } = await db
                .from("work_items")
                .update({
                    status: "in_progress",
                    assigned_agent: agent_type,
                    started_at: new Date().toISOString(),
                })
                .eq("id", work_item_id)
                .select();

            if (error) throw new Error(error.message);
            if (!data || data.length === 0) throw new Error("Work item not found");
            return {
                content: [{ type: "text", text: `Successfully claimed item "${data[0].title}". Session ID: ${instance_id}` }],
            };
        }

        if (name === "add_comment") {
            const work_item_id = String(args?.work_item_id);
            const content = String(args?.content);

            const { error } = await db
                .from("comments")
                .insert({
                    work_item_id,
                    content,
                    author_agent: "developer",
                })
                .select();

            if (error) throw new Error(error.message);
            return {
                content: [{ type: "text", text: "Comment added successfully." }],
            };
        }

        if (name === "complete_work_item") {
            const work_item_id = String(args?.work_item_id);
            const summary = String(args?.summary || "Completed externally");

            const { data, error } = await db
                .from("work_items")
                .update({
                    status: "review",
                    completed_at: new Date().toISOString(),
                })
                .eq("id", work_item_id)
                .select();

            if (error) throw new Error(error.message);
            if (!data || data.length === 0) throw new Error("Work item not found");

            // Add a completion comment if summary provided
            if (summary && summary !== "Completed externally") {
                await db.from("comments").insert({
                    work_item_id,
                    content: `Work completed: ${summary}`,
                    author_agent: "developer",
                });
            }

            return {
                content: [{ type: "text", text: `Work item "${data[0].title}" completed and moved to review.` }],
            };
        }

        if (name === "create_work_item") {
            const project_id = String(args?.project_id);
            const title = String(args?.title);
            const description = args?.description ? String(args.description) : "";
            const type = String(args?.type);
            const parent_id = args?.parent_id ? String(args.parent_id) : null;
            const priority = args?.priority ? String(args.priority) : "medium";
            const status = args?.status ? String(args.status) : "ready";
            const story_points = args?.story_points ? Number(args.story_points) : null;
            const labels = args?.labels || [];
            const metadata = args?.metadata || {};
            const user_id = args?.user_id ? String(args.user_id) : null;

            const insertData: Record<string, unknown> = {
                project_id,
                title,
                description,
                type,
                priority,
                status,
                labels,
                metadata,
            };

            if (parent_id) insertData.parent_id = parent_id;
            if (story_points) insertData.story_points = story_points;
            if (user_id) insertData.created_by = user_id;

            const { data, error } = await db
                .from("work_items")
                .insert(insertData)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return {
                content: [{ type: "text", text: `Work item "${data.title}" created successfully.\n\n${JSON.stringify(data, null, 2)}` }],
            };
        }

        if (name === "update_work_item") {
            const work_item_id = String(args?.work_item_id);

            const updateData: Record<string, unknown> = {};
            if (args?.title) updateData.title = String(args.title);
            if (args?.description !== undefined) updateData.description = String(args.description);
            if (args?.status) updateData.status = String(args.status);
            if (args?.priority) updateData.priority = String(args.priority);
            if (args?.story_points) updateData.story_points = Number(args.story_points);
            if (args?.labels) updateData.labels = args.labels;

            // Handle metadata merge
            if (args?.metadata) {
                const { data: existing } = await db
                    .from("work_items")
                    .select("metadata")
                    .eq("id", work_item_id)
                    .single();

                updateData.metadata = { ...(existing?.metadata || {}), ...(args.metadata as Record<string, unknown>) };
            }

            if (Object.keys(updateData).length === 0) {
                throw new Error("No fields to update");
            }

            const { data, error } = await db
                .from("work_items")
                .update(updateData)
                .eq("id", work_item_id)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return {
                content: [{ type: "text", text: `Work item "${data.title}" updated successfully.\n\n${JSON.stringify(data, null, 2)}` }],
            };
        }

        if (name === "handoff_work_item") {
            const work_item_id = String(args?.work_item_id);
            const agent_type = String(args?.agent_type);
            const output = args?.output || {};
            const child_items = args?.child_items || [];

            // Get the current work item
            const { data: workItem, error: fetchError } = await db
                .from("work_items")
                .select("*")
                .eq("id", work_item_id)
                .single();

            if (fetchError) throw new Error(fetchError.message);
            if (!workItem) throw new Error("Work item not found");

            // Mark the current item as done
            const { error: updateError } = await db
                .from("work_items")
                .update({
                    status: "done",
                    completed_at: new Date().toISOString(),
                    assigned_agent: null,
                    metadata: {
                        ...workItem.metadata,
                        output,
                        completed_by_agent: agent_type,
                        completed_at: new Date().toISOString(),
                    },
                })
                .eq("id", work_item_id);

            if (updateError) throw new Error(updateError.message);

            // Create child items if provided
            const createdChildren: Record<string, unknown>[] = [];
            const childArray = Array.isArray(child_items) ? child_items : [];
            for (const child of childArray) {
                const typedChild = child as { title: string; description?: string; type: string; story_points?: number; metadata?: Record<string, unknown> };
                const childData: Record<string, unknown> = {
                    project_id: workItem.project_id,
                    parent_id: work_item_id,
                    title: typedChild.title,
                    description: typedChild.description || "",
                    type: typedChild.type,
                    priority: workItem.priority,
                    status: "ready",
                    metadata: {
                        ...typedChild.metadata,
                        created_by_agent: agent_type,
                        parent_output: output,
                    },
                };
                if (typedChild.story_points) childData.story_points = typedChild.story_points;
                // Inherit created_by from parent work item for RLS visibility
                if (workItem.created_by) childData.created_by = workItem.created_by;

                const { data: newChild, error: childError } = await db
                    .from("work_items")
                    .insert(childData)
                    .select()
                    .single();

                if (!childError && newChild) {
                    createdChildren.push(newChild);
                }
            }

            // Log the handoff in agent_activity
            await db.from("agent_activity").insert({
                work_item_id,
                agent_type,
                action: "handed_off",
                details: {
                    child_count: createdChildren.length,
                    child_ids: createdChildren.map(c => (c as { id: string }).id),
                },
                output_data: output,
                status: "success",
            });

            // Record in handoff_history
            await db.from("handoff_history").insert({
                source_work_item_id: work_item_id,
                target_work_item_ids: createdChildren.map(c => (c as { id: string }).id),
                from_agent_type: agent_type,
                output_data: output,
                validation_passed: true,
            });

            return {
                content: [{
                    type: "text",
                    text: `Handoff complete for "${workItem.title}".\n\nCreated ${createdChildren.length} child item(s):\n${createdChildren.map(c => `- ${(c as { title: string }).title} (${(c as { type: string }).type})`).join('\n')}\n\n${JSON.stringify({ completed_item: work_item_id, child_items: createdChildren.map(c => (c as { id: string }).id) }, null, 2)}`,
                }],
            };
        }

        // Memory/RAG tools
        if (name === "index_project" || name === "update_index") {
            return {
                content: [{
                    type: "text",
                    text: `Error: The ${name} tool requires local filesystem access and cannot be run via the HTTP API. Please use the stdio MCP server instead:\n\n1. Configure the MCP server in your Claude Code settings\n2. Run: npx ts-node MCP/src/index.ts\n\nOr use the git post-commit hook for automatic indexing.`,
                }],
                isError: true,
            };
        }

        if (name === "search_codebase") {
            const project_id = String(args?.project_id);
            const query = String(args?.query);
            const file_types = args?.file_types as string[] | null || null;
            const directories = args?.directories as string[] | null || null;
            const limit = Math.min(Number(args?.limit) || 10, 50);

            // Query code embeddings directly (vector search via RPC has compatibility issues)
            let dbQuery = db
                .from('code_embeddings')
                .select('id, file_path, chunk_text, chunk_index, start_line, end_line, language')
                .eq('project_id', project_id)
                .limit(limit * 2);

            if (file_types && file_types.length > 0) {
                dbQuery = dbQuery.in('language', file_types);
            }

            const { data: codeData, error: codeError } = await dbQuery.order('created_at', { ascending: false });

            if (codeError) throw new Error(codeError.message);

            // Simple text matching for relevance (until vector search is fixed)
            const queryLower = query.toLowerCase();
            const results = (codeData || [])
                .map(row => {
                    const pathMatch = (row.file_path || '').toLowerCase().includes(queryLower) ? 30 : 0;
                    const textMatch = (row.chunk_text || '').toLowerCase().includes(queryLower) ? 50 : 0;
                    return {
                        file_path: row.file_path,
                        chunk_text: row.chunk_text,
                        start_line: row.start_line,
                        end_line: row.end_line,
                        language: row.language,
                        similarity: 50 + pathMatch + textMatch,
                    };
                })
                .filter(r => r.similarity > 50 || (directories && directories.some(d => r.file_path?.startsWith(d))))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            return {
                content: [{
                    type: "text",
                    text: results.length > 0
                        ? `Found ${results.length} results:\n\n${results.map((r: Record<string, unknown>) =>
                            `**${r.file_path}** (${r.start_line}-${r.end_line}) - ${r.similarity}% match\n\`\`\`${r.language}\n${(r.chunk_text as string).slice(0, 500)}${(r.chunk_text as string).length > 500 ? '...' : ''}\n\`\`\``
                        ).join('\n\n')}`
                        : 'No results found.',
                }],
            };
        }

        if (name === "add_memory") {
            const project_id = String(args?.project_id);
            const memory_type = String(args?.memory_type);
            const title = String(args?.title);
            const content = String(args?.content);
            const source_work_item_id = args?.source_work_item_id ? String(args.source_work_item_id) : null;
            const is_global = Boolean(args?.is_global) || false;

            // Validate memory type
            if (!MEMORY_TYPES.includes(memory_type as typeof MEMORY_TYPES[number])) {
                throw new Error(`Invalid memory_type. Must be one of: ${MEMORY_TYPES.join(', ')}`);
            }

            // Generate embedding for title + content
            const textToEmbed = `${title}\n\n${content}`;
            const embedding = await generateEmbedding(textToEmbed);

            const insertData: Record<string, unknown> = {
                project_id,
                memory_type,
                title,
                content,
                embedding: `[${embedding.join(',')}]`,
                is_global,
                created_by_agent: 'developer',
            };
            if (source_work_item_id) insertData.source_work_item_id = source_work_item_id;

            const { data, error } = await db
                .from('project_memory')
                .insert(insertData)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return {
                content: [{
                    type: "text",
                    text: `Memory added successfully!\n\nID: ${data.id}\nType: ${data.memory_type}\nTitle: ${data.title}`,
                }],
            };
        }

        if (name === "search_memories") {
            const project_id = String(args?.project_id);
            const query = String(args?.query);
            const memory_types = args?.memory_types as string[] | null || null;
            const include_global = args?.include_global !== false;
            const limit = Number(args?.limit) || 10;

            // Query memories directly (vector search via RPC has compatibility issues)
            // For now, fetch all matching memories and filter client-side
            let dbQuery = db
                .from('project_memory')
                .select('id, memory_type, title, content, source_work_item_id, created_by_agent, is_global, created_at')
                .eq('is_active', true)
                .limit(limit * 2); // Fetch extra to allow for filtering

            if (include_global) {
                dbQuery = dbQuery.or(`project_id.eq.${project_id},is_global.eq.true`);
            } else {
                dbQuery = dbQuery.eq('project_id', project_id);
            }

            if (memory_types && memory_types.length > 0) {
                dbQuery = dbQuery.in('memory_type', memory_types);
            }

            const { data: memData, error: memError } = await dbQuery.order('created_at', { ascending: false });

            if (memError) throw new Error(memError.message);

            // Simple text matching for relevance (until vector search is fixed)
            const queryLower = query.toLowerCase();
            const results = (memData || [])
                .map(row => {
                    const titleMatch = (row.title || '').toLowerCase().includes(queryLower) ? 40 : 0;
                    const contentMatch = (row.content || '').toLowerCase().includes(queryLower) ? 30 : 0;
                    const typeMatch = (row.memory_type || '').toLowerCase().includes(queryLower) ? 10 : 0;
                    return { ...row, similarity: 50 + titleMatch + contentMatch + typeMatch };
                })
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            return {
                content: [{
                    type: "text",
                    text: results.length > 0
                        ? `Found ${results.length} memories:\n\n${results.map((r: Record<string, unknown>) =>
                            `**[${r.memory_type}] ${r.title}** (${r.similarity}% match)\n${(r.content as string).slice(0, 300)}${(r.content as string).length > 300 ? '...' : ''}`
                        ).join('\n\n')}`
                        : 'No memories found.',
                }],
            };
        }

        if (name === "recall_context") {
            const work_item_id = String(args?.work_item_id);
            const code_limit = Number(args?.code_limit) || 5;
            const memory_limit = Number(args?.memory_limit) || 5;
            const related_limit = Number(args?.related_limit) || 5;

            // Fetch the work item
            const { data: workItem, error: workItemError } = await db
                .from('work_items')
                .select('*')
                .eq('id', work_item_id)
                .single();

            if (workItemError) throw new Error(workItemError.message);
            if (!workItem) throw new Error('Work item not found');

            // Build search query from title and description
            const searchQuery = `${workItem.title}\n${workItem.description || ''}`.slice(0, 1000);

            // Run searches in parallel (using direct queries instead of RPC for compatibility)
            const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);

            const [codeResults, memoryResults, relatedItems] = await Promise.all([
                // Search codebase
                (async () => {
                    try {
                        const res = await db
                            .from('code_embeddings')
                            .select('id, file_path, chunk_text, start_line, end_line, language')
                            .eq('project_id', workItem.project_id)
                            .limit(code_limit * 2);

                        // Simple text relevance scoring
                        return (res.data || [])
                            .map(row => ({
                                ...row,
                                similarity: searchTerms.reduce((score, term) =>
                                    score + ((row.chunk_text || '').toLowerCase().includes(term) ? 20 : 0) +
                                    ((row.file_path || '').toLowerCase().includes(term) ? 10 : 0), 50) / 100
                            }))
                            .filter(r => r.similarity > 0.5)
                            .sort((a, b) => b.similarity - a.similarity)
                            .slice(0, code_limit);
                    } catch { return []; }
                })(),

                // Search memories
                (async () => {
                    try {
                        const res = await db
                            .from('project_memory')
                            .select('id, memory_type, title, content')
                            .eq('is_active', true)
                            .or(`project_id.eq.${workItem.project_id},is_global.eq.true`)
                            .limit(memory_limit * 2);

                        return (res.data || [])
                            .map(row => ({
                                ...row,
                                similarity: searchTerms.reduce((score, term) =>
                                    score + ((row.title || '').toLowerCase().includes(term) ? 30 : 0) +
                                    ((row.content || '').toLowerCase().includes(term) ? 20 : 0), 50) / 100
                            }))
                            .filter(r => r.similarity > 0.5)
                            .sort((a, b) => b.similarity - a.similarity)
                            .slice(0, memory_limit);
                    } catch { return []; }
                })(),

                // Find related work items
                (async () => {
                    try {
                        const res = await db
                            .from('work_items')
                            .select('id, title, type, status, description')
                            .eq('project_id', workItem.project_id)
                            .neq('id', work_item_id)
                            .in('status', ['done', 'review'])
                            .order('completed_at', { ascending: false })
                            .limit(related_limit);
                        return res.data || [];
                    } catch { return []; }
                })(),
            ]);

            const contextParts = [];
            if (codeResults.length > 0) {
                contextParts.push(`## Code Snippets (${codeResults.length})\n${codeResults.map((c: Record<string, unknown>) =>
                    `- ${c.file_path}:${c.start_line} (${Math.round((c.similarity as number) * 1000) / 10}%)`
                ).join('\n')}`);
            }
            if (memoryResults.length > 0) {
                contextParts.push(`## Memories (${memoryResults.length})\n${memoryResults.map((m: Record<string, unknown>) =>
                    `- [${m.memory_type}] ${m.title}`
                ).join('\n')}`);
            }
            if (relatedItems.length > 0) {
                contextParts.push(`## Related Work Items (${relatedItems.length})\n${relatedItems.map((w: Record<string, unknown>) =>
                    `- [${w.type}] ${w.title} (${w.status})`
                ).join('\n')}`);
            }

            return {
                content: [{
                    type: "text",
                    text: contextParts.length > 0
                        ? `Context for work item:\n\n${contextParts.join('\n\n')}`
                        : 'No context found.',
                }],
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
        };
    }
}
