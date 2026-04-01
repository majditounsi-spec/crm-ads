import { useState } from 'react';
import { Zap, Plus, Play, Pause, ArrowRight, Clock, CheckCircle2, XCircle, MoreHorizontal, Trash2, Mail, Bell, MessageSquare, Calendar } from 'lucide-react';
import { mockAutomations } from '@/data/mockData';
import { Automation } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const triggerTemplates = [
  { value: 'deadline', label: 'Deadline närmar sig', icon: Calendar },
  { value: 'status_change', label: 'Status ändras', icon: CheckCircle2 },
  { value: 'budget_warning', label: 'Budget överskridning', icon: XCircle },
  { value: 'new_task', label: 'Ny uppgift skapad', icon: Plus },
  { value: 'custom', label: 'Anpassad trigger', icon: Zap },
];

const actionTemplates = [
  { value: 'email', label: 'Skicka e-post', icon: Mail },
  { value: 'notification', label: 'Push-notifikation', icon: Bell },
  { value: 'slack', label: 'Slack-meddelande', icon: MessageSquare },
  { value: 'status_update', label: 'Uppdatera status', icon: CheckCircle2 },
];

function getActionIcon(action: string) {
  if (action.toLowerCase().includes('e-post') || action.toLowerCase().includes('mail')) return Mail;
  if (action.toLowerCase().includes('slack')) return MessageSquare;
  if (action.toLowerCase().includes('notif')) return Bell;
  return Zap;
}

function getTriggerIcon(trigger: string) {
  if (trigger.toLowerCase().includes('deadline')) return Calendar;
  if (trigger.toLowerCase().includes('status')) return CheckCircle2;
  if (trigger.toLowerCase().includes('budget') || trigger.toLowerCase().includes('spend')) return XCircle;
  if (trigger.toLowerCase().includes('uppgift') || trigger.toLowerCase().includes('task')) return Plus;
  return Zap;
}

function formatSwedishDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAuto, setNewAuto] = useState({ name: '', trigger: '', triggerType: '', action: '', actionType: '' });

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
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, lastRun: new Date().toISOString().split('T')[0] } : a));
    toast.success('Automation körd manuellt!');
  };

  const handleCreate = () => {
    if (!newAuto.name) {
      toast.error('Fyll i ett namn');
      return;
    }
    const trigger = newAuto.trigger || triggerTemplates.find(t => t.value === newAuto.triggerType)?.label || 'Anpassad';
    const action = newAuto.action || actionTemplates.find(a => a.value === newAuto.actionType)?.label || 'Anpassad';
    const automation: Automation = {
      id: String(Date.now()),
      name: newAuto.name,
      trigger,
      action,
      active: true,
    };
    setAutomations([automation, ...automations]);
    setDialogOpen(false);
    setNewAuto({ name: '', trigger: '', triggerType: '', action: '', actionType: '' });
    toast.success('Automation skapad!');
  };

  const active = automations.filter(a => a.active).length;
  const total = automations.length;
  const recentlyRun = automations.filter(a => a.lastRun).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Automationer</h1>
          <p className="text-muted-foreground">{active} aktiva av {total} automationer</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Ny Automation</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Skapa automation</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Namn</Label><Input value={newAuto.name} onChange={e => setNewAuto({...newAuto, name: e.target.value})} placeholder="T.ex. Påminnelse vid deadline" /></div>

              <div>
                <Label>Trigger (När)</Label>
                <Select value={newAuto.triggerType} onValueChange={v => setNewAuto({...newAuto, triggerType: v, trigger: ''})}>
                  <SelectTrigger><SelectValue placeholder="Välj trigger-typ" /></SelectTrigger>
                  <SelectContent>
                    {triggerTemplates.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newAuto.triggerType === 'custom' && (
                  <Input className="mt-2" value={newAuto.trigger} onChange={e => setNewAuto({...newAuto, trigger: e.target.value})} placeholder="Beskriv trigger..." />
                )}
              </div>

              <div>
                <Label>Åtgärd (Gör)</Label>
                <Select value={newAuto.actionType} onValueChange={v => setNewAuto({...newAuto, actionType: v, action: ''})}>
                  <SelectTrigger><SelectValue placeholder="Välj åtgärd" /></SelectTrigger>
                  <SelectContent>
                    {actionTemplates.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newAuto.actionType === 'status_update' && (
                  <Input className="mt-2" value={newAuto.action} onChange={e => setNewAuto({...newAuto, action: e.target.value})} placeholder="Beskriv åtgärd..." />
                )}
              </div>

              <Button onClick={handleCreate} className="w-full">Skapa Automation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Aktiva', value: active, total, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10', icon: Play },
          { title: 'Pausade', value: total - active, total, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10', icon: Pause },
          { title: 'Körda', value: recentlyRun, total, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10', icon: CheckCircle2 },
        ].map(stat => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={`pt-5 pb-4 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-heading font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">av {stat.total} totalt</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.iconColor}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <Progress value={stat.total > 0 ? (stat.value / stat.total) * 100 : 0} className="h-1.5 mt-3" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Automation Cards */}
      <div className="grid gap-4">
        {automations.map((auto, i) => {
          const TriggerIcon = getTriggerIcon(auto.trigger);
          const ActionIcon = getActionIcon(auto.action);
          return (
            <motion.div
              key={auto.id}
              variants={item}
              className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md group ${!auto.active ? 'opacity-60' : ''}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Name and status */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${auto.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold text-sm">{auto.name}</p>
                        {auto.active ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Aktiv</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Pausad</span>
                        )}
                      </div>

                      {/* Visual workflow: Trigger → Action */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium">
                          <TriggerIcon className="h-3.5 w-3.5" />
                          {auto.trigger}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1.5 bg-violet-500/10 text-violet-600 px-3 py-1.5 rounded-lg text-xs font-medium">
                          <ActionIcon className="h-3.5 w-3.5" />
                          {auto.action}
                        </div>
                      </div>

                      {auto.lastRun && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Senast körd: {formatSwedishDate(auto.lastRun)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => runAutomation(auto.id)}
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Kör
                    </Button>
                    <Switch checked={auto.active} onCheckedChange={() => toggleActive(auto.id)} />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteAutomation(auto.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {automations.length === 0 && (
        <motion.div variants={item} className="text-center py-16">
          <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg">Inga automationer ännu</h3>
          <p className="text-muted-foreground text-sm mt-1">Skapa din första automation för att automatisera repetitiva uppgifter.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
