import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file from MCP directory
const __filename_env = fileURLToPath(import.meta.url);
const __dirname_env = path.dirname(__filename_env);
dotenv.config({ path: path.resolve(__dirname_env, '../.env') });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { supabase } from "./db.js";
import { generateEmbedding, prepareTextForEmbedding, generateEmbeddingsBatch } from "./embedding.js";
import { indexProject } from "./services/index-project.js";
import { chunkFile } from "./services/chunking.js";
import fs from 'fs';
import crypto from 'crypto';

const __filename = __filename_env;
const __dirname = __dirname_env;

const LOG_FILE = path.resolve(__dirname, '../../debug.log');

function log(msg: string) {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

log('Server starting...');
log(`Current Dir: ${process.cwd()}`);
log(`Env URL: ${process.env.SUPABASE_URL ? 'Set' : 'Unset'}`);

const server = new Server(
    {
        name: "kanban-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Handler for listing available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
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
                description: "List work items that are ready to be worked on.",
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
                            description: "Type of agent claiming the item (default 'external')",
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
            {
                name: "add_memory",
                description: "Store a learned decision, pattern, or lesson for future agent context. Embeds the memory for semantic search.",
                inputSchema: {
                    type: "object",
                    properties: {
                        project_id: {
                            type: "string",
                            description: "UUID of the project",
                        },
                        memory: {
                            type: "object",
                            description: "Memory object to store",
                            properties: {
                                type: {
                                    type: "string",
                                    description: "Type of memory",
                                    enum: ["decision", "pattern", "convention", "lesson", "architecture", "warning", "preference"],
                                },
                                title: {
                                    type: "string",
                                    description: "Title/summary of the memory",
                                },
                                content: {
                                    type: "string",
                                    description: "Detailed content of the memory",
                                },
                                source_work_item_id: {
                                    type: "string",
                                    description: "UUID of the work item that generated this memory (optional)",
                                },
                                is_global: {
                                    type: "boolean",
                                    description: "Whether this memory applies across all projects (default: false)",
                                },
                            },
                            required: ["type", "title", "content"],
                        },
                        created_by_agent: {
                            type: "string",
                            description: "Agent type that created this memory (default: 'developer')",
                        },
                    },
                    required: ["project_id", "memory"],
                },
            },
            {
                name: "search_codebase",
                description: "Semantic code search to find relevant code without knowing exact paths. Uses vector similarity to match query intent.",
                inputSchema: {
                    type: "object",
                    properties: {
                        project_id: {
                            type: "string",
                            description: "UUID of the project to search in",
                        },
                        query: {
                            type: "string",
                            description: "Natural language search query describing what code you're looking for",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of results to return (default 10, max 50)",
                        },
                        file_types: {
                            type: "array",
                            items: { type: "string" },
                            description: "Filter by file extensions (e.g., ['ts', 'js'])",
                        },
                        directories: {
                            type: "array",
                            items: { type: "string" },
                            description: "Filter by directory paths (e.g., ['src/components'])",
                        },
                        similarity_threshold: {
                            type: "number",
                            description: "Minimum similarity score (0-1, default 0.5)",
                        },
                    },
                    required: ["project_id", "query"],
                },
            },
            {
                name: "search_memories",
                description: "Semantic search for past decisions, patterns, and lessons using vector similarity. Returns ranked results with relevance scores and source work item links.",
                inputSchema: {
                    type: "object",
                    properties: {
                        project_id: {
                            type: "string",
                            description: "UUID of the project to search within",
                        },
                        query: {
                            type: "string",
                            description: "Search query text (will be embedded for semantic search)",
                        },
                        memory_types: {
                            type: "array",
                            items: {
                                type: "string",
                                enum: ["decision", "pattern", "convention", "lesson", "architecture", "warning", "preference"],
                            },
                            description: "Filter results by memory type(s) (optional)",
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of results to return (default: 10)",
                        },
                        include_global: {
                            type: "boolean",
                            description: "Include global memories that apply across all projects (default: true)",
                        },
                        similarity_threshold: {
                            type: "number",
                            description: "Minimum similarity score (0.0-1.0) for results (default: 0.5)",
                        },
                    },
                    required: ["project_id", "query"],
                },
            },
            {
                name: "index_project",
                description: "Index entire codebase for semantic search. Discovers files, chunks code, generates embeddings, and stores them for later retrieval.",
                inputSchema: {
                    type: "object",
                    properties: {
                        project_id: {
                            type: "string",
                            description: "UUID of the project to index",
                        },
                        repo_path: {
                            type: "string",
                            description: "Absolute path to the repository root",
                        },
                        patterns: {
                            type: "array",
                            items: { type: "string" },
                            description: "Optional glob patterns to match files (default: **/*.ts, **/*.tsx, **/*.js, **/*.jsx, **/*.py, **/*.md)",
                        },
                        batch_size: {
                            type: "number",
                            description: "Number of chunks to process in each batch (default: 50)",
                        },
                    },
                    required: ["project_id", "repo_path"],
                },
            },
            {
                name: "recall_context",
                description: "Retrieve relevant context for a work item by combining codebase search, memory search, and related work items. Automatically provides context when claiming a work item.",
                inputSchema: {
                    type: "object",
                    properties: {
                        work_item_id: {
                            type: "string",
                            description: "UUID of the work item to get context for",
                        },
                        code_limit: {
                            type: "number",
                            description: "Maximum number of code snippets to return (default: 5)",
                        },
                        memory_limit: {
                            type: "number",
                            description: "Maximum number of memories to return (default: 5)",
                        },
                        related_limit: {
                            type: "number",
                            description: "Maximum number of related work items to return (default: 5)",
                        },
                    },
                    required: ["work_item_id"],
                },
            },
            {
                name: "update_index",
                description: "Incrementally update the code index for changed or deleted files. Compares file hashes to skip unchanged content.",
                inputSchema: {
                    type: "object",
                    properties: {
                        project_id: {
                            type: "string",
                            description: "UUID of the project",
                        },
                        repo_path: {
                            type: "string",
                            description: "Absolute path to the repository root",
                        },
                        files: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of file paths (relative to repo_path) to re-index",
                        },
                        deleted_files: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of file paths (relative to repo_path) to remove from index",
                        },
                    },
                    required: ["project_id", "repo_path"],
                },
            },
        ],
    };
});

/**
 * Handler for tool execution.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "list_projects") {
            const status = String(args?.status || "active");

            const { data, error } = await supabase
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

            const insertData: any = {
                name: name_val,
                description,
                status: "active",
            };
            if (user_id) insertData.created_by = user_id;

            const { data, error } = await supabase
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

            let query = supabase
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

            const { data, error } = await supabase
                .from("work_items")
                .select("*")
                .eq("id", work_item_id)
                .single();

            if (error) throw new Error(error.message);
            if (!data) throw new Error("Work item not found");

            // Also fetch comments for this work item
            const { data: comments } = await supabase
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
            const instance_id = `ext-${Date.now()}`; // Generate a session ID

            // Use direct database update instead of RPC
            const { data, error } = await supabase
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

            // Use 'developer' as the agent type (valid value in the database)
            const { data, error } = await supabase
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

            // Use direct database update instead of RPC
            const { data, error } = await supabase
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
                await supabase.from("comments").insert({
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

            const insertData: any = {
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

            const { data, error } = await supabase
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

            const updateData: any = {};
            if (args?.title) updateData.title = String(args.title);
            if (args?.description !== undefined) updateData.description = String(args.description);
            if (args?.status) updateData.status = String(args.status);
            if (args?.priority) updateData.priority = String(args.priority);
            if (args?.story_points) updateData.story_points = Number(args.story_points);
            if (args?.labels) updateData.labels = args.labels;

            // Handle metadata merge
            if (args?.metadata) {
                const { data: existing } = await supabase
                    .from("work_items")
                    .select("metadata")
                    .eq("id", work_item_id)
                    .single();

                updateData.metadata = { ...(existing?.metadata || {}), ...args.metadata };
            }

            if (Object.keys(updateData).length === 0) {
                throw new Error("No fields to update");
            }

            const { data, error } = await supabase
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
            const { data: workItem, error: fetchError } = await supabase
                .from("work_items")
                .select("*")
                .eq("id", work_item_id)
                .single();

            if (fetchError) throw new Error(fetchError.message);
            if (!workItem) throw new Error("Work item not found");

            // Mark the current item as done
            const { error: updateError } = await supabase
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
            const createdChildren: any[] = [];
            const childArray = Array.isArray(child_items) ? child_items : [];
            for (const child of childArray) {
                const childData: any = {
                    project_id: workItem.project_id,
                    parent_id: work_item_id,
                    title: child.title,
                    description: child.description || "",
                    type: child.type,
                    priority: workItem.priority,
                    status: "ready",
                    metadata: {
                        ...child.metadata,
                        created_by_agent: agent_type,
                        parent_output: output,
                    },
                };
                if (child.story_points) childData.story_points = child.story_points;
                // Inherit created_by from parent work item for RLS visibility
                if (workItem.created_by) childData.created_by = workItem.created_by;

                const { data: newChild, error: childError } = await supabase
                    .from("work_items")
                    .insert(childData)
                    .select()
                    .single();

                if (childError) {
                    log(`Error creating child item: ${childError.message}`);
                } else {
                    createdChildren.push(newChild);
                }
            }

            // Log the handoff in agent_activity
            await supabase.from("agent_activity").insert({
                work_item_id,
                agent_type,
                action: "handed_off",
                details: {
                    child_count: createdChildren.length,
                    child_ids: createdChildren.map(c => c.id),
                },
                output_data: output,
                status: "success",
            });

            // Record in handoff_history
            await supabase.from("handoff_history").insert({
                source_work_item_id: work_item_id,
                target_work_item_ids: createdChildren.map(c => c.id),
                from_agent_type: agent_type,
                output_data: output,
                validation_passed: true,
            });

            return {
                content: [{
                    type: "text",
                    text: `Handoff complete for "${workItem.title}".\n\nCreated ${createdChildren.length} child item(s):\n${createdChildren.map(c => `- ${c.title} (${c.type})`).join('\n')}\n\n${JSON.stringify({ completed_item: work_item_id, child_items: createdChildren.map(c => c.id) }, null, 2)}`,
                }],
            };
        }

        if (name === "add_memory") {
            const project_id = String(args?.project_id);
            const memory = args?.memory as any;
            const created_by_agent = args?.created_by_agent ? String(args.created_by_agent) : "developer";

            // Validate required memory fields
            if (!memory || typeof memory !== 'object') {
                throw new Error("Memory object is required");
            }

            const memory_type = String(memory.type);
            const title = String(memory.title);
            const content = String(memory.content);
            const source_work_item_id = memory.source_work_item_id ? String(memory.source_work_item_id) : null;
            const is_global = memory.is_global === true;

            // Validate memory type
            const validTypes = ["decision", "pattern", "convention", "lesson", "architecture", "warning", "preference"];
            if (!validTypes.includes(memory_type)) {
                throw new Error(`Invalid memory type. Must be one of: ${validTypes.join(", ")}`);
            }

            // Validate that title and content are provided
            if (!title || title.trim().length === 0) {
                throw new Error("Memory title is required");
            }
            if (!content || content.trim().length === 0) {
                throw new Error("Memory content is required");
            }

            // Verify the project exists
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .select("id, name")
                .eq("id", project_id)
                .single();

            if (projectError || !project) {
                throw new Error(`Project not found: ${project_id}`);
            }

            // If source_work_item_id provided, verify it exists
            if (source_work_item_id) {
                const { data: workItem, error: workItemError } = await supabase
                    .from("work_items")
                    .select("id")
                    .eq("id", source_work_item_id)
                    .single();

                if (workItemError || !workItem) {
                    throw new Error(`Source work item not found: ${source_work_item_id}`);
                }
            }

            // Generate embedding for the memory
            log(`Generating embedding for memory: ${title}`);
            const textToEmbed = prepareTextForEmbedding(title, content);
            let embedding: number[];

            try {
                embedding = await generateEmbedding(textToEmbed);
            } catch (embeddingError: any) {
                log(`Embedding generation failed: ${embeddingError.message}`);
                throw new Error(`Failed to generate embedding: ${embeddingError.message}`);
            }

            // Convert embedding array to PostgreSQL vector format
            const embeddingVector = `[${embedding.join(',')}]`;

            // Insert the memory into the database
            const insertData: any = {
                project_id,
                memory_type,
                title,
                content,
                embedding: embeddingVector,
                created_by_agent,
                is_global,
                is_active: true,
                relevance_score: 1.0,
            };

            if (source_work_item_id) {
                insertData.source_work_item_id = source_work_item_id;
            }

            const { data: newMemory, error: insertError } = await supabase
                .from("project_memory")
                .insert(insertData)
                .select()
                .single();

            if (insertError) {
                log(`Failed to insert memory: ${insertError.message}`);
                throw new Error(`Failed to create memory: ${insertError.message}`);
            }

            log(`Memory created successfully: ${newMemory.id}`);

            return {
                content: [{
                    type: "text",
                    text: `Memory created successfully!\n\nID: ${newMemory.id}\nType: ${memory_type}\nTitle: ${title}\nProject: ${project.name}\n${source_work_item_id ? `Linked to work item: ${source_work_item_id}\n` : ''}Created by: ${created_by_agent}\n\n${JSON.stringify(newMemory, null, 2)}`,
                }],
            };
        }

        if (name === "search_codebase") {
            const project_id = String(args?.project_id);
            const query = String(args?.query);
            const limit = Math.min(Number(args?.limit) || 10, 50); // Cap at 50
            const file_types = args?.file_types as string[] | undefined;
            const directories = args?.directories as string[] | undefined;
            const similarity_threshold = Number(args?.similarity_threshold) || 0.5;

            // Validate project exists
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .select("id, name")
                .eq("id", project_id)
                .single();

            if (projectError || !project) {
                throw new Error(`Project not found: ${project_id}`);
            }

            // Generate embedding for the query
            log(`Generating embedding for search query: ${query}`);
            let queryEmbedding: number[];

            try {
                queryEmbedding = await generateEmbedding(query);
            } catch (embeddingError: any) {
                log(`Embedding generation failed: ${embeddingError.message}`);
                throw new Error(`Failed to generate query embedding: ${embeddingError.message}`);
            }

            // Convert embedding to PostgreSQL vector format
            const embeddingVector = `[${queryEmbedding.join(',')}]`;

            log(`Searching codebase with limit=${limit}, threshold=${similarity_threshold}`);

            // Use the database function for the base search
            const { data: results, error: searchError } = await supabase
                .rpc('search_codebase', {
                    p_project_id: project_id,
                    p_query_embedding: embeddingVector,
                    p_limit: limit * 2, // Fetch extra for filtering
                    p_similarity_threshold: similarity_threshold,
                });

            if (searchError) {
                log(`Search error: ${searchError.message}`);
                throw new Error(`Search failed: ${searchError.message}`);
            }

            // Apply client-side filters for file_types and directories
            let filteredResults = results || [];

            if (file_types && file_types.length > 0) {
                const extensions = file_types.map(ft => ft.toLowerCase().replace(/^\./, ''));
                filteredResults = filteredResults.filter((result: any) => {
                    const ext = result.file_path.split('.').pop()?.toLowerCase();
                    return ext && extensions.includes(ext);
                });
            }

            if (directories && directories.length > 0) {
                filteredResults = filteredResults.filter((result: any) => {
                    return directories.some(dir => {
                        // Normalize paths for comparison
                        const normalizedPath = result.file_path.replace(/\\/g, '/');
                        const normalizedDir = dir.replace(/\\/g, '/');
                        return normalizedPath.includes(normalizedDir);
                    });
                });
            }

            // Limit to requested number after filtering
            filteredResults = filteredResults.slice(0, limit);

            log(`Search completed: ${filteredResults.length} results returned`);

            // Format results for display
            const formattedResults = filteredResults.map((r: any, idx: number) => {
                return `\n${idx + 1}. ${r.file_path}${r.language ? ` (${r.language})` : ''}\n` +
                       `   Lines ${r.chunk_start_line}-${r.chunk_end_line} | Similarity: ${(r.similarity * 100).toFixed(1)}%\n` +
                       `   ${r.chunk_text.substring(0, 150)}${r.chunk_text.length > 150 ? '...' : ''}`;
            });

            const summary = `Found ${filteredResults.length} code chunk(s) matching "${query}" in project "${project.name}"\n` +
                          (file_types ? `Filtered by extensions: ${file_types.join(', ')}\n` : '') +
                          (directories ? `Filtered by directories: ${directories.join(', ')}\n` : '') +
                          `Similarity threshold: ${(similarity_threshold * 100).toFixed(0)}%\n` +
                          `${formattedResults.join('\n')}`;

            return {
                content: [{
                    type: "text",
                    text: filteredResults.length > 0
                        ? `${summary}\n\n${JSON.stringify(filteredResults, null, 2)}`
                        : `No code chunks found matching "${query}" with similarity >= ${(similarity_threshold * 100).toFixed(0)}%.\n\nTry:\n- Lowering the similarity_threshold\n- Using different keywords\n- Checking if the code has been indexed`,
                }],
            };
        }

        if (name === "search_memories") {
            const project_id = String(args?.project_id);
            const query = String(args?.query);
            const limit = Number(args?.limit) || 10;
            const memory_types = args?.memory_types as string[] | undefined;
            const include_global = args?.include_global !== undefined ? Boolean(args.include_global) : true;
            const similarity_threshold = Number(args?.similarity_threshold) || 0.5;

            // Validate project exists
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .select("id, name")
                .eq("id", project_id)
                .single();

            if (projectError || !project) {
                throw new Error(`Project not found: ${project_id}`);
            }

            // Generate embedding for the query
            log(`Generating embedding for memory search query: ${query}`);
            let queryEmbedding: number[];

            try {
                queryEmbedding = await generateEmbedding(query);
            } catch (embeddingError: any) {
                log(`Embedding generation failed: ${embeddingError.message}`);
                throw new Error(`Failed to generate query embedding: ${embeddingError.message}`);
            }

            // Convert embedding to PostgreSQL vector format
            const embeddingVector = `[${queryEmbedding.join(',')}]`;

            log(`Searching memories with limit=${limit}, threshold=${similarity_threshold}, include_global=${include_global}`);
            if (memory_types) {
                log(`Filtering by memory types: ${memory_types.join(', ')}`);
            }

            // Use the database function for searching memories
            const { data: results, error: searchError } = await supabase
                .rpc('search_memories', {
                    p_project_id: project_id,
                    p_query_embedding: embeddingVector,
                    p_limit: limit,
                    p_memory_types: memory_types || null,
                    p_include_global: include_global,
                    p_similarity_threshold: similarity_threshold,
                });

            if (searchError) {
                log(`Memory search error: ${searchError.message}`);
                throw new Error(`Memory search failed: ${searchError.message}`);
            }

            const memories = results || [];
            log(`Memory search completed: ${memories.length} results returned`);

            // Format results for display
            const formattedResults = memories.map((m: any, idx: number) => {
                const agentInfo = m.created_by_agent ? ` by ${m.created_by_agent}` : '';
                const workItemInfo = m.source_work_item_id ? `\n   Source: Work Item ${m.source_work_item_id}` : '';
                const relevanceInfo = m.relevance_score !== 1.0 ? ` | Relevance: ${(m.relevance_score * 100).toFixed(0)}%` : '';

                return `\n${idx + 1}. [${m.memory_type.toUpperCase()}] ${m.title}\n` +
                       `   Created: ${new Date(m.created_at).toLocaleDateString()}${agentInfo}\n` +
                       `   Similarity: ${(m.similarity * 100).toFixed(1)}%${relevanceInfo}${workItemInfo}\n` +
                       `   ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`;
            });

            const summary = `Found ${memories.length} memor${memories.length === 1 ? 'y' : 'ies'} matching "${query}" in project "${project.name}"\n` +
                          (memory_types ? `Filtered by types: ${memory_types.join(', ')}\n` : '') +
                          (include_global ? `Including global memories\n` : 'Excluding global memories\n') +
                          `Similarity threshold: ${(similarity_threshold * 100).toFixed(0)}%\n` +
                          `${formattedResults.join('\n')}`;

            return {
                content: [{
                    type: "text",
                    text: memories.length > 0
                        ? `${summary}\n\n${JSON.stringify(memories, null, 2)}`
                        : `No memories found matching "${query}" with similarity >= ${(similarity_threshold * 100).toFixed(0)}%.\n\nTry:\n- Lowering the similarity_threshold\n- Using different keywords\n- Removing memory_types filter\n- Checking if memories have been added to the project`,
                }],
            };
        }

        if (name === "index_project") {
            const project_id = String(args?.project_id);
            const repo_path = String(args?.repo_path);
            const patterns = args?.patterns as string[] | undefined;
            const batch_size = args?.batch_size ? Number(args.batch_size) : undefined;

            log(`Starting project indexing: project_id=${project_id}, repo_path=${repo_path}`);

            // Call the indexing service
            const result = await indexProject({
                project_id,
                repo_path,
                patterns,
                batch_size
            });

            if (result.status === 'error') {
                log(`Indexing failed: ${result.error}`);
                throw new Error(`Indexing failed: ${result.error}`);
            }

            log(`Indexing completed successfully: ${result.files_processed} files, ${result.chunks_created} chunks, ${result.duration_ms}ms`);

            const summary = `Project indexing completed successfully!\n\n` +
                          `Files processed: ${result.files_processed}\n` +
                          `Chunks created: ${result.chunks_created}\n` +
                          `Duration: ${(result.duration_ms / 1000).toFixed(2)}s\n` +
                          `Average: ${(result.duration_ms / result.files_processed).toFixed(0)}ms per file\n\n` +
                          `The codebase is now indexed and ready for semantic search.`;

            return {
                content: [{
                    type: "text",
                    text: `${summary}\n\n${JSON.stringify(result, null, 2)}`,
                }],
            };
        }

        if (name === "recall_context") {
            const work_item_id = String(args?.work_item_id);
            const code_limit = Number(args?.code_limit) || 5;
            const memory_limit = Number(args?.memory_limit) || 5;
            const related_limit = Number(args?.related_limit) || 5;

            log(`Recalling context for work item: ${work_item_id}`);

            // Fetch the work item to get title and description
            const { data: workItem, error: workItemError } = await supabase
                .from("work_items")
                .select("*")
                .eq("id", work_item_id)
                .single();

            if (workItemError || !workItem) {
                throw new Error(`Work item not found: ${work_item_id}`);
            }

            // Prepare the search query from title and description
            const query = `${workItem.title} ${workItem.description || ''}`.trim();
            log(`Search query: ${query.substring(0, 100)}...`);

            // Generate embedding for the query once to reuse
            let queryEmbedding: number[];
            try {
                queryEmbedding = await generateEmbedding(query);
            } catch (embeddingError: any) {
                log(`Embedding generation failed: ${embeddingError.message}`);
                throw new Error(`Failed to generate query embedding: ${embeddingError.message}`);
            }

            const embeddingVector = `[${queryEmbedding.join(',')}]`;

            // Run searches in parallel for efficiency
            const [codeResults, memoryResults, relatedResults] = await Promise.all([
                // Search codebase
                supabase
                    .rpc('search_codebase', {
                        p_project_id: workItem.project_id,
                        p_query_embedding: embeddingVector,
                        p_limit: code_limit,
                        p_similarity_threshold: 0.5,
                    })
                    .then(({ data, error }: { data: any; error: any }) => {
                        if (error) {
                            log(`Codebase search error: ${error.message}`);
                            return [];
                        }
                        return data || [];
                    }),

                // Search memories
                supabase
                    .rpc('search_memories', {
                        p_project_id: workItem.project_id,
                        p_query_embedding: embeddingVector,
                        p_limit: memory_limit,
                        p_memory_types: null,
                        p_include_global: true,
                        p_similarity_threshold: 0.5,
                    })
                    .then(({ data, error }: { data: any; error: any }) => {
                        if (error) {
                            log(`Memory search error: ${error.message}`);
                            return [];
                        }
                        return data || [];
                    }),

                // Find related work items (same project, recent, similar keywords)
                supabase
                    .from("work_items")
                    .select("id, title, description, type, status, priority, created_at, labels")
                    .eq("project_id", workItem.project_id)
                    .neq("id", work_item_id)
                    .in("status", ["done", "review", "in_progress"])
                    .order("created_at", { ascending: false })
                    .limit(related_limit * 2) // Fetch extra for keyword filtering
                    .then(({ data, error }: { data: any; error: any }) => {
                        if (error) {
                            log(`Related work items error: ${error.message}`);
                            return [];
                        }

                        // Extract keywords from work item title and description
                        const extractKeywords = (text: string): Set<string> => {
                            const words = text.toLowerCase()
                                .replace(/[^\w\s]/g, ' ')
                                .split(/\s+/)
                                .filter(w => w.length > 3); // Filter short words
                            return new Set(words);
                        };

                        const workItemKeywords = extractKeywords(query);

                        // Score and sort related items by keyword overlap and recency
                        const scoredItems = (data || []).map((item: any) => {
                            const itemText = `${item.title} ${item.description || ''}`;
                            const itemKeywords = extractKeywords(itemText);

                            // Count keyword matches
                            let matches = 0;
                            itemKeywords.forEach(keyword => {
                                if (workItemKeywords.has(keyword)) matches++;
                            });

                            // Calculate recency score (newer = higher)
                            const ageInDays = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
                            const recencyScore = Math.max(0, 1 - (ageInDays / 30)); // Decay over 30 days

                            // Combined score: keyword matches weighted more than recency
                            const score = matches * 2 + recencyScore;

                            return { ...item, relevance_score: score };
                        });

                        // Sort by score and return top results
                        return scoredItems
                            .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
                            .slice(0, related_limit);
                    }),
            ]);

            log(`Context recall completed: ${codeResults.length} code snippets, ${memoryResults.length} memories, ${relatedResults.length} related items`);

            // Format the combined results
            const response = {
                work_item: {
                    id: workItem.id,
                    title: workItem.title,
                    description: workItem.description,
                    type: workItem.type,
                    status: workItem.status,
                },
                query_used: query,
                code_snippets: codeResults.map((r: any) => ({
                    file_path: r.file_path,
                    language: r.language,
                    lines: `${r.chunk_start_line}-${r.chunk_end_line}`,
                    similarity: r.similarity,
                    snippet: r.chunk_text.substring(0, 300),
                })),
                memories: memoryResults.map((m: any) => ({
                    id: m.id,
                    type: m.memory_type,
                    title: m.title,
                    content: m.content,
                    similarity: m.similarity,
                    created_by: m.created_by_agent,
                    source_work_item_id: m.source_work_item_id,
                })),
                related_work_items: relatedResults.map((w: any) => ({
                    id: w.id,
                    title: w.title,
                    description: w.description?.substring(0, 200),
                    type: w.type,
                    status: w.status,
                    priority: w.priority,
                    relevance_score: w.relevance_score,
                    labels: w.labels,
                })),
            };

            // Create a formatted summary
            const summary = `Context recalled for work item: "${workItem.title}"\n\n` +
                          `Query used: ${query.substring(0, 150)}${query.length > 150 ? '...' : ''}\n\n` +
                          `Found:\n` +
                          `- ${codeResults.length} relevant code snippet(s)\n` +
                          `- ${memoryResults.length} relevant memor${memoryResults.length === 1 ? 'y' : 'ies'}\n` +
                          `- ${relatedResults.length} related work item(s)\n`;

            return {
                content: [{
                    type: "text",
                    text: `${summary}\n${JSON.stringify(response, null, 2)}`,
                }],
            };
        }

        if (name === "update_index") {
            const startTime = Date.now();
            const project_id = String(args?.project_id);
            const repo_path = String(args?.repo_path);
            const files = (args?.files as string[]) || [];
            const deleted_files = (args?.deleted_files as string[]) || [];

            log(`Starting incremental index update: project_id=${project_id}, ${files.length} files to update, ${deleted_files.length} files to delete`);

            let filesUpdated = 0;
            let filesDeleted = 0;
            let filesSkipped = 0;

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
                    await fs.promises.access(repo_path);
                } catch (error) {
                    throw new Error(`Repository path not found: ${repo_path}`);
                }

                // Process deleted files
                if (deleted_files.length > 0) {
                    log(`Deleting embeddings for ${deleted_files.length} files`);

                    for (const filePath of deleted_files) {
                        const { error: deleteError } = await supabase
                            .from('code_embeddings')
                            .delete()
                            .eq('project_id', project_id)
                            .eq('file_path', filePath);

                        if (deleteError) {
                            log(`Error deleting embeddings for ${filePath}: ${deleteError.message}`);
                        } else {
                            filesDeleted++;
                        }
                    }
                }

                // Process updated/new files
                if (files.length > 0) {
                    log(`Processing ${files.length} files for updates`);

                    // Helper function to calculate file hash
                    const calculateFileHash = (content: string): string => {
                        return crypto.createHash('sha256').update(content).digest('hex');
                    };

                    // Collect all chunks to embed
                    const chunksToEmbed: Array<{
                        filePath: string;
                        fileHash: string;
                        chunks: any[];
                        shouldUpdate: boolean;
                    }> = [];

                    for (const relativeFilePath of files) {
                        const absolutePath = path.join(repo_path, relativeFilePath);

                        // Read file content
                        let content: string;
                        try {
                            content = await fs.promises.readFile(absolutePath, 'utf-8');
                        } catch (error: any) {
                            log(`Error reading file ${absolutePath}: ${error.message}`);
                            continue;
                        }

                        // Calculate file hash
                        const fileHash = calculateFileHash(content);

                        // Check if file hash has changed
                        const { data: existingEmbedding } = await supabase
                            .from('code_embeddings')
                            .select('file_hash')
                            .eq('project_id', project_id)
                            .eq('file_path', relativeFilePath)
                            .limit(1)
                            .single();

                        if (existingEmbedding && existingEmbedding.file_hash === fileHash) {
                            log(`Skipping unchanged file: ${relativeFilePath}`);
                            filesSkipped++;
                            continue;
                        }

                        // Chunk the file
                        const fileName = path.basename(absolutePath);
                        const chunks = chunkFile(content, fileName);

                        if (!chunks || chunks.length === 0) {
                            log(`File type not supported or empty: ${relativeFilePath}`);
                            continue;
                        }

                        chunksToEmbed.push({
                            filePath: relativeFilePath,
                            fileHash,
                            chunks,
                            shouldUpdate: true
                        });
                    }

                    // Process files in batches
                    if (chunksToEmbed.length > 0) {
                        log(`Generating embeddings for ${chunksToEmbed.length} files`);

                        for (const fileData of chunksToEmbed) {
                            // Extract chunk texts
                            const chunkTexts = fileData.chunks.map(c => c.text);

                            // Generate embeddings
                            let embeddings: number[][];
                            try {
                                embeddings = await generateEmbeddingsBatch(chunkTexts);
                            } catch (embeddingError: any) {
                                log(`Error generating embeddings for ${fileData.filePath}: ${embeddingError.message}`);
                                continue;
                            }

                            // Delete existing embeddings for this file
                            await supabase
                                .from('code_embeddings')
                                .delete()
                                .eq('project_id', project_id)
                                .eq('file_path', fileData.filePath);

                            // Prepare records for insert
                            const records = fileData.chunks.map((chunk, index) => ({
                                project_id,
                                file_path: fileData.filePath,
                                chunk_index: index,
                                chunk_text: chunk.text,
                                chunk_start_line: chunk.startLine,
                                chunk_end_line: chunk.endLine,
                                language: chunk.language,
                                file_hash: fileData.fileHash,
                                embedding: `[${embeddings[index].join(',')}]`
                            }));

                            // Insert new embeddings
                            const { error: insertError } = await supabase
                                .from('code_embeddings')
                                .insert(records);

                            if (insertError) {
                                log(`Error inserting embeddings for ${fileData.filePath}: ${insertError.message}`);
                            } else {
                                filesUpdated++;
                                log(`Updated ${records.length} chunks for ${fileData.filePath}`);
                            }
                        }
                    }
                }

                // Update code_index_status
                const { data: existingStatus } = await supabase
                    .from('code_index_status')
                    .select('id, total_files, total_chunks')
                    .eq('project_id', project_id)
                    .eq('repo_path', repo_path)
                    .single();

                const statusRecord = {
                    project_id,
                    repo_path,
                    status: 'completed',
                    last_indexed_at: new Date().toISOString(),
                    error_message: null
                };

                if (existingStatus) {
                    await supabase
                        .from('code_index_status')
                        .update(statusRecord)
                        .eq('id', existingStatus.id);
                } else {
                    await supabase
                        .from('code_index_status')
                        .insert(statusRecord);
                }

                const duration = Date.now() - startTime;

                const summary = `Incremental index update completed successfully!\n\n` +
                              `Files updated: ${filesUpdated}\n` +
                              `Files deleted: ${filesDeleted}\n` +
                              `Files skipped (unchanged): ${filesSkipped}\n` +
                              `Duration: ${(duration / 1000).toFixed(2)}s\n`;

                log(`Update completed: ${filesUpdated} updated, ${filesDeleted} deleted, ${filesSkipped} skipped in ${duration}ms`);

                return {
                    content: [{
                        type: "text",
                        text: `${summary}\n${JSON.stringify({
                            updated: filesUpdated,
                            deleted: filesDeleted,
                            skipped: filesSkipped,
                            duration_ms: duration
                        }, null, 2)}`,
                    }],
                };
            } catch (error: any) {
                const duration = Date.now() - startTime;
                log(`Update failed: ${error.message}`);
                throw error;
            }
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Kanban MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
