import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';

// In-memory session store (works within single serverless instance lifetime)
// For production, consider using Redis or similar for cross-instance sessions
const sessions = new Map<string, { created: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Generate session ID
    const sessionId = randomUUID();
    sessions.set(sessionId, { created: Date.now() });

    // Send initial endpoint event (MCP SSE protocol)
    // Use absolute URL for compatibility with remote MCP clients
    const host = req.headers.host || 'kanban.spennington.dev';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const endpointUrl = `${protocol}://${host}/api/mcp/message?sessionId=${sessionId}`;
    res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(() => {
        try {
            res.write(`: ping\n\n`);
        } catch {
            clearInterval(pingInterval);
        }
    }, 15000);

    // Clean up on close
    req.on('close', () => {
        clearInterval(pingInterval);
        sessions.delete(sessionId);
    });

    // For Vercel, we need to eventually end the response
    // The connection will stay open until timeout or client disconnect
}

export const config = {
    maxDuration: 60, // 60 seconds for Pro plan
};
