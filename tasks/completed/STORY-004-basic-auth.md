# STORY-004: Implement Basic Authentication

## Overview
Implement user authentication using Supabase Auth, including sign up, sign in, sign out, and session management.

## Status
**Current**: BACKLOG
**Phase**: 1 - Foundation
**Priority**: HIGH
**Estimated Effort**: Medium

---

## User Story
As a user, I want to sign up and log into the application so that I can access my projects and work items securely.

---

## Acceptance Criteria

- [ ] Email/password authentication implemented
- [ ] Sign up page with form validation
- [ ] Sign in page with form validation
- [ ] Password reset functionality
- [ ] Session persistence across page reloads
- [ ] Auth state available globally via Zustand store
- [ ] Protected routes redirect to login
- [ ] User profile information accessible
- [ ] Sign out functionality
- [ ] Loading states during auth operations

---

## Technical Notes

### Auth Store (Zustand)
```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({
      session,
      user: session?.user ?? null,
      loading: false
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  }
}))
```

### Protected Route Component
```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
```

### RLS Policies for Auth
```sql
-- Enable RLS on tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own projects
CREATE POLICY "Users can view their projects" ON projects
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);
```

---

## UI Components Needed

- [ ] `LoginPage` - Sign in form
- [ ] `SignUpPage` - Registration form
- [ ] `ForgotPasswordPage` - Password reset request
- [ ] `ProtectedRoute` - HOC for route protection
- [ ] `UserMenu` - Dropdown with user info and sign out

---

## Related Stories
- Depends on: STORY-002, STORY-003
- Blocks: STORY-006, STORY-009

---

## Notes
- Consider adding OAuth providers (Google, GitHub) in future iteration
- Email confirmation can be configured in Supabase dashboard
- Rate limiting is handled automatically by Supabase
