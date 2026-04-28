import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, User, ListTodo, CalendarDays, Trash2, Mail, Phone, Building2, FileText, Target, Tag, Copy, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { mockTimeEntries, mockTasks } from '@/data/mockData';
import { useProjects } from '@/hooks/useProjects';
import { useHourlyRate, computeProfitability } from '@/hooks/useBilling';
import { ProjectStatus, TimeEntry, Task } from '@/types/crm';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

function loadTasks(projectId: string): Task[] {
  try {
    const stored = localStorage.getItem(`marketflow_tasks_${projectId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return mockTasks.filter(t => t.projectId === projectId);
}

function saveTasks(projectId: string, tasks: Task[]) {
  try {
    localStorage.setItem(`marketflow_tasks_${projectId}`, JSON.stringify(tasks));
  } catch {}
}

function loadTimeEntries(projectId: string): TimeEntry[] {
  try {
    const stored = localStorage.getItem(`marketflow_time_${projectId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return mockTimeEntries.filter(t => t.projectId === projectId);
}

function saveTimeEntries(projectId: string, entries: TimeEntry[]) {
  try {
    localStorage.setItem(`marketflow_time_${projectId}`, JSON.stringify(entries));
  } catch {}
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, updateProject, deleteProject, loading } = useProjects();
  const project = getProject(id || '');

  const [tasks, setTasksState] = useState<Task[]>(() => loadTasks(id || ''));
  const [timeEntries, setTimeEntriesState] = useState<TimeEntry[]>(() => loadTimeEntries(id || ''));
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [newTime, setNewTime] = useState({ description: '', hours: '', date: new Date().toISOString().split('T')[0], taskId: '' });
  const [taskTimeDialog, setTaskTimeDialog] = useState<{ open: boolean; taskId: string; taskTitle: string }>({ open: false, taskId: '', taskTitle: '' });
  const [taskTime, setTaskTime] = useState({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });

  const { rate: hourlyRate } = useHourlyRate();

  const setTasks = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveTasks(id || '', next);
      return next;
    });
  }, [id]);

  const setTimeEntries = useCallback((updater: TimeEntry[] | ((prev: TimeEntry[]) => TimeEntry[])) => {
    setTimeEntriesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveTimeEntries(id || '', next);
      return next;
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Laddar projekt...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Projektet hittades inte.</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Tillbaka
        </Button>
      </div>
    );
  }

  const totalHours = timeEntries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const profit = computeProfitability(project.budget, totalHours, hourlyRate);
  const budgetPct = Math.round(profit.budgetUsedPct);
  const getTaskHoursFor = (taskId: string) =>
    timeEntries.filter(e => e.taskId === taskId).reduce((sum, e) => sum + (Number(e.hours) || 0), 0);

  const handleStatusChange = (status: ProjectStatus) => {
    updateProject(project.id, { status });
    toast.success('Status uppdaterad!');
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks(prev => [...prev, {
      id: String(Date.now()),
      projectId: project.id,
      title: newTaskTitle.trim(),
      completed: false,
      assignee: project.assignee,
      createdAt: new Date().toISOString().split('T')[0],
    }]);
    setNewTaskTitle('');
    toast.success('Uppgift tillagd!');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Uppgift borttagen');
  };

  const handleLogTime = () => {
    if (!newTime.description || !newTime.hours) { toast.error('Fyll i beskrivning och timmar'); return; }
    setTimeEntries(prev => [{
      id: String(Date.now()),
      projectId: project.id,
      projectName: project.name,
      description: newTime.description,
      hours: Number(newTime.hours),
      date: newTime.date,
      assignee: project.assignee,
      taskId: newTime.taskId || undefined,
    }, ...prev]);
    setTimeDialogOpen(false);
    setNewTime({ description: '', hours: '', date: new Date().toISOString().split('T')[0], taskId: '' });
    toast.success('Tid registrerad!');
  };

  const handleLogTaskTime = () => {
    if (!taskTime.hours) { toast.error('Fyll i timmar'); return; }
    const hours = Number(taskTime.hours);
    if (!Number.isFinite(hours) || hours <= 0) { toast.error('Ange giltigt antal timmar'); return; }
    setTimeEntries(prev => [{
      id: String(Date.now()),
      projectId: project.id,
      projectName: project.name,
      description: taskTime.description || taskTimeDialog.taskTitle,
      hours,
      date: taskTime.date,
      assignee: project.assignee,
      taskId: taskTimeDialog.taskId,
    }, ...prev]);
    setTaskTimeDialog({ open: false, taskId: '', taskTitle: '' });
    setTaskTime({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });
    toast.success(`${hours}h loggat på uppgiften`);
  };

  const deleteTimeEntry = (entryId: string) => {
    setTimeEntries(prev => prev.filter(e => e.id !== entryId));
    toast.success('Tidspost borttagen');
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    // Clean up localStorage for this project
    try {
      localStorage.removeItem(`marketflow_tasks_${project.id}`);
      localStorage.removeItem(`marketflow_time_${project.id}`);
    } catch {}
    navigate('/projects');
    toast.success('Projekt borttaget!');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="mt-1 shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-heading font-bold">{project.name}</h1>
            <PriorityBadge priority={project.priority} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{project.client} · {project.assignee}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive shrink-0"><Trash2 className="h-4 w-4 mr-1" />Ta bort</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Ta bort projekt?</AlertDialogTitle><AlertDialogDescription>Ta bort {project.name}? Detta kan inte ångras.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDeleteProject}>Ta bort</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Status</p>
          <Select value={project.status} onValueChange={v => handleStatusChange(v as ProjectStatus)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Väntande</SelectItem>
              <SelectItem value="working">Pågår</SelectItem>
              <SelectItem value="review">Granskning</SelectItem>
              <SelectItem value="done">Klar</SelectItem>
              <SelectItem value="stuck">Blockerad</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Uppgifter</p>
          <p className="text-2xl font-heading font-bold">{completedTasks}/{tasks.length}</p>
          <Progress value={tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0} className="h-1.5 mt-2" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Loggad tid</p>
          <p className="text-2xl font-heading font-bold">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground mt-1">{timeEntries.length} poster · {hourlyRate.toLocaleString('sv-SE')} kr/h</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Budget</p>
          <p className="text-2xl font-heading font-bold">{(project.budget / 1000).toFixed(0)}k kr</p>
          <Progress value={Math.min(100, budgetPct)} className={`h-1.5 mt-2 ${profit.status === 'over' ? '[&>div]:bg-red-500' : profit.status === 'warning' ? '[&>div]:bg-amber-500' : ''}`} />
          <p className="text-xs text-muted-foreground mt-1">Deadline: {project.deadline}</p>
        </motion.div>
      </div>

      {/* Profitability panel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
        className={`rounded-xl border shadow-sm overflow-hidden ${profit.status === 'over' ? 'border-red-500/40 bg-red-500/5' : profit.status === 'warning' ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
        <div className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: profit.status === 'over' ? 'rgba(239,68,68,0.3)' : profit.status === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)' }}>
          <div className="flex items-center gap-2">
            <DollarSign className={`h-4 w-4 ${profit.status === 'over' ? 'text-red-500' : profit.status === 'warning' ? 'text-amber-500' : 'text-emerald-600'}`} />
            <span className="font-heading font-semibold text-sm">Ekonomi & Lönsamhet</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">Timpris: {hourlyRate.toLocaleString('sv-SE')} kr/h</span>
          </div>
          {profit.status === 'over' && <Badge className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Över budget</Badge>}
          {profit.status === 'warning' && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px]">Nära budget</Badge>}
          {profit.status === 'healthy' && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px]">Lönsam</Badge>}
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Budget</p>
            <p className="text-xl font-heading font-bold tabular-nums">{profit.budget.toLocaleString('sv-SE')} kr</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Arbetskostnad</p>
            <p className="text-xl font-heading font-bold tabular-nums">{profit.cost.toLocaleString('sv-SE')} kr</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totalHours.toFixed(1)}h × {hourlyRate.toLocaleString('sv-SE')}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kvar av budget</p>
            <p className={`text-xl font-heading font-bold tabular-nums ${profit.remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {profit.remaining >= 0 ? '+' : ''}{profit.remaining.toLocaleString('sv-SE')} kr
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{profit.remaining >= 0 ? `${(profit.remaining / hourlyRate).toFixed(1)}h kvar` : `${Math.abs(profit.remaining / hourlyRate).toFixed(1)}h över`}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Marginal</p>
            <p className={`text-xl font-heading font-bold tabular-nums flex items-center gap-1 ${profit.profitPct < 0 ? 'text-red-500' : profit.profitPct < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {profit.profitPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {profit.profitPct.toFixed(0)}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{budgetPct}% av budget använd</p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <Progress value={Math.min(100, budgetPct)}
            className={`h-2 ${profit.status === 'over' ? '[&>div]:bg-red-500' : profit.status === 'warning' ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} />
        </div>
      </motion.div>

      {/* Sales Brief (from won deal) */}
      {(project.description || project.contactName || project.contactEmail || project.contactPhone || project.leadSource || project.salesperson) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-heading font-semibold text-sm">Säljbrief</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium uppercase">Vunnen deal</span>
            </div>
            {project.dealId && <span className="text-[10px] text-muted-foreground font-mono">#{project.dealId}</span>}
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Kontakt */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Kundkontakt</p>
              <div className="space-y-1.5 text-sm">
                {project.contactName && (
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />{project.contactName}</div>
                )}
                {project.contactEmail && (
                  <a href={`mailto:${project.contactEmail}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />{project.contactEmail}
                  </a>
                )}
                {project.contactPhone && (
                  <a href={`tel:${project.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />{project.contactPhone}
                  </a>
                )}
                {project.client && (
                  <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{project.client}</div>
                )}
              </div>
            </div>
            {/* Deal info */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Affärsinfo</p>
              <div className="space-y-1.5 text-sm">
                {project.salesperson && (
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Säljare:</span> {project.salesperson}
                  </div>
                )}
                {project.leadSource && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Källa:</span> {project.leadSource}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Skapad:</span> {project.createdAt}
                </div>
                {project.tags.filter(t => !t.startsWith('deal:')).length > 0 && (
                  <div className="flex items-start gap-2 flex-wrap pt-1">
                    {project.tags.filter(t => !t.startsWith('deal:')).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Anteckningar */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Anteckningar från sälj</p>
              {project.description ? (
                <p className="text-sm whitespace-pre-wrap text-foreground/80 bg-card rounded-lg border p-3 max-h-32 overflow-y-auto">
                  {project.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Inga anteckningar från säljet.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tasks */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2"><ListTodo className="h-4 w-4 text-muted-foreground" /><span className="font-heading font-semibold text-sm">Uppgifter</span></div>
          <span className="text-xs text-muted-foreground">{completedTasks} av {tasks.length} klara</span>
        </div>
        <div className="divide-y">
          {tasks.map(task => {
            const hrs = getTaskHoursFor(task.id);
            const taskCost = hrs * hourlyRate;
            return (
              <div key={task.id} className="px-5 py-3 flex items-center gap-3 monday-row group">
                <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                {hrs > 0 && (
                  <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md tabular-nums">
                    {hrs.toFixed(1)}h · {(taskCost / 1000).toFixed(1)}k kr
                  </span>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{task.assignee}</span>
                <Button size="sm" variant="ghost"
                  className="h-6 px-2 text-[11px] rounded-md gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setTaskTimeDialog({ open: true, taskId: task.id, taskTitle: task.title }); setTaskTime({ hours: '', description: '', date: new Date().toISOString().split('T')[0] }); }}>
                  <Clock className="h-3 w-3" /> Logga
                </Button>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t flex gap-2">
          <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Lägg till en uppgift..." className="h-9" onKeyDown={e => e.key === 'Enter' && handleAddTask()} />
          <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}><Plus className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      {/* Time Entries */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="font-heading font-semibold text-sm">Tidslogg</span></div>
          <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Logga tid</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Logga tid – {project.name}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Beskrivning</Label><Input value={newTime.description} onChange={e => setNewTime({...newTime, description: e.target.value})} placeholder="Vad jobbade du med?" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Timmar</Label><Input type="number" step="0.5" value={newTime.hours} onChange={e => setNewTime({...newTime, hours: e.target.value})} placeholder="0" /></div>
                  <div><Label>Datum</Label><Input type="date" value={newTime.date} onChange={e => setNewTime({...newTime, date: e.target.value})} /></div>
                </div>
                <Button onClick={handleLogTime} className="w-full">Registrera</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="divide-y">
          {timeEntries.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Ingen tid loggad ännu</div>
          ) : timeEntries.map(entry => (
            <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between monday-row group">
              <div>
                <p className="text-sm font-medium">{entry.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><CalendarDays className="h-3 w-3" />{new Date(entry.date + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-md">{entry.hours}h</span>
                <button onClick={() => deleteTimeEntry(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Task-specific time log dialog */}
      <Dialog open={taskTimeDialog.open} onOpenChange={(o) => { if (!o) setTaskTimeDialog({ open: false, taskId: '', taskTitle: '' }); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Clock className="h-4 w-4" /> Logga tid på uppgift
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Uppgift</p>
              <p className="font-medium">{taskTimeDialog.taskTitle}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Timpris: {hourlyRate.toLocaleString('sv-SE')} kr/h</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Timmar *</Label>
                <Input type="number" step="0.25" min="0" value={taskTime.hours}
                  onChange={e => setTaskTime({ ...taskTime, hours: e.target.value })}
                  placeholder="0" className="rounded-lg" />
              </div>
              <div>
                <Label className="text-xs">Datum</Label>
                <Input type="date" value={taskTime.date}
                  onChange={e => setTaskTime({ ...taskTime, date: e.target.value })}
                  className="rounded-lg" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Anteckning (valfritt)</Label>
              <Input value={taskTime.description}
                onChange={e => setTaskTime({ ...taskTime, description: e.target.value })}
                placeholder="Vad gjorde du?" className="rounded-lg" />
            </div>
            {taskTime.hours && Number(taskTime.hours) > 0 && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 p-3 text-xs">
                Kostnad: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{(Number(taskTime.hours) * hourlyRate).toLocaleString('sv-SE')} kr</span>
              </div>
            )}
            <Button onClick={handleLogTaskTime} className="w-full rounded-lg gap-1.5">
              <Clock className="h-4 w-4" /> Registrera tid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
