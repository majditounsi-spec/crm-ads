export type ProjectStatus = 'done' | 'working' | 'stuck' | 'pending' | 'review';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string;
  budget: number;
  spent: number;
  assignee: string;
  tags: string[];
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  description: string;
  hours: number;
  date: string;
  assignee: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  lastRun?: string;
}
