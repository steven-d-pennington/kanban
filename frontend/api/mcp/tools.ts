import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
];

// Tool execution handler
export async function executeTool(name: string, args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
    try {
        const db = getSupabase();

        if (name === "list_work_items") {
            const limit = Number(args?.limit) || 10;
            const status = String(args?.status || "ready");

            const { data, error } = await db
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

            const { error } = await db.rpc("claim_work_item", {
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

            const { error } = await db
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

            const { error } = await db.rpc("complete_work_item", {
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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
        };
    }
}
