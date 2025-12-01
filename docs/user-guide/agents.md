# Working with Agents

## Understanding AI Agents

Agent Kanban includes three types of AI agents that can automatically process work items:

| Agent | Role | Processes | Creates |
|-------|------|-----------|---------|
| **Project Manager (PM)** | Strategic planning | Features, Project Specs | PRDs |
| **Scrum Master (SM)** | Story breakdown | PRDs | User Stories |
| **Developer (Dev)** | Implementation | Stories, Bugs, Tasks | Code/PRs |

## How Agents Work

### Automatic Processing

1. Create or move an item to "Ready" status
2. An appropriate agent claims the item
3. The agent processes the item (shown with a pulsing indicator)
4. Upon completion:
   - Child items are created if applicable
   - The original item moves to "Done"
   - Activity is logged

### Agent Claiming Rules

- Agents only process items in "Ready" status
- Each item can only be claimed by one agent
- Claims have a timeout (30 minutes by default)
- Stale claims are automatically released

## Project Manager Agent

### What It Does

The PM Agent takes high-level requirements and creates detailed Product Requirements Documents (PRDs).

### Input Requirements

- **Project Spec** or **Feature** type items
- Clear title describing the feature
- Description with context and goals

### Output

- Creates a PRD work item
- PRD contains structured requirements
- Includes user stories outline
- Sets appropriate priority

### Example

**Input Feature:**
```
Title: User Dashboard
Description: Users need a dashboard to view their activity and metrics.
```

**Output PRD:**
```
Title: PRD: User Dashboard
Description:
## Overview
Comprehensive dashboard for user activity monitoring...

## Requirements
- Display recent activity feed
- Show key metrics
- Support date filtering
...
```

## Scrum Master Agent

### What It Does

The SM Agent breaks down PRDs into actionable user stories with acceptance criteria.

### Input Requirements

- **PRD** type items
- Structured requirements
- Clear scope definition

### Output

- Creates multiple **Story** items
- Each story is independent
- Includes acceptance criteria
- Assigns story points

### Example

**Input PRD:** User Dashboard PRD

**Output Stories:**
1. "As a user, I want to see my recent activity"
2. "As a user, I want to view key metrics"
3. "As a user, I want to filter by date range"

## Developer Agent

### What It Does

The Dev Agent implements stories, fixes bugs, and completes tasks.

### Input Requirements

- **Story**, **Bug**, or **Task** type items
- Clear acceptance criteria
- Technical context if needed

### Output

- Implementation code
- Pull request (if configured)
- Documentation updates
- Completion notes

## Monitoring Agents

### Agent Monitor Dashboard

Access via "Monitoring" in the navigation:

**Summary Cards:**
- Active agents count
- Currently processing count
- Tasks completed today
- Errors today

**Agent Cards:**
- Status (Idle, Processing, Error, Offline)
- Current task details
- Success rate
- Average processing time

### Activity Feed

Real-time log of agent actions:
- Claims and releases
- Processing updates
- Completions and handoffs
- Errors and escalations

### Alerts

Automatic alerts for:
- Agent failures
- Long-running tasks (>45 min)
- High error rates

## Agent Controls

### Pausing an Agent

1. Go to Monitoring dashboard
2. Find the agent card
3. Click "Pause"
4. Agent will finish current task, then idle

### Resuming an Agent

1. Go to Monitoring dashboard
2. Find the paused agent
3. Click "Resume"
4. Agent will start picking up new items

### Force Releasing an Item

If an item is stuck:
1. Go to the Agent Instances panel
2. Find the claimed item
3. Click "Force Release"
4. Item returns to "Ready" status

## Escalation to Humans

Agents can escalate items when:
- Requirements are unclear
- Technical blockers exist
- Human decision needed

When escalated:
- Item returns to "Ready" status
- Escalation reason is logged
- System comment is added
- Email notification sent (if configured)

## Best Practices

### For PM Agent

- Provide clear feature descriptions
- Include business context
- Specify target users
- Note any constraints

### For SM Agent

- Ensure PRDs are complete
- Define acceptance criteria
- Set clear boundaries
- Prioritize appropriately

### For Dev Agent

- Include technical context
- Reference existing code
- Specify testing requirements
- Note dependencies
