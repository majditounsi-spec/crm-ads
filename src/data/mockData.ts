import { Project, TimeEntry, Automation, Task } from '@/types/crm';

export const mockProjects: Project[] = [
  {
    id: '1', name: 'SEO Kampanj - TechStart AB', client: 'TechStart AB',
    status: 'working', priority: 'high', deadline: '2026-04-15',
    budget: 45000, spent: 28000, assignee: 'Kevin', tags: ['SEO', 'Content'],
    createdAt: '2026-02-01',
  },
  {
    id: '2', name: 'Social Media Strategi - Nordic Food', client: 'Nordic Food',
    status: 'review', priority: 'medium', deadline: '2026-03-28',
    budget: 32000, spent: 30000, assignee: 'Elin', tags: ['Social Media', 'Strategi'],
    createdAt: '2026-01-15',
  },
  {
    id: '3', name: 'Google Ads - FashionBrand', client: 'FashionBrand',
    status: 'done', priority: 'low', deadline: '2026-03-10',
    budget: 60000, spent: 55000, assignee: 'Hussein', tags: ['PPC', 'Google Ads'],
    createdAt: '2026-01-01',
  },
  {
    id: '4', name: 'Webbdesign - GreenEnergy', client: 'GreenEnergy',
    status: 'stuck', priority: 'critical', deadline: '2026-03-20',
    budget: 80000, spent: 65000, assignee: 'Dan', tags: ['Webb', 'Design'],
    createdAt: '2026-02-10',
  },
  {
    id: '5', name: 'E-post Automation - HealthPlus', client: 'HealthPlus',
    status: 'pending', priority: 'medium', deadline: '2026-04-01',
    budget: 25000, spent: 5000, assignee: 'Therese', tags: ['Email', 'Automation'],
    createdAt: '2026-03-01',
  },
  {
    id: '6', name: 'Varumärkesstrategi - StartupXYZ', client: 'StartupXYZ',
    status: 'working', priority: 'high', deadline: '2026-04-20',
    budget: 70000, spent: 20000, assignee: 'Marcus', tags: ['Branding', 'Strategi'],
    createdAt: '2026-03-05',
  },
];

export const mockTimeEntries: TimeEntry[] = [
  { id: '1', projectId: '1', projectName: 'SEO Kampanj - TechStart AB', description: 'Sökordsanalys', hours: 3, date: '2026-03-10', assignee: 'Kevin' },
  { id: '2', projectId: '1', projectName: 'SEO Kampanj - TechStart AB', description: 'Innehållsskapande', hours: 5, date: '2026-03-09', assignee: 'Kevin' },
  { id: '3', projectId: '2', projectName: 'Social Media Strategi - Nordic Food', description: 'Strategiplanering', hours: 4, date: '2026-03-10', assignee: 'Elin' },
  { id: '4', projectId: '4', projectName: 'Webbdesign - GreenEnergy', description: 'Wireframes', hours: 6, date: '2026-03-08', assignee: 'Dan' },
  { id: '5', projectId: '6', projectName: 'Varumärkesstrategi - StartupXYZ', description: 'Kundmöte', hours: 2, date: '2026-03-10', assignee: 'Marcus' },
  { id: '6', projectId: '3', projectName: 'Google Ads - FashionBrand', description: 'Kampanjoptimering', hours: 3, date: '2026-03-07', assignee: 'Hussein' },
];

export const mockTasks: Task[] = [
  { id: 't1', projectId: '1', title: 'Sökordsanalys för målsidor', completed: true, assignee: 'Kevin', createdAt: '2026-02-05' },
  { id: 't2', projectId: '1', title: 'Skapa innehållsplan', completed: false, assignee: 'Kevin', createdAt: '2026-02-10' },
  { id: 't3', projectId: '1', title: 'Teknisk SEO-audit', completed: false, assignee: 'Jonas', createdAt: '2026-02-15' },
  { id: 't4', projectId: '2', title: 'Målgruppsanalys', completed: true, assignee: 'Elin', createdAt: '2026-01-20' },
  { id: 't5', projectId: '2', title: 'Skapa content-kalender', completed: true, assignee: 'Elin', createdAt: '2026-01-25' },
  { id: 't6', projectId: '4', title: 'Wireframes för startsida', completed: true, assignee: 'Dan', createdAt: '2026-02-12' },
  { id: 't7', projectId: '4', title: 'Design av undersidor', completed: false, assignee: 'Dan', createdAt: '2026-02-20' },
  { id: 't8', projectId: '4', title: 'Responsiv anpassning', completed: false, assignee: 'Shodran', createdAt: '2026-03-01' },
  { id: 't9', projectId: '6', title: 'Varumärkesworkshop', completed: true, assignee: 'Marcus', createdAt: '2026-03-06' },
  { id: 't10', projectId: '6', title: 'Logotypförslag', completed: false, assignee: 'Anell', createdAt: '2026-03-08' },
];

export const mockAutomations: Automation[] = [
  { id: '1', name: 'Påminnelse vid deadline', trigger: 'Deadline om 3 dagar', action: 'Skicka e-post till ansvarig', active: true, lastRun: '2026-03-09' },
  { id: '2', name: 'Statusuppdatering till kund', trigger: 'Status ändras till "Klar"', action: 'Skicka kundnotifikation', active: true, lastRun: '2026-03-10' },
  { id: '3', name: 'Budgetvarning', trigger: 'Spenderat > 80% av budget', action: 'Notifiera projektledare', active: false },
  { id: '4', name: 'Ny uppgift tilldelad', trigger: 'Uppgift tilldelas teammedlem', action: 'Slack-notifikation', active: true, lastRun: '2026-03-10' },
];
