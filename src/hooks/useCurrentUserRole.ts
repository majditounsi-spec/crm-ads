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

  if (!user) {
    return { role: null as AppRole | null, name: '', isAdmin: false, isProduction: false };
  }

  const found = lookupRole(user.email);
  const role: AppRole = found?.role ?? 'admin';
  const name = found?.name ?? user.name;

  // admin + manager see everything; produktion/member/viewer are filtered
  const isAdmin = role === 'admin' || role === 'manager';
  const isProduction = !isAdmin;

  return { role, name, isAdmin, isProduction };
}
