import { useState, useMemo } from 'react';
import {
  Zap, Plus, Play, Pause, ArrowRight, Clock, CheckCircle2, XCircle, Trash2,
  Mail, Bell, MessageSquare, Calendar, DollarSign, Users, FileText, Camera,
  TrendingUp, Globe, Target, MousePointer, BarChart3, Send, Webhook, RefreshCw,
  Copy, GripVertical, ChevronDown, Filter, Search, MoreHorizontal, Sparkles,
} from 'lucide-react';
import { mockAutomations } from '@/data/mockData';
import { Automation } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ── Media Agency Specific Triggers & Actions ──────────────────────────

const triggerCategories = [
  {
    category: 'Kund & Affär',
    icon: Users,
    triggers: [
      { value: 'status_won', label: 'Affär vunnen (status → Aktiv)', icon: CheckCircle2, color: 'emerald' },
      { value: 'status_lost', label: 'Affär förlorad', icon: XCircle, color: 'red' },
      { value: 'new_lead', label: 'Ny lead skapad', icon: Users, color: 'blue' },
      { value: 'contract_ending', label: 'Avtal löper ut (30 dagar)', icon: Calendar, color: 'amber' },
      { value: 'rating_drop', label: 'Kundrating sjunker', icon: TrendingUp, color: 'red' },
    ],
  },
  {
    category: 'Budget & Ekonomi',
    icon: DollarSign,
    triggers: [
      { value: 'budget_80', label: 'Budget > 80% förbrukad', icon: DollarSign, color: 'amber' },
      { value: 'budget_exceeded', label: 'Budget överskridits', icon: XCircle, color: 'red' },
      { value: 'invoice_due', label: 'Faktura förfaller', icon: FileText, color: 'amber' },
      { value: 'ads_spend_spike', label: 'Google/Meta Ads spend ökar >20%', icon: TrendingUp, color: 'red' },
    ],
  },
  {
    category: 'Kampanj & Prestanda',
    icon: Target,
    triggers: [
      { value: 'ctr_drop', label: 'CTR sjunker under tröskelvärde', icon: MousePointer, color: 'red' },
      { value: 'conversion_goal', label: 'Konverteringsmål uppnått', icon: Target, color: 'emerald' },
      { value: 'campaign_ended', label: 'Kampanj avslutad', icon: BarChart3, color: 'blue' },
      { value: 'seo_ranking_change', label: 'SEO-ranking ändras', icon: Globe, color: 'violet' },
      { value: 'new_review', label: 'Ny Google-recension', icon: MessageSquare, color: 'amber' },
    ],
  },
  {
    category: 'Projekt & Uppgifter',
    icon: Calendar,
    triggers: [
      { value: 'deadline_near', label: 'Deadline om 3 dagar', icon: Calendar, color: 'amber' },
      { value: 'status_change', label: 'Projektstatus ändras', icon: RefreshCw, color: 'blue' },
      { value: 'task_completed', label: 'Alla uppgifter klara', icon: CheckCircle2, color: 'emerald' },
      { value: 'film_delivery', label: 'Film/Foto leverans klar', icon: Camera, color: 'violet' },
    ],
  },
];

const actionCategories = [
  {
    category: 'Kommunikation',
    icon: Send,
    actions: [
      { value: 'email_client', label: 'Skicka e-post till kund', icon: Mail, color: 'blue' },
      { value: 'email_team', label: 'Skicka e-post till team', icon: Mail, color: 'blue' },
      { value: 'slack_notify', label: 'Slack-notifikation', icon: MessageSquare, color: 'violet' },
      { value: 'sms', label: 'Skicka SMS', icon: Send, color: 'emerald' },
      { value: 'push', label: 'Push-notifikation', icon: Bell, color: 'amber' },
    ],
  },
  {
    category: 'CRM-åtgärder',
    icon: Users,
    actions: [
      { value: 'update_status', label: 'Uppdatera status', icon: RefreshCw, color: 'blue' },
      { value: 'create_task', label: 'Skapa uppgift', icon: Plus, color: 'emerald' },
      { value: 'assign_member', label: 'Tilldela teammedlem', icon: Users, color: 'violet' },
      { value: 'add_tag', label: 'Lägg till etikett', icon: FileText, color: 'amber' },
      { value: 'move_pipeline', label: 'Flytta i pipeline', icon: ArrowRight, color: 'blue' },
    ],
  },
  {
    category: 'Ekonomi & Dokument',
    icon: FileText,
    actions: [
      { value: 'create_invoice', label: 'Skapa faktura (Fortnox)', icon: FileText, color: 'emerald' },
      { value: 'generate_report', label: 'Generera rapport', icon: BarChart3, color: 'blue' },
      { value: 'pause_campaign', label: 'Pausa kampanj', icon: Pause, color: 'amber' },
      { value: 'adjust_budget', label: 'Justera budget', icon: DollarSign, color: 'red' },
    ],
  },
  {
    category: 'Integrationer',
    icon: Webhook,
    actions: [
      { value: 'webhook', label: 'Skicka webhook', icon: Webhook, color: 'violet' },
      { value: 'zapier', label: 'Trigga Zapier/Make', icon: Zap, color: 'amber' },
      { value: 'google_ads_adjust', label: 'Justera Google Ads budget', icon: Globe, color: 'blue' },
      { value: 'meta_ads_adjust', label: 'Justera Meta Ads budget', icon: Target, color: 'blue' },
    ],
  },
];

// Flatten for quick lookup
const allTriggers = triggerCategories.flatMap(c => c.triggers);
const allActions = actionCategories.flatMap(c => c.actions);

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  red: 'bg-red-500/10 text-red-600 border-red-500/20',
};

// ── Workflow builder templates (pre-built for media agencies) ─────────

const workflowTemplates = [
  {
    name: 'Välkomstflöde ny kund',
    description: 'När en affär vinns: skapa faktura, skicka välkomstmejl och Slack-notis',
    triggers: ['status_won'],
    actions: ['create_invoice', 'email_client', 'slack_notify'],
    category: 'Onboarding',
  },
  {
    name: 'Budgetvarning',
    description: 'Notifiera teamet och pausa kampanjer vid budgetöverskridning',
    triggers: ['budget_80'],
    actions: ['push', 'email_team'],
    category: 'Budget',
  },
  {
    name: 'Kampanjrapport',
    description: 'Generera och skicka rapport när en kampanj avslutas',
    triggers: ['campaign_ended'],
    actions: ['generate_report', 'email_client'],
    category: 'Rapportering',
  },
  {
    name: 'Uppsäljning vid avtalslut',
    description: 'Skicka förnyelse-erbjudande 30 dagar innan avtalet löper ut',
    triggers: ['contract_ending'],
    actions: ['email_client', 'create_task', 'slack_notify'],
    category: 'Retention',
  },
  {
    name: 'SEO-ranking alert',
    description: 'Notifiera SEO-teamet vid ranking-förändringar',
    triggers: ['seo_ranking_change'],
    actions: ['slack_notify', 'create_task'],
    category: 'SEO',
  },
  {
    name: 'Film/Foto leveransflöde',
    description: 'Skicka leveranslänk till kund och skapa faktura',
    triggers: ['film_delivery'],
    actions: ['email_client', 'create_invoice'],
    category: 'Produktion',
  },
];

function formatSwedishDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

interface WorkflowStep {
  type: 'trigger' | 'action';
  value: string;
  delay?: string; // e.g. "5 min", "1 timme", "1 dag"
}

interface ExtendedAutomation extends Automation {
  steps?: WorkflowStep[];
  description?: string;
  category?: string;
  runCount?: number;
}

export default function Automations() {
  const [automations, setAutomations] = useState<ExtendedAutomation[]>(
    mockAutomations.map(a => ({
      ...a,
      steps: [
        { type: 'trigger' as const, value: '' },
        { type: 'action' as const, value: '' },
      ],
      runCount: Math.floor(Math.random() * 50) + 1,
      category: 'Anpassad',
    }))
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<'template' | 'custom'>('template');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Builder state
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderSteps, setBuilderSteps] = useState<WorkflowStep[]>([
    { type: 'trigger', value: '' },
    { type: 'action', value: '' },
  ]);

  const toggleActive = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
    const auto = automations.find(a => a.id === id);
    toast.success(auto?.active ? 'Automation pausad' : 'Automation aktiverad');
  };

  const deleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Automation borttagen');
  };

  const runAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? {
      ...a,
      lastRun: new Date().toISOString().split('T')[0],
      runCount: (a.runCount || 0) + 1,
    } : a));
    toast.success('Automation körd manuellt!');
  };

  const duplicateAutomation = (auto: ExtendedAutomation) => {
    const dup: ExtendedAutomation = {
      ...auto,
      id: String(Date.now()),
      name: `${auto.name} (kopia)`,
      lastRun: undefined,
      runCount: 0,
    };
    setAutomations(prev => [dup, ...prev]);
    toast.success('Automation duplicerad');
  };

  const addBuilderStep = () => {
    setBuilderSteps(prev => [...prev, { type: 'action', value: '', delay: '' }]);
  };

  const removeBuilderStep = (idx: number) => {
    if (builderSteps.length <= 2) return;
    setBuilderSteps(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBuilderStep = (idx: number, updates: Partial<WorkflowStep>) => {
    setBuilderSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const createFromTemplate = (template: typeof workflowTemplates[0]) => {
    const steps: WorkflowStep[] = [
      ...template.triggers.map(t => ({ type: 'trigger' as const, value: t })),
      ...template.actions.map(a => ({ type: 'action' as const, value: a })),
    ];
    const triggerLabels = template.triggers.map(t => allTriggers.find(x => x.value === t)?.label || t).join(' + ');
    const actionLabels = template.actions.map(a => allActions.find(x => x.value === a)?.label || a).join(' → ');

    const auto: ExtendedAutomation = {
      id: String(Date.now()),
      name: template.name,
      description: template.description,
      trigger: triggerLabels,
      action: actionLabels,
      active: true,
      steps,
      category: template.category,
      runCount: 0,
    };
    setAutomations(prev => [auto, ...prev]);
    setDialogOpen(false);
    toast.success(`"${template.name}" skapad!`);
  };

  const handleCreate = () => {
    if (!builderName) { toast.error('Fyll i ett namn'); return; }
    const triggers = builderSteps.filter(s => s.type === 'trigger' && s.value);
    const actions = builderSteps.filter(s => s.type === 'action' && s.value);
    if (triggers.length === 0 || actions.length === 0) {
      toast.error('Lägg till minst en trigger och en åtgärd');
      return;
    }

    const triggerLabel = triggers.map(t => allTriggers.find(x => x.value === t.value)?.label || t.value).join(' + ');
    const actionLabel = actions.map(a => allActions.find(x => x.value === a.value)?.label || a.value).join(' → ');

    const auto: ExtendedAutomation = {
      id: String(Date.now()),
      name: builderName,
      description: builderDesc,
      trigger: triggerLabel,
      action: actionLabel,
      active: true,
      steps: builderSteps,
      category: 'Anpassad',
      runCount: 0,
    };
    setAutomations(prev => [auto, ...prev]);
    setDialogOpen(false);
    setBuilderName('');
    setBuilderDesc('');
    setBuilderSteps([{ type: 'trigger', value: '' }, { type: 'action', value: '' }]);
    toast.success('Automation skapad!');
  };

  const filtered = automations.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.trigger.toLowerCase().includes(search.toLowerCase()) ||
      a.action.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const active = automations.filter(a => a.active).length;
  const total = automations.length;
  const totalRuns = automations.reduce((s, a) => s + (a.runCount || 0), 0);
  const categories = [...new Set(automations.map(a => a.category).filter(Boolean))];

  const getTriggerMeta = (triggerStr: string) => {
    const found = allTriggers.find(t => t.label === triggerStr || triggerStr.includes(t.label));
    return found || { icon: Zap, color: 'violet', label: triggerStr };
  };

  const getActionMeta = (actionStr: string) => {
    const found = allActions.find(a => a.label === actionStr || actionStr.includes(a.label));
    return found || { icon: Zap, color: 'blue', label: actionStr };
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Automationer</h1>
          <p className="text-muted-foreground">{active} aktiva · {totalRuns} körningar totalt</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Sparkles className="h-4 w-4" /> Ny Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Skapa automation</DialogTitle>
            </DialogHeader>

            {/* Mode toggle */}
            <div className="flex gap-2 border-b pb-3">
              <Button variant={builderMode === 'template' ? 'default' : 'outline'} size="sm" className="rounded-lg"
                onClick={() => setBuilderMode('template')}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Mallar
              </Button>
              <Button variant={builderMode === 'custom' ? 'default' : 'outline'} size="sm" className="rounded-lg"
                onClick={() => setBuilderMode('custom')}>
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Bygg egen
              </Button>
            </div>

            {builderMode === 'template' ? (
              <div className="grid gap-3 pt-2">
                {workflowTemplates.map((tpl, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer group"
                    onClick={() => createFromTemplate(tpl)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{tpl.name}</h4>
                          <Badge variant="outline" className="text-[10px] px-1.5">{tpl.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                        {/* Visual workflow preview */}
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {tpl.triggers.map(t => {
                            const meta = allTriggers.find(x => x.value === t);
                            const Icon = meta?.icon || Zap;
                            return (
                              <div key={t} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${colorMap[meta?.color || 'blue']}`}>
                                <Icon className="h-3 w-3" />{meta?.label || t}
                              </div>
                            );
                          })}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          {tpl.actions.map(a => {
                            const meta = allActions.find(x => x.value === a);
                            const Icon = meta?.icon || Zap;
                            return (
                              <div key={a} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${colorMap[meta?.color || 'violet']}`}>
                                <Icon className="h-3 w-3" />{meta?.label || a}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Använd
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Namn</Label>
                    <Input value={builderName} onChange={e => setBuilderName(e.target.value)}
                      placeholder="T.ex. Välkomstflöde ny kund" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Beskrivning</Label>
                    <Input value={builderDesc} onChange={e => setBuilderDesc(e.target.value)}
                      placeholder="Kort beskrivning..." className="mt-1" />
                  </div>
                </div>

                {/* Visual workflow builder */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Workflow</Label>
                  <div className="space-y-2">
                    {builderSteps.map((step, idx) => (
                      <div key={idx}>
                        {idx > 0 && (
                          <div className="flex items-center gap-2 py-1 pl-6">
                            <div className="w-px h-4 bg-border" />
                            {step.type === 'action' && idx > 1 && (
                              <Input placeholder="Fördröjning (t.ex. 5 min)" value={step.delay || ''}
                                onChange={e => updateBuilderStep(idx, { delay: e.target.value })}
                                className="h-7 w-40 text-xs" />
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-8 rounded-full shrink-0 ${step.type === 'trigger' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${step.type === 'trigger' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-violet-500/10 text-violet-600 border-violet-500/20'}`}>
                            {step.type === 'trigger' ? 'NÄR' : 'GÖR'}
                          </Badge>
                          <Select value={step.value} onValueChange={v => updateBuilderStep(idx, { value: v })}>
                            <SelectTrigger className="flex-1 h-9 text-sm">
                              <SelectValue placeholder={step.type === 'trigger' ? 'Välj trigger...' : 'Välj åtgärd...'} />
                            </SelectTrigger>
                            <SelectContent>
                              {(step.type === 'trigger' ? triggerCategories : actionCategories).map(cat => (
                                <div key={cat.category}>
                                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cat.category}</div>
                                  {(step.type === 'trigger' ? cat.triggers : (cat as typeof actionCategories[0]).actions).map((opt: any) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      <span className="flex items-center gap-2">
                                        <opt.icon className="h-3.5 w-3.5" />{opt.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                          {builderSteps.length > 2 && idx > 0 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                              onClick={() => removeBuilderStep(idx)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" className="mt-3 gap-1.5 rounded-lg" onClick={addBuilderStep}>
                    <Plus className="h-3.5 w-3.5" /> Lägg till steg
                  </Button>
                </div>

                <Button onClick={handleCreate} className="w-full rounded-xl">
                  <Zap className="h-4 w-4 mr-2" /> Skapa Automation
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: 'Aktiva', value: active, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10', icon: Play },
          { title: 'Pausade', value: total - active, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10', icon: Pause },
          { title: 'Totala körningar', value: totalRuns, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10', icon: RefreshCw },
          { title: 'Mallar', value: workflowTemplates.length, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10', icon: Sparkles },
        ].map(stat => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={`pt-4 pb-3 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                    <p className="text-xl font-heading font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.iconColor}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <motion.div variants={item} className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök automation..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Alla kategorier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kategorier</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c!}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} automationer</span>
      </motion.div>

      {/* Automation Cards */}
      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((auto) => {
            const triggerMeta = getTriggerMeta(auto.trigger);
            const actionMeta = getActionMeta(auto.action);
            const TriggerIcon = triggerMeta.icon || Zap;
            const ActionIcon = actionMeta.icon || Zap;
            const triggerColor = colorMap[(triggerMeta as any).color || 'blue'];
            const actionColor = colorMap[(actionMeta as any).color || 'violet'];

            return (
              <motion.div key={auto.id} layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md group ${!auto.active ? 'opacity-50' : ''}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl shrink-0 ${auto.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-sm">{auto.name}</p>
                          {auto.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5 h-4">{auto.category}</Badge>
                          )}
                          {auto.active ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Aktiv</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Pausad</span>
                          )}
                        </div>
                        {auto.description && (
                          <p className="text-xs text-muted-foreground mt-1">{auto.description}</p>
                        )}

                        {/* Visual workflow */}
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {auto.trigger.split(' + ').map((t, i) => (
                            <div key={i} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${triggerColor}`}>
                              <TriggerIcon className="h-3 w-3" />{t.trim()}
                            </div>
                          ))}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {auto.action.split(' → ').map((a, i) => (
                            <div key={i} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${actionColor}`}>
                              <ActionIcon className="h-3 w-3" />{a.trim()}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          {auto.lastRun && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Senast: {formatSwedishDate(auto.lastRun)}
                            </p>
                          )}
                          {auto.runCount != null && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" /> {auto.runCount} körningar
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => runAutomation(auto.id)}>
                        <Play className="h-3 w-3 mr-1" />Kör
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => duplicateAutomation(auto)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Switch checked={auto.active} onCheckedChange={() => toggleActive(auto.id)} />
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteAutomation(auto.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div variants={item} className="text-center py-16">
          <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg">Inga automationer hittades</h3>
          <p className="text-muted-foreground text-sm mt-1">Skapa din första automation eller använd en mall.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
