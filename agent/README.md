# Agent Kanban - AI Agents

This directory contains the AI agent implementations and SDK for the Agent Kanban system. These agents autonomously monitor the board and perform work based on their roles.

## Agent Types

| Agent | Role | Triggers | Responsibility |
|-------|------|----------|----------------|
| **Project Manager** | `pm` | Feature / Project Spec | Analyzes requirements and generates Product Requirement Documents (PRDs). |
| **Scrum Master** | `sm` | PRD | Breaks down PRDs into specific User Stories, Tasks, and Bugs. |
| **Developer** | `dev` | Story / Bug / Task | Implements code changes (simulation) and updates task status. |

## Prerequisites

- Node.js 18+
- Supabase Project (set up via root instructions)
- Anthropic API Key (for Claude models)

## Installation

1. Navigate to the agent directory:
   ```bash
   cd agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

Create a `.env` file in this directory (`agent/.env`):

```env
# Supabase Configuration (Use Service Role Key for Agents)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# AI Configuration
ANTHROPIC_API_KEY=sk-ant-...
```

> **Important**: Agents require the **Service Role Key** to bypass Row Level Security (RLS) policies that might restrict normal users. You can find this in your Supabase Dashboard under Settings > API.

## Running Agents

You can run agents individually. It's recommended to run them in separate terminal windows or use a process manager like PM2.

### Project Manager
```bash
npm run start:pm
```

### Scrum Master
```bash
npm run start:sm
```

### Developer
```bash
npm run start:dev
```

## Development

- **Source Code**: Located in `lib/agents/`
- **SDK**: Core logic in `lib/`
- **Build**: `npm run build` (Watch mode: `npm run dev`)

## Troubleshooting

- **"Connection refused"**: Check your stored `SUPABASE_URL`.
- **"Permission denied"**: Ensure you are using the `SUPABASE_SERVICE_KEY`, not the anonymous key.
- **Agents not picking up items**:
  - Verify the item is in the "Ready" column.
  - Verify the item type matches the agent's responsibility.
  - Check the console logs for errors.
