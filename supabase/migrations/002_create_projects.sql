-- Create projects table for MarketFlow CRM
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  client TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  deadline TEXT DEFAULT '',
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  assignee TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Insert sample projects
INSERT INTO projects (id, name, client, status, priority, deadline, budget, spent, assignee, tags, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'SEO Kampanj - TechStart AB', 'TechStart AB', 'working', 'high', '2026-04-15', 45000, 28000, 'Anna S.', 'SEO,Content', '2026-02-01'),
('00000000-0000-0000-0000-000000000002', 'Social Media Strategi - Nordic Food', 'Nordic Food', 'review', 'medium', '2026-03-28', 32000, 30000, 'Erik L.', 'Social Media,Strategi', '2026-01-15'),
('00000000-0000-0000-0000-000000000003', 'Google Ads - FashionBrand', 'FashionBrand', 'done', 'low', '2026-03-10', 60000, 55000, 'Maria K.', 'PPC,Google Ads', '2026-01-01'),
('00000000-0000-0000-0000-000000000004', 'Webbdesign - GreenEnergy', 'GreenEnergy', 'stuck', 'critical', '2026-03-20', 80000, 65000, 'Johan P.', 'Webb,Design', '2026-02-10'),
('00000000-0000-0000-0000-000000000005', 'E-post Automation - HealthPlus', 'HealthPlus', 'pending', 'medium', '2026-04-01', 25000, 5000, 'Anna S.', 'Email,Automation', '2026-03-01'),
('00000000-0000-0000-0000-000000000006', 'Varumärkesstrategi - StartupXYZ', 'StartupXYZ', 'working', 'high', '2026-04-20', 70000, 20000, 'Erik L.', 'Branding,Strategi', '2026-03-05');
