# Managing Work Items

## Work Item Properties

Each work item has the following properties:

| Property | Description |
|----------|-------------|
| Title | Brief description of the work |
| Type | Category (Feature, Story, Bug, etc.) |
| Priority | Urgency level (Critical to Low) |
| Status | Current column/stage |
| Description | Detailed requirements |
| Story Points | Effort estimate (1, 2, 3, 5, 8, 13, 21) |
| Labels | Custom tags for organization |
| Due Date | Optional deadline |
| Assigned To | Human assignee |
| Assigned Agent | AI agent assignee |

## Creating Work Items

### From the Board

1. Click "+ New Item" in the header
2. Fill in the required fields
3. Add optional details (points, labels, due date)
4. Click "Create"

### Best Practices

- Use clear, action-oriented titles
- Include acceptance criteria in descriptions
- Set appropriate priority based on urgency
- Add story points for planning
- Use labels consistently

## Editing Work Items

### Quick Edit

Click on any work item to open the detail panel:
- Edit title and description inline
- Change type, priority, and status
- Update story points
- Manage labels
- Add comments

### Bulk Operations

Currently, items must be edited individually.

## Work Item Lifecycle

### Manual Flow

```
Backlog → Ready → In Progress → Review → Testing → Done
```

### With Agent Processing

1. **Features/Project Specs**:
   - Create in Backlog
   - Move to Ready when refined
   - PM Agent claims and creates PRD
   - Moves to Done when complete

2. **PRDs**:
   - Created by PM Agent in Ready
   - SM Agent claims and creates Stories
   - Moves to Done when complete

3. **Stories/Bugs/Tasks**:
   - Created by SM Agent or manually
   - Dev Agent claims from Ready
   - Implements and moves to Done

## Comments and Activity

### Adding Comments

1. Open the work item detail
2. Scroll to the comments section
3. Type your comment
4. Click "Add Comment"

### System Comments

Agent activity is logged as system comments:
- Agent claimed the item
- Processing started
- Completion notes
- Escalation reasons

## Labels

### Creating Labels

1. Open work item detail
2. Click the labels field
3. Type a new label name
4. Press Enter to create

### Using Labels

Common label patterns:
- Feature areas: `frontend`, `backend`, `api`
- Priorities: `urgent`, `blocked`
- Sprints: `sprint-1`, `sprint-2`

## Story Points

### Fibonacci Scale

| Points | Effort Level |
|--------|--------------|
| 1 | Trivial |
| 2 | Small |
| 3 | Medium |
| 5 | Large |
| 8 | Very Large |
| 13 | Epic |
| 21 | Too large - should split |

### Estimation Tips

- Compare to previously completed items
- Consider complexity, not just time
- Include testing and review time
- Split items larger than 8 points

## Duplicating Items

To create a copy of a work item:
1. Open the work item
2. Click the "..." menu
3. Select "Duplicate"
4. The copy appears in Backlog with "(Copy)" suffix

## Deleting Items

To delete a work item:
1. Open the work item
2. Click the "..." menu
3. Select "Delete"
4. Confirm the deletion

**Warning**: Deletion is permanent and cannot be undone.
