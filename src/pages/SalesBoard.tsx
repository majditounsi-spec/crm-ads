import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useContacts } from '@/hooks/useContacts';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriorityBadge } from '@/components/PriorityBadge';
import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, Target, Calendar, ArrowRight, Search, Filter, ExternalLink, Phone, Mail } from 'lucide-react';
import { ProjectStatus } from '@/types/crm';

const pipelineStages = [
  { key: 'lead', label: 'Lead', color: 'bg-blue-500', lightColor: 'bg-blue-500/10 text-blue-600' },
  { key: 'proposal', label: 'Offert', color: 'bg-amber-500', lightColor: 'bg-amber-500/10 text-amber-600' },
  { key: 'active', label: 'Aktiv', color: 'bg-emerald-500', lightColor: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'closed', label: 'Avslutad', color: 'bg-violet-500', lightColor: 'bg-violet-500/10 text-violet-600' },
];

function mapStatusToStage(status: string): string {
  if (status === 'pending') return 'lead';
  if (status === 'working' || status === 'review') return 'active';
  if (status === 'done') return 'closed';
  if (status === 'stuck') return 'proposal';
  return 'lead';
}

function mapContactStatusToStage(status: string): string {
  if (status === 'pending') return 'lead';
  if (status === 'active') return 'active';
  if (status === 'paused') return 'proposal';
  if (status === 'completed') return 'closed';
  return 'lead';
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function SalesBoard() {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { contacts } = useContacts();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline');

  // Combine projects and contacts into deals
  type Deal = {
    id: string;
    name: string;
    client: string;
    value: number;
    stage: string;
    assignee: string;
    deadline: string;
    type: 'project' | 'contact';
    status: string;
    priority?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    service?: string;
    website?: string;
    spent?: number;
  };

  const deals: Deal[] = [
    ...projects.map(p => ({
      id: `p-${p.id}`,
      name: p.name,
      client: p.client,
      value: p.budget,
      stage: mapStatusToStage(p.status),
      assignee: p.assignee,
      deadline: p.deadline,
      type: 'project' as const,
      status: p.status,
      priority: p.priority,
      spent: p.spent,
    })),
    ...contacts.map(c => ({
      id: `c-${c.id}`,
      name: c.name,
      client: c.name,
      value: c.budget,
      stage: mapContactStatusToStage(c.status),
      assignee: c.seller,
      deadline: c.endDate,
      type: 'contact' as const,
      status: c.status,
      contactPerson: c.contactPerson,
      phone: c.phone,
      email: c.emails?.[0],
      service: c.service,
      website: c.website,
    })),
  ];

  const filteredDeals = deals.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.client.toLowerCase().includes(search.toLowerCase()) ||
    d.assignee.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const activeValue = deals.filter(d => d.stage === 'active').reduce((s, d) => s + d.value, 0);
  const leadValue = deals.filter(d => d.stage === 'lead').reduce((s, d) => s + d.value, 0);
  const closedValue = deals.filter(d => d.stage === 'closed').reduce((s, d) => s + d.value, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Säljtavla</h1>
          <p className="text-muted-foreground">{deals.length} affärer i pipeline · {(totalValue / 1000).toFixed(0)}k kr totalt värde</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl border bg-muted/50 p-0.5">
            <Button variant={view === 'pipeline' ? 'default' : 'ghost'} size="sm" className={`h-7 px-3 rounded-lg text-xs ${view === 'pipeline' ? 'bg-gradient-to-r from-primary to-violet-600 text-white' : ''}`} onClick={() => setView('pipeline')}>Pipeline</Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className={`h-7 px-3 rounded-lg text-xs ${view === 'list' ? 'bg-gradient-to-r from-primary to-violet-600 text-white' : ''}`} onClick={() => setView('list')}>Lista</Button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'Pipeline-värde', value: `${(totalValue / 1000).toFixed(0)}k kr`, icon: DollarSign, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { title: 'Leads', value: `${(leadValue / 1000).toFixed(0)}k kr`, icon: Target, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
          { title: 'Aktiva', value: `${(activeValue / 1000).toFixed(0)}k kr`, icon: TrendingUp, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Stängda', value: `${(closedValue / 1000).toFixed(0)}k kr`, icon: Users, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
        ].map(stat => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={`pt-4 pb-3 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                    <p className="text-xl font-heading font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.iconColor}`}><stat.icon className="h-4 w-4" /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pipeline bar */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              {pipelineStages.map(stage => {
                const count = filteredDeals.filter(d => d.stage === stage.key).length;
                const value = filteredDeals.filter(d => d.stage === stage.key).reduce((s, d) => s + d.value, 0);
                return (
                  <div key={stage.key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${stage.color}`} />
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">{stage.label} ({(value / 1000).toFixed(0)}k)</span>
                  </div>
                );
              })}
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {pipelineStages.map(stage => {
                const value = filteredDeals.filter(d => d.stage === stage.key).reduce((s, d) => s + d.value, 0);
                const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
                return pct > 0 ? (
                  <motion.div key={stage.key} className={`h-full rounded-sm ${stage.color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Sök affär, kund, ansvarig..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </motion.div>

      {view === 'pipeline' ? (
        /* ========== PIPELINE VIEW ========== */
        <motion.div variants={item} className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.key);
            const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <div key={stage.key} className="min-w-[260px] w-[260px] sm:min-w-[300px] sm:w-[300px] shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${stage.color}`} />
                    <span className="font-heading font-semibold text-sm">{stage.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stageDeals.length}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{(stageValue / 1000).toFixed(0)}k kr</span>
                </div>
                <div className="space-y-2.5">
                  {stageDeals.map((deal, i) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="kanban-card bg-card rounded-xl border p-4 cursor-pointer group"
                      onClick={() => {
                        if (deal.type === 'project') navigate(`/projects/${deal.id.slice(2)}`);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{deal.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{deal.client}</p>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${deal.type === 'project' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {deal.type === 'project' ? 'Projekt' : 'Kund'}
                        </Badge>
                      </div>

                      {deal.service && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {deal.service.split(/\s*[\+\,]\s*/).map(s => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground font-medium">{s.trim()}</span>
                          ))}
                        </div>
                      )}

                      {deal.priority && <div className="mt-2"><PriorityBadge priority={deal.priority as any} /></div>}

                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-heading font-bold text-sm">{deal.value.toLocaleString('sv-SE')} kr</span>
                        {deal.spent !== undefined && deal.value > 0 && (
                          <span className="text-[10px] text-muted-foreground">{Math.round((deal.spent / deal.value) * 100)}% spenderat</span>
                        )}
                      </div>

                      {deal.spent !== undefined && deal.value > 0 && (
                        <Progress value={Math.round((deal.spent / deal.value) * 100)} className="h-1.5 mt-1.5" />
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-3 w-3 text-primary" /></div>
                          {deal.assignee || '—'}
                        </div>
                        {deal.deadline && (
                          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{deal.deadline}</div>
                        )}
                      </div>

                      {(deal.phone || deal.email || deal.website) && (
                        <div className="flex gap-2 mt-2 pt-2 border-t" onClick={e => e.stopPropagation()}>
                          {deal.phone && (
                            <a href={`tel:${deal.phone}`} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"><Phone className="h-3 w-3" />{deal.phone}</a>
                          )}
                          {deal.email && (
                            <a href={`mailto:${deal.email}`} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"><Mail className="h-3 w-3" />Mail</a>
                          )}
                          {deal.website && (
                            <a href={deal.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"><ExternalLink className="h-3 w-3" />Webb</a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">Inga affärer</div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        /* ========== LIST VIEW ========== */
        <motion.div variants={item} className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Affär</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Typ</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Steg</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Värde</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Ansvarig</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Kontakt</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDeals.map((deal, i) => {
                  const stage = pipelineStages.find(s => s.key === deal.stage);
                  return (
                    <motion.tr
                      key={deal.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="monday-row cursor-pointer"
                      onClick={() => { if (deal.type === 'project') navigate(`/projects/${deal.id.slice(2)}`); }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{deal.name}</p>
                        <p className="text-xs text-muted-foreground">{deal.client}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary" className={`text-[10px] ${deal.type === 'project' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {deal.type === 'project' ? 'Projekt' : 'Kund'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${stage?.lightColor}`}>{stage?.label}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-heading font-bold text-sm">{deal.value.toLocaleString('sv-SE')} kr</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{deal.assignee || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          {deal.phone && <a href={`tel:${deal.phone}`} className="text-muted-foreground hover:text-primary"><Phone className="h-3.5 w-3.5" /></a>}
                          {deal.email && <a href={`mailto:${deal.email}`} className="text-muted-foreground hover:text-primary"><Mail className="h-3.5 w-3.5" /></a>}
                          {deal.website && <a href={deal.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="h-3.5 w-3.5" /></a>}
                          {!deal.phone && !deal.email && !deal.website && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{deal.deadline || '—'}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
