import { useState, useCallback } from 'react';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  active: boolean;
}

const STORAGE_KEY = 'marketflow_team_members';

const demoMembers: TeamMember[] = [
  { id: 'tm-1', email: 'alban@byrå.se', name: 'Alban', role: 'member', active: true },
  { id: 'tm-2', email: 'kevin@byrå.se', name: 'Kevin', role: 'member', active: true },
  { id: 'tm-3', email: 'roine@byrå.se', name: 'Roine', role: 'manager', active: true },
  { id: 'tm-4', email: 'therese@byrå.se', name: 'Therese', role: 'member', active: true },
  { id: 'tm-5', email: 'dan@byrå.se', name: 'Dan', role: 'member', active: true },
  { id: 'tm-6', email: 'skhodran@byrå.se', name: 'Skhodran', role: 'member', active: true },
  { id: 'tm-7', email: 'jonas@byrå.se', name: 'Jonas', role: 'member', active: true },
  { id: 'tm-8', email: 'ulf@byrå.se', name: 'Ulf', role: 'manager', active: true },
  { id: 'tm-9', email: 'elin@byrå.se', name: 'Elin', role: 'manager', active: true },
  { id: 'tm-10', email: 'anell@byrå.se', name: 'Anell', role: 'member', active: true },
  { id: 'tm-11', email: 'hussein@byrå.se', name: 'Hussein', role: 'member', active: true },
];

function loadMembers(): TeamMember[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Seed demo members
  saveMembers(demoMembers);
  return demoMembers;
}

function saveMembers(members: TeamMember[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {}
}

export function useTeamMembers() {
  const [members, setMembersState] = useState<TeamMember[]>(loadMembers);

  const setMembers = useCallback((updater: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => {
    setMembersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveMembers(next);
      return next;
    });
  }, []);

  const activeMembers = members.filter(m => m.active);
  const memberNames = activeMembers.map(m => m.name);

  return { members, activeMembers, memberNames, setMembers };
}

// Simple function to get member names without hook (for initial data)
export function getTeamMemberNames(): string[] {
  return loadMembers().filter(m => m.active).map(m => m.name);
}
