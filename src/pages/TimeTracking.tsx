import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Clock, Play, Square, Timer, BarChart3, Calendar, Trash2 } from 'lucide-react';
import { mockTimeEntries } from '@/data/mockData';
import { useProjects } from '@/hooks/useProjects';
import { TimeEntry } from '@/types/crm';

const TIME_STORAGE_KEY = 'marketflow_time_global';

function loadTimeEntries(): TimeEntry[] {
  try {
    const raw = localStorage.getItem(TIME_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return mockTimeEntries;
}

function saveTimeEntries(entries: TimeEntry[]) {
  try {
    localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const WEEKDAYS_SV = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function formatSwedishDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function TimeTracking() {
  const { projects } = useProjects();
  const [entries, _setEntries] = useState<TimeEntry[]>(loadTimeEntries);
  const setEntries: typeof _setEntries = (update) => {
    _setEntries(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      saveTimeEntries(next);
      return next;
    });
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ projectId: '', description: '', hours: '', date: new Date().toISOString().split('T')[0] });

  // Live timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProject, setTimerProject] = useState('');
  const [timerDescription, setTimerDescription] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const startTimer = () => {
    if (!timerProject) {
      toast.error('Välj ett projekt först');
      return;
    }
    setTimerRunning(true);
    toast.success('Timer startad!');
  };

  const stopTimer = () => {
    setTimerRunning(false);
    const hours = Math.round((timerSeconds / 3600) * 10) / 10;
    if (hours >= 0.1) {
      const project = projects.find(p => p.id === timerProject);
      const entry: TimeEntry = {
        id: String(Date.now()),
        projectId: timerProject,
        projectName: project?.name || '',
        description: timerDescription || 'Timer-loggning',
        hours,
        date: new Date().toISOString().split('T')[0],
        assignee: 'Anna S.',
      };
      setEntries(prev => [entry, ...prev]);
      toast.success(`${hours}h registrerade!`);
    } else {
      toast.info('Mindre än 6 minuter - ingen tid registrerad');
    }
    setTimerSeconds(0);
    setTimerDescription('');
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Tid borttagen');
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayHours = entries.filter(e => e.date === today).reduce((sum, e) => sum + e.hours, 0);
  const weekDates = getWeekDates();
  const weekHours = weekDates.map(d => entries.filter(e => e.date === d).reduce((s, e) => s + e.hours, 0));
  const maxWeekHours = Math.max(...weekHours, 8);
  const weekTotal = weekHours.reduce((a, b) => a + b, 0);

  const grouped = entries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    (acc[entry.date] = acc[entry.date] || []).push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Per-project summary
  const projectSummary = entries.reduce<Record<string, { name: string; hours: number }>>((acc, e) => {
    if (!acc[e.projectId]) acc[e.projectId] = { name: e.projectName, hours: 0 };
    acc[e.projectId].hours += e.hours;
    return acc;
  }, {});
  const projectSorted = Object.values(projectSummary).sort((a, b) => b.hours - a.hours);

  const handleCreate = () => {
    if (!newEntry.projectId || !newEntry.description || !newEntry.hours) {
      toast.error('Fyll i alla fält');
      return;
    }
    const project = projects.find(p => p.id === newEntry.projectId);
    const entry: TimeEntry = {
      id: String(Date.now()),
      projectId: newEntry.projectId,
      projectName: project?.name || '',
      description: newEntry.description,
      hours: Number(newEntry.hours),
      date: newEntry.date,
      assignee: 'Anna S.',
    };
    setEntries(prev => [entry, ...prev]);
    setDialogOpen(false);
    setNewEntry({ projectId: '', description: '', hours: '', date: new Date().toISOString().split('T')[0] });
    toast.success('Tid registrerad!');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Tidloggning</h1>
          <p className="text-muted-foreground">{totalHours.toLocaleString('sv-SE')} timmar totalt · {todayHours}h idag</p>
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
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Beskrivning</Label><Input value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} placeholder="Vad jobbade du med?" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Timmar</Label><Input type="number" step="0.5" value={newEntry.hours} onChange={e => setNewEntry({...newEntry, hours: e.target.value})} placeholder="0" /></div>
                <div><Label>Datum</Label><Input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Registrera</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Idag', value: `${todayHours}h`, sub: 'av 8h mål', pct: Math.min((todayHours / 8) * 100, 100), color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10', icon: Clock },
          { title: 'Denna vecka', value: `${weekTotal}h`, sub: 'av 40h mål', pct: Math.min((weekTotal / 40) * 100, 100), color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10', icon: Calendar },
          { title: 'Totalt', value: `${totalHours}h`, sub: `${entries.length} poster`, pct: 100, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10', icon: BarChart3 },
          { title: 'Projekt', value: String(Object.keys(projectSummary).length), sub: 'med loggad tid', pct: 100, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10', icon: Timer },
        ].map(stat => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={`pt-5 pb-4 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-heading font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.iconColor}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <Progress value={stat.pct} className="h-1.5 mt-3" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live Timer */}
      <motion.div variants={item}>
        <Card className={`overflow-hidden transition-all ${timerRunning ? 'ring-2 ring-primary shadow-lg' : ''}`}>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-4">
              <Timer className={`h-5 w-5 ${timerRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <h2 className="font-heading font-semibold">Live Timer</h2>
              {timerRunning && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Aktiv</span>}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`font-mono text-4xl font-bold tabular-nums tracking-wider ${timerRunning ? 'text-primary' : 'text-foreground'}`}>
                {formatTimer(timerSeconds)}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
                <Select value={timerProject} onValueChange={setTimerProject} disabled={timerRunning}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Välj projekt..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Vad jobbar du med?"
                  value={timerDescription}
                  onChange={e => setTimerDescription(e.target.value)}
                  disabled={timerRunning}
                  className="h-9"
                />
              </div>
              {timerRunning ? (
                <Button variant="destructive" onClick={stopTimer} className="gap-2 shrink-0">
                  <Square className="h-4 w-4" />Stoppa
                </Button>
              ) : (
                <Button onClick={startTimer} className="gap-2 shrink-0">
                  <Play className="h-4 w-4" />Starta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold">Veckoöversikt</h2>
                <span className="text-sm text-muted-foreground">{weekTotal}h / 40h</span>
              </div>
              <div className="flex items-end gap-2 h-40">
                {weekDates.map((date, i) => {
                  const hours = weekHours[i];
                  const heightPct = maxWeekHours > 0 ? (hours / maxWeekHours) * 100 : 0;
                  const isToday = date === today;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs font-medium tabular-nums">{hours > 0 ? `${hours}h` : ''}</span>
                      <div className="w-full relative" style={{ height: '120px' }}>
                        <motion.div
                          className={`absolute bottom-0 w-full rounded-t-md ${isToday ? 'bg-primary' : 'bg-primary/30'}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                        />
                        {/* 8h goal line */}
                        <div
                          className="absolute w-full border-t border-dashed border-muted-foreground/30"
                          style={{ bottom: `${(8 / maxWeekHours) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {WEEKDAYS_SV[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-primary" />
                  <span>Idag</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-primary/30" />
                  <span>Övriga dagar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 border-t border-dashed border-muted-foreground/30" />
                  <span>8h mål</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Per-project breakdown */}
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-4">
              <h2 className="font-heading font-semibold mb-4">Per projekt</h2>
              <div className="space-y-3">
                {projectSorted.slice(0, 6).map((p, i) => {
                  const pct = totalHours > 0 ? (p.hours / totalHours) * 100 : 0;
                  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                  return (
                    <div key={p.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate mr-2">{p.name.split(' - ')[0]}</span>
                        <span className="text-muted-foreground shrink-0">{p.hours}h</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${colors[i % colors.length]}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Time entries list */}
      <motion.div variants={item} className="space-y-4">
        <h2 className="font-heading font-semibold text-lg">Tidsposter</h2>
        {sortedDates.map(date => (
          <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
              <span className="font-heading font-semibold text-sm capitalize">{formatSwedishDate(date)}</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {grouped[date].reduce((s, e) => s + e.hours, 0)}h
              </span>
            </div>
            <div className="divide-y">
              {grouped[date].map(entry => (
                <div key={entry.id} className="monday-row px-5 py-3.5 flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 h-8 rounded-full bg-primary/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{entry.projectName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{entry.assignee}</span>
                    <span className="font-heading font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-md">{entry.hours}h</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
