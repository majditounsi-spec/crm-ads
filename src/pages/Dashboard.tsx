import { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban, Clock, DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
  Activity, Target, CheckCircle2, AlertCircle, BarChart3, Globe, Camera, Zap,
  MessageSquare, FileText, ArrowRight, Sparkles, Brain,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { mockTimeEntries, mockTasks } from '@/data/mockData';
import { useContacts } from '@/hooks/useContacts';
import { useProjects } from '@/hooks/useProjects';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

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

  // AI Insights
  const insights = [
    { type: 'opportunity', text: 'Nordic Food kan vara redo för uppsäljning av Meta Ads - kontraktet löper ut om 30 dagar', confidence: 85 },
    { type: 'risk', text: 'GreenEnergy har överskridit 80% av budget med 40% arbete kvar', confidence: 92 },
    { type: 'forecast', text: 'Baserat på pipeline förväntas intäkterna öka 12% nästa kvartal', confidence: 74 },
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
          { title: 'Pipeline', value: pipelineValue.total, suffix: ' kr', icon: TrendingUp, change: `${pipelineValue.leadCount} leads`, positive: true, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
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

      {/* AI Insights Banner */}
      <motion.div variants={item}>
        <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-transparent to-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <Brain className="h-4 w-4 text-violet-500" />
              </div>
              <h3 className="font-heading font-semibold text-sm">AI Insikter</h3>
              <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20">Beta</Badge>
            </div>
            <div className="grid gap-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    insight.type === 'opportunity' ? 'bg-emerald-500' :
                    insight.type === 'risk' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-muted-foreground flex-1">{insight.text}</span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">{insight.confidence}% konfidens</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
