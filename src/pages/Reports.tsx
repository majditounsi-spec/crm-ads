import { useState, useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useProjects } from '@/hooks/useProjects';
import { useGetAccept } from '@/hooks/useGetAccept';
import { useFortnox } from '@/hooks/useFortnox';
import { useWhiteLabel } from '@/hooks/useWhiteLabel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  PieChart, BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight,
  Download, Send, FileText, Target, Globe, Camera,
  Clock, User, Building2, X,
} from 'lucide-react';
import type { SalesLead } from '@/pages/SalesBoard';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type DateRange = 'week' | 'month' | '3months' | '12months';
type ReportTab = 'overview' | 'sellers' | 'customers' | 'projects' | 'invoices';

const SERVICE_COLORS: Record<string, string> = {
  'SEO': 'bg-emerald-500',
  'Google ADS': 'bg-blue-500',
  'Google Ads': 'bg-blue-500',
  'META': 'bg-violet-500',
  'META Ads': 'bg-violet-500',
  'Film/Foto': 'bg-amber-500',
  'WEBB': 'bg-rose-500',
  'Webb': 'bg-rose-500',
  'SEO + ADS': 'bg-teal-500',
  'ADS': 'bg-indigo-500',
  'Content': 'bg-pink-500',
  'Social Media': 'bg-cyan-500',
  'Email Marketing': 'bg-orange-500',
  'PR': 'bg-lime-500',
  'Strategi': 'bg-fuchsia-500',
};

const SERVICE_ICONS: Record<string, any> = {
  'SEO': TrendingUp,
  'Google ADS': Globe,
  'Google Ads': Globe,
  'META': Target,
  'META Ads': Target,
  'Film/Foto': Camera,
  'WEBB': Globe,
  'Webb': Globe,
};

const LEADS_KEY = 'marketflow_sales_leads';

function loadSalesLeads(): SalesLead[] {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  contact: 'Kontaktad',
  offer: 'Offert',
  negotiation: 'Förhandling',
  won: 'Vunnen',
  lost: 'Förlorad',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  contact: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  offer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  negotiation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  lost: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
};

export default function Reports() {
  const { contacts } = useContacts();
  const { projects } = useProjects();
  const { deals } = useGetAccept();
  const { invoices, totalRevenue, totalOutstanding, totalOverdue } = useFortnox();
  const { config } = useWhiteLabel();

  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [sendOpen, setSendOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendSections, setSendSections] = useState({
    kpi: true, services: true, customers: true, projects: false, invoices: true,
  });

  const salesLeads = useMemo(() => loadSalesLeads(), []);

  // Collect all unique seller names
  const allSellers = useMemo(() => {
    const names = new Set<string>();
    contacts.forEach(c => { if (c.seller?.trim()) names.add(c.seller.trim()); });
    salesLeads.forEach(l => { if (l.assignee?.trim()) names.add(l.assignee.trim()); });
    projects.forEach(p => {
      if (p.salesperson?.trim()) names.add(p.salesperson.trim());
      if (p.assignee?.trim()) names.add(p.assignee.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'sv'));
  }, [contacts, salesLeads, projects]);

  // Filtered data based on selected seller
  const filteredContacts = useMemo(() => {
    if (selectedSeller === 'all') return contacts;
    return contacts.filter(c => c.seller?.trim().toLowerCase() === selectedSeller.toLowerCase());
  }, [contacts, selectedSeller]);

  const filteredProjects = useMemo(() => {
    if (selectedSeller === 'all') return projects;
    return projects.filter(p =>
      p.assignee?.toLowerCase() === selectedSeller.toLowerCase() ||
      p.salesperson?.toLowerCase() === selectedSeller.toLowerCase()
    );
  }, [projects, selectedSeller]);

  const filteredLeads = useMemo(() => {
    if (selectedSeller === 'all') return salesLeads;
    return salesLeads.filter(l => l.assignee?.trim().toLowerCase() === selectedSeller.toLowerCase());
  }, [salesLeads, selectedSeller]);

  // KPI calculations (use filtered data)
  const activeCustomers = filteredContacts.filter(c => c.status === 'active').length;
  const totalCustomers = filteredContacts.length;
  const totalBudget = filteredContacts.reduce((s, c) => s + c.budget, 0);
  const signedDeals = deals.filter(d => d.status === 'signed');
  const winRate = deals.length > 0 ? Math.round((signedDeals.length / deals.length) * 100) : 0;
  const avgDealValue = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length) : 0;
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPaidAmount = paidInvoices.reduce((s, i) => s + i.totalAmount, 0);

  // Leads KPI
  const wonLeads = filteredLeads.filter(l => l.stage === 'won');
  const wonValue = wonLeads.reduce((s, l) => {
    if (l.services && l.services.length > 0) return s + l.services.reduce((ss, sv) => ss + (Number(sv.budget) || 0), 0);
    return s + (l.value || 0);
  }, 0);
  const leadsWinRate = filteredLeads.length > 0 ? Math.round((wonLeads.length / filteredLeads.length) * 100) : 0;

  // Service distribution (from filtered contacts)
  const serviceDistribution = useMemo(() => {
    const dist: Record<string, { count: number; budget: number }> = {};
    filteredContacts.forEach(c => {
      const services = c.service.split(/\s*[\+\,]\s*/);
      services.forEach(s => {
        const key = s.trim();
        if (!key) return;
        if (!dist[key]) dist[key] = { count: 0, budget: 0 };
        dist[key].count++;
        dist[key].budget += c.budget / services.length;
      });
    });
    return Object.entries(dist).sort((a, b) => b[1].budget - a[1].budget);
  }, [filteredContacts]);
  const totalServiceBudget = serviceDistribution.reduce((s, [, d]) => s + d.budget, 0);

  // Pipeline funnel
  const pipelineFunnel = useMemo(() => {
    const stages = [
      { key: 'draft', label: 'Utkast', color: 'bg-gray-400' },
      { key: 'sent', label: 'Skickad', color: 'bg-blue-500' },
      { key: 'viewed', label: 'Visad', color: 'bg-amber-500' },
      { key: 'signed', label: 'Signerad', color: 'bg-emerald-500' },
    ];
    return stages.map(s => ({
      ...s,
      count: deals.filter(d => d.status === s.key).length,
      value: deals.filter(d => d.status === s.key).reduce((sum, d) => sum + d.value, 0),
    }));
  }, [deals]);
  const maxFunnel = Math.max(...pipelineFunnel.map(s => s.count), 1);

  // Monthly revenue bars (simulated from invoices)
  const monthlyRevenue = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun'];
    const base = totalBudget || 50000;
    return months.map((m, i) => ({
      month: m,
      amount: Math.round(base * (0.7 + Math.random() * 0.6) * (1 + i * 0.05)),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalBudget]);
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.amount), 1);

  // Per-seller stats for the sellers tab
  const sellerStats = useMemo(() => {
    const stats: Record<string, {
      name: string;
      customers: number;
      activeCustomers: number;
      totalBudget: number;
      services: Record<string, { count: number; budget: number }>;
      leads: number;
      wonLeads: number;
      wonValue: number;
      projects: number;
    }> = {};

    const ensure = (name: string) => {
      if (!stats[name]) {
        stats[name] = {
          name,
          customers: 0,
          activeCustomers: 0,
          totalBudget: 0,
          services: {},
          leads: 0,
          wonLeads: 0,
          wonValue: 0,
          projects: 0,
        };
      }
      return stats[name];
    };

    contacts.forEach(c => {
      if (!c.seller?.trim()) return;
      const s = ensure(c.seller.trim());
      s.customers++;
      if (c.status === 'active') s.activeCustomers++;
      s.totalBudget += c.budget;
      const svcs = c.service.split(/\s*[\+\,]\s*/);
      svcs.forEach(svc => {
        const key = svc.trim();
        if (!key) return;
        if (!s.services[key]) s.services[key] = { count: 0, budget: 0 };
        s.services[key].count++;
        s.services[key].budget += c.budget / svcs.length;
      });
    });

    salesLeads.forEach(l => {
      if (!l.assignee?.trim()) return;
      const s = ensure(l.assignee.trim());
      s.leads++;
      if (l.stage === 'won') {
        s.wonLeads++;
        if (l.services && l.services.length > 0) {
          const val = l.services.reduce((sum, sv) => sum + (Number(sv.budget) || 0), 0);
          s.wonValue += val;
          l.services.forEach(sv => {
            const key = sv.name.trim();
            if (!key) return;
            if (!s.services[key]) s.services[key] = { count: 0, budget: 0 };
            s.services[key].count++;
            s.services[key].budget += Number(sv.budget) || 0;
          });
        } else {
          s.wonValue += l.value || 0;
        }
      }
    });

    projects.forEach(p => {
      const name = p.salesperson?.trim() || p.assignee?.trim();
      if (!name) return;
      const s = ensure(name);
      s.projects++;
    });

    return Object.values(stats).sort((a, b) => b.totalBudget + b.wonValue - (a.totalBudget + a.wonValue));
  }, [contacts, salesLeads, projects]);

  // Expanded seller detail
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null);

  const handleSendReport = () => {
    if (!sendEmail) { toast.error('Ange mottagarens e-post'); return; }
    toast.success(`Rapport skickad till ${sendEmail}!`);
    setSendOpen(false);
    setSendEmail('');
    setSendMessage('');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />Rapporter & Analys
          </h1>
          <p className="text-muted-foreground">Översikt av alla KPI:er och affärsdata</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seller filter */}
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger className="w-[180px] h-9 rounded-xl text-sm">
              <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Alla säljare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla säljare</SelectItem>
              {allSellers.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSeller !== 'all' && (
            <Button variant="ghost" size="sm" className="h-9 px-2 rounded-xl" onClick={() => setSelectedSeller('all')}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}

          <Select value={dateRange} onValueChange={v => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Denna vecka</SelectItem>
              <SelectItem value="month">Denna månad</SelectItem>
              <SelectItem value="3months">Senaste 3 mån</SelectItem>
              <SelectItem value="12months">Senaste 12 mån</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => toast.success('Rapport exporterad som PDF!')}>
            <Download className="h-3.5 w-3.5" />Exportera
          </Button>
          <Dialog open={sendOpen} onOpenChange={setSendOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-xl"><Send className="h-3.5 w-3.5" />Skicka rapport</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading">Skicka rapport</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Mottagare (e-post)</Label><Input value={sendEmail} onChange={e => setSendEmail(e.target.value)} placeholder="kund@foretag.se" /></div>
                <div><Label>Meddelande (valfritt)</Label><Textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)} placeholder="Hej! Här kommer er månadsrapport..." rows={3} /></div>
                <div>
                  <Label className="mb-2 block">Inkludera sektioner</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'kpi' as const, label: 'KPI-översikt' },
                      { key: 'services' as const, label: 'Tjänstefördelning' },
                      { key: 'customers' as const, label: 'Kundlista' },
                      { key: 'projects' as const, label: 'Projektöversikt' },
                      { key: 'invoices' as const, label: 'Faktureringsrapport' },
                    ].map(sec => (
                      <div key={sec.key} className="flex items-center gap-2">
                        <Checkbox checked={sendSections[sec.key]} onCheckedChange={c => setSendSections(prev => ({ ...prev, [sec.key]: !!c }))} />
                        <span className="text-sm">{sec.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border rounded-xl p-4 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Förhandsgranskning</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-sm overflow-hidden">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-white font-bold text-xs">{config.companyName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-heading font-bold">{config.companyName}</p>
                      <p className="text-[10px] text-muted-foreground">Månadsrapport - Maj 2026</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    {sendSections.kpi && <p>- KPI: {activeCustomers} aktiva kunder, {totalBudget.toLocaleString('sv-SE')} kr budget</p>}
                    {sendSections.services && <p>- {serviceDistribution.length} tjänster</p>}
                    {sendSections.customers && <p>- {filteredContacts.length} kunder</p>}
                    {sendSections.projects && <p>- {filteredProjects.length} projekt</p>}
                    {sendSections.invoices && <p>- {invoices.length} fakturor, {(totalRevenue / 1000).toFixed(0)}k kr betalt</p>}
                  </div>
                </div>
                <Button onClick={handleSendReport} className="w-full gap-1.5"><Send className="h-3.5 w-3.5" />Skicka</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Active filter indicator */}
      {selectedSeller !== 'all' && (
        <motion.div variants={item}>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl text-sm">
            <User className="h-4 w-4 text-primary" />
            <span>Filtrerar på säljare: <strong>{selectedSeller}</strong></span>
            <button onClick={() => setSelectedSeller('all')} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="h-3 w-3" /> Rensa filter
            </button>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total budget', value: `${(totalBudget / 1000).toFixed(0)}k kr`, icon: DollarSign, trend: `${totalPaidAmount > 0 ? (totalPaidAmount / 1000).toFixed(0) + 'k betalt' : activeCustomers + ' aktiva'}`, positive: true, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Kunder', value: activeCustomers, icon: Users, trend: `${totalCustomers} totalt`, positive: true, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
          { label: 'Vunna affärer', value: `${wonLeads.length} st`, icon: Target, trend: `${leadsWinRate}% vinst · ${(wonValue / 1000).toFixed(0)}k kr`, positive: leadsWinRate > 30, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { label: 'Leads i pipeline', value: `${filteredLeads.length} st`, icon: TrendingUp, trend: `${filteredLeads.filter(l => l.stage === 'offer' || l.stage === 'negotiation').length} pågående`, positive: true, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
        ].map(stat => (
          <motion.div key={stat.label} variants={item}>
            <Card className={`overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-br ${stat.color}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-heading font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.positive ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                      <span className="text-xs text-muted-foreground">{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.iconColor}`}><stat.icon className="h-5 w-5" /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tab navigation */}
      <motion.div variants={item} className="flex gap-2 border-b pb-3 overflow-x-auto">
        {[
          { key: 'overview' as const, label: 'Översikt', icon: PieChart },
          { key: 'sellers' as const, label: 'Säljare', icon: User },
          { key: 'customers' as const, label: 'Kunder', icon: Users },
          { key: 'projects' as const, label: 'Projekt', icon: BarChart3 },
          { key: 'invoices' as const, label: 'Fakturor', icon: FileText },
        ].map(tab => (
          <Button key={tab.key} variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm" className="gap-1.5 rounded-xl shrink-0"
            onClick={() => setActiveTab(tab.key)}>
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </Button>
        ))}
      </motion.div>

      {/* ───── OVERVIEW TAB ───── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue */}
            <motion.div variants={item}>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />Intäkter per månad
                  </h3>
                  <div className="space-y-2.5">
                    {monthlyRevenue.map((m, i) => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-8 text-muted-foreground">{m.month}</span>
                        <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden">
                          <motion.div className="h-full bg-primary/80 rounded-lg flex items-center justify-end pr-2"
                            initial={{ width: 0 }}
                            animate={{ width: `${(m.amount / maxRevenue) * 100}%` }}
                            transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}>
                            <span className="text-[10px] font-medium text-primary-foreground">{(m.amount / 1000).toFixed(0)}k</span>
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Service Distribution (Donut-like) */}
            <motion.div variants={item}>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />Tjänstefördelning
                  </h3>
                  {serviceDistribution.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Inga tjänster att visa</p>
                  ) : (
                    <div className="flex items-center gap-6">
                      <div className="relative w-32 h-32 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          {(() => {
                            let offset = 0;
                            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#14b8a6', '#6366f1', '#ec4899', '#06b6d4'];
                            return serviceDistribution.map(([service, data], i) => {
                              const pct = totalServiceBudget > 0 ? (data.budget / totalServiceBudget) * 100 : 0;
                              const dashArray = `${pct} ${100 - pct}`;
                              const el = (
                                <circle key={service} cx="18" cy="18" r="15.915" fill="none"
                                  stroke={colors[i % colors.length]} strokeWidth="3.5"
                                  strokeDasharray={dashArray} strokeDashoffset={`-${offset}`}
                                  className="transition-all duration-500" />
                              );
                              offset += pct;
                              return el;
                            });
                          })()}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-heading font-bold">{serviceDistribution.length}</span>
                          <span className="text-[10px] text-muted-foreground">tjänster</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {serviceDistribution.map(([service, data]) => {
                          const pct = totalServiceBudget > 0 ? Math.round((data.budget / totalServiceBudget) * 100) : 0;
                          const Icon = SERVICE_ICONS[service] || BarChart3;
                          return (
                            <div key={service} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-sm ${SERVICE_COLORS[service] || 'bg-gray-400'}`} />
                                <Icon className="h-3 w-3 text-muted-foreground" />
                                {service}
                              </span>
                              <span className="text-muted-foreground">{pct}% · {data.count} st</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Pipeline Funnel */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-4">
                <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />Pipeline-funnel (GetAccept)
                </h3>
                <div className="flex items-end gap-4 h-36">
                  {pipelineFunnel.map((stage, i) => (
                    <div key={stage.key} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-heading font-bold">{stage.count}</span>
                      <motion.div className={`w-full ${stage.color} rounded-t-lg`}
                        initial={{ height: 0 }}
                        animate={{ height: `${(stage.count / maxFunnel) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                        style={{ minHeight: stage.count > 0 ? '20px' : '4px' }}
                      />
                      <div className="text-center">
                        <span className="text-xs font-medium block">{stage.label}</span>
                        <span className="text-[10px] text-muted-foreground">{(stage.value / 1000).toFixed(0)}k kr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sales leads pipeline overview */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-4">
                <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />Säljtavla-pipeline
                </h3>
                {filteredLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Inga leads i pipeline</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {(['lead', 'contact', 'offer', 'negotiation', 'won', 'lost'] as const).map(stage => {
                      const stageLeads = filteredLeads.filter(l => l.stage === stage);
                      const stageValue = stageLeads.reduce((s, l) => {
                        if (l.services && l.services.length > 0) return s + l.services.reduce((ss, sv) => ss + (Number(sv.budget) || 0), 0);
                        return s + (l.value || 0);
                      }, 0);
                      return (
                        <div key={stage} className="text-center p-3 bg-muted/30 rounded-xl">
                          <Badge className={`text-[10px] border-0 mb-2 ${STAGE_COLORS[stage]}`}>{STAGE_LABELS[stage]}</Badge>
                          <p className="text-lg font-heading font-bold">{stageLeads.length}</p>
                          <p className="text-[10px] text-muted-foreground">{(stageValue / 1000).toFixed(0)}k kr</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ───── SELLERS TAB ───── */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          {sellerStats.length === 0 ? (
            <motion.div variants={item}>
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Inga säljare hittades. Tilldela säljare till kontakter och leads för att se statistik här.
                </CardContent>
              </Card>
            </motion.div>
          ) : sellerStats.map(seller => {
            const isExpanded = expandedSeller === seller.name;
            const sellerServices = Object.entries(seller.services).sort((a, b) => b[1].budget - a[1].budget);
            const totalSellerServiceBudget = sellerServices.reduce((s, [, d]) => s + d.budget, 0);
            const sellerWinRate = seller.leads > 0 ? Math.round((seller.wonLeads / seller.leads) * 100) : 0;

            return (
              <motion.div key={seller.name} variants={item}>
                <Card className={`overflow-hidden transition-shadow ${isExpanded ? 'shadow-md ring-1 ring-primary/20' : 'hover:shadow-md'}`}>
                  <CardContent className="p-0">
                    {/* Summary row — always visible */}
                    <button
                      className="w-full text-left p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedSeller(isExpanded ? null : seller.name)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">
                          {seller.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold truncate">{seller.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {seller.customers} kunder · {seller.leads} leads · {seller.projects} projekt
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-right shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground">Kundbudget</p>
                          <p className="text-sm font-heading font-bold">{(seller.totalBudget / 1000).toFixed(0)}k kr</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Vunnet</p>
                          <p className="text-sm font-heading font-bold text-emerald-600">{(seller.wonValue / 1000).toFixed(0)}k kr</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Vinst %</p>
                          <p className={`text-sm font-heading font-bold ${sellerWinRate >= 40 ? 'text-emerald-600' : sellerWinRate >= 20 ? 'text-amber-600' : 'text-red-500'}`}>
                            {sellerWinRate}%
                          </p>
                        </div>
                      </div>
                      <div className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ArrowDownRight className="h-4 w-4 rotate-45" />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3 space-y-4">
                        {/* KPI row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Aktiva kunder</p>
                            <p className="text-lg font-heading font-bold">{seller.activeCustomers}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total budget</p>
                            <p className="text-lg font-heading font-bold">{seller.totalBudget.toLocaleString('sv-SE')} kr</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vunna affärer</p>
                            <p className="text-lg font-heading font-bold text-emerald-600">{seller.wonLeads} st</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vunnet värde</p>
                            <p className="text-lg font-heading font-bold text-emerald-600">{seller.wonValue.toLocaleString('sv-SE')} kr</p>
                          </div>
                        </div>

                        {/* Services breakdown */}
                        <div>
                          <h4 className="font-heading font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Sålda tjänster</h4>
                          {sellerServices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Inga tjänster registrerade</p>
                          ) : (
                            <div className="space-y-2">
                              {sellerServices.map(([svc, data]) => {
                                const pct = totalSellerServiceBudget > 0 ? (data.budget / totalSellerServiceBudget) * 100 : 0;
                                return (
                                  <div key={svc} className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 w-32 shrink-0">
                                      <div className={`w-2.5 h-2.5 rounded-sm ${SERVICE_COLORS[svc] || 'bg-gray-400'}`} />
                                      <span className="text-sm truncate">{svc}</span>
                                    </div>
                                    <div className="flex-1 h-5 bg-muted/50 rounded-lg overflow-hidden">
                                      <motion.div
                                        className={`h-full rounded-lg ${SERVICE_COLORS[svc] || 'bg-gray-400'} opacity-80`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.5 }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                                      {data.count} st · {(data.budget / 1000).toFixed(0)}k kr
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Seller's customers list */}
                        <div>
                          <h4 className="font-heading font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Kunder</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Företag</th>
                                  <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Tjänst</th>
                                  <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Budget</th>
                                  <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {contacts.filter(c => c.seller?.trim() === seller.name).map(c => (
                                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-2 px-2 font-medium">{c.name}</td>
                                    <td className="py-2 px-2"><Badge variant="secondary" className="text-[10px]">{c.service}</Badge></td>
                                    <td className="py-2 px-2">{c.budget > 0 ? `${c.budget.toLocaleString('sv-SE')} kr` : '—'}</td>
                                    <td className="py-2 px-2"><StatusBadge status={c.status} /></td>
                                  </tr>
                                ))}
                                {contacts.filter(c => c.seller?.trim() === seller.name).length === 0 && (
                                  <tr><td colSpan={4} className="py-3 text-center text-xs text-muted-foreground">Inga kunder</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Seller's leads */}
                        {salesLeads.filter(l => l.assignee?.trim() === seller.name).length > 0 && (
                          <div>
                            <h4 className="font-heading font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider">Leads i pipeline</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b text-left">
                                    <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Företag</th>
                                    <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Tjänster</th>
                                    <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Värde</th>
                                    <th className="py-1.5 px-2 text-xs font-semibold text-muted-foreground">Steg</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {salesLeads.filter(l => l.assignee?.trim() === seller.name).map(l => {
                                    const leadVal = l.services && l.services.length > 0
                                      ? l.services.reduce((s, sv) => s + (Number(sv.budget) || 0), 0)
                                      : l.value || 0;
                                    return (
                                      <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2 px-2 font-medium">{l.company || l.title}</td>
                                        <td className="py-2 px-2">
                                          <div className="flex flex-wrap gap-1">
                                            {l.services && l.services.length > 0
                                              ? l.services.map(sv => (
                                                  <Badge key={sv.id} variant="secondary" className="text-[10px]">{sv.name}</Badge>
                                                ))
                                              : <span className="text-xs text-muted-foreground">—</span>
                                            }
                                          </div>
                                        </td>
                                        <td className="py-2 px-2 font-heading font-semibold">{leadVal.toLocaleString('sv-SE')} kr</td>
                                        <td className="py-2 px-2">
                                          <Badge className={`text-[10px] border-0 ${STAGE_COLORS[l.stage] || ''}`}>{STAGE_LABELS[l.stage] || l.stage}</Badge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Quick action: filter everything by this seller */}
                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-xl text-xs"
                            onClick={() => { setSelectedSeller(seller.name); setActiveTab('overview'); }}
                          >
                            <PieChart className="h-3 w-3" /> Visa fullständig rapport för {seller.name}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ───── CUSTOMERS TAB ───── */}
      {activeTab === 'customers' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-2">
              <h3 className="font-heading font-semibold text-sm mb-4">
                Kundrapport ({filteredContacts.length} kunder{selectedSeller !== 'all' ? ` · ${selectedSeller}` : ''})
              </h3>
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Inga kunder att visa</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Företag</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Säljare</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tjänst</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startdatum</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredContacts.map(c => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-medium">{c.name}</td>
                          <td className="py-2.5 px-3">
                            {c.seller ? (
                              <button
                                className="text-primary hover:underline text-sm"
                                onClick={() => { setSelectedSeller(c.seller); }}
                              >
                                {c.seller}
                              </button>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2.5 px-3"><Badge variant="secondary" className="text-[10px]">{c.service}</Badge></td>
                          <td className="py-2.5 px-3">{c.budget > 0 ? `${c.budget.toLocaleString('sv-SE')} kr` : '—'}</td>
                          <td className="py-2.5 px-3"><StatusBadge status={c.status} /></td>
                          <td className="py-2.5 px-3 text-muted-foreground">{c.startDate || '—'}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(star => (
                                <span key={star} className={`text-xs ${star <= c.rating ? 'text-amber-400' : 'text-muted-foreground/30'}`}>★</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ───── PROJECTS TAB ───── */}
      {activeTab === 'projects' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-2">
              <h3 className="font-heading font-semibold text-sm mb-4">
                Projektrapport ({filteredProjects.length} projekt{selectedSeller !== 'all' ? ` · ${selectedSeller}` : ''})
              </h3>
              {filteredProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Inga projekt att visa</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projekt</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Företag</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ansvarig</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spenderat</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredProjects.map(p => {
                        const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 font-medium">{p.name}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{p.client}</td>
                            <td className="py-2.5 px-3">{p.assignee || '—'}</td>
                            <td className="py-2.5 px-3"><StatusBadge status={p.status} /></td>
                            <td className="py-2.5 px-3">{p.budget.toLocaleString('sv-SE')} kr</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <Progress value={pct} className={`h-1.5 w-16 ${pct > 90 ? '[&>div]:bg-red-500' : ''}`} />
                                <span className={`text-xs ${pct > 90 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>{pct}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">{p.deadline}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ───── INVOICES TAB ───── */}
      {activeTab === 'invoices' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-2">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-heading font-semibold text-sm">Faktureringsrapport ({invoices.length} fakturor)</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Betalt: {(totalRevenue / 1000).toFixed(0)}k kr</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Utestående: {(totalOutstanding / 1000).toFixed(0)}k kr</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Förfallen: {(totalOverdue / 1000).toFixed(0)}k kr</span>
                </div>
              </div>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Inga fakturor att visa</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fakturanr</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kund</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Belopp</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Förfallodatum</th>
                        <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Källa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoices.map(inv => {
                        const statusColors: Record<string, string> = {
                          paid: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                          sent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                          draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                          overdue: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                          cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
                        };
                        const statusLabels: Record<string, string> = {
                          paid: 'Betald', sent: 'Skickad', draft: 'Utkast', overdue: 'Förfallen', cancelled: 'Makulerad',
                        };
                        return (
                          <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 font-medium font-mono text-xs">{inv.invoiceNumber}</td>
                            <td className="py-2.5 px-3">{inv.customerName}</td>
                            <td className="py-2.5 px-3 font-heading font-semibold">{inv.totalAmount.toLocaleString('sv-SE')} kr</td>
                            <td className="py-2.5 px-3">
                              <Badge className={`text-[10px] border-0 ${statusColors[inv.status] || ''}`}>{statusLabels[inv.status] || inv.status}</Badge>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">{inv.dueDate}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant="secondary" className="text-[10px]">{inv.sourceType === 'getaccept' ? 'GetAccept' : inv.sourceType === 'manual' ? 'Manuell' : 'Projekt'}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
