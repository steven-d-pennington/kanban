import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tools, executeTool } from './tools.js';

interface JsonRpcRequest {
    jsonrpc: string;
    id: number | string;
    method: string;
    params?: Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const request = req.body as JsonRpcRequest;
        const { id, method, params } = request;

        let result: unknown;

        switch (method) {
            case 'initialize':
                result = {
                    protocolVersion: "2024-11-05",
                    capabilities: { tools: {} },
                    serverInfo: {
                        name: "kanban-mcp",
                        version: "1.0.0"
                    }
                };
                break;

            case 'notifications/initialized':
                // Client notification - just acknowledge
                return res.status(200).json({
                    jsonrpc: "2.0",
                    id,
                    result: {}
                });

            case 'tools/list':
                result = { tools };
                break;

            case 'tools/call':
                const toolName = (params as { name: string })?.name;
                const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments || {};
                result = await executeTool(toolName, toolArgs);
                break;

            case 'ping':
                result = {};
                break;

            default:
                return res.status(200).json({
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: -32601,
                        message: `Method not found: ${method}`
                    }
                });
        }

        return res.status(200).json({
            jsonrpc: "2.0",
            id,
            result
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            jsonrpc: "2.0",
            id: null,
            error: {
                code: -32603,
                message
            }
        });
    }
}
