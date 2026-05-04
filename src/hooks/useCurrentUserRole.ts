import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'manager' | 'produktion' | 'member' | 'viewer';

const TEAM_KEY = 'marketflow_team_members';
const ROLES_KEY = 'marketflow_roles';

interface RolePermissions {
  contacts: boolean;
  projects: boolean;
  sales: boolean;
  invoices: boolean;
  timeTracking: boolean;
  automations: boolean;
  googleAds: boolean;
  reports: boolean;
  settings: boolean;
  users: boolean;
}

const adminPermissions: RolePermissions = {
  contacts: true, projects: true, sales: true, invoices: true,
  timeTracking: true, automations: true, googleAds: true, reports: true,
  settings: true, users: true,
};

const roleToSettingsKey: Record<AppRole, string> = {
  admin: 'super_admin',
  manager: 'super_admin',
  produktion: 'production',
  member: 'production',
  viewer: 'viewer',
};

function lookupRole(email: string): { role: AppRole; name: string } | null {
  try {
    const stored = localStorage.getItem(TEAM_KEY);
    if (!stored) return null;
    const members: any[] = JSON.parse(stored);
    const found = members.find(m => m.email?.toLowerCase() === email?.toLowerCase());
    if (found) return { role: found.role as AppRole, name: found.name };
  } catch {}
  return null;
}

function loadPermissions(role: AppRole): RolePermissions {
  try {
    const stored = localStorage.getItem(ROLES_KEY);
    if (stored) {
      const roles = JSON.parse(stored);
      const settingsKey = roleToSettingsKey[role] || 'production';
      if (roles[settingsKey]?.permissions) return roles[settingsKey].permissions;
    }
  } catch {}
  if (role === 'admin' || role === 'manager') return adminPermissions;
  return {
    contacts: true, projects: true, sales: false, invoices: false,
    timeTracking: true, automations: false, googleAds: false, reports: false,
    settings: false, users: false,
  };
}

export function useCurrentUserRole() {
  const { user } = useAuth();
  const [, rerender] = useState(0);

  useEffect(() => {
    const handler = () => rerender(n => n + 1);
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return useMemo(() => {
    if (!user) {
      return { role: 'admin' as AppRole, name: '', isAdmin: true, isProduction: false, permissions: adminPermissions };
    }

    const found = lookupRole(user.email);

    if (!found) {
      return { role: 'admin' as AppRole, name: user.name, isAdmin: true, isProduction: false, permissions: adminPermissions };
    }

    const { role, name } = found;
    const isAdmin = role === 'admin' || role === 'manager';
    const isProduction = !isAdmin;
    const permissions = loadPermissions(role);

    return { role, name, isAdmin, isProduction, permissions };
  }, [user, rerender]);
}
