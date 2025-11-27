# Agent Kanban Board - Project Specification

## 1. Executive Summary

Agent Kanban is a web-based project management tool designed specifically for hybrid human-agent workflows. It provides a visual Kanban board interface where humans can define projects, features, bugs, and issues, while AI agents autonomously pick up, process, and hand off work items through a structured pipeline.

### Key Differentiators
- **Agent-First Design**: Built from the ground up to support autonomous agent workflows
- **Structured Handoffs**: Clear protocols for work item transitions between agents
- **Human Oversight**: Full visibility and control for human stakeholders
- **Real-time Collaboration**: Live updates across all connected clients (human and agent)

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18+ with TypeScript | User interface |
| Styling | Tailwind CSS | Utility-first styling |
| State Management | Zustand | Lightweight state management |
| Backend | Supabase | PostgreSQL, Auth, Realtime, Storage |
| Hosting | Vercel | Frontend deployment |
| Real-time | Supabase Realtime | WebSocket subscriptions |

### 2.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React Frontend                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │  Human   │  │  Kanban  │  │  Agent   │              │    │
│  │  │   UI     │  │  Board   │  │ Monitor  │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │PostgreSQL│  │   Auth   │  │ Realtime │  │ Storage  │       │
│  │    DB    │  │          │  │WebSocket │  │  Files   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT LAYER                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Project     │  │    Scrum      │  │  Developer    │       │
│  │   Manager     │  │    Master     │  │    Agents     │       │
│  │    Agent      │  │    Agent      │  │               │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Core Entities

#### Projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Work Items
```sql
CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES work_items(id), -- For hierarchical items

  -- Core fields
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'project_spec', 'feature', 'prd', 'story', 'bug', 'task'
  priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'

  -- Kanban state
  status VARCHAR(50) DEFAULT 'backlog',
  column_order INTEGER DEFAULT 0,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_agent VARCHAR(100), -- 'project_manager', 'scrum_master', 'developer'

  -- Metadata
  story_points INTEGER,
  due_date DATE,
  labels JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

#### Agent Activity Log
```sql
CREATE TABLE agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES work_items(id),
  agent_type VARCHAR(100) NOT NULL,
  agent_instance_id VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'claimed', 'processing', 'completed', 'handed_off', 'failed'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Comments & Discussions
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_agent VARCHAR(100), -- If comment is from an agent
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Work Item Types

| Type | Description | Created By | Processed By |
|------|-------------|------------|--------------|
| `project_spec` | High-level project specification | Human | Project Manager Agent |
| `feature` | Feature request or specification | Human | Project Manager Agent |
| `prd` | Product Requirements Document | Project Manager Agent | Scrum Master Agent |
| `story` | User story ready for development | Scrum Master Agent | Developer Agent / Human |
| `bug` | Bug report | Human / Agent | Developer Agent / Human |
| `task` | Generic task | Any | Any |

### 3.3 Kanban Columns (Statuses)

```
┌──────────┬───────────┬─────────────┬─────────────┬──────────┬────────┐
│ BACKLOG  │  READY    │ IN PROGRESS │   REVIEW    │  TESTING │  DONE  │
│          │           │             │             │          │        │
│ New items│ Refined & │ Being       │ Code review │ QA/Test  │Complete│
│ waiting  │ ready to  │ actively    │ or agent    │ phase    │        │
│ for      │ be picked │ worked on   │ validation  │          │        │
│ triage   │ up        │             │             │          │        │
└──────────┴───────────┴─────────────┴─────────────┴──────────┴────────┘
```

---

## 4. Agent Workflow

### 4.1 Agent Types & Responsibilities

#### Project Manager Agent
- **Monitors**: `project_spec`, `feature` items in `ready` status
- **Actions**:
  - Claims work items
  - Analyzes specifications
  - Generates comprehensive PRDs
  - Creates child `prd` items
  - Moves original item to `done`
- **Output**: Structured PRD documents with acceptance criteria

#### Scrum Master Agent
- **Monitors**: `prd` items in `ready` status
- **Actions**:
  - Claims PRD items
  - Breaks down PRDs into user stories
  - Creates child `story` items with:
    - Clear acceptance criteria
    - Story point estimates
    - Technical notes
  - Moves PRD to `done`
- **Output**: Development-ready user stories

#### Developer Agent
- **Monitors**: `story`, `bug`, `task` items in `ready` status
- **Actions**:
  - Claims work items
  - Implements changes
  - Creates PRs
  - Moves items through `in_progress` → `review` → `testing`
- **Output**: Code changes, documentation updates

### 4.2 Agent Communication Protocol

```typescript
interface AgentMessage {
  type: 'claim' | 'update' | 'complete' | 'handoff' | 'error';
  workItemId: string;
  agentType: string;
  agentInstanceId: string;
  payload: {
    status?: string;
    output?: any;
    nextAgent?: string;
    error?: string;
  };
  timestamp: string;
}
```

### 4.3 Workflow Diagram

```
Human Creates Feature Spec
            │
            ▼
    ┌───────────────┐
    │    BACKLOG    │ ◄── Human triages and moves to Ready
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │     READY     │ ◄── Project Manager Agent claims
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │  IN PROGRESS  │ ◄── PM Agent generates PRD
    └───────────────┘
            │
            ▼
    Creates PRD Item ──► Goes to READY
            │
            ▼
    ┌───────────────┐
    │     READY     │ ◄── Scrum Master Agent claims PRD
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │  IN PROGRESS  │ ◄── SM Agent creates Stories
    └───────────────┘
            │
            ▼
    Creates Story Items ──► Go to READY
            │
            ▼
    ┌───────────────┐
    │     READY     │ ◄── Developer Agent or Human claims
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │  IN PROGRESS  │ ◄── Development work
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │    REVIEW     │ ◄── Code review
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │    TESTING    │ ◄── QA validation
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │     DONE      │ ◄── Complete!
    └───────────────┘
```

---

## 5. User Interface

### 5.1 Views

#### Main Kanban Board
- Drag-and-drop columns
- Work item cards with key info
- Filter by project, type, assignee
- Real-time updates

#### Project Dashboard
- Project overview and metrics
- Active agents display
- Progress tracking
- Recent activity feed

#### Work Item Detail
- Full description and metadata
- Comment thread
- Activity history
- Child items list
- Agent processing log

#### Agent Monitor
- Active agent instances
- Current tasks per agent
- Performance metrics
- Error logs

### 5.2 UI Components

```
┌────────────────────────────────────────────────────────────────────┐
│  🏠 Agent Kanban    │ Projects ▼ │ 🔍 Search    │ 👤 User │ ⚙️    │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filters: [All Types ▼] [All Priorities ▼] [All Assignees ▼]      │
│                                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ BACKLOG │ │  READY  │ │IN PROG  │ │ REVIEW  │ │  DONE   │      │
│  │   (5)   │ │   (3)   │ │   (2)   │ │   (1)   │ │  (12)   │      │
│  ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤      │
│  │┌───────┐│ │┌───────┐│ │┌───────┐│ │┌───────┐│ │┌───────┐│      │
│  ││ Card  ││ ││ Card  ││ ││ Card  ││ ││ Card  ││ ││ Card  ││      │
│  ││       ││ ││  🤖   ││ ││  🤖   ││ ││       ││ ││       ││      │
│  │└───────┘│ │└───────┘│ │└───────┘│ │└───────┘│ │└───────┘│      │
│  │┌───────┐│ │┌───────┐│ │┌───────┐│ │         │ │┌───────┐│      │
│  ││ Card  ││ ││ Card  ││ ││ Card  ││ │         │ ││ Card  ││      │
│  ││       ││ ││       ││ ││       ││ │         │ ││       ││      │
│  │└───────┘│ │└───────┘│ │└───────┘│ │         │ │└───────┘│      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                                     │
│  🤖 Active Agents: PM Agent (1) | Scrum Master (1) | Dev (3)       │
└────────────────────────────────────────────────────────────────────┘
```

### 5.3 Work Item Card

```
┌──────────────────────────────────┐
│ 🏷️ feature    ⚡ high            │
├──────────────────────────────────┤
│ User Authentication System       │
│                                  │
│ Implement OAuth2 with Google     │
│ and GitHub providers...          │
├──────────────────────────────────┤
│ 📊 5 pts  │ 👤 @dev-agent │ 💬 3 │
│ 🤖 Processing by PM Agent        │
└──────────────────────────────────┘
```

---

## 6. API Endpoints

### 6.1 Supabase Edge Functions

All API interactions go through Supabase's auto-generated REST API and Realtime subscriptions. Custom logic is handled via Edge Functions:

| Function | Purpose |
|----------|---------|
| `agent-claim` | Atomically claim a work item for an agent |
| `agent-complete` | Mark work item complete and trigger handoff |
| `generate-prd` | Webhook for PM Agent PRD generation |
| `generate-stories` | Webhook for SM Agent story breakdown |
| `notify-agents` | Send notifications to agent endpoints |

### 6.2 Agent API

```typescript
// Agent claims a work item
POST /functions/v1/agent-claim
{
  "workItemId": "uuid",
  "agentType": "project_manager",
  "agentInstanceId": "pm-agent-001"
}

// Agent updates work item
PATCH /rest/v1/work_items?id=eq.{uuid}
{
  "status": "in_progress",
  "metadata": { "processing_started": "timestamp" }
}

// Agent completes and hands off
POST /functions/v1/agent-complete
{
  "workItemId": "uuid",
  "agentType": "project_manager",
  "output": { "prd": "..." },
  "createChildItems": [
    { "type": "prd", "title": "...", "description": "..." }
  ]
}
```

---

## 7. Security & Access Control

### 7.1 Authentication
- Human users: Supabase Auth (email, OAuth)
- Agents: Service role keys with scoped permissions

### 7.2 Row Level Security (RLS)

```sql
-- Users can only see projects they have access to
CREATE POLICY "Users can view their projects" ON projects
  FOR SELECT USING (
    auth.uid() = created_by OR
    auth.uid() IN (SELECT user_id FROM project_members WHERE project_id = id)
  );

-- Agents can only modify items assigned to them
CREATE POLICY "Agents can update assigned items" ON work_items
  FOR UPDATE USING (
    assigned_agent = current_setting('app.agent_type', true)
  );
```

### 7.3 Agent Authentication

```typescript
// Agents authenticate with service keys
const supabase = createClient(SUPABASE_URL, AGENT_SERVICE_KEY, {
  global: {
    headers: {
      'x-agent-type': 'project_manager',
      'x-agent-instance': 'pm-001'
    }
  }
});
```

---

## 8. Real-time Features

### 8.1 Subscriptions

```typescript
// Subscribe to work item changes
supabase
  .channel('work_items')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'work_items',
    filter: `project_id=eq.${projectId}`
  }, handleChange)
  .subscribe();

// Subscribe to agent activity
supabase
  .channel('agent_activity')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'agent_activity'
  }, handleAgentUpdate)
  .subscribe();
```

### 8.2 Presence

Track which users and agents are currently viewing/working:

```typescript
const channel = supabase.channel('project:${projectId}');
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // Update UI with active users/agents
});
```

---

## 9. Deployment

### 9.1 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### 9.2 Supabase Setup

1. Create Supabase project
2. Run database migrations
3. Configure RLS policies
4. Deploy Edge Functions
5. Set up Auth providers

### 9.3 Environment Variables

```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Agent Environment
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
AGENT_TYPE=project_manager
AGENT_INSTANCE_ID=pm-001
```

---

## 10. Development Phases

### Phase 1: Foundation
- [ ] Initialize React application
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Implement basic authentication
- [ ] Build Kanban board UI

### Phase 2: Core Features
- [ ] Work item CRUD operations
- [ ] Drag-and-drop functionality
- [ ] Real-time updates
- [ ] Project management

### Phase 3: Agent Integration
- [ ] Agent authentication system
- [ ] Claim/release mechanisms
- [ ] Agent activity logging
- [ ] Handoff protocols

### Phase 4: Agent Implementation
- [ ] Project Manager Agent
- [ ] Scrum Master Agent
- [ ] Developer Agent framework

### Phase 5: Polish
- [ ] Agent monitoring dashboard
- [ ] Analytics and metrics
- [ ] Performance optimization
- [ ] Documentation

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Work item cycle time | < 24 hours for stories |
| Agent processing time | < 5 min for PRD generation |
| UI response time | < 100ms for interactions |
| Real-time update latency | < 500ms |
| Agent success rate | > 95% |

---

## 12. Future Considerations

- **Multi-tenancy**: Support for multiple organizations
- **Custom agents**: Allow users to define custom agent types
- **Integrations**: GitHub, Jira, Slack, etc.
- **AI Improvements**: Fine-tuned models for better output
- **Mobile app**: React Native companion app

---

*Document Version: 1.0*
*Last Updated: November 2024*
