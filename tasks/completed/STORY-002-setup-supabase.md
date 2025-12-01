# STORY-002: Set Up Supabase Project

## Overview
Create and configure a Supabase project to serve as the backend for authentication, database, and real-time features.

## Status
**Current**: BACKLOG
**Phase**: 1 - Foundation
**Priority**: HIGH
**Estimated Effort**: Small

---

## User Story
As a developer, I want a properly configured Supabase project so that I can store data and handle authentication for the application.

---

## Acceptance Criteria

- [ ] Supabase project created
- [ ] Supabase client library installed (`@supabase/supabase-js`)
- [ ] Supabase client initialized in the React app
- [ ] Environment variables configured:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Connection to Supabase verified
- [ ] TypeScript types generated for database schema

---

## Technical Notes

### Supabase Client Setup
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Type Generation
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

---

## Related Stories
- Depends on: STORY-001 (React app must exist)
- Blocks: STORY-003, STORY-004

---

## Notes
- Keep service role key secure (never expose in frontend)
- Consider setting up local Supabase for development
