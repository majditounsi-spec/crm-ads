-- Create invoices table for MarketFlow CRM (Fortnox integration)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL DEFAULT '',
  customer_name TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  due_date TEXT DEFAULT '',
  paid_at TEXT,
  description TEXT DEFAULT '',
  source_type TEXT DEFAULT 'manual',
  source_id TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Insert sample invoices
INSERT INTO invoices (id, invoice_number, customer_name, customer_email, amount, vat, total_amount, status, due_date, paid_at, description, source_type, source_id, items, created_at) VALUES
('00000000-0000-0000-0000-000000000101', '2026-001', 'TechStart AB', 'anna@techstart.se', 45000, 11250, 56250, 'paid', '2026-04-20', '2026-04-15', 'SEO Paket - Q2 2026', 'getaccept', 'ga-1', '[{"description":"SEO Optimering Q2","quantity":1,"unitPrice":45000,"total":45000}]'::jsonb, '2026-03-21'),
('00000000-0000-0000-0000-000000000102', '2026-002', 'DataVision AB', 'maria@datavision.se', 180000, 45000, 225000, 'sent', '2026-04-30', NULL, 'Webb & SEO Årsavtal', 'getaccept', 'ga-5', '[{"description":"Webbdesign & Utveckling","quantity":1,"unitPrice":120000,"total":120000},{"description":"SEO Årspaket","quantity":1,"unitPrice":60000,"total":60000}]'::jsonb, '2026-02-16');
