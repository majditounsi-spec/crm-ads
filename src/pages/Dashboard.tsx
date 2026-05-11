import { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban, Clock, DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
  Activity, Target, CheckCircle2, AlertCircle, BarChart3, Globe, Camera, Zap,
  MessageSquare, FileText, ArrowRight, Sparkles, Brain, AlertTriangle, CalendarClock,
  Hourglass, BellRing, ChevronRight, XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { mockTimeEntries, mockTasks } from '@/data/mockData';
import { useContacts } from '@/hooks/useContacts';
import { useProjects } from '@/hooks/useProjects';
import { useGetAccept } from '@/hooks/useGetAccept';
import { useFortnox } from '@/hooks/useFortnox';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import type { SalesLead } from '@/pages/SalesBoard';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round((value) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toLocaleString('sv-SE')}{suffix}</>;
}

// Service distribution for media agency
const SERVICE_ICONS: Record<string, any> = {
  'Google ADS': Globe,
  'META': Target,
  'SEO': TrendingUp,
  'WEBB': Globe,
  'Film/Foto': Camera,
};

export default function Dashboard() {
  const { contacts } = useContacts();
  const { projects } = useProjects();
  const { deals } = useGetAccept();
  const { invoices, totalRevenue, totalOutstanding } = useFortnox();

  const timeEntries = useMemo(() => {
    try {
      const raw = localStorage.getItem('marketflow_time_global');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return mockTimeEntries;
  }, []);

  const tasks = useMemo(() => {
    try {
      // Aggregate tasks from all projects
      const allTasks: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('marketflow_tasks_')) {
          const t = JSON.parse(localStorage.getItem(key) || '[]');
          allTasks.push(...t);
        }
      }
      if (allTasks.length > 0) return allTasks;
    } catch { /* ignore */ }
    return mockTasks;
  }, []);

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayHours = timeEntries.filter((e: any) => e.date === today).reduce((sum: number, e: any) => sum + e.hours, 0);
  const activeProjects = projects.filter(p => p.status !== 'done').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const activeContacts = contacts.filter(c => c.status === 'active').length;
  const totalContactBudget = contacts.reduce((s, c) => s + c.budget, 0);
  const signedDeals = deals.filter(d => d.status === 'signed').length;
  const pendingDeals = deals.filter(d => ['sent', 'viewed'].includes(d.status)).length;
  const winRate = deals.length > 0 ? Math.round((signedDeals / deals.length) * 100) : 0;

  // ── AI Forecasting (simulated based on pipeline data) ───────────
  const pipelineValue = useMemo(() => {
    const leads = contacts.filter(c => c.status === 'pending');
    const active = contacts.filter(c => c.status === 'active');
    const paused = contacts.filter(c => c.status === 'paused');

    const leadValue = leads.reduce((s, c) => s + c.budget, 0) * 0.25; // 25% probability
    const activeValue = active.reduce((s, c) => s + c.budget, 0); // 100%
    const pausedValue = paused.reduce((s, c) => s + c.budget, 0) * 0.5; // 50%

    return {
      confirmed: activeValue,
      likely: pausedValue,
      potential: leadValue,
      total: activeValue + pausedValue + leadValue,
      leadCount: leads.length,
      activeCount: active.length,
    };
  }, [contacts]);

  // Monthly forecast (simulated)
  const monthlyForecast = useMemo(() => {
    const months = ['Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep'];
    const baseRevenue = totalContactBudget;
    return months.map((month, i) => ({
      month,
      confirmed: Math.round(baseRevenue * (1 - i * 0.05)),
      forecast: Math.round(baseRevenue * (1 + i * 0.08) * (0.9 + Math.random() * 0.2)),
    }));
  }, [totalContactBudget]);

  const maxForecast = Math.max(...monthlyForecast.map(m => Math.max(m.confirmed, m.forecast)));

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

  // Load sales leads for stagnant lead alerts
  const salesLeads: SalesLead[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('marketflow_sales_leads');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  // ── Smart Alerts: computed from real data ──
  interface SmartAlert {
    id: string;
    type: 'deadline' | 'budget' | 'stagnant' | 'overdue' | 'blocked' | 'opportunity';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    link: string;
    icon: any;
  }

  const smartAlerts = useMemo(() => {
    const alerts: SmartAlert[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Deadline alerts
    projects.forEach(p => {
      if (p.status === 'done' || !p.deadline) return;
      const deadlineDate = new Date(p.deadline);
      const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        alerts.push({
          id: `deadline-overdue-${p.id}`,
          type: 'deadline',
          severity: 'critical',
          title: `${p.name} har passerat deadline`,
          description: `Deadline var ${p.deadline} (${Math.abs(daysLeft)} dagar sedan). Kund: ${p.client}`,
          link: `/projects/${p.id}`,
          icon: XCircle,
        });
      } else if (daysLeft <= 3) {
        alerts.push({
          id: `deadline-soon-${p.id}`,
          type: 'deadline',
          severity: 'critical',
          title: `${p.name} – deadline om ${daysLeft} dag${daysLeft !== 1 ? 'ar' : ''}`,
          description: `Deadline: ${p.deadline}. Status: ${p.status === 'working' ? 'Pågår' : p.status === 'stuck' ? 'Blockerad' : p.status}`,
          link: `/projects/${p.id}`,
          icon: CalendarClock,
        });
      } else if (daysLeft <= 7) {
        alerts.push({
          id: `deadline-week-${p.id}`,
          type: 'deadline',
          severity: 'warning',
          title: `${p.name} – deadline om ${daysLeft} dagar`,
          description: `Kund: ${p.client}. Ansvarig: ${p.assignee}`,
          link: `/projects/${p.id}`,
          icon: CalendarClock,
        });
      }
    });

    // Budget alerts
    projects.forEach(p => {
      if (p.status === 'done' || p.budget <= 0) return;
      const pct = Math.round((p.spent / p.budget) * 100);
      if (pct >= 100) {
        alerts.push({
          id: `budget-over-${p.id}`,
          type: 'budget',
          severity: 'critical',
          title: `${p.name} – budget överskriden`,
          description: `Spenderat ${p.spent.toLocaleString('sv-SE')} kr av ${p.budget.toLocaleString('sv-SE')} kr (${pct}%)`,
          link: `/projects/${p.id}`,
          icon: AlertTriangle,
        });
      } else if (pct >= 80) {
        alerts.push({
          id: `budget-warn-${p.id}`,
          type: 'budget',
          severity: 'warning',
          title: `${p.name} – ${pct}% av budget använd`,
          description: `${(p.budget - p.spent).toLocaleString('sv-SE')} kr kvar. Kund: ${p.client}`,
          link: `/projects/${p.id}`,
          icon: AlertTriangle,
        });
      }
    });

    // Blocked projects
    projects.forEach(p => {
      if (p.status === 'stuck') {
        alerts.push({
          id: `blocked-${p.id}`,
          type: 'blocked',
          severity: 'warning',
          title: `${p.name} är blockerat`,
          description: `Ansvarig: ${p.assignee}. Kund: ${p.client}`,
          link: `/projects/${p.id}`,
          icon: AlertCircle,
        });
      }
    });

    // Stagnant leads (no update in 14+ days)
    salesLeads.forEach(l => {
      if (l.stage === 'won' || l.stage === 'lost') return;
      const updated = new Date(l.updatedAt);
      const daysSinceUpdate = Math.ceil((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate >= 14) {
        alerts.push({
          id: `stagnant-${l.id}`,
          type: 'stagnant',
          severity: daysSinceUpdate >= 30 ? 'warning' : 'info',
          title: `${l.company} – lead inaktiv i ${daysSinceUpdate} dagar`,
          description: `Steg: ${l.stage === 'lead' ? 'Lead' : l.stage === 'contact' ? 'Kontaktad' : l.stage === 'offer' ? 'Offert' : 'Förhandling'}. Ansvarig: ${l.assignee}`,
          link: '/sales',
          icon: Hourglass,
        });
      }
    });

    // Overdue invoices
    invoices.forEach(inv => {
      if (inv.status === 'overdue') {
        alerts.push({
          id: `invoice-overdue-${inv.id}`,
          type: 'overdue',
          severity: 'critical',
          title: `Faktura ${inv.invoiceNumber} förfallen`,
          description: `${inv.customerName} – ${inv.totalAmount.toLocaleString('sv-SE')} kr. Förfallodag: ${inv.dueDate}`,
          link: '/sales',
          icon: FileText,
        });
      }
    });

    // Opportunity: contacts nearing end date
    contacts.forEach(c => {
      if (!c.endDate || c.status !== 'active') return;
      const endDate = new Date(c.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 30) {
        alerts.push({
          id: `opportunity-${c.id}`,
          type: 'opportunity',
          severity: 'info',
          title: `${c.name} – avtal löper ut om ${daysLeft} dagar`,
          description: `Tjänst: ${c.service}. Säljare: ${c.seller || '—'}. Möjlighet till förlängning/uppsäljning.`,
          link: '/contacts',
          icon: Sparkles,
        });
      }
    });

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [projects, salesLeads, invoices, contacts]);

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('marketflow_dismissed_alerts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const visibleAlerts = smartAlerts.filter(a => !dismissedAlerts.has(a.id));
  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('marketflow_dismissed_alerts', JSON.stringify([...next]));
      return next;
    });
  };

  const clearDismissed = () => {
    setDismissedAlerts(new Set());
    localStorage.removeItem('marketflow_dismissed_alerts');
  };

  // Activity stream (simulated)
  const activities = [
    { icon: CheckCircle2, text: 'SEO Kampanj - TechStart AB flyttad till Pågår', time: '2 min sedan', color: 'text-emerald-500' },
    { icon: DollarSign, text: 'Faktura skickad till Nordic Food (32 000 kr)', time: '15 min sedan', color: 'text-blue-500' },
    { icon: Users, text: 'Ny lead: DataVision AB', time: '1 timme sedan', color: 'text-violet-500' },
    { icon: AlertCircle, text: 'Budget varning: GreenEnergy (81%)', time: '2 timmar sedan', color: 'text-amber-500' },
    { icon: Camera, text: 'Film/Foto leverans klar - FashionBrand', time: '3 timmar sedan', color: 'text-violet-500' },
    { icon: TrendingUp, text: 'SEO ranking upp 5 positioner - HealthPlus', time: '4 timmar sedan', color: 'text-emerald-500' },
    { icon: Zap, text: 'Automation kördes: Välkomstflöde ny kund', time: '5 timmar sedan', color: 'text-amber-500' },
    { icon: MessageSquare, text: 'Ny Google-recension (5★) - TechStart AB', time: '6 timmar sedan', color: 'text-emerald-500' },
  ];

  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Välkommen tillbaka! Här är din mediabyrå-översikt.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: 'Aktiva Projekt', value: activeProjects, icon: FolderKanban, change: `${projects.length} totalt`, positive: true, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { title: 'Kunder', value: activeContacts, icon: Users, change: `${contacts.length} totalt`, positive: true, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
          { title: 'Månadsomsättning', value: totalContactBudget, suffix: ' kr', icon: DollarSign, change: '+12% prognos', positive: true, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Offerter', value: deals.reduce((s, d) => s + d.value, 0), suffix: ' kr', icon: TrendingUp, change: `${signedDeals} signerade · ${pendingDeals} väntande`, positive: winRate > 30, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
        ].map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow group">
              <CardContent className={`pt-5 pb-4 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                    <p className="text-lg sm:text-2xl font-heading font-bold mt-1">
                      <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {stat.positive ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                      <span className="text-xs text-muted-foreground">{stat.change}</span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.iconColor} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Smart Alerts */}
      {visibleAlerts.length > 0 && (
        <motion.div variants={item}>
          <Card className={`overflow-hidden ${criticalCount > 0 ? 'border-red-500/30 bg-gradient-to-r from-red-500/5 via-transparent to-amber-500/5' : 'border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5'}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${criticalCount > 0 ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    <BellRing className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-sm">Smart Alerts</h3>
                  <div className="flex gap-1.5">
                    {criticalCount > 0 && <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">{criticalCount} kritisk{criticalCount !== 1 ? 'a' : ''}</Badge>}
                    {warningCount > 0 && <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">{warningCount} varning{warningCount !== 1 ? 'ar' : ''}</Badge>}
                  </div>
                </div>
                {dismissedAlerts.size > 0 && (
                  <button onClick={clearDismissed} className="text-[10px] text-muted-foreground hover:text-foreground">
                    Visa avfärdade ({dismissedAlerts.size})
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {visibleAlerts.slice(0, 8).map(alert => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Link to={alert.link} className="block group">
                        <div className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-muted/50 ${
                          alert.severity === 'critical' ? 'bg-red-500/5' :
                          alert.severity === 'warning' ? 'bg-amber-500/5' : 'bg-blue-500/5'
                        }`}>
                          <alert.icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                            alert.severity === 'critical' ? 'text-red-500' :
                            alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">{alert.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissAlert(alert.id); }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Avfärda"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {visibleAlerts.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{visibleAlerts.length - 8} fler alerts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick sales summary */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/sales" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Betalt</p>
                  <p className="text-sm font-heading font-bold">{(totalRevenue / 1000).toFixed(0)}k kr</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/sales" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Utestående</p>
                  <p className="text-sm font-heading font-bold">{(totalOutstanding / 1000).toFixed(0)}k kr</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/getaccept" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
                  <p className="text-sm font-heading font-bold">{winRate}%</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/reports" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rapporter</p>
                  <p className="text-sm font-heading font-bold">Visa alla</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Forecast Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-sm">Intäktsprognos</h3>
                  <Badge variant="outline" className="text-[10px]">AI</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Bekräftat</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary/30" /> Prognos</span>
                </div>
              </div>
              <div className="flex items-end gap-3 h-40">
                {monthlyForecast.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
                      <motion.div
                        className="flex-1 bg-primary rounded-t-md"
                        initial={{ height: 0 }}
                        animate={{ height: `${(m.confirmed / maxForecast) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                      />
                      <motion.div
                        className="flex-1 bg-primary/25 rounded-t-md border border-primary/20 border-dashed"
                        initial={{ height: 0 }}
                        animate={{ height: `${(m.forecast / maxForecast) * 100}%` }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 0.6 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{m.month}</span>
                  </div>
                ))}
              </div>
              {/* Pipeline breakdown */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-heading font-bold text-emerald-600">{(pipelineValue.confirmed / 1000).toFixed(0)}k</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bekräftat</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-heading font-bold text-amber-600">{(pipelineValue.likely / 1000).toFixed(0)}k</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sannolikt</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-heading font-bold text-blue-600">{(pipelineValue.potential / 1000).toFixed(0)}k</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Potentiellt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Distribution */}
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-4">
              <h3 className="font-heading font-semibold text-sm mb-4">Tjänstefördelning</h3>
              <div className="space-y-3">
                {serviceDistribution.map(([service, data], i) => {
                  const pct = totalServiceBudget > 0 ? (data.budget / totalServiceBudget) * 100 : 0;
                  const Icon = SERVICE_ICONS[service] || BarChart3;
                  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'];
                  return (
                    <div key={service}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {service}
                        </span>
                        <span className="text-muted-foreground">{data.count} kunder · {(data.budget / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${colors[i % colors.length]}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                        />
                      </div>
                    </div>
                  );
                })}
                {serviceDistribution.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Inga tjänster registrerade</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status bar + Projects + Activity */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Projektstatus:</span>
              {[
                { status: 'working', label: 'Pågår', color: 'bg-[hsl(var(--status-working))]' },
                { status: 'review', label: 'Granskning', color: 'bg-[hsl(var(--status-review))]' },
                { status: 'pending', label: 'Väntande', color: 'bg-[hsl(var(--status-pending))]' },
                { status: 'stuck', label: 'Blockerad', color: 'bg-[hsl(var(--status-stuck))]' },
                { status: 'done', label: 'Klar', color: 'bg-[hsl(var(--status-done))]' },
              ].map(s => (
                <div key={s.status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${s.color}`} />
                  <span className="text-sm font-medium">{statusCounts[s.status] || 0}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-0.5">
              {[
                { status: 'working', color: 'bg-[hsl(var(--status-working))]' },
                { status: 'review', color: 'bg-[hsl(var(--status-review))]' },
                { status: 'pending', color: 'bg-[hsl(var(--status-pending))]' },
                { status: 'stuck', color: 'bg-[hsl(var(--status-stuck))]' },
                { status: 'done', color: 'bg-[hsl(var(--status-done))]' },
              ].map(s => {
                const count = statusCounts[s.status] || 0;
                const pct = projects.length > 0 ? (count / projects.length) * 100 : 0;
                return pct > 0 ? (
                  <motion.div key={s.status} className={`h-full rounded-sm ${s.color}`}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }} />
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <motion.div variants={item} className="lg:col-span-2 bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-heading font-semibold text-lg">Senaste Projekt</h2>
            <Link to="/projects" className="text-sm text-primary hover:underline font-medium">Visa alla</Link>
          </div>
          <div className="divide-y">
            {projects.slice(0, 5).map((project, i) => {
              const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="block">
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.client} · {project.assignee}</p>
                    </div>
                    <div className="w-24 shrink-0">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{pct}%</span>
                        <span>{(project.budget / 1000).toFixed(0)}k</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <StatusBadge status={project.status} />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Activity Stream */}
        <motion.div variants={item} className="bg-card rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm">Aktivitetsström</h3>
            <Link to="/activity" className="text-xs text-primary hover:underline font-medium">Visa alla</Link>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {activities.map((act, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                <act.icon className={`h-4 w-4 mt-0.5 shrink-0 ${act.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-relaxed">{act.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Budget + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm">Uppgifter</h3>
                <span className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} klara</span>
              </div>
              <Progress value={(completedTasks / totalTasks) * 100} className="h-3 rounded-full" />
              <div className="mt-4 space-y-2">
                {tasks.filter((t: any) => !t.completed).slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-4">
              <h3 className="font-heading font-semibold text-sm mb-3">Projektbudget</h3>
              {projects.slice(0, 5).map((project) => {
                const pct = Math.round((project.spent / project.budget) * 100);
                const overBudget = pct > 90;
                return (
                  <div key={project.id} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate mr-2">{project.client}</span>
                      <span className={`shrink-0 ${overBudget ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>{pct}%</span>
                    </div>
                    <Progress value={pct} className={`h-1.5 ${overBudget ? '[&>div]:bg-red-500' : ''}`} />
                  </div>
                );
              })}
              <div className="pt-3 border-t mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Totalt spenderat</span>
                  <span className="font-semibold">{(totalSpent / 1000).toFixed(0)}k / {(totalBudget / 1000).toFixed(0)}k kr</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
