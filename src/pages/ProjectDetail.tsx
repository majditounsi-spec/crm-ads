import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, User, ListTodo, CalendarDays, Trash2, Mail, Phone, Building2, FileText, Target, Tag, Copy } from 'lucide-react';
import { mockTimeEntries, mockTasks } from '@/data/mockData';
import { useProjects } from '@/hooks/useProjects';
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
  const { getProject, updateProject, deleteProject } = useProjects();
  const project = getProject(id || '');

  const [tasks, setTasksState] = useState<Task[]>(() => loadTasks(id || ''));
  const [timeEntries, setTimeEntriesState] = useState<TimeEntry[]>(() => loadTimeEntries(id || ''));
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [newTime, setNewTime] = useState({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });

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

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

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
    }, ...prev]);
    setTimeDialogOpen(false);
    setNewTime({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });
    toast.success('Tid registrerad!');
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
          <p className="text-2xl font-heading font-bold">{totalHours}h</p>
          <p className="text-xs text-muted-foreground mt-1">{timeEntries.length} poster</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Budget</p>
          <p className="text-2xl font-heading font-bold">{(project.spent / 1000).toFixed(0)}k / {(project.budget / 1000).toFixed(0)}k kr</p>
          <Progress value={budgetPct} className={`h-1.5 mt-2 ${budgetPct > 90 ? '[&>div]:bg-red-500' : ''}`} />
          <p className="text-xs text-muted-foreground mt-1">Deadline: {project.deadline}</p>
        </motion.div>
      </div>

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
          {tasks.map(task => (
            <div key={task.id} className="px-5 py-3 flex items-center gap-3 monday-row group">
              <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
              <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{task.assignee}</span>
              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10">
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
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
    </motion.div>
  );
}
