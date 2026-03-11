import { Project, TimeEntry, Automation } from '@/types/crm';

export const mockProjects: Project[] = [
  {
    id: '1', name: 'SEO Kampanj - TechStart AB', client: 'TechStart AB',
    status: 'working', priority: 'high', deadline: '2026-04-15',
    budget: 45000, spent: 28000, assignee: 'Anna S.', tags: ['SEO', 'Content'],
    createdAt: '2026-02-01',
  },
  {
    id: '2', name: 'Social Media Strategi - Nordic Food', client: 'Nordic Food',
    status: 'review', priority: 'medium', deadline: '2026-03-28',
    budget: 32000, spent: 30000, assignee: 'Erik L.', tags: ['Social Media', 'Strategi'],
    createdAt: '2026-01-15',
  },
  {
    id: '3', name: 'Google Ads - FashionBrand', client: 'FashionBrand',
    status: 'done', priority: 'low', deadline: '2026-03-10',
    budget: 60000, spent: 55000, assignee: 'Maria K.', tags: ['PPC', 'Google Ads'],
    createdAt: '2026-01-01',
  },
  {
    id: '4', name: 'Webbdesign - GreenEnergy', client: 'GreenEnergy',
    status: 'stuck', priority: 'critical', deadline: '2026-03-20',
    budget: 80000, spent: 65000, assignee: 'Johan P.', tags: ['Webb', 'Design'],
    createdAt: '2026-02-10',
  },
  {
    id: '5', name: 'E-post Automation - HealthPlus', client: 'HealthPlus',
    status: 'pending', priority: 'medium', deadline: '2026-04-01',
    budget: 25000, spent: 5000, assignee: 'Anna S.', tags: ['Email', 'Automation'],
    createdAt: '2026-03-01',
  },
  {
    id: '6', name: 'Varumärkesstrategi - StartupXYZ', client: 'StartupXYZ',
    status: 'working', priority: 'high', deadline: '2026-04-20',
    budget: 70000, spent: 20000, assignee: 'Erik L.', tags: ['Branding', 'Strategi'],
    createdAt: '2026-03-05',
  },
];

export const mockTimeEntries: TimeEntry[] = [
  { id: '1', projectId: '1', projectName: 'SEO Kampanj - TechStart AB', description: 'Sökordsanalys', hours: 3, date: '2026-03-10', assignee: 'Anna S.' },
  { id: '2', projectId: '1', projectName: 'SEO Kampanj - TechStart AB', description: 'Innehållsskapande', hours: 5, date: '2026-03-09', assignee: 'Anna S.' },
  { id: '3', projectId: '2', projectName: 'Social Media Strategi - Nordic Food', description: 'Strategiplanering', hours: 4, date: '2026-03-10', assignee: 'Erik L.' },
  { id: '4', projectId: '4', projectName: 'Webbdesign - GreenEnergy', description: 'Wireframes', hours: 6, date: '2026-03-08', assignee: 'Johan P.' },
  { id: '5', projectId: '6', projectName: 'Varumärkesstrategi - StartupXYZ', description: 'Kundmöte', hours: 2, date: '2026-03-10', assignee: 'Erik L.' },
  { id: '6', projectId: '3', projectName: 'Google Ads - FashionBrand', description: 'Kampanjoptimering', hours: 3, date: '2026-03-07', assignee: 'Maria K.' },
];

export const mockAutomations: Automation[] = [
  { id: '1', name: 'Påminnelse vid deadline', trigger: 'Deadline om 3 dagar', action: 'Skicka e-post till ansvarig', active: true, lastRun: '2026-03-09' },
  { id: '2', name: 'Statusuppdatering till kund', trigger: 'Status ändras till "Klar"', action: 'Skicka kundnotifikation', active: true, lastRun: '2026-03-10' },
  { id: '3', name: 'Budgetvarning', trigger: 'Spenderat > 80% av budget', action: 'Notifiera projektledare', active: false },
  { id: '4', name: 'Ny uppgift tilldelad', trigger: 'Uppgift tilldelas teammedlem', action: 'Slack-notifikation', active: true, lastRun: '2026-03-10' },
];
