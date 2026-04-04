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
  Download, Send, FileText, Calendar, Filter, Target, Globe, Camera, CheckCircle2,
  Clock, Eye, Building2,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type DateRange = 'week' | 'month' | '3months' | '12months';
type ReportTab = 'overview' | 'customers' | 'projects' | 'invoices';

const SERVICE_COLORS: Record<string, string> = {
  'SEO': 'bg-emerald-500',
  'Google ADS': 'bg-blue-500',
  'META': 'bg-violet-500',
  'Film/Foto': 'bg-amber-500',
  'WEBB': 'bg-rose-500',
  'SEO + ADS': 'bg-teal-500',
  'ADS': 'bg-indigo-500',
};

const SERVICE_ICONS: Record<string, any> = {
  'SEO': TrendingUp,
  'Google ADS': Globe,
  'META': Target,
  'Film/Foto': Camera,
  'WEBB': Globe,
};

export default function Reports() {
  const { contacts } = useContacts();
  const { projects } = useProjects();
  const { deals } = useGetAccept();
  const { invoices, totalRevenue, totalOutstanding, totalOverdue } = useFortnox();
  const { config } = useWhiteLabel();

  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [sendOpen, setSendOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendSections, setSendSections] = useState({
    kpi: true, services: true, customers: true, projects: false, invoices: true,
  });

  // KPI calculations
  const activeCustomers = contacts.filter(c => c.status === 'active').length;
  const totalCustomers = contacts.length;
  const totalBudget = contacts.reduce((s, c) => s + c.budget, 0);
  const signedDeals = deals.filter(d => d.status === 'signed');
  const winRate = deals.length > 0 ? Math.round((signedDeals.length / deals.length) * 100) : 0;
  const avgDealValue = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length) : 0;
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPaidAmount = paidInvoices.reduce((s, i) => s + i.totalAmount, 0);

  // Service distribution
  const serviceDistribution = useMemo(() => {
    const dist: Record<string, { count: number; budget: number }> = {};
    contacts.forEach(c => {
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
  }, [contacts]);
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
    const base = totalBudget;
    return months.map((m, i) => ({
      month: m,
      amount: Math.round(base * (0.7 + Math.random() * 0.6) * (1 + i * 0.05)),
    }));
  }, [totalBudget]);
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.amount), 1);

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
        <div className="flex items-center gap-2">
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
                {/* Preview */}
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
                      <p className="text-[10px] text-muted-foreground">Månadsrapport - April 2026</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    {sendSections.kpi && <p>- KPI: {activeCustomers} aktiva kunder, {totalBudget.toLocaleString('sv-SE')} kr budget</p>}
                    {sendSections.services && <p>- {serviceDistribution.length} tjänster</p>}
                    {sendSections.customers && <p>- {contacts.length} kunder</p>}
                    {sendSections.projects && <p>- {projects.length} projekt</p>}
                    {sendSections.invoices && <p>- {invoices.length} fakturor, {(totalRevenue / 1000).toFixed(0)}k kr betalt</p>}
                  </div>
                </div>
                <Button onClick={handleSendReport} className="w-full gap-1.5"><Send className="h-3.5 w-3.5" />Skicka</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total intäkter', value: `${(totalPaidAmount / 1000).toFixed(0)}k kr`, icon: DollarSign, trend: '+12%', positive: true, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Aktiva kunder', value: activeCustomers, icon: Users, trend: `${totalCustomers} totalt`, positive: true, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
          { label: 'Konverteringsgrad', value: `${winRate}%`, icon: Target, trend: `${signedDeals.length} signerade`, positive: winRate > 30, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { label: 'Snitt ordervärde', value: `${(avgDealValue / 1000).toFixed(0)}k kr`, icon: TrendingUp, trend: `${deals.length} offerter`, positive: true, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
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
      <motion.div variants={item} className="flex gap-2 border-b pb-3">
        {[
          { key: 'overview' as const, label: 'Översikt', icon: PieChart },
          { key: 'customers' as const, label: 'Kunder', icon: Users },
          { key: 'projects' as const, label: 'Projekt', icon: BarChart3 },
          { key: 'invoices' as const, label: 'Fakturor', icon: FileText },
        ].map(tab => (
          <Button key={tab.key} variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm" className="gap-1.5 rounded-xl"
            onClick={() => setActiveTab(tab.key)}>
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </Button>
        ))}
      </motion.div>

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
                  <div className="flex items-center gap-6">
                    {/* Visual donut */}
                    <div className="relative w-32 h-32 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        {(() => {
                          let offset = 0;
                          const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#14b8a6', '#6366f1'];
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
                    {/* Legend */}
                    <div className="flex-1 space-y-2">
                      {serviceDistribution.map(([service, data], i) => {
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
        </div>
      )}

      {activeTab === 'customers' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-2">
              <h3 className="font-heading font-semibold text-sm mb-4">Kundrapport ({contacts.length} kunder)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Företag</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tjänst</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startdatum</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contacts.map(c => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{c.name}</td>
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'projects' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-2">
              <h3 className="font-heading font-semibold text-sm mb-4">Projektrapport ({projects.length} projekt)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projekt</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Företag</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spenderat</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projects.map(p => {
                      const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-medium">{p.name}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{p.client}</td>
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'invoices' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-sm">Faktureringsrapport ({invoices.length} fakturor)</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Betalt: {(totalRevenue / 1000).toFixed(0)}k kr</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Utestående: {(totalOutstanding / 1000).toFixed(0)}k kr</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Förfallen: {(totalOverdue / 1000).toFixed(0)}k kr</span>
                </div>
              </div>
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
                        paid: 'bg-emerald-100 text-emerald-600',
                        sent: 'bg-blue-100 text-blue-600',
                        draft: 'bg-gray-100 text-gray-600',
                        overdue: 'bg-red-100 text-red-600',
                        cancelled: 'bg-gray-100 text-gray-500',
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
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
