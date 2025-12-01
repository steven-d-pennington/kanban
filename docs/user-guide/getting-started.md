# Getting Started with Agent Kanban

## Overview

Agent Kanban is a project management tool that combines traditional Kanban boards with AI-powered agents that can automate routine tasks. This guide will help you get started.

## Creating an Account

1. Navigate to your Agent Kanban instance
2. Click "Sign Up" to create a new account
3. Enter your email and create a password
4. Verify your email address
5. Log in to access your dashboard

## Your First Project

### Creating a Project

1. Click the "+" button next to the project selector
2. Enter a project name (e.g., "My First Project")
3. Add an optional description
4. Click "Create Project"

### Understanding the Board

The Kanban board has six columns representing different stages:

| Column | Description |
|--------|-------------|
| **Backlog** | Ideas and items not yet prioritized |
| **Ready** | Items refined and ready to start |
| **In Progress** | Work currently being done |
| **Review** | Work completed and awaiting review |
| **Testing** | Items being tested |
| **Done** | Completed work |

## Creating Work Items

### Adding a New Item

1. Click the "+ New Item" button in the header
2. Fill in the details:
   - **Title**: Brief description of the work
   - **Type**: Select from Project Spec, Feature, PRD, Story, Bug, or Task
   - **Priority**: Critical, High, Medium, or Low
   - **Description**: Detailed requirements
3. Click "Create" to add the item

### Work Item Types

| Type | Purpose | Agent Processing |
|------|---------|------------------|
| Project Spec | High-level project description | PM Agent creates PRD |
| Feature | Feature request | PM Agent creates PRD |
| PRD | Product requirements document | SM Agent creates Stories |
| Story | User story for implementation | Dev Agent implements |
| Bug | Bug report | Dev Agent fixes |
| Task | General task | Dev Agent completes |

## Moving Items Through the Board

### Manual Movement

Drag and drop items between columns to update their status:

1. Click and hold an item
2. Drag it to the desired column
3. Release to drop

### Agent-Automated Movement

When agents process items:
1. Move a Feature or Project Spec to "Ready"
2. PM Agent will claim and process it
3. Upon completion, child items (PRDs/Stories) are created
4. The original item moves to "Done"

## Working with Agents

### Understanding Agent Status

Items being processed by agents show:
- A robot icon (🤖) indicating agent assignment
- The agent type (PM, SM, or Dev)
- A pulsing indicator when actively processing

### Agent Workflow

```
Feature/Project Spec → PM Agent → PRD
                                   ↓
                          SM Agent → Stories
                                      ↓
                             Dev Agent → Implementation
```

### Monitoring Agent Activity

Click "Monitoring" in the navigation to:
- View all active agent instances
- See current tasks being processed
- Monitor success rates and errors
- Pause or resume agents

## Project Settings

Access project settings by clicking the gear icon:

- **Rename Project**: Change the project name
- **Archive Project**: Hide completed projects
- **Delete Project**: Permanently remove (with confirmation)

## Filtering Items

Use the filter bar to focus on specific items:

- **Type Filter**: Show only specific item types
- **Priority Filter**: Filter by priority level
- **Assignee Filter**: Show agent-assigned or human-assigned items

## Next Steps

- Learn about [Managing Work Items](./work-items.md)
- Explore [Project Management](./projects.md)
- Understand [Working with Agents](./agents.md)
