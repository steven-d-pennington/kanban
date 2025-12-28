# Kanban MCP Server

This MCP server provides tools to interact with the Kanban board from external AI agents. It supports two transport modes:

- **Stdio** (local) - For Claude Desktop and local CLI usage
- **HTTP/SSE** (remote) - For Claude mobile app and web usage

## Installation

```bash
cd MCP
npm install
npm run build
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_work_items` | View tickets by status (todo, ready, in_progress, in_review, done) |
| `claim_work_item` | Assign a ticket to yourself |
| `add_comment` | Post updates or questions on a ticket |
| `complete_work_item` | Submit your work for review |

---

## Option 1: Local Stdio Server (Claude Desktop / CLI)

For local usage with Claude Desktop or Claude Code CLI.

### Setup

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kanban": {
      "command": "node",
      "args": ["/path/to/kanban/MCP/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Run Locally

```bash
npm start
```

---

## Option 2: Remote HTTP Server (Mobile / Web)

For usage with Claude mobile app or any remote MCP client.

### Environment Variables

Create a `.env` file or set these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

### Run Locally

```bash
# Development (with hot reload)
npm run dev:http

# Production
npm run build
npm run start:http
```

Server will be available at:
- SSE endpoint: `http://localhost:3001/sse`
- Health check: `http://localhost:3001/health`

### Deploy to Vercel

1. Create a new Vercel project pointing to the `MCP` directory

2. Add a `vercel.json` in the MCP folder:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/http-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/http-server.js"
    }
  ]
}
```

3. Set environment variables in Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. Deploy:
```bash
cd MCP
npm run build
vercel --prod
```

### Deploy to Railway / Render / Fly.io

Any Node.js hosting platform works. Set the environment variables and run:

```bash
npm run build && npm run start:http
```

### Connect to Claude Mobile App

1. Deploy the HTTP server to a public URL (e.g., `https://your-mcp.vercel.app`)

2. Go to [Claude.ai](https://claude.ai) on desktop

3. Navigate to **Settings** → **Connectors** → **Add Custom Connector**

4. Enter:
   - Name: `Kanban`
   - URL: `https://your-mcp.vercel.app/sse`

5. The connector will sync to your mobile app automatically

---

## API Endpoints (HTTP Server)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/sse` | GET | SSE connection for MCP protocol |
| `/message` | POST | Message handler for MCP requests |

## Troubleshooting

### "Supabase not configured" error
Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly.

### Connection issues on mobile
- Verify the server is publicly accessible (not localhost)
- Check that CORS is working (the HTTP server enables CORS by default)
- Ensure the URL in Claude settings ends with `/sse`

### Tools not appearing
- Rebuild the project: `npm run build`
- Check server logs for errors
- Verify the SSE connection is established
