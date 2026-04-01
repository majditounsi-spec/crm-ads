import { useState, useCallback } from 'react';
import { Project, ProjectStatus, ProjectPriority } from '@/types/crm';
import { mockProjects } from '@/data/mockData';

const STORAGE_KEY = 'marketflow_projects';

function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return mockProjects;
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjects() {
  const [projects, setProjectsState] = useState<Project[]>(loadProjects);

  const setProjects = useCallback((updater: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveProjects(next);
      return next;
    });
  }, []);

  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }, [setProjects]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setProjects]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, [setProjects]);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id) || null;
  }, [projects]);

  return { projects, setProjects, addProject, updateProject, deleteProject, getProject };
}
