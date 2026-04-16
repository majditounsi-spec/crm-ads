import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from '@/types/crm';

const HOURLY_RATE_KEY = 'marketflow_hourly_rate';
const DEFAULT_RATE = 1750;

function loadRate(): number {
  try {
    const stored = localStorage.getItem(HOURLY_RATE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return DEFAULT_RATE;
}

function saveRate(rate: number) {
  try {
    localStorage.setItem(HOURLY_RATE_KEY, String(rate));
  } catch {}
  // Notify listeners
  try {
    window.dispatchEvent(new CustomEvent('marketflow:hourly-rate-changed', { detail: rate }));
  } catch {}
}

/** Shared hook for the global hourly rate setting. */
export function useHourlyRate() {
  const [rate, setRateState] = useState<number>(() => loadRate());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number') setRateState(detail);
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === HOURLY_RATE_KEY && e.newValue) {
        const n = Number(e.newValue);
        if (!Number.isNaN(n) && n > 0) setRateState(n);
      }
    };
    window.addEventListener('marketflow:hourly-rate-changed', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('marketflow:hourly-rate-changed', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const setRate = useCallback((next: number) => {
    if (!Number.isFinite(next) || next <= 0) return;
    saveRate(next);
    setRateState(next);
  }, []);

  return { rate, setRate };
}

/** Loads all time entries for a project from localStorage. */
export function loadProjectTimeEntries(projectId: string): TimeEntry[] {
  try {
    const stored = localStorage.getItem(`marketflow_time_${projectId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

/** Compute total hours logged on a project. */
export function getProjectHours(projectId: string): number {
  return loadProjectTimeEntries(projectId).reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
}

/** Compute total hours logged on a specific task in a project. */
export function getTaskHours(projectId: string, taskId: string): number {
  return loadProjectTimeEntries(projectId)
    .filter(e => e.taskId === taskId)
    .reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
}

export interface ProjectProfitability {
  hours: number;
  cost: number;
  budget: number;
  remaining: number;
  profitPct: number;      // (budget - cost) / budget * 100
  budgetUsedPct: number;  // cost / budget * 100
  status: 'healthy' | 'warning' | 'over';
}

/** Compute profitability for a project given its budget, hours, and current hourly rate. */
export function computeProfitability(budget: number, hours: number, hourlyRate: number): ProjectProfitability {
  const cost = hours * hourlyRate;
  const remaining = budget - cost;
  const budgetUsedPct = budget > 0 ? (cost / budget) * 100 : 0;
  const profitPct = budget > 0 ? ((budget - cost) / budget) * 100 : 0;
  const status: ProjectProfitability['status'] =
    budgetUsedPct >= 100 ? 'over' : budgetUsedPct >= 80 ? 'warning' : 'healthy';
  return { hours, cost, budget, remaining, profitPct, budgetUsedPct, status };
}
