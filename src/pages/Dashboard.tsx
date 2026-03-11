import { FolderKanban, Clock, DollarSign, Users, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { mockProjects, mockTimeEntries } from '@/data/mockData';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);
  const todayHours = mockTimeEntries.filter(e => e.date === '2026-03-10').reduce((sum, e) => sum + e.hours, 0);
  const activeProjects = mockProjects.filter(p => p.status !== 'done').length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Översikt över dina marknadsföringsprojekt</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Aktiva Projekt" value={activeProjects} icon={FolderKanban} trend={{ value: 12, positive: true }} color="bg-accent text-accent-foreground" />
        <StatCard title="Timmar Idag" value={`${todayHours}h`} icon={Clock} subtitle="Av 8h mål" color="bg-status-working/15 text-status-working" />
        <StatCard title="Total Omsättning" value={`${(totalBudget / 1000).toFixed(0)}k kr`} icon={DollarSign} trend={{ value: 8, positive: true }} color="bg-status-done/15 text-status-done" />
        <StatCard title="Kunder" value={mockProjects.length} icon={Users} color="bg-status-pending/15 text-status-pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-heading font-semibold text-lg">Senaste Projekt</h2>
            <Link to="/projects" className="text-sm text-primary hover:underline font-medium">Visa alla</Link>
          </div>
          <div className="divide-y">
            {mockProjects.slice(0, 4).map((project) => (
              <div key={project.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <PriorityBadge priority={project.priority} />
                  <StatusBadge status={project.status} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Budget Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border shadow-sm p-5 space-y-5">
          <h2 className="font-heading font-semibold text-lg">Budgetöversikt</h2>
          {mockProjects.slice(0, 4).map((project) => {
            const pct = Math.round((project.spent / project.budget) * 100);
            return (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium truncate mr-2">{project.client}</span>
                  <span className="text-muted-foreground shrink-0">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Totalt spenderat</span>
              <span className="font-semibold">{(totalSpent / 1000).toFixed(0)}k / {(totalBudget / 1000).toFixed(0)}k kr</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Time Entries */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl border shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg">Senaste Tidregistreringar</h2>
          <Link to="/time" className="text-sm text-primary hover:underline font-medium">Visa alla</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Projekt</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Beskrivning</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Ansvarig</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Timmar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockTimeEntries.slice(0, 4).map(entry => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium">{entry.projectName}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{entry.description}</td>
                  <td className="px-5 py-3 text-sm">{entry.assignee}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold">{entry.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
