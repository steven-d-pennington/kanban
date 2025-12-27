import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ProjectMemory, MemoryType } from '../types/memory';

// Database row type for project_memory
interface DbMemory {
  id: string;
  project_id: string;
  memory_type: string;
  title: string;
  content: string;
  embedding: string | null;
  source_work_item_id: string | null;
  created_by_agent: string | null;
  created_by_user: string | null;
  relevance_score: number;
  is_global: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MemoryState {
  memories: ProjectMemory[];
  selectedMemory: ProjectMemory | null;
  selectedMemories: Set<string>;
  loading: boolean;
  error: string | null;

  // Actions
  fetchMemories: (projectId: string) => Promise<void>;
  createMemory: (
    projectId: string,
    title: string,
    content: string,
    memoryType: MemoryType
  ) => Promise<ProjectMemory | null>;
  updateMemory: (id: string, title: string, content: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  bulkDeleteMemories: (ids: string[]) => Promise<void>;
  setSelectedMemory: (memory: ProjectMemory | null) => void;
  toggleMemorySelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

// Mapper function
const mapMemoryFromDb = (m: DbMemory): ProjectMemory => ({
  id: m.id,
  projectId: m.project_id,
  memoryType: m.memory_type as MemoryType,
  title: m.title,
  content: m.content,
  embedding: null, // We don't need to load the full embedding in the UI
  sourceWorkItemId: m.source_work_item_id || undefined,
  createdByAgent: m.created_by_agent || undefined,
  createdByUser: m.created_by_user || undefined,
  relevanceScore: m.relevance_score,
  isGlobal: m.is_global,
  isActive: m.is_active,
  createdAt: m.created_at,
  updatedAt: m.updated_at,
});

// Helper function to call MCP embedding service
async function generateEmbedding(title: string, content: string): Promise<number[] | null> {
  try {
    // Call MCP embedding service via edge function
    // This should match your MCP setup - adjust URL as needed
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      console.error('Failed to generate embedding:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

export const useMemoryStore = create<MemoryState>((set) => ({
  memories: [],
  selectedMemory: null,
  selectedMemories: new Set(),
  loading: false,
  error: null,

  fetchMemories: async (projectId: string) => {
    if (!supabase) return;
    set({ loading: true, error: null });

    try {
      const { data, error } = await (supabase as any)
        .from('project_memory')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const memories = (data || []).map(mapMemoryFromDb);
      set({ memories, loading: false });
    } catch (err: any) {
      console.error('Failed to fetch memories:', err);
      set({ error: err.message, loading: false });
    }
  },

  createMemory: async (
    projectId: string,
    title: string,
    content: string,
    memoryType: MemoryType
  ) => {
    if (!supabase) return null;
    set({ loading: true, error: null });

    try {
      const { data: userData } = await supabase.auth.getUser();

      // Generate embedding
      const embedding = await generateEmbedding(title, content);

      const { data, error } = await (supabase as any)
        .from('project_memory')
        .insert({
          project_id: projectId,
          memory_type: memoryType,
          title,
          content,
          embedding: embedding ? JSON.stringify(embedding) : null,
          created_by_user: userData.user?.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const newMemory = mapMemoryFromDb(data);
      set((state) => ({
        memories: [newMemory, ...state.memories],
        loading: false,
      }));
      return newMemory;
    } catch (err: any) {
      console.error('Failed to create memory:', err);
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateMemory: async (id: string, title: string, content: string) => {
    if (!supabase) return;
    set({ loading: true, error: null });

    try {
      // Generate new embedding for updated content
      const embedding = await generateEmbedding(title, content);

      const { data, error } = await (supabase as any)
        .from('project_memory')
        .update({
          title,
          content,
          embedding: embedding ? JSON.stringify(embedding) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedMemory = mapMemoryFromDb(data);
      set((state) => ({
        memories: state.memories.map((m) => (m.id === id ? updatedMemory : m)),
        selectedMemory:
          state.selectedMemory?.id === id ? updatedMemory : state.selectedMemory,
        loading: false,
      }));
    } catch (err: any) {
      console.error('Failed to update memory:', err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteMemory: async (id: string) => {
    if (!supabase) return;
    set({ loading: true, error: null });

    try {
      // Soft delete - set is_active to false
      const { error } = await (supabase as any)
        .from('project_memory')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        memories: state.memories.filter((m) => m.id !== id),
        selectedMemory: state.selectedMemory?.id === id ? null : state.selectedMemory,
        selectedMemories: new Set(
          Array.from(state.selectedMemories).filter((mId) => mId !== id)
        ),
        loading: false,
      }));
    } catch (err: any) {
      console.error('Failed to delete memory:', err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  bulkDeleteMemories: async (ids: string[]) => {
    if (!supabase || ids.length === 0) return;
    set({ loading: true, error: null });

    try {
      // Soft delete all selected memories
      const { error } = await (supabase as any)
        .from('project_memory')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;

      set((state) => ({
        memories: state.memories.filter((m) => !ids.includes(m.id)),
        selectedMemories: new Set(),
        loading: false,
      }));
    } catch (err: any) {
      console.error('Failed to bulk delete memories:', err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  setSelectedMemory: (memory) => set({ selectedMemory: memory }),

  toggleMemorySelection: (id: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedMemories);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedMemories: newSelection };
    });
  },

  clearSelection: () => set({ selectedMemories: new Set() }),

  selectAll: () => {
    set((state) => ({
      selectedMemories: new Set(state.memories.map((m) => m.id)),
    }));
  },
}));
