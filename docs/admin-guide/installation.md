# Installation Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (or self-hosted Supabase)
- Anthropic API key (for agents)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/agent-kanban.git
cd agent-kanban
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Agent SDK
cd ../agent
npm install
```

### 3. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations:

```bash
cd supabase
supabase db push
```

Or manually run the SQL files in order:
- `migrations/001_initial_schema.sql`
- `migrations/002_agent_integration.sql`
- `migrations/003_performance_optimization.sql`

### 4. Environment Variables

Create `.env` files:

**Frontend (`frontend/.env`):**
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Agent (`agent/.env`):**
```env
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_KEY=your-service-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### 5. Start Development Servers

```bash
# Frontend (in frontend directory)
npm run dev

# Agents (in agent directory)
npm run start:pm   # Project Manager Agent
npm run start:sm   # Scrum Master Agent
npm run start:dev  # Developer Agent
```

## Production Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Agents (Node.js Host)

Agents can run on any Node.js hosting:
- AWS Lambda
- Google Cloud Functions
- Railway
- Render
- Self-hosted server

Example systemd service:

```ini
[Unit]
Description=Agent Kanban PM Agent
After=network.target

[Service]
ExecStart=/usr/bin/node /app/agent/lib/agents/project-manager/run.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Database Setup

### Required Extensions

The following PostgreSQL extensions must be enabled:
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions

### Row Level Security

All tables have RLS enabled. Ensure policies are properly configured for your use case.

### Indexes

The migration `003_performance_optimization.sql` creates essential indexes. Verify they exist:

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'work_items';
```

## Verifying Installation

### Frontend Health Check

Access the application and verify:
- [ ] Login page loads
- [ ] Can create account
- [ ] Board displays
- [ ] Can create work items

### Agent Health Check

Check agent registration:

```sql
SELECT * FROM agent_instances
ORDER BY last_seen_at DESC;
```

Agents should appear with `status = 'active'`.

### Database Health Check

Verify views are created:

```sql
SELECT * FROM agent_activity_feed LIMIT 1;
SELECT * FROM agent_claimed_items LIMIT 1;
SELECT * FROM work_item_metrics LIMIT 1;
```

## Troubleshooting

### Common Issues

**"Supabase credentials not configured"**
- Verify `.env` file exists and has correct values
- Restart the development server

**Agents not claiming items**
- Check agent is registered: `SELECT * FROM agent_instances`
- Verify items are in "Ready" status
- Check agent logs for errors

**Realtime not working**
- Ensure Supabase realtime is enabled
- Check browser console for WebSocket errors
- Verify RLS policies allow the operation

See [Troubleshooting Guide](./troubleshooting.md) for more details.
