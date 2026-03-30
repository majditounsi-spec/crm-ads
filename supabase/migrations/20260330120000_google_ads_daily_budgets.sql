-- Add Google Ads customer ID to contacts
ALTER TABLE public.contacts ADD COLUMN google_ads_customer_id TEXT NOT NULL DEFAULT '';

-- Create table for storing daily Google Ads budget data
CREATE TABLE public.google_ads_daily_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  daily_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  daily_spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, date, campaign_name)
);

ALTER TABLE public.google_ads_daily_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on google_ads_daily_budgets"
  ON public.google_ads_daily_budgets FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on google_ads_daily_budgets"
  ON public.google_ads_daily_budgets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on google_ads_daily_budgets"
  ON public.google_ads_daily_budgets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access on google_ads_daily_budgets"
  ON public.google_ads_daily_budgets FOR DELETE
  USING (true);

-- Create index for fast lookups by contact and date range
CREATE INDEX idx_google_ads_budgets_contact_date
  ON public.google_ads_daily_budgets(contact_id, date DESC);
