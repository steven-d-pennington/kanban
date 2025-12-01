# STORY-020: Documentation

## Overview
Create comprehensive documentation for users, administrators, and developers covering all aspects of the Agent Kanban system.

## Status
**Current**: BACKLOG
**Phase**: 5 - Polish
**Priority**: LOW
**Estimated Effort**: Medium

---

## User Story
As a new user or developer, I want comprehensive documentation so that I can understand how to use and extend the Agent Kanban system.

---

## Acceptance Criteria

- [ ] User guide for Kanban board usage
- [ ] Administrator guide for system setup
- [ ] Agent configuration documentation
- [ ] API reference documentation
- [ ] Developer guide for extending the system
- [ ] Troubleshooting guide
- [ ] Architecture overview diagrams
- [ ] Inline code documentation (JSDoc)
- [ ] README files for each major component
- [ ] Video tutorials (optional)

---

## Technical Notes

### Documentation Structure
```
docs/
├── README.md                    # Documentation overview
├── user-guide/
│   ├── getting-started.md       # Quick start for users
│   ├── kanban-board.md          # Using the Kanban board
│   ├── work-items.md            # Creating and managing items
│   ├── projects.md              # Project management
│   └── keyboard-shortcuts.md    # Keyboard shortcuts
├── admin-guide/
│   ├── installation.md          # Self-hosted setup
│   ├── configuration.md         # Environment variables
│   ├── authentication.md        # Auth provider setup
│   ├── database.md              # Database management
│   └── monitoring.md            # System monitoring
├── agent-guide/
│   ├── overview.md              # Agent architecture
│   ├── project-manager.md       # PM Agent docs
│   ├── scrum-master.md          # SM Agent docs
│   ├── developer.md             # Developer Agent docs
│   ├── custom-agents.md         # Creating custom agents
│   └── troubleshooting.md       # Agent issues
├── api-reference/
│   ├── rest-api.md              # REST API endpoints
│   ├── realtime.md              # Realtime subscriptions
│   ├── edge-functions.md        # Supabase functions
│   └── types.md                 # TypeScript types
├── developer-guide/
│   ├── architecture.md          # System architecture
│   ├── local-development.md     # Dev environment setup
│   ├── contributing.md          # Contribution guidelines
│   ├── testing.md               # Testing guide
│   └── deployment.md            # Deployment guide
└── assets/
    ├── architecture-diagram.png
    ├── workflow-diagram.png
    └── screenshots/
```

### User Guide Example
```markdown
# Getting Started with Agent Kanban

## Overview
Agent Kanban is a project management tool that combines traditional
Kanban boards with AI-powered agents that can automate routine tasks.

## Quick Start

### 1. Create an Account
Navigate to [your-domain.com/signup] and create an account using
your email or OAuth provider.

### 2. Create Your First Project
1. Click "New Project" in the sidebar
2. Enter a project name and description
3. Click "Create"

### 3. Add Your First Work Item
1. Click "+" in the Backlog column
2. Fill in the item details:
   - **Title**: Brief description
   - **Type**: Feature, Bug, Story, or Task
   - **Description**: Detailed requirements
3. Click "Create"

### 4. Move Items Through the Board
Drag and drop items between columns:
- **Backlog** → **Ready** when refined
- **Ready** → **In Progress** when starting work
- Continue through **Review** → **Testing** → **Done**

## Working with Agents
When you move a feature or project spec to "Ready", AI agents
can automatically process it:

1. **Project Manager Agent**: Generates PRDs from features
2. **Scrum Master Agent**: Breaks PRDs into user stories
3. **Developer Agent**: Implements stories (if configured)

Items being processed by agents show a robot icon (🤖).
```

### API Documentation Example
```markdown
# REST API Reference

## Authentication
All API requests require authentication using a Bearer token.

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-project.supabase.co/rest/v1/work_items
\`\`\`

## Work Items

### List Work Items
\`GET /rest/v1/work_items\`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| project_id | uuid | Filter by project |
| status | string | Filter by status |
| type | string | Filter by type |
| select | string | Fields to return |

**Example:**
\`\`\`bash
GET /rest/v1/work_items?project_id=eq.{uuid}&status=eq.ready
\`\`\`

### Create Work Item
\`POST /rest/v1/work_items\`

**Body:**
\`\`\`json
{
  "project_id": "uuid",
  "title": "string",
  "description": "string",
  "type": "feature|bug|story|task",
  "priority": "critical|high|medium|low"
}
\`\`\`
```

### JSDoc Example
```typescript
/**
 * Claims a work item for an agent to process.
 *
 * @param workItemId - The UUID of the work item to claim
 * @param agentType - The type of agent making the claim
 * @param agentInstanceId - Unique identifier for this agent instance
 * @returns Promise resolving to true if claim succeeded, false otherwise
 *
 * @example
 * ```typescript
 * const claimed = await claimWorkItem(
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   'project_manager',
 *   'pm-001'
 * )
 * if (claimed) {
 *   // Process the item
 * }
 * ```
 *
 * @throws {Error} If the work item doesn't exist
 * @see {@link releaseWorkItem} for releasing a claimed item
 */
export async function claimWorkItem(
  workItemId: string,
  agentType: AgentType,
  agentInstanceId: string
): Promise<boolean> {
  // Implementation
}
```

### Architecture Diagram (Mermaid)
```markdown
\`\`\`mermaid
graph TB
    subgraph Frontend["Frontend (Vercel)"]
        UI[React UI]
        Store[Zustand Store]
    end

    subgraph Backend["Backend (Supabase)"]
        DB[(PostgreSQL)]
        Auth[Auth Service]
        RT[Realtime]
        Edge[Edge Functions]
    end

    subgraph Agents["Agent Layer"]
        PM[PM Agent]
        SM[SM Agent]
        Dev[Dev Agent]
    end

    UI --> Store
    Store --> DB
    Store --> RT
    UI --> Auth

    PM --> Edge
    SM --> Edge
    Dev --> Edge
    Edge --> DB

    RT --> UI
\`\`\`
```

### README Template for Components
```markdown
# Component Name

## Overview
Brief description of what this component does.

## Usage
\`\`\`tsx
import { ComponentName } from './ComponentName'

<ComponentName
  prop1="value"
  prop2={123}
  onAction={handleAction}
/>
\`\`\`

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Required. Description |
| prop2 | number | 0 | Optional. Description |

## Examples
### Basic Usage
[Example code]

### With Custom Styling
[Example code]

## Related Components
- [RelatedComponent1](../RelatedComponent1)
- [RelatedComponent2](../RelatedComponent2)
```

---

## Documentation Tools

- **Docusaurus** or **VitePress** for documentation site
- **Mermaid** for diagrams
- **TypeDoc** for API documentation from TypeScript
- **Storybook** for component documentation

---

## Related Stories
- Depends on: All other stories (document completed features)
- Blocks: None

---

## Notes
- Keep documentation close to code (co-located)
- Update docs as part of each PR
- Include screenshots and GIFs for UI features
- Consider internationalization for docs
