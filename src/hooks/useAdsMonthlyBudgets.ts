import { useState, useCallback } from 'react';

const STORAGE_KEY = 'marketflow_ads_monthly_budgets';

type BudgetMap = Record<string, number>; // key: `${contactId}-${year}-${month}`

function makeKey(contactId: string, year: number, month: number): string {
  return `${contactId}-${year}-${month}`;
}

function load(): BudgetMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function save(map: BudgetMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function useAdsMonthlyBudgets() {
  const [budgetMap, setBudgetMap] = useState<BudgetMap>(load);

  const getMonthlyBudget = useCallback((contactId: string, year: number, month: number): number | null => {
    const val = budgetMap[makeKey(contactId, year, month)];
    return val !== undefined ? val : null;
  }, [budgetMap]);

  const setMonthlyBudget = useCallback((contactId: string, year: number, month: number, budget: number) => {
    setBudgetMap(prev => {
      const next = { ...prev, [makeKey(contactId, year, month)]: budget };
      save(next);
      return next;
    });
  }, []);

  const clearMonthlyBudget = useCallback((contactId: string, year: number, month: number) => {
    setBudgetMap(prev => {
      const next = { ...prev };
      delete next[makeKey(contactId, year, month)];
      save(next);
      return next;
    });
  }, []);

  return { getMonthlyBudget, setMonthlyBudget, clearMonthlyBudget };
}
