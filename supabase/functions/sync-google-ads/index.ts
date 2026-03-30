import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_ADS_API_VERSION = "v18";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GoogleAdsConfig {
  id: string;
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token: string;
  access_token_expires_at: string | null;
}

interface Contact {
  id: string;
  name: string;
  google_ads_customer_id: string;
}

async function refreshAccessToken(config: GoogleAdsConfig): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh token: ${err}`);
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
  // Remove dashes from customer ID
  const cleanCustomerId = customerId.replace(/-/g, "");

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
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Ads API error for ${customerId}: ${err}`);
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
        date: row.segments?.date || "",
        campaign_name: row.campaign?.name || "Unknown",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional date range
    let dateFrom: string;
    let dateTo: string;
    try {
      const body = await req.json();
      dateFrom = body.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dateTo = body.dateTo || new Date().toISOString().split("T")[0];
    } catch {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dateTo = new Date().toISOString().split("T")[0];
    }

    // Get Google Ads config
    const { data: configData, error: configError } = await supabase
      .from("google_ads_config")
      .select("*")
      .limit(1)
      .single();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: "Google Ads är inte konfigurerat. Gå till inställningar och lägg till dina API-nycklar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = configData as GoogleAdsConfig;

    if (!config.developer_token || !config.client_id || !config.client_secret || !config.refresh_token) {
      return new Response(
        JSON.stringify({ error: "Google Ads-konfiguration saknar nödvändiga fält (developer_token, client_id, client_secret, refresh_token)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(config);

    // Update access token in DB
    await supabase
      .from("google_ads_config")
      .update({
        access_token: accessToken,
        access_token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
      })
      .eq("id", config.id);

    // Get all contacts with Google Ads customer IDs
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, name, google_ads_customer_id")
      .neq("google_ads_customer_id", "");

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    const adsContacts = (contacts as Contact[]).filter((c) => c.google_ads_customer_id);

    if (adsContacts.length === 0) {
      return new Response(
        JSON.stringify({ message: "Inga kontakter har Google Ads kund-ID konfigurerat.", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch budgets for each contact
    let totalSynced = 0;
    const errors: string[] = [];

    for (const contact of adsContacts) {
      try {
        const budgets = await fetchGoogleAdsBudgets(
          accessToken,
          config.developer_token,
          contact.google_ads_customer_id,
          dateFrom,
          dateTo
        );

        // Upsert budget data
        for (const budget of budgets) {
          const { error: upsertError } = await supabase
            .from("google_ads_daily_budgets")
            .upsert(
              {
                contact_id: contact.id,
                date: budget.date,
                campaign_name: budget.campaign_name,
                daily_budget: budget.daily_budget,
                daily_spend: budget.daily_spend,
                impressions: budget.impressions,
                clicks: budget.clicks,
                conversions: budget.conversions,
              },
              { onConflict: "contact_id,date,campaign_name" }
            );

          if (upsertError) {
            errors.push(`Upsert error for ${contact.name}: ${upsertError.message}`);
          } else {
            totalSynced++;
          }
        }
      } catch (err) {
        errors.push(`${contact.name} (${contact.google_ads_customer_id}): ${err.message}`);
      }
    }

    // Update last synced timestamp
    await supabase
      .from("google_ads_config")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", config.id);

    return new Response(
      JSON.stringify({
        message: `Synkronisering klar`,
        synced: totalSynced,
        contacts: adsContacts.length,
        dateFrom,
        dateTo,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
