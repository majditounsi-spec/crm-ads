import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, User, ListTodo, CalendarDays, Trash2 } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, updateProject, deleteProject } = useProjects();
  const project = getProject(id || '');

  const [tasks, setTasks] = useState<Task[]>(mockTasks.filter(t => t.projectId === id));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries.filter(t => t.projectId === id));
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [newTime, setNewTime] = useState({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });

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
    setTasks([...tasks, { id: String(Date.now()), projectId: project.id, title: newTaskTitle.trim(), completed: false, assignee: project.assignee, createdAt: new Date().toISOString().split('T')[0] }]);
    setNewTaskTitle('');
    toast.success('Uppgift tillagd!');
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleLogTime = () => {
    if (!newTime.description || !newTime.hours) { toast.error('Fyll i beskrivning och timmar'); return; }
    setTimeEntries([{ id: String(Date.now()), projectId: project.id, projectName: project.name, description: newTime.description, hours: Number(newTime.hours), date: newTime.date, assignee: project.assignee }, ...timeEntries]);
    setTimeDialogOpen(false);
    setNewTime({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });
    toast.success('Tid registrerad!');
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate('/projects');
    toast.success('Projekt borttaget!');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="mt-1 shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              value={project.name}
              onChange={e => updateProject(project.id, { name: e.target.value })}
              className="text-2xl font-heading font-bold border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-xl px-3 -mx-3 h-auto"
            />
            <PriorityBadge priority={project.priority} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={project.client}
              onChange={e => updateProject(project.id, { client: e.target.value })}
              className="text-sm text-muted-foreground border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-2 -mx-2 h-7 w-40"
              placeholder="Kund"
            />
            <span className="text-muted-foreground">·</span>
            <Input
              value={project.assignee}
              onChange={e => updateProject(project.id, { assignee: e.target.value })}
              className="text-sm text-muted-foreground border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-2 h-7 w-32"
              placeholder="Ansvarig"
            />
          </div>
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
          <div className="flex justify-between text-sm">
            <Input type="number" value={project.budget} onChange={e => updateProject(project.id, { budget: Number(e.target.value) })} className="h-7 w-20 text-sm font-heading font-bold border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-2" />
            <span className="text-muted-foreground text-xs mt-1">kr</span>
          </div>
          <Progress value={budgetPct} className={`h-1.5 mt-2 ${budgetPct > 90 ? '[&>div]:bg-red-500' : ''}`} />
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground">Deadline:</span>
            <Input type="date" value={project.deadline} onChange={e => updateProject(project.id, { deadline: e.target.value })} className="h-6 text-[10px] border-none bg-transparent p-0 shadow-none focus-visible:ring-1 w-28 px-1" />
          </div>
        </motion.div>
      </div>

      {/* Tasks */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2"><ListTodo className="h-4 w-4 text-muted-foreground" /><span className="font-heading font-semibold text-sm">Uppgifter</span></div>
          <span className="text-xs text-muted-foreground">{completedTasks} av {tasks.length} klara</span>
        </div>
        <div className="divide-y">
          {tasks.map(task => (
            <div key={task.id} className="px-5 py-3 flex items-center gap-3 monday-row">
              <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
              <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{task.assignee}</span>
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
                <div className="grid grid-cols-2 gap-4">
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
            <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between monday-row">
              <div>
                <p className="text-sm font-medium">{entry.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><CalendarDays className="h-3 w-3" />{new Date(entry.date + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</p>
              </div>
              <span className="font-heading font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-md">{entry.hours}h</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
