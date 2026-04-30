import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'manager' | 'produktion' | 'member' | 'viewer';

const STORAGE_KEY = 'marketflow_team_members';

function lookupRole(email: string): { role: AppRole; name: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const members: any[] = JSON.parse(stored);
    const found = members.find(m => m.email?.toLowerCase() === email?.toLowerCase());
    if (found) return { role: found.role as AppRole, name: found.name };
  } catch {}
  return null;
}

export function useCurrentUserRole() {
  const { user } = useAuth();
  const [, rerender] = useState(0);

  // Re-read when team members change in localStorage
  useEffect(() => {
    const handler = () => rerender(n => n + 1);
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // No user logged in → full access (backwards compatible)
  if (!user) {
    return { role: 'admin' as AppRole, name: '', isAdmin: true, isProduction: false };
  }

  const found = lookupRole(user.email);

  // User not in team list → default to admin (owner/new user)
  if (!found) {
    return { role: 'admin' as AppRole, name: user.name, isAdmin: true, isProduction: false };
  }

  const { role, name } = found;
  const isAdmin = role === 'admin' || role === 'manager';
  const isProduction = !isAdmin;

  return { role, name, isAdmin, isProduction };
}
