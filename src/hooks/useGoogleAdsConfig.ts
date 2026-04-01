import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GoogleAdsConfig {
  id: string;
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  lastSyncedAt: string | null;
}

interface DbConfig {
  id: string;
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token: string;
  access_token_expires_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

function dbToConfig(row: DbConfig): GoogleAdsConfig {
  return {
    id: row.id,
    developerToken: row.developer_token,
    clientId: row.client_id,
    clientSecret: row.client_secret,
    refreshToken: row.refresh_token,
    lastSyncedAt: row.last_synced_at,
  };
}

export function useGoogleAdsConfig() {
  const [config, setConfig] = useState<GoogleAdsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from('google_ads_config' as any)
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
    }
    if (data) {
      setConfig(dbToConfig(data as unknown as DbConfig));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (values: Omit<GoogleAdsConfig, 'id' | 'lastSyncedAt'>) => {
    const dbValues = {
      developer_token: values.developerToken,
      client_id: values.clientId,
      client_secret: values.clientSecret,
      refresh_token: values.refreshToken,
      updated_at: new Date().toISOString(),
    };

    if (config?.id) {
      const { error } = await supabase
        .from('google_ads_config' as any)
        .update(dbValues as any)
        .eq('id', config.id);

      if (error) {
        toast.error('Kunde inte spara konfiguration');
        console.error(error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('google_ads_config' as any)
        .insert(dbValues as any);

      if (error) {
        toast.error('Kunde inte spara konfiguration');
        console.error(error);
        return false;
      }
    }

    toast.success('Google Ads-konfiguration sparad');
    await fetchConfig();
    return true;
  };

  const syncBudgets = async (dateFrom?: string, dateTo?: string) => {
    setSyncing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cybxfemtgzonmhuiabeb.supabase.co";
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YnhmZW10Z3pvbm1odWlhYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzI5NjEsImV4cCI6MjA4OTM0ODk2MX0.93PI5FLPkhfMvwq1ADIwuzfsn92S6tngoQDaB4DOysA";

      const res = await fetch(`${supabaseUrl}/functions/v1/sync-google-ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ dateFrom, dateTo }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Synkronisering misslyckades');
        return null;
      }

      if (data.errors?.length > 0) {
        toast.warning(`Synkat ${data.synced} poster, men ${data.errors.length} fel uppstod`);
      } else {
        toast.success(`${data.synced} poster synkade från ${data.contacts} konton`);
      }

      await fetchConfig();
      return data;
    } catch (err) {
      toast.error('Kunde inte ansluta till synkroniseringstjänsten');
      console.error(err);
      return null;
    } finally {
      setSyncing(false);
    }
  };

  return { config, loading, syncing, saveConfig, syncBudgets, refetch: fetchConfig };
}
