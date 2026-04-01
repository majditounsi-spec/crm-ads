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

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API_VERSION = 'v18';

async function refreshAccessToken(config: GoogleAdsConfig): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kunde inte förnya token: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchGoogleAdsBudgets(
  accessToken: string,
  developerToken: string,
  customerId: string,
  dateFrom: string,
  dateTo: string
) {
  const cleanCustomerId = customerId.replace(/-/g, '');

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign_budget.amount_micros,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date DESC
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Ads API fel för ${customerId}: ${err}`);
  }

  const data = await res.json();
  const results: Array<{
    date: string;
    campaign_name: string;
    daily_budget: number;
    daily_spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }> = [];

  if (!data || !Array.isArray(data)) return results;

  for (const batch of data) {
    if (!batch.results) continue;
    for (const row of batch.results) {
      results.push({
        date: row.segments?.date || '',
        campaign_name: row.campaign?.name || 'Unknown',
        daily_budget: (row.campaignBudget?.amountMicros || 0) / 1_000_000,
        daily_spend: (row.metrics?.costMicros || 0) / 1_000_000,
        impressions: row.metrics?.impressions || 0,
        clicks: row.metrics?.clicks || 0,
        conversions: row.metrics?.conversions || 0,
      });
    }
  }

  return results;
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
    if (!config) {
      toast.error('Konfigurera Google Ads API först');
      return null;
    }

    setSyncing(true);
    try {
      // Step 1: Refresh access token
      toast.info('Förnyar access token...');
      const accessToken = await refreshAccessToken(config);

      // Save access token to DB
      await supabase
        .from('google_ads_config' as any)
        .update({
          access_token: accessToken,
          access_token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
        } as any)
        .eq('id', config.id);

      // Step 2: Get contacts with Google Ads customer IDs
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, name, google_ads_customer_id')
        .neq('google_ads_customer_id', '');

      if (contactsError) {
        throw new Error(`Kunde inte hämta kontakter: ${contactsError.message}`);
      }

      const adsContacts = (contacts || []).filter((c: any) => c.google_ads_customer_id);

      if (adsContacts.length === 0) {
        toast.warning('Inga kontakter har Google Ads kund-ID. Lägg till kund-ID i kontakternas inställningar.');
        return null;
      }

      const from = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = dateTo || new Date().toISOString().split('T')[0];

      // Step 3: Fetch budgets for each contact
      toast.info(`Hämtar data för ${adsContacts.length} konton...`);
      let totalSynced = 0;
      const errors: string[] = [];

      for (const contact of adsContacts) {
        try {
          const budgets = await fetchGoogleAdsBudgets(
            accessToken,
            config.developerToken,
            (contact as any).google_ads_customer_id,
            from,
            to
          );

          for (const budget of budgets) {
            const { error: upsertError } = await supabase
              .from('google_ads_daily_budgets' as any)
              .upsert(
                {
                  contact_id: (contact as any).id,
                  date: budget.date,
                  campaign_name: budget.campaign_name,
                  daily_budget: budget.daily_budget,
                  daily_spend: budget.daily_spend,
                  impressions: budget.impressions,
                  clicks: budget.clicks,
                  conversions: budget.conversions,
                } as any,
                { onConflict: 'contact_id,date,campaign_name' }
              );

            if (upsertError) {
              errors.push(`${(contact as any).name}: ${upsertError.message}`);
            } else {
              totalSynced++;
            }
          }
        } catch (err: any) {
          errors.push(`${(contact as any).name}: ${err.message}`);
        }
      }

      // Update last synced timestamp
      await supabase
        .from('google_ads_config' as any)
        .update({ last_synced_at: new Date().toISOString() } as any)
        .eq('id', config.id);

      await fetchConfig();

      if (errors.length > 0) {
        toast.warning(`Synkat ${totalSynced} poster, men ${errors.length} fel uppstod`);
        console.error('Sync errors:', errors);
      } else if (totalSynced === 0) {
        toast.info('Inga nya poster att synka. Kontrollera att kund-ID:n är korrekta.');
      } else {
        toast.success(`${totalSynced} poster synkade från ${adsContacts.length} konton!`);
      }

      return { synced: totalSynced, contacts: adsContacts.length, errors };
    } catch (err: any) {
      toast.error(err.message || 'Synkronisering misslyckades');
      console.error('Sync failed:', err);
      return null;
    } finally {
      setSyncing(false);
    }
  };

  return { config, loading, syncing, saveConfig, syncBudgets, refetch: fetchConfig };
}
