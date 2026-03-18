
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT '',
  budget INTEGER NOT NULL DEFAULT 0,
  rating INTEGER NOT NULL DEFAULT 1,
  contact_person TEXT NOT NULL DEFAULT '',
  seller TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT 'SEO',
  status TEXT NOT NULL DEFAULT 'pending',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',
  has_report BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on contacts"
  ON public.contacts FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on contacts"
  ON public.contacts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access on contacts"
  ON public.contacts FOR DELETE
  USING (true);
