import { useState, useMemo } from 'react';
import {
  Activity, CheckCircle2, DollarSign, Users, AlertCircle, Camera, TrendingUp,
  Zap, MessageSquare, FileText, Shield, Clock, Search, Filter, Eye,
  Mail, Phone, Globe, Target, UserCheck, LogIn, Settings, Trash2, Edit,
  Plus, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  userInitials: string;
  action: string;
  target: string;
  details?: string;
  category: 'crm' | 'kampanj' | 'ekonomi' | 'system' | 'automation';
  icon: any;
  color: string;
}

// Simulated audit log data
const mockActivities: ActivityEntry[] = [
  { id: '1', timestamp: '2026-04-01T11:32:00', user: 'Anna Svensson', userInitials: 'AS', action: 'Ändrade status', target: 'TechStart AB', details: 'Pending → Aktiv', category: 'crm', icon: CheckCircle2, color: 'text-emerald-500' },
  { id: '2', timestamp: '2026-04-01T11:15:00', user: 'System', userInitials: 'SY', action: 'Automation kördes', target: 'Välkomstflöde ny kund', details: 'Skickade välkomstmejl och Slack-notis', category: 'automation', icon: Zap, color: 'text-amber-500' },
  { id: '3', timestamp: '2026-04-01T10:48:00', user: 'Erik Lindgren', userInitials: 'EL', action: 'Skapade faktura', target: 'Nordic Food', details: '32 000 kr via Fortnox', category: 'ekonomi', icon: FileText, color: 'text-blue-500' },
  { id: '4', timestamp: '2026-04-01T10:30:00', user: 'Maria Kraft', userInitials: 'MK', action: 'Uppdaterade Google Ads budget', target: 'FashionBrand', details: '15 000 → 18 000 kr/mån', category: 'kampanj', icon: Globe, color: 'text-blue-500' },
  { id: '5', timestamp: '2026-04-01T10:12:00', user: 'Anna Svensson', userInitials: 'AS', action: 'La till kontakt', target: 'DataVision AB', details: 'Ny lead via webbformulär', category: 'crm', icon: Plus, color: 'text-violet-500' },
  { id: '6', timestamp: '2026-04-01T09:45:00', user: 'System', userInitials: 'SY', action: 'Budget varning', target: 'GreenEnergy', details: 'Spenderat 81% av budget', category: 'ekonomi', icon: AlertCircle, color: 'text-amber-500' },
  { id: '7', timestamp: '2026-04-01T09:30:00', user: 'Johan Persson', userInitials: 'JP', action: 'Levererade film', target: 'FashionBrand', details: 'Produktvideo Q2 - 3 filer uppladdade', category: 'kampanj', icon: Camera, color: 'text-violet-500' },
  { id: '8', timestamp: '2026-04-01T09:15:00', user: 'Erik Lindgren', userInitials: 'EL', action: 'SEO-rapport genererad', target: 'HealthPlus', details: 'Ranking upp 5 positioner', category: 'kampanj', icon: TrendingUp, color: 'text-emerald-500' },
  { id: '9', timestamp: '2026-04-01T09:00:00', user: 'Anna Svensson', userInitials: 'AS', action: 'Loggade in', target: 'MarketFlow CRM', details: 'IP: 85.xxx.xxx.xxx', category: 'system', icon: LogIn, color: 'text-muted-foreground' },
  { id: '10', timestamp: '2026-03-31T17:45:00', user: 'Maria Kraft', userInitials: 'MK', action: 'Ändrade Meta Ads målgrupp', target: 'StartupXYZ', details: 'Utökade till 25-44 år', category: 'kampanj', icon: Target, color: 'text-blue-500' },
  { id: '11', timestamp: '2026-03-31T16:30:00', user: 'System', userInitials: 'SY', action: 'Automation kördes', target: 'Budgetvarning', details: 'Notifierade projektledare', category: 'automation', icon: Zap, color: 'text-amber-500' },
  { id: '12', timestamp: '2026-03-31T15:00:00', user: 'Johan Persson', userInitials: 'JP', action: 'Ändrade projektstatus', target: 'Webbdesign - GreenEnergy', details: 'Working → Stuck (väntar på kundmaterial)', category: 'crm', icon: ArrowRight, color: 'text-red-500' },
  { id: '13', timestamp: '2026-03-31T14:20:00', user: 'Erik Lindgren', userInitials: 'EL', action: 'Ringde kund', target: 'Nordic Food', details: 'Samtal 12 min - diskuterade kampanjresultat', category: 'crm', icon: Phone, color: 'text-blue-500' },
  { id: '14', timestamp: '2026-03-31T13:00:00', user: 'Anna Svensson', userInitials: 'AS', action: 'Skickade offert', target: 'DataVision AB', details: 'SEO + Google Ads paket - 45 000 kr/mån', category: 'ekonomi', icon: Mail, color: 'text-violet-500' },
  { id: '15', timestamp: '2026-03-31T11:30:00', user: 'System', userInitials: 'SY', action: 'Google Ads synk', target: 'Alla kunder', details: 'Synkade budgetdata för 6 konton', category: 'kampanj', icon: Globe, color: 'text-blue-500' },
  { id: '16', timestamp: '2026-03-31T10:00:00', user: 'Maria Kraft', userInitials: 'MK', action: 'Ändrade behörighet', target: 'Johan Persson', details: 'Lade till Film/Foto-åtkomst', category: 'system', icon: Shield, color: 'text-muted-foreground' },
];

const categoryConfig: Record<string, { label: string; className: string }> = {
  crm: { label: 'CRM', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  kampanj: { label: 'Kampanj', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  ekonomi: { label: 'Ekonomi', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  system: { label: 'System', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  automation: { label: 'Automation', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return 'Just nu';
  if (diffMin < 60) return `${diffMin} min sedan`;
  if (diffH < 24) return `${diffH}h sedan`;

  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ActivityLog() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const users = [...new Set(mockActivities.map(a => a.user))];

  const filtered = mockActivities.filter(a => {
    const matchSearch = !search ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      a.target.toLowerCase().includes(search.toLowerCase()) ||
      a.details?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || a.category === filterCategory;
    const matchUser = filterUser === 'all' || a.user === filterUser;
    return matchSearch && matchCategory && matchUser;
  });

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};
    filtered.forEach(a => {
      const dateKey = a.timestamp.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(a);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Aktivitetslogg</h1>
          <p className="text-muted-foreground">Alla händelser och ändringar i systemet</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Shield className="h-3 w-3" /> Audit Log
          </Badge>
        </div>
      </motion.div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(categoryConfig).map(([key, cfg]) => {
          const count = mockActivities.filter(a => a.category === key).length;
          return (
            <motion.div key={key} variants={item}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}>
                <CardContent className={`pt-3 pb-2 ${filterCategory === key ? 'ring-1 ring-primary' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{cfg.label}</p>
                    <Badge variant="outline" className={`text-[10px] h-4 ${cfg.className}`}>{count}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div variants={item} className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök händelse..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Alla kategorier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kategorier</SelectItem>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Alla användare" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla användare</SelectItem>
            {users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} händelser</span>
      </motion.div>

      {/* Timeline */}
      {grouped.map(([dateKey, entries]) => (
        <motion.div key={dateKey} variants={item}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">
              {formatDate(dateKey + 'T12:00:00')}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground">{entries.length} händelser</span>
          </div>

          <Card>
            <div className="divide-y">
              {entries.map((entry, i) => {
                const cat = categoryConfig[entry.category];
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors group">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                      <entry.icon className={`h-4 w-4 ${entry.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{entry.action}</span>
                        <span className="text-sm text-primary font-medium">{entry.target}</span>
                        <Badge variant="outline" className={`text-[9px] px-1 h-3.5 ${cat.className}`}>{cat.label}</Badge>
                      </div>
                      {entry.details && (
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <div>
                        <p className="text-[11px] text-muted-foreground">{entry.user}</p>
                        <p className="text-[10px] text-muted-foreground/60">{formatTimestamp(entry.timestamp)}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        entry.user === 'System' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {entry.userInitials}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      ))}

      {filtered.length === 0 && (
        <motion.div variants={item} className="text-center py-16">
          <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg">Inga händelser hittades</h3>
          <p className="text-muted-foreground text-sm mt-1">Prova att ändra dina filter.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
