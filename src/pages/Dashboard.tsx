import { useState, useEffect } from 'react';
import { FolderKanban, Clock, DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { mockProjects, mockTimeEntries, mockTasks } from '@/data/mockData';
import { useContacts } from '@/hooks/useContacts';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
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
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toLocaleString('sv-SE')}{suffix}</>;
}

export default function Dashboard() {
  const { contacts } = useContacts();
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);
  const todayHours = mockTimeEntries.filter(e => e.date === '2026-03-10').reduce((sum, e) => sum + e.hours, 0);
  const activeProjects = mockProjects.filter(p => p.status !== 'done').length;
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(t => t.completed).length;
  const activeContacts = contacts.filter(c => c.status === 'active').length;
  const totalContactBudget = contacts.reduce((s, c) => s + c.budget, 0);

  const statusCounts = mockProjects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Välkommen tillbaka! Här är din översikt.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Aktiva Projekt', value: activeProjects, icon: FolderKanban, change: '+2 denna vecka', positive: true, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { title: 'Kunder', value: activeContacts, icon: Users, change: `${contacts.length} totalt`, positive: true, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
          { title: 'Omsättning', value: totalContactBudget, suffix: ' kr', icon: DollarSign, change: '+8% vs förra mån', positive: true, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Timmar Idag', value: todayHours, suffix: 'h', icon: Clock, change: 'Av 8h mål', positive: todayHours >= 6, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
        ].map((stat, i) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow group">
              <CardContent className={`pt-5 pb-4 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-heading font-bold mt-1">
                      <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {stat.positive ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
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

      {/* Status overview bar */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-6 flex-wrap">
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
            {/* Visual bar */}
            <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-0.5">
              {[
                { status: 'working', color: 'bg-[hsl(var(--status-working))]' },
                { status: 'review', color: 'bg-[hsl(var(--status-review))]' },
                { status: 'pending', color: 'bg-[hsl(var(--status-pending))]' },
                { status: 'stuck', color: 'bg-[hsl(var(--status-stuck))]' },
                { status: 'done', color: 'bg-[hsl(var(--status-done))]' },
              ].map(s => {
                const count = statusCounts[s.status] || 0;
                const pct = (count / mockProjects.length) * 100;
                return pct > 0 ? (
                  <motion.div
                    key={s.status}
                    className={`h-full rounded-sm ${s.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
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
            {mockProjects.slice(0, 5).map((project, i) => {
              const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="block">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group"
                  >
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
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={project.status} />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Tasks & Activity */}
        <motion.div variants={item} className="space-y-4">
          {/* Task progress */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm">Uppgifter</h3>
                <span className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} klara</span>
              </div>
              <div className="relative pt-1">
                <Progress value={(completedTasks / totalTasks) * 100} className="h-3 rounded-full" />
              </div>
              <div className="mt-4 space-y-2">
                {mockTasks.filter(t => !t.completed).slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <h3 className="font-heading font-semibold text-sm mb-3">Budgetöversikt</h3>
              {mockProjects.slice(0, 4).map((project) => {
                const pct = Math.round((project.spent / project.budget) * 100);
                const overBudget = pct > 90;
                return (
                  <div key={project.id} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate mr-2">{project.client}</span>
                      <span className={`shrink-0 ${overBudget ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                        {pct}%
                      </span>
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

      {/* Recent Time Entries */}
      <motion.div variants={item} className="bg-card rounded-xl border shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg">Senaste Tidregistreringar</h2>
          <Link to="/time" className="text-sm text-primary hover:underline font-medium">Visa alla</Link>
        </div>
        <div className="divide-y">
          {mockTimeEntries.slice(0, 4).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-primary/30" />
                <div>
                  <p className="text-sm font-medium">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">{entry.projectName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{entry.date}</span>
                <span className="text-xs text-muted-foreground">{entry.assignee}</span>
                <span className="font-heading font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-md">{entry.hours}h</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
