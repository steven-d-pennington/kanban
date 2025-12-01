# REST API Reference

Agent Kanban uses Supabase as its backend, which provides automatic REST APIs for all tables.

## Base URL

```
https://your-project.supabase.co/rest/v1
```

## Authentication

All API requests require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "apikey: YOUR_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/work_items
```

For agents, use the service role key instead.

## Projects API

### List Projects

```http
GET /rest/v1/projects
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| select | string | Fields to return |
| status | string | Filter by status |
| order | string | Sort order |

**Example:**
```bash
GET /rest/v1/projects?status=eq.active&order=created_at.desc
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Project",
    "description": "Project description",
    "status": "active",
    "created_by": "user-uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

### Create Project

```http
POST /rest/v1/projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "Description",
  "status": "active"
}
```

### Update Project

```http
PATCH /rest/v1/projects?id=eq.{uuid}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Project

```http
DELETE /rest/v1/projects?id=eq.{uuid}
```

## Work Items API

### List Work Items

```http
GET /rest/v1/work_items
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| project_id | uuid | Filter by project |
| status | string | Filter by status |
| type | string | Filter by type |
| assigned_agent | string | Filter by agent type |
| select | string | Fields to return |

**Example:**
```bash
GET /rest/v1/work_items?project_id=eq.{uuid}&status=eq.ready&order=column_order
```

### Create Work Item

```http
POST /rest/v1/work_items
Content-Type: application/json

{
  "project_id": "uuid",
  "title": "New Feature",
  "description": "Feature description",
  "type": "feature",
  "priority": "high",
  "status": "backlog"
}
```

**Required Fields:**
- project_id
- title
- type
- priority

### Update Work Item

```http
PATCH /rest/v1/work_items?id=eq.{uuid}
Content-Type: application/json

{
  "status": "in_progress",
  "started_at": "2025-01-01T00:00:00Z"
}
```

### Delete Work Item

```http
DELETE /rest/v1/work_items?id=eq.{uuid}
```

## Agent Functions

### Claim Work Item

```http
POST /rest/v1/rpc/claim_work_item
Content-Type: application/json

{
  "p_work_item_id": "uuid",
  "p_agent_type": "developer",
  "p_agent_instance_id": "dev-001"
}
```

**Response:**
```json
true  // or false if claim failed
```

### Release Work Item

```http
POST /rest/v1/rpc/release_work_item
Content-Type: application/json

{
  "p_work_item_id": "uuid",
  "p_agent_instance_id": "dev-001",
  "p_reason": "completed"
}
```

### Complete Work Item

```http
POST /rest/v1/rpc/complete_work_item
Content-Type: application/json

{
  "p_work_item_id": "uuid",
  "p_agent_type": "scrum_master",
  "p_agent_instance_id": "sm-001",
  "p_output": {
    "stories": ["story1", "story2"]
  },
  "p_child_items": [
    {
      "type": "story",
      "title": "User Story 1",
      "description": "As a user..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "completed_item": "uuid",
  "child_items": ["uuid1", "uuid2"],
  "validation_errors": []
}
```

### Register Agent Instance

```http
POST /rest/v1/rpc/register_agent_instance
Content-Type: application/json

{
  "p_instance_id": "pm-001",
  "p_agent_type": "project_manager",
  "p_display_name": "PM Agent 1"
}
```

### Log Agent Activity

```http
POST /rest/v1/rpc/log_agent_activity
Content-Type: application/json

{
  "p_work_item_id": "uuid",
  "p_agent_type": "developer",
  "p_agent_instance_id": "dev-001",
  "p_action": "processing",
  "p_details": {"step": "analyzing"},
  "p_status": "success"
}
```

## Views

### Agent Activity Feed

```http
GET /rest/v1/agent_activity_feed?order=created_at.desc&limit=50
```

### Agent Claimed Items

```http
GET /rest/v1/agent_claimed_items
```

### Work Item Metrics

```http
GET /rest/v1/work_item_metrics?project_id=eq.{uuid}
```

### Bottlenecks

```http
GET /rest/v1/work_item_bottlenecks?project_id=eq.{uuid}
```

## Error Responses

**400 Bad Request:**
```json
{
  "message": "Invalid input",
  "details": "Missing required field: title"
}
```

**401 Unauthorized:**
```json
{
  "message": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**409 Conflict:**
```json
{
  "message": "Work item already claimed"
}
```

## Rate Limits

- Anonymous: 100 requests/minute
- Authenticated: 1000 requests/minute
- Agents: Configurable per action

## Pagination

Use `offset` and `limit` for pagination:

```http
GET /rest/v1/work_items?offset=20&limit=10
```

Or use range headers:

```http
GET /rest/v1/work_items
Range: 0-9
```
