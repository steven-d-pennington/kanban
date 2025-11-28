# STORY-009: Project Management Features

## Overview
Implement project management functionality including creating projects, switching between projects, and project settings.

## Status
**Current**: BACKLOG
**Phase**: 2 - Core Features
**Priority**: MEDIUM
**Estimated Effort**: Medium

---

## User Story
As a user, I want to create and manage multiple projects so that I can organize different initiatives on separate Kanban boards.

---

## Acceptance Criteria

- [ ] Create new project with name and description
- [ ] List all user's projects
- [ ] Switch between projects
- [ ] Project dashboard/overview page
- [ ] Edit project settings (name, description)
- [ ] Archive/delete project
- [ ] Project selector in header navigation
- [ ] Default project on login
- [ ] Project-specific URL routing (`/projects/:id/board`)

---

## Technical Notes

### Projects Store
```typescript
// src/stores/projectsStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean

  fetchProjects: () => Promise<void>
  createProject: (data: CreateProjectInput) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project) => void
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      set({ projects: data, loading: false })
      // Set first project as current if none selected
      if (!get().currentProject && data.length > 0) {
        set({ currentProject: data[0] })
      }
    }
  },

  createProject: async (data) => {
    const { data: project, error } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    set({ projects: [project, ...get().projects] })
    return project
  },

  setCurrentProject: (project) => {
    set({ currentProject: project })
  }
}))
```

### Project Types
```typescript
// src/types/project.ts
export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  name: string
  description?: string
}
```

### Routing Structure
```typescript
// src/App.tsx
<Routes>
  <Route path="/" element={<Navigate to="/projects" />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignUpPage />} />

  <Route element={<ProtectedRoute />}>
    <Route path="/projects" element={<ProjectsListPage />} />
    <Route path="/projects/new" element={<CreateProjectPage />} />
    <Route path="/projects/:projectId" element={<ProjectLayout />}>
      <Route index element={<Navigate to="board" />} />
      <Route path="board" element={<KanbanBoardPage />} />
      <Route path="settings" element={<ProjectSettingsPage />} />
    </Route>
  </Route>
</Routes>
```

### Project Selector Component
```typescript
// src/components/ProjectSelector.tsx
export function ProjectSelector() {
  const { projects, currentProject, setCurrentProject } = useProjectsStore()
  const navigate = useNavigate()

  const handleChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      navigate(`/projects/${projectId}/board`)
    }
  }

  return (
    <select
      value={currentProject?.id ?? ''}
      onChange={(e) => handleChange(e.target.value)}
      className="..."
    >
      {projects.map(project => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  )
}
```

---

## UI Components Needed

- [ ] `ProjectsListPage` - Grid/list of all projects
- [ ] `ProjectCard` - Card showing project info
- [ ] `CreateProjectForm` - Form to create new project
- [ ] `ProjectSelector` - Dropdown in header
- [ ] `ProjectSettingsPage` - Edit project details
- [ ] `DeleteProjectDialog` - Confirmation modal

---

## Related Stories
- Depends on: STORY-004
- Blocks: None (parallel with other Phase 2 stories)

---

## Notes
- Consider adding project templates for quick setup
- Future: Add project members/sharing functionality
- Consider persisting current project selection in localStorage
