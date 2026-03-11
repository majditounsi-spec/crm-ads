import { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { mockTimeEntries, mockProjects } from '@/data/mockData';
import { TimeEntry } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ projectId: '', description: '', hours: '', date: new Date().toISOString().split('T')[0] });

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const todayHours = entries.filter(e => e.date === '2026-03-10').reduce((sum, e) => sum + e.hours, 0);

  const grouped = entries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    (acc[entry.date] = acc[entry.date] || []).push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleCreate = () => {
    if (!newEntry.projectId || !newEntry.description || !newEntry.hours) {
      toast.error('Fyll i alla fält');
      return;
    }
    const project = mockProjects.find(p => p.id === newEntry.projectId);
    const entry: TimeEntry = {
      id: String(Date.now()),
      projectId: newEntry.projectId,
      projectName: project?.name || '',
      description: newEntry.description,
      hours: Number(newEntry.hours),
      date: newEntry.date,
      assignee: 'Anna S.',
    };
    setEntries([entry, ...entries]);
    setDialogOpen(false);
    setNewEntry({ projectId: '', description: '', hours: '', date: new Date().toISOString().split('T')[0] });
    toast.success('Tid registrerad!');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Tidloggning</h1>
          <p className="text-muted-foreground">{totalHours} timmar totalt · {todayHours}h idag</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Logga Tid</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Registrera tid</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Projekt</Label>
                <Select value={newEntry.projectId} onValueChange={v => setNewEntry({...newEntry, projectId: v})}>
                  <SelectTrigger><SelectValue placeholder="Välj projekt" /></SelectTrigger>
                  <SelectContent>
                    {mockProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Beskrivning</Label><Input value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} placeholder="Vad jobbade du med?" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Timmar</Label><Input type="number" step="0.5" value={newEntry.hours} onChange={e => setNewEntry({...newEntry, hours: e.target.value})} placeholder="0" /></div>
                <div><Label>Datum</Label><Input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Registrera</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {sortedDates.map(date => (
          <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
              <span className="font-heading font-semibold text-sm">{date}</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {grouped[date].reduce((s, e) => s + e.hours, 0)}h
              </span>
            </div>
            <div className="divide-y">
              {grouped[date].map(entry => (
                <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">{entry.projectName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{entry.assignee}</span>
                    <span className="font-heading font-bold text-sm">{entry.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
