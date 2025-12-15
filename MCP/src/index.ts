
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
                name: "list_work_items",
                description: "List work items that are ready to be worked on.",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            description: "Maximum number of items to return (default 10)",
                        },
                        status: {
                            type: "string",
                            description: "Filter by status (default 'ready')",
                            enum: ["todo", "ready", "in_progress", "review", "done"],
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
        ],
    };
});

/**
 * Handler for tool execution.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "list_work_items") {
            const limit = Number(args?.limit) || 10;
            const status = String(args?.status || "ready");

            const { data, error } = await supabase
                .from("work_items")
                .select("*")
                .eq("status", status)
                .limit(limit);

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
