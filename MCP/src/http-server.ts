import express, { Request, Response } from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { supabase } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for remote access
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Store active transports for each session
const transports = new Map<string, SSEServerTransport>();

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: "kanban-mcp", version: "1.0.0" });
});

// SSE endpoint for MCP connections
app.get("/sse", async (req: Request, res: Response) => {
    console.log("New SSE connection established");

    const transport = new SSEServerTransport("/message", res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    const server = createMCPServer();

    res.on("close", () => {
        console.log(`SSE connection closed: ${sessionId}`);
        transports.delete(sessionId);
    });

    await server.connect(transport);
});

// Message endpoint for client-to-server communication
app.post("/message", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);

    if (!transport) {
        res.status(404).json({ error: "Session not found" });
        return;
    }

    await transport.handlePostMessage(req, res);
});

/**
 * Creates a new MCP server instance with all tool handlers
 */
function createMCPServer(): Server {
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

    // Handler for listing available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "list_work_items",
                    description: "List work items from the Kanban board.",
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
                                enum: ["todo", "ready", "in_progress", "in_review", "done"],
                            },
                        },
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

    // Handler for tool execution
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

            if (name === "claim_work_item") {
                const work_item_id = String(args?.work_item_id);
                const agent_type = String(args?.agent_type || "external");
                const instance_id = `ext-${Date.now()}`;

                const { data, error } = await supabase.rpc("claim_work_item", {
                    p_work_item_id: work_item_id,
                    p_agent_type: agent_type,
                    p_instance_id: instance_id,
                });

                if (error) throw new Error(error.message);
                return {
                    content: [{ type: "text", text: `Successfully claimed item. Session ID: ${instance_id}` }],
                };
            }

            if (name === "add_comment") {
                const work_item_id = String(args?.work_item_id);
                const content = String(args?.content);

                const { data, error } = await supabase
                    .from("comments")
                    .insert({
                        work_item_id,
                        content,
                        author_agent: "external",
                    })
                    .select();

                if (error) throw new Error(error.message);
                return {
                    content: [{ type: "text", text: "Comment added." }],
                };
            }

            if (name === "complete_work_item") {
                const work_item_id = String(args?.work_item_id);
                const summary = String(args?.summary || "Completed externally");

                const { data, error } = await supabase.rpc("complete_work_item", {
                    p_work_item_id: work_item_id,
                    p_summary: summary,
                    p_next_status: "review",
                });

                if (error) throw new Error(error.message);
                return {
                    content: [{ type: "text", text: "Work item completed and moved to review." }],
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

    return server;
}

app.listen(PORT, () => {
    console.log(`Kanban MCP HTTP Server running on port ${PORT}`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
