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
  assignees?: string[];
  tags: string[];
  createdAt: string;
  // Optional brief info inherited from a won sales lead
  description?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  leadSource?: string;
  dealId?: string;
  salesperson?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  assignee: string;
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
  taskId?: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  lastRun?: string;
}

export type ContactStatus = 'active' | 'paused' | 'completed' | 'pending';

export interface Contact {
  id: string;
  name: string;
  website: string;
  platform: string;
  budget: number;
  rating: number;
  contactPerson: string;
  seller: string;
  service: string;
  status: ContactStatus;
  startDate: string;
  endDate: string;
  comment: string;
  hasReport: boolean;
  phone: string;
  emails: string[];
  googleAdsCustomerId: string;
}

export interface GoogleAdsDailyBudget {
  id: string;
  contactId: string;
  date: string;
  campaignName: string;
  dailyBudget: number;
  dailySpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}
