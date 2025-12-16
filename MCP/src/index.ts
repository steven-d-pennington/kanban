
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { supabase } from "./db.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

            const { data, error } = await supabase
                .from("projects")
                .insert({
                    name: name_val,
                    description,
                    status: "active",
                })
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
