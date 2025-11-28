import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Project } from '../types';
import { mockProjects } from '../data/mockData';

interface DbProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbToProject(p: DbProject): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    status: p.status as Project['status'],
    createdBy: p.created_by || '',
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedProjects = ((data || []) as DbProject[]).map(mapDbToProject);
      setProjects(mappedProjects.length > 0 ? mappedProjects : mockProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name: string, description: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      // Mock mode
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name,
        description,
        status: 'active',
        createdBy: 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    }

    const { data, error: createError } = await supabase
      .from('projects')
      .insert({ name, description } as never)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    const newProject = mapDbToProject(data as DbProject);
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    const client = supabase;
    const channel = client
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
  };
}
