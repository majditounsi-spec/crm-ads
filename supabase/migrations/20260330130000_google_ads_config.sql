-- Store Google Ads API configuration and OAuth tokens
CREATE TABLE public.google_ads_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_token TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL DEFAULT '',
  client_secret TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL DEFAULT '',
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.google_ads_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on google_ads_config"
  ON public.google_ads_config FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on google_ads_config"
  ON public.google_ads_config FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on google_ads_config"
  ON public.google_ads_config FOR UPDATE USING (true) WITH CHECK (true);
