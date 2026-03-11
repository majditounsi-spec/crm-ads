import { useState } from 'react';
import { Zap, Plus, Play, Pause } from 'lucide-react';
import { mockAutomations } from '@/data/mockData';
import { Automation } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAuto, setNewAuto] = useState({ name: '', trigger: '', action: '' });

  const toggleActive = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
    toast.success('Automation uppdaterad');
  };

  const handleCreate = () => {
    if (!newAuto.name || !newAuto.trigger || !newAuto.action) {
      toast.error('Fyll i alla fält');
      return;
    }
    const automation: Automation = {
      id: String(Date.now()),
      name: newAuto.name,
      trigger: newAuto.trigger,
      action: newAuto.action,
      active: true,
    };
    setAutomations([automation, ...automations]);
    setDialogOpen(false);
    setNewAuto({ name: '', trigger: '', action: '' });
    toast.success('Automation skapad!');
  };

  const active = automations.filter(a => a.active).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Automationer</h1>
          <p className="text-muted-foreground">{active} aktiva av {automations.length} automationer</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Ny Automation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Skapa automation</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Namn</Label><Input value={newAuto.name} onChange={e => setNewAuto({...newAuto, name: e.target.value})} placeholder="T.ex. Påminnelse vid deadline" /></div>
              <div><Label>Trigger (När)</Label><Input value={newAuto.trigger} onChange={e => setNewAuto({...newAuto, trigger: e.target.value})} placeholder="T.ex. Deadline om 3 dagar" /></div>
              <div><Label>Åtgärd (Gör)</Label><Input value={newAuto.action} onChange={e => setNewAuto({...newAuto, action: e.target.value})} placeholder="T.ex. Skicka e-post" /></div>
              <Button onClick={handleCreate} className="w-full">Skapa Automation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {automations.map((auto, i) => (
          <motion.div
            key={auto.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border shadow-sm p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${auto.active ? 'bg-status-done/15 text-status-done' : 'bg-muted text-muted-foreground'}`}>
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{auto.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>⚡ {auto.trigger}</span>
                  <span>→ {auto.action}</span>
                  {auto.lastRun && <span>Senast: {auto.lastRun}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Switch checked={auto.active} onCheckedChange={() => toggleActive(auto.id)} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
