import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GoogleAdsDailyBudget } from '@/types/crm';
import { toast } from 'sonner';

interface DbGoogleAdsBudget {
  id: string;
  contact_id: string;
  date: string;
  campaign_name: string;
  daily_budget: number;
  daily_spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

function dbToBudget(row: DbGoogleAdsBudget): GoogleAdsDailyBudget {
  return {
    id: row.id,
    contactId: row.contact_id,
    date: row.date,
    campaignName: row.campaign_name,
    dailyBudget: Number(row.daily_budget),
    dailySpend: Number(row.daily_spend),
    impressions: row.impressions,
    clicks: row.clicks,
    conversions: Number(row.conversions),
  };
}

export function useGoogleAdsBudgets(contactIds: string[], dateFrom?: string, dateTo?: string) {
  const [budgets, setBudgets] = useState<GoogleAdsDailyBudget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (contactIds.length === 0) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('google_ads_daily_budgets' as any)
      .select('*')
      .in('contact_id', contactIds)
      .order('date', { ascending: false });

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Kunde inte hämta Google Ads-budgetar');
      console.error(error);
    } else {
      setBudgets((data as unknown as DbGoogleAdsBudget[]).map(dbToBudget));
    }
    setLoading(false);
  }, [contactIds.join(','), dateFrom, dateTo]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const addBudgetEntry = async (entry: Omit<GoogleAdsDailyBudget, 'id'>) => {
    const { data, error } = await supabase
      .from('google_ads_daily_budgets' as any)
      .upsert({
        contact_id: entry.contactId,
        date: entry.date,
        campaign_name: entry.campaignName,
        daily_budget: entry.dailyBudget,
        daily_spend: entry.dailySpend,
        impressions: entry.impressions,
        clicks: entry.clicks,
        conversions: entry.conversions,
      } as any, { onConflict: 'contact_id,date,campaign_name' })
      .select()
      .single();

    if (error) {
      toast.error('Kunde inte spara budgetdata');
      console.error(error);
      return null;
    }
    const newEntry = dbToBudget(data as unknown as DbGoogleAdsBudget);
    setBudgets((prev) => {
      const existing = prev.findIndex(b => b.contactId === newEntry.contactId && b.date === newEntry.date && b.campaignName === newEntry.campaignName);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newEntry;
        return updated;
      }
      return [newEntry, ...prev];
    });
    return newEntry;
  };

  const deleteBudgetEntry = async (id: string) => {
    const { error } = await supabase
      .from('google_ads_daily_budgets' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Kunde inte ta bort budgetdata');
      console.error(error);
      return false;
    }
    setBudgets((prev) => prev.filter(b => b.id !== id));
    return true;
  };

  return { budgets, loading, addBudgetEntry, deleteBudgetEntry, refetch: fetchBudgets };
}
