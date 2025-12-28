# Kanban SuperCharge - Agent-Driven Development Pipeline

## Vision

Transform the kanban board into an AI-native development workflow where specialized agents collaborate to take feature requests from concept to completion, with humans maintaining oversight and control through the UI.

## The Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENT-DRIVEN WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Feature Request]                                                           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐    Creates PRD     ┌──────────────┐                       │
│  │   Product    │ ─────────────────► │    Scrum     │                       │
│  │   Manager    │                    │    Master    │                       │
│  │    Agent     │                    │    Agent     │                       │
│  └──────────────┘                    └──────────────┘                       │
│                                             │                                │
│                              Creates Stories │                               │
│                                             ▼                                │
│                                    ┌──────────────┐                         │
│                                    │  Developer   │──┐                      │
│                                    │   Agent(s)   │  │                      │
│                                    └──────────────┘  │                      │
│                                             │        │ Parallel             │
│                                    ┌──────────────┐  │ work                 │
│                                    │  Developer   │──┘                      │
│                                    │   Agent(s)   │                         │
│                                    └──────────────┘                         │
│                                             │                                │
│                              Submits for    │                                │
│                              review         ▼                                │
│                                    ┌──────────────┐                         │
│                                    │    Code      │                         │
│                                    │   Review     │                         │
│                                    │    Agent     │                         │
│                                    └──────────────┘                         │
│                                             │                                │
│                              Approved        │                               │
│                                             ▼                                │
│                                    ┌──────────────┐                         │
│                                    │     QA       │                         │
│                                    │    Agent     │                         │
│                                    └──────────────┘                         │
│                                             │                                │
│                                             ▼                                │
│                                         [Done]                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Current State Analysis

### What Already Exists (Database)

**Work Item Types:**
- `project_spec` - High-level project specification
- `feature` - Feature request
- `prd` - Product Requirements Document
- `story` - User story for development
- `bug` - Bug fix
- `task` - Generic task

**Agent Types:**
- `project_manager` - Creates PRDs from features
- `scrum_master` - Breaks PRDs into stories
- `developer` - Implements stories/bugs/tasks

**Handoff Rules (already configured):**
```
project_spec → project_manager → creates PRD
feature      → project_manager → creates PRD
prd          → scrum_master    → creates stories
story        → developer       → implementation
bug          → developer       → fix
task         → developer       → completion
```

**Key Tables:**
- `projects` - Project containers
- `work_items` - All work items with parent/child relationships
- `comments` - Comments on work items
- `agent_activity` - Logs all agent actions
- `agent_instances` - Registered agent instances
- `handoff_rules` - Configures the pipeline
- `handoff_history` - Tracks handoffs between agents

### What Already Exists (MCP Server)

**Current Tools:**
- `list_work_items` - List items by status
- `get_work_item` - Get item details with comments
- `claim_work_item` - Claim an item to work on
- `add_comment` - Add comments to items
- `complete_work_item` - Mark item complete (moves to review)

### What's Missing

**MCP Server Gaps:**
1. No `create_project` tool
2. No `create_work_item` tool (for agents to create child items)
3. No `handoff_work_item` tool (uses the complete_work_item RPC properly)
4. No `escalate_work_item` tool (for human intervention)
5. No `list_projects` tool
6. No `update_work_item` tool (for status changes, adding metadata)
7. No `code_review` agent type in the database

**Agent Types Missing:**
- `code_reviewer` - Reviews code and approves/rejects
- `qa_tester` - Validates acceptance criteria

**UI Gaps (for later):**
- Pipeline visualization
- Agent activity dashboard
- Bottleneck detection
- Quality metrics

---

## Implementation Plan

### Phase 1: MCP Server Enhancement

**Goal:** Make the MCP server fully capable of supporting the agent workflow.

#### 1.1 Add Missing Tools

```typescript
// New tools to add:

create_project
  - name: string
  - description?: string
  Returns: project object

list_projects
  - status?: 'active' | 'archived' | 'completed'
  Returns: array of projects

create_work_item
  - project_id: string
  - title: string
  - description?: string
  - type: 'project_spec' | 'feature' | 'prd' | 'story' | 'bug' | 'task'
  - parent_id?: string (for creating child items)
  - priority?: 'critical' | 'high' | 'medium' | 'low'
  - labels?: string[]
  - metadata?: object
  Returns: work item object

update_work_item
  - work_item_id: string
  - title?: string
  - description?: string
  - status?: string
  - priority?: string
  - labels?: string[]
  - metadata?: object
  Returns: updated work item

handoff_work_item
  - work_item_id: string
  - agent_type: string
  - agent_instance_id: string
  - output: object (structured output from agent's work)
  - child_items?: array of {type, title, description, metadata}
  Returns: {success, completed_item, child_items}

escalate_work_item
  - work_item_id: string
  - agent_instance_id: string
  - reason: string
  Returns: success boolean

list_agent_activity
  - work_item_id?: string
  - agent_type?: string
  - limit?: number
  Returns: array of activity records
```

#### 1.2 Add Missing Agent Type

Add `code_reviewer` to the database constraints:
```sql
ALTER TABLE work_items DROP CONSTRAINT work_items_assigned_agent_check;
ALTER TABLE work_items ADD CONSTRAINT work_items_assigned_agent_check
  CHECK (assigned_agent IN ('project_manager', 'scrum_master', 'developer', 'code_reviewer', 'qa_tester') OR assigned_agent IS NULL);

-- Same for other tables
```

#### 1.3 Add Review Status Handling

The `review` status should route to `code_reviewer` agent:
```sql
INSERT INTO handoff_rules (source_type, processed_by, output_type, creates_types, validation_rules) VALUES
  ('story', 'code_reviewer', 'review_result', ARRAY[]::VARCHAR[], '{"required_fields": ["approved", "feedback"]}');
```

---

### Phase 2: Specialized Agent Skills

**Goal:** Create Claude Code skills that agents can use for specific workflows.

#### 2.1 Product Manager Agent Skill

**File:** `.claude/commands/pm-agent.md`

```markdown
# Product Manager Agent

You are a Product Manager agent for the Kanban board. Your job is to:

1. Pick up `feature` or `project_spec` items that are `ready`
2. Analyze the request and research the codebase
3. Create a comprehensive PRD with:
   - Problem statement
   - User stories (high-level)
   - Acceptance criteria
   - Technical considerations
   - Out of scope items
4. Hand off to the Scrum Master by creating a PRD work item

## Workflow

1. Use `list_work_items` with status='ready' to find features
2. Use `claim_work_item` to claim one
3. Research the codebase using exploration tools
4. Write the PRD in the work item description
5. Use `handoff_work_item` to complete and create PRD child item
```

#### 2.2 Scrum Master Agent Skill

**File:** `.claude/commands/scrum-agent.md`

```markdown
# Scrum Master Agent

You are a Scrum Master agent. Your job is to:

1. Pick up `prd` items that are `ready`
2. Break down the PRD into actionable user stories
3. Each story should have:
   - Clear title (As a..., I want..., So that...)
   - Detailed acceptance criteria
   - Story point estimate (1, 2, 3, 5, 8, 13, 21)
   - Technical notes
4. Create stories as child items and hand off

## Story Sizing Guide

- 1 point: Trivial change, one file, < 30 min
- 2 points: Simple change, few files, < 2 hours
- 3 points: Moderate change, several files, < half day
- 5 points: Complex change, many files, < 1 day
- 8 points: Large feature, significant work, < 2 days
- 13 points: Epic-level, should consider breaking down
- 21 points: Too large, must break down
```

#### 2.3 Developer Agent Skill

**File:** `.claude/commands/dev-agent.md`

```markdown
# Developer Agent

You are a Developer agent. Your job is to:

1. Pick up `story`, `bug`, or `task` items that are `ready`
2. Implement the required changes
3. Write/update tests
4. Create a commit with clear message
5. Add implementation notes as comments
6. Hand off for code review

## Workflow

1. Claim the work item
2. Read and understand the requirements
3. Explore relevant code
4. Make changes with tests
5. Commit changes
6. Complete work item with summary
```

#### 2.4 Code Review Agent Skill

**File:** `.claude/commands/review-agent.md`

```markdown
# Code Review Agent

You are a Code Review agent. Your job is to:

1. Pick up items in `review` status
2. Review the changes made
3. Check for:
   - Code quality and style
   - Security vulnerabilities
   - Test coverage
   - Documentation
4. Approve or request changes

## Review Checklist

- [ ] Code follows project conventions
- [ ] No obvious bugs or logic errors
- [ ] Security considerations addressed
- [ ] Tests added/updated
- [ ] No unnecessary complexity
```

---

### Phase 3: Enhanced Database Schema

#### 3.1 New Agent Types Migration

```sql
-- Migration: 007_enhanced_agents.sql

-- Add new agent types
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_assigned_agent_check;
ALTER TABLE work_items ADD CONSTRAINT work_items_assigned_agent_check
  CHECK (assigned_agent IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ) OR assigned_agent IS NULL);

-- Update agent_instances
ALTER TABLE agent_instances DROP CONSTRAINT IF EXISTS agent_instances_agent_type_check;
ALTER TABLE agent_instances ADD CONSTRAINT agent_instances_agent_type_check
  CHECK (agent_type IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ));

-- Update comments
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_agent_check;
ALTER TABLE comments ADD CONSTRAINT comments_author_agent_check
  CHECK (author_agent IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ) OR author_agent IS NULL);

-- Update agent_activity
ALTER TABLE agent_activity DROP CONSTRAINT IF EXISTS agent_activity_agent_type_check;
ALTER TABLE agent_activity ADD CONSTRAINT agent_activity_agent_type_check
  CHECK (agent_type IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ));

-- Add code review handoff rule
INSERT INTO handoff_rules (source_type, processed_by, output_type, creates_types, validation_rules)
VALUES ('story', 'code_reviewer', 'review_result', ARRAY[]::VARCHAR[],
        '{"required_fields": ["approved", "feedback"]}')
ON CONFLICT DO NOTHING;
```

---

### Phase 4: UI Enhancements (Future)

#### 4.1 Pipeline Visualization

- Show work items flowing through the pipeline
- Color-code by assigned agent
- Show time spent at each stage

#### 4.2 Agent Dashboard

- Active agents and their current tasks
- Agent success/failure rates
- Average processing times

#### 4.3 Bottleneck Detection

- Highlight stages with too many items
- Alert when items are stuck too long
- Suggest load balancing

---

## Implementation Order

### Immediate (This Session)

1. **Add `create_project` tool to MCP server**
2. **Create "Kanban SuperCharge" project**
3. **Add `create_work_item` tool**
4. **Add `list_projects` tool**
5. **Test the enhanced MCP server**

### Next Session

6. Create database migration for new agent types
7. Add `handoff_work_item` tool (uses RPC)
8. Add `escalate_work_item` tool
9. Create agent skill files

### Future

10. Build out full agent prompts
11. UI pipeline visualization
12. Agent dashboard
13. Automated orchestration

---

## Success Metrics

1. **Pipeline Flow** - Feature → PRD → Stories → Code → Review → Done in automated fashion
2. **Human Oversight** - All agent actions visible in UI, easy to intervene
3. **Quality** - Code review catches issues before merge
4. **Velocity** - Multiple stories processed in parallel by developer agents
5. **Transparency** - Full audit trail of all agent decisions

---

## Open Questions

1. **Orchestration:** Should there be a "conductor" agent that assigns work, or should agents poll for ready items?
   - *Proposal:* Polling with smart filtering by agent type

2. **Concurrency:** How do we handle multiple developer agents working on related stories?
   - *Proposal:* Use branch-per-story, merge conflicts handled by human escalation

3. **Quality Gates:** What happens if code review fails?
   - *Proposal:* Item returns to `ready` status with feedback, developer claims again

4. **Human Override:** How can humans intervene in the pipeline?
   - *Proposal:* UI allows manual status changes, comments tagged as human override

---

## Files to Create/Modify

### MCP Server
- `MCP/src/index.ts` - Add new tools

### Database
- `supabase/migrations/007_enhanced_agents.sql` - New agent types

### Skills/Commands
- `.claude/commands/pm-agent.md`
- `.claude/commands/scrum-agent.md`
- `.claude/commands/dev-agent.md`
- `.claude/commands/review-agent.md`

### Documentation
- `docs/AGENT_WORKFLOW.md` - How agents work together
- `docs/HUMAN_OVERSIGHT.md` - How to monitor and intervene
