# STORY-003: Create Database Schema

## Overview
Design and implement the PostgreSQL database schema in Supabase to support projects, work items, agent activity, and comments.

## Status
**Current**: BACKLOG
**Phase**: 1 - Foundation
**Priority**: HIGH
**Estimated Effort**: Medium

---

## User Story
As a developer, I want a well-designed database schema so that I can store and manage all Kanban board data efficiently.

---

## Acceptance Criteria

- [ ] `projects` table created with all required fields
- [ ] `work_items` table created with hierarchical support
- [ ] `agent_activity` table created for logging
- [ ] `comments` table created for discussions
- [ ] All foreign key relationships established
- [ ] Indexes created for common query patterns
- [ ] Row Level Security (RLS) policies enabled
- [ ] Database triggers for `updated_at` timestamps
- [ ] TypeScript types regenerated and updated

---

## Technical Notes

### Projects Table
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

### Work Items Table
```sql
CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES work_items(id),

  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'project_spec', 'feature', 'prd', 'story', 'bug', 'task'
  priority VARCHAR(20) DEFAULT 'medium',

  status VARCHAR(50) DEFAULT 'backlog',
  column_order INTEGER DEFAULT 0,

  assigned_to UUID REFERENCES auth.users(id),
  assigned_agent VARCHAR(100),

  story_points INTEGER,
  due_date DATE,
  labels JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### Agent Activity Table
```sql
CREATE TABLE agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES work_items(id),
  agent_type VARCHAR(100) NOT NULL,
  agent_instance_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_agent VARCHAR(100),
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_work_items_project ON work_items(project_id);
CREATE INDEX idx_work_items_status ON work_items(status);
CREATE INDEX idx_work_items_type ON work_items(type);
CREATE INDEX idx_work_items_assigned_agent ON work_items(assigned_agent);
CREATE INDEX idx_agent_activity_work_item ON agent_activity(work_item_id);
CREATE INDEX idx_comments_work_item ON comments(work_item_id);
```

### Auto-update Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_work_items_updated_at
  BEFORE UPDATE ON work_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Related Stories
- Depends on: STORY-002 (Supabase project must exist)
- Blocks: STORY-004, STORY-006, STORY-010

---

## Notes
- Consider adding soft delete columns (`deleted_at`) for audit trail
- Work item types should be enforced via CHECK constraint or enum
- Status values: 'backlog', 'ready', 'in_progress', 'review', 'testing', 'done'
