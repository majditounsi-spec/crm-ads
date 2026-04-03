import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectStatus, ProjectPriority } from '@/types/crm';
import { mockProjects } from '@/data/mockData';

const STORAGE_KEY = 'marketflow_projects';

interface DbProject {
  id: string;
  name: string;
  client: string;
  status: string;
  priority: string;
  deadline: string;
  budget: number;
  spent: number;
  assignee: string;
  tags: string;
  created_at: string;
}

function dbToProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    status: row.status as ProjectStatus,
    priority: row.priority as ProjectPriority,
    deadline: row.deadline,
    budget: Number(row.budget),
    spent: Number(row.spent),
    assignee: row.assignee,
    tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    createdAt: row.created_at?.split('T')[0] || '',
  };
}

function projectToDb(p: Omit<Project, 'id'>) {
  return {
    name: p.name,
    client: p.client,
    status: p.status,
    priority: p.priority,
    deadline: p.deadline,
    budget: p.budget,
    spent: p.spent,
    assignee: p.assignee,
    tags: p.tags.join(','),
  };
}

function saveLocal(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

function loadLocal(): Project[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

export function useProjects() {
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = (data as unknown as DbProject[]).map(dbToProject);
        setProjectsState(mapped);
        saveLocal(mapped);
      } else {
        const local = loadLocal();
        if (local && local.length > 0) {
          setProjectsState(local);
        } else {
          setProjectsState(mockProjects);
          saveLocal(mockProjects);
        }
      }
    } catch {
      const local = loadLocal();
      if (local && local.length > 0) {
        setProjectsState(local);
      } else {
        setProjectsState(mockProjects);
        saveLocal(mockProjects);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const setProjects = useCallback((updater: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLocal(next);
      return next;
    });
  }, []);

  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('projects' as any)
      .insert(projectToDb({ ...project, createdAt: '' }) as any)
      .select()
      .single();

    if (error) {
      const newProject: Project = {
        ...project,
        id: String(Date.now()),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    }
    const newProject = dbToProject(data as unknown as DbProject);
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }, [setProjects]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    // Update locally first
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    // Build DB updates
    const dbUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'tags' && Array.isArray(value)) {
        dbUpdates.tags = value.join(',');
      } else if (key === 'createdAt') {
        // skip - managed by DB
      } else {
        dbUpdates[key] = value;
      }
    }

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase
        .from('projects' as any)
        .update(dbUpdates as any)
        .eq('id', id);
      if (error) {
        console.error('Supabase project update failed:', error.message);
      }
    }
  }, [setProjects]);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase
      .from('projects' as any)
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Supabase project delete failed:', error.message);
    }
  }, [setProjects]);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id) || null;
  }, [projects]);

  return { projects, loading, setProjects, addProject, updateProject, deleteProject, getProject, refetch: fetchProjects };
}
