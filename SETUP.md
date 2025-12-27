# Agent Kanban - Complete Setup Guide

This guide will walk you through setting up Agent Kanban from scratch. By the end, you'll have a fully functional Kanban board with optional AI agent automation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [Detailed Setup](#detailed-setup)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Create a Supabase Project](#step-2-create-a-supabase-project)
  - [Step 3: Set Up the Database](#step-3-set-up-the-database)
  - [Step 4: Configure the Frontend](#step-4-configure-the-frontend)
  - [Step 5: Start the Application](#step-5-start-the-application)
- [Setting Up AI Agents (Optional)](#setting-up-ai-agents-optional)
- [Environment Variables Reference](#environment-variables-reference)
- [Verifying Your Setup](#verifying-your-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Minimum Version | Check Command |
|-------------|-----------------|---------------|
| Node.js | 18.0+ | `node --version` |
| npm | 9.0+ | `npm --version` |
| Git | 2.0+ | `git --version` |

You'll also need:
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com/) (only if using AI agents)

---

## Quick Start (5 minutes)

For those who want to get up and running quickly:

```bash
# 1. Clone the repository
git clone <repository-url>
cd kanban

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your Supabase credentials (see Step 2 below)
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 5. Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Detailed Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd kanban
```

**Project structure overview:**
```
kanban/
├── frontend/          # React web application
├── agent/             # AI agent SDK and implementations
├── supabase/          # Database migrations
├── docs/              # Documentation
└── README.md
```

### Step 2: Create a Supabase Project

Supabase provides the backend infrastructure (database, authentication, real-time updates).

1. **Go to [supabase.com](https://supabase.com)** and sign up or log in

2. **Create a new project:**
   - Click "New Project"
   - Choose your organization
   - Enter a project name (e.g., "agent-kanban")
   - Create a secure database password (save this!)
   - Select a region close to your users
   - Click "Create new project"

3. **Wait for setup** (takes 1-2 minutes)

4. **Get your API credentials:**
   - Go to **Settings** → **API** in the left sidebar
   - Copy these values (you'll need them in Step 4):
     - **Project URL** (looks like `https://abc123.supabase.co`)
     - **anon/public key** (a long string starting with `eyJ...`)

### Step 3: Set Up the Database

You need to run the database migrations to create the required tables.

#### Option A: Using the Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor** in the left sidebar

2. Run each migration file **in order**:

   **Migration 1 - Initial Schema:**
   - Click "New query"
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into the editor
   - Click "Run"

   **Migration 2 - Agent Integration:**
   - Create another new query
   - Copy the contents of `supabase/migrations/002_agent_integration.sql`
   - Paste and run

   **Migration 3 - Performance Optimization:**
   - Create another new query
   - Copy the contents of `supabase/migrations/003_performance_optimization.sql`
   - Paste and run

3. **Verify the tables were created:**
   - Go to **Table Editor** in the left sidebar
   - You should see these tables:
     - `projects`
     - `work_items`
     - `agent_activity`
     - `comments`
     - `agent_instances`

#### Option B: Using Supabase CLI

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
cd supabase
supabase link --project-ref your-project-ref
supabase db push
```

### Step 4: Configure the Frontend

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit the `.env` file** with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Replace the values with the ones you copied from Step 2.

### Step 5: Start the Application

```bash
npm run dev
```

The application will start and display:
```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open [http://localhost:5173](http://localhost:5173)** in your browser.

### First-Time Setup

1. **Create an account:**
   - Click "Sign Up"
   - Enter your email and create a password
   - Check your email for a verification link (or configure Supabase to skip email verification for development)

2. **Create your first project:**
   - Click the "+" button next to projects
   - Enter a project name
   - Click "Create"

3. **Add a work item:**
   - Click "+ New Item"
   - Fill in the title and details
   - Click "Create"

4. **Try drag and drop:**
   - Drag items between columns (Backlog → Ready → In Progress → etc.)

---

## Setting Up AI Agents (Optional)

AI agents can automatically process work items, converting features into PRDs, PRDs into user stories, and stories into implementations.

### Agent Types

| Agent | Function | Triggers On |
|-------|----------|-------------|
| **Project Manager** | Analyzes specs, generates PRDs | Feature or Project Spec in "Ready" |
| **Scrum Master** | Breaks PRDs into user stories | PRD in "Ready" |
| **Developer** | Implements stories | Story, Bug, or Task in "Ready" |

### Setting Up Agents

1. **Navigate to the agent directory:**
   ```bash
   cd agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the TypeScript:**
   ```bash
   npm run build
   ```

4. **Create an environment file:**
   ```bash
   touch .env
   ```

5. **Configure agent environment variables:**
   ```env
   # Supabase connection (use SERVICE KEY for agents)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Anthropic API for Claude
   ANTHROPIC_API_KEY=sk-ant-api...
   ```

   **Important:** Use the **service_role** key (not anon) for agents. Find it in:
   Supabase Dashboard → Settings → API → service_role key

6. **Start an agent:**
   ```bash
   # Start the Project Manager Agent
   npm run start:pm

   # Or Scrum Master Agent
   npm run start:sm

   # Or Developer Agent
   npm run start:dev
   ```

7. **Verify agent registration:**
   - In the web app, go to "Monitoring" in the navigation
   - You should see the agent listed as "Active"

### Testing Agent Workflow

1. Create a Feature work item in the Kanban board
2. Drag it to the "Ready" column
3. Watch the PM Agent claim and process it
4. A new PRD will be created automatically

---

## Setting Up MCP Server (Optional)

The Model Context Protocol (MCP) server allows you to interact with the Kanban board directly from Claude Desktop (or other MCP clients).

### Installation

1. **Navigate to the MCP directory:**
   ```bash
   cd MCP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the server:**
   ```bash
   npm run build
   ```

### Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kanban": {
      "command": "node",
      "args": ["c:\\projects\\kanban\\MCP\\dist\\index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "OPENAI_API_KEY": "sk-..." 
      }
    }
  }
}
```

> **Note**: `OPENAI_API_KEY` is required for Semantic Search functionality.

---

## Environment Variables Reference

### Frontend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |

### Agent Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (elevated permissions) |
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude |

---

## Verifying Your Setup

### Frontend Checklist

- [ ] Application loads at `http://localhost:5173`
- [ ] Can create a new account
- [ ] Can log in successfully
- [ ] Can create a project
- [ ] Can create work items
- [ ] Can drag items between columns
- [ ] Items persist after page refresh

### Database Checklist

In Supabase SQL Editor, run:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check for any projects
SELECT COUNT(*) FROM projects;

-- Check for any work items
SELECT COUNT(*) FROM work_items;
```

### Agent Checklist (if using agents)

```sql
-- Check agent instances
SELECT * FROM agent_instances
ORDER BY last_seen_at DESC;

-- Check recent agent activity
SELECT * FROM agent_activity
ORDER BY created_at DESC
LIMIT 10;
```

---

## Production Deployment

### Frontend Deployment (Vercel)

1. **Push your code to GitHub**

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the Vite configuration

3. **Set environment variables:**
   - In Vercel project settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

4. **Deploy:**
   - Vercel will automatically build and deploy

### Agent Deployment

Agents can run on any Node.js hosting platform:

- **Railway** - Easy Node.js hosting with persistent processes
- **Render** - Background workers support
- **AWS EC2/Lambda** - For more control
- **Self-hosted** - Any server with Node.js 18+

Example with PM2 (process manager):
```bash
npm install -g pm2
cd agent
npm run build
pm2 start dist/agents/project-manager/run.js --name pm-agent
pm2 start dist/agents/scrum-master/run.js --name sm-agent
pm2 start dist/agents/developer/run.js --name dev-agent
```

---

## Troubleshooting

### "Failed to connect to Supabase"

**Cause:** Invalid or missing environment variables

**Solution:**
1. Check `.env` file exists in `frontend/`
2. Verify `VITE_SUPABASE_URL` starts with `https://`
3. Verify `VITE_SUPABASE_ANON_KEY` is the complete key
4. Restart the dev server after changing `.env`

### "RLS policy violation" or "permission denied"

**Cause:** Row Level Security is blocking operations

**Solution:**
1. For frontend: Ensure you're logged in
2. For agents: Use service_role key (not anon key)
3. Check that all migrations ran successfully

### Real-time updates not working

**Cause:** WebSocket connection issues

**Solution:**
1. Check browser console for WebSocket errors
2. Ensure Supabase Realtime is enabled:
   - Dashboard → Database → Replication
   - Enable replication for `work_items` table

### Agents not claiming items

**Cause:** Items not in correct state or agent not registered

**Solution:**
1. Ensure work item is in "Ready" status
2. Ensure item type matches agent type:
   - PM Agent: `feature`, `project_spec`
   - SM Agent: `prd`
   - Dev Agent: `story`, `bug`, `task`
3. Check agent logs for errors
4. Verify agent shows as "Active" in Monitoring

### "Module not found" errors

**Cause:** Dependencies not installed or TypeScript not compiled

**Solution:**
```bash
# Frontend
cd frontend && npm install

# Agents
cd agent && npm install && npm run build
```

### Port 5173 already in use

**Cause:** Another process using the port

**Solution:**
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

---

## Next Steps

After setup, explore these resources:

- **[User Guide](./docs/user-guide/getting-started.md)** - Learn to use the Kanban board
- **[Agent Guide](./docs/agent-guide/overview.md)** - Deep dive into AI agents
- **[API Reference](./docs/api-reference/rest-api.md)** - REST API documentation
- **[Admin Guide](./docs/admin-guide/installation.md)** - Advanced configuration

## Getting Help

- Check the [docs/](./docs/) folder for detailed documentation
- Review [SPEC.md](./docs/SPEC.md) for technical architecture
- Open an issue on GitHub for bugs or feature requests

---

Happy building!
