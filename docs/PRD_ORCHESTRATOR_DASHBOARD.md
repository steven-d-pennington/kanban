# PRD: Agent Orchestrator Dashboard

## Problem Statement

Users currently have limited visibility into what AI agents are doing within the kanban system. The existing monitoring dashboard shows basic agent status, but doesn't provide:
- Real-time pipeline flow visualization
- Bottleneck detection and alerts
- Agent handoff tracking
- Actionable interventions (force-release, reassign)

Without this visibility, users cannot:
1. Understand where work is getting stuck
2. Identify inefficient agents or processes
3. Take corrective action when things go wrong
4. Trust that the autonomous system is working correctly

## Solution Overview

Build an **Agent Orchestrator Dashboard** that provides real-time visibility into the agent pipeline, enabling users to monitor, understand, and intervene in agent workflows.

---

## User Stories

### US-1: View Active Agent Sessions
**As a** user monitoring the system
**I want to** see all active agent sessions and what they're working on
**So that** I know the system is functioning and can track progress

**Acceptance Criteria:**
- [ ] Display list of active agent instances with their current work item
- [ ] Show agent type with color-coded indicator (PM=blue, Scrum=green, Dev=yellow, Review=purple)
- [ ] Display time elapsed since agent started current task
- [ ] Show agent health status (active/idle/error)
- [ ] Auto-refresh every 10 seconds
- [ ] Click agent card to see detailed activity log

### US-2: Visualize Pipeline Flow
**As a** user
**I want to** see a visual representation of items flowing through the pipeline
**So that** I can understand the overall system state at a glance

**Acceptance Criteria:**
- [ ] Display horizontal pipeline: Feature → PRD → Stories → Dev → Review → Done
- [ ] Show count of items in each stage
- [ ] Items represented as mini-cards flowing between stages
- [ ] Animate transitions when items move between stages
- [ ] Color-code items by priority (critical=red, high=orange, medium=blue, low=gray)
- [ ] Click stage to see items in that stage

### US-3: Identify Bottlenecks
**As a** user
**I want to** be alerted when bottlenecks occur
**So that** I can take corrective action before they impact delivery

**Acceptance Criteria:**
- [ ] Highlight stages with more than 5 items as "at risk" (yellow)
- [ ] Highlight stages with more than 10 items as "bottleneck" (red)
- [ ] Show average time-in-stage for each status
- [ ] Alert when items have been in a stage longer than threshold (configurable)
- [ ] Display bottleneck notification in alerts panel
- [ ] Suggest actions (e.g., "Consider adding more developer agents")

### US-4: View System Metrics
**As a** user
**I want to** see key metrics about system performance
**So that** I can track improvement over time

**Acceptance Criteria:**
- [ ] Items completed today / this week / this month
- [ ] Average cycle time (feature request to done)
- [ ] Agent throughput (items processed per hour by agent type)
- [ ] Error/escalation rate
- [ ] Story points completed (velocity)
- [ ] Time range selector (24h, 7d, 30d)

### US-5: Force-Release Stuck Items
**As a** user
**I want to** force-release items that are stuck with an agent
**So that** work can continue when an agent fails or gets stuck

**Acceptance Criteria:**
- [ ] Show "Release" button on items claimed for >30 minutes without activity
- [ ] Confirm action with modal showing item details
- [ ] Log the force-release action with reason
- [ ] Move item back to "ready" status
- [ ] Notify in activity feed

### US-6: Reassign Work Items
**As a** user
**I want to** reassign a work item to a different agent type
**So that** I can correct routing mistakes or skip stages when appropriate

**Acceptance Criteria:**
- [ ] Show "Reassign" option in item context menu
- [ ] Select target agent type from dropdown
- [ ] Optionally add a comment explaining reassignment
- [ ] Update item status appropriately
- [ ] Log reassignment in activity feed

### US-7: View Handoff History
**As a** user
**I want to** see the history of how an item moved through the pipeline
**So that** I can understand the full journey and identify issues

**Acceptance Criteria:**
- [ ] Show timeline of handoffs for selected item
- [ ] Display: from_agent → to_agent with timestamp
- [ ] Show output/summary from each stage
- [ ] Highlight any failures or escalations
- [ ] Link to child items created at each handoff

---

## Technical Specifications

### Architecture Fit

Based on research of the existing frontend:

**State Management:**
- Create new Zustand store: `src/store/orchestratorStore.ts`
- State includes: pipelineData, activeAgents, metrics, alerts
- Actions: fetchPipelineData, releaseItem, reassignItem

**Components:**
```
src/components/orchestrator/
├── OrchestrationDashboard.tsx    (main page)
├── PipelineVisualization.tsx     (horizontal flow diagram)
├── ActiveAgentsPanel.tsx         (agent cards list)
├── OrchestratorMetrics.tsx       (4 metric cards)
├── BottleneckAlerts.tsx          (alert list)
├── HandoffTimeline.tsx           (item journey view)
└── QuickActions.tsx              (release, reassign buttons)
```

**Navigation:**
- Add 'orchestrator' to navigationStore page types
- Add nav link in Header.tsx between Monitoring and Analytics

**Data Sources:**
- `work_items` table - current status, assigned_agent
- `agent_activity` table - action history
- `agent_instances` table - active agents
- `handoff_history` table - handoff records
- May need new view: `work_item_pipeline` (already created in migration)

**Real-time Updates:**
- Use Supabase realtime subscriptions for work_items and agent_activity
- 10-second polling fallback for metrics

### UI/UX Guidelines

**Layout:**
- Full-width dashboard similar to existing Analytics page
- Top: Metric cards (4 across)
- Middle: Pipeline visualization (full width)
- Bottom: Two columns - Active Agents (left), Alerts/Actions (right)

**Colors (matching existing design system):**
- PM Agent: blue-500
- Scrum Agent: green-500
- Developer Agent: yellow-500
- Review Agent: purple-500
- QA Agent: teal-500
- Error states: red-500
- Warning states: amber-500

**Interactions:**
- Hover on pipeline stage: Show item count and avg time
- Click pipeline stage: Expand to show items
- Hover on agent card: Show current item details
- Drag items between stages (optional, phase 2)

---

## Out of Scope

- Automated agent spawning/scaling (future feature)
- Agent configuration/settings management
- Historical trend analysis beyond 30 days
- Mobile-specific optimizations (responsive is fine)
- Integration with external monitoring tools (Datadog, etc.)

---

## Open Questions

1. **Thresholds**: What should the default bottleneck thresholds be? Suggest: 5 items = warning, 10 items = critical
2. **Refresh Rate**: Is 10-second refresh acceptable? Could be configurable.
3. **Permissions**: Should all users see this dashboard or only admins?

---

## Success Metrics

1. **Adoption**: >80% of users visit orchestrator dashboard weekly
2. **MTTR**: Mean time to resolve stuck items decreases by 50%
3. **Visibility**: Users report improved understanding of system state
4. **Intervention**: Average of <2 manual interventions per day needed

---

## Dependencies

- Database migration 007_enhanced_agents.sql must be applied
- MCP server must support code_reviewer and qa_tester agent types
- Existing monitoring and analytics dashboards for reference patterns
