import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, CheckCircle2, Circle, ListTodo, CalendarDays, User } from 'lucide-react';
import { mockProjects, mockTimeEntries, mockTasks } from '@/data/mockData';
import { Project, ProjectStatus, TimeEntry, Task } from '@/types/crm';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const initialProject = mockProjects.find(p => p.id === id);

  const [project, setProject] = useState<Project>(initialProject || mockProjects[0]);
  const [tasks, setTasks] = useState<Task[]>(mockTasks.filter(t => t.projectId === id));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries.filter(t => t.projectId === id));
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [newTime, setNewTime] = useState({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });

  if (!initialProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Projektet hittades inte.</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Tillbaka
        </Button>
      </div>
    );
  }

  const [project, setProject] = useState<Project>(initialProject);
  const [tasks, setTasks] = useState<Task[]>(mockTasks.filter(t => t.projectId === id));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries.filter(t => t.projectId === id));

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [newTime, setNewTime] = useState({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const budgetPct = Math.round((project.spent / project.budget) * 100);

  const handleStatusChange = (status: ProjectStatus) => {
    setProject({ ...project, status });
    toast.success(`Status ändrad till ${status === 'done' ? 'Klar' : status === 'working' ? 'Pågår' : status === 'review' ? 'Granskning' : status === 'pending' ? 'Väntande' : 'Blockerad'}`);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: String(Date.now()),
      projectId: project.id,
      title: newTaskTitle.trim(),
      completed: false,
      assignee: project.assignee,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks([...tasks, task]);
    setNewTaskTitle('');
    toast.success('Uppgift tillagd!');
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleLogTime = () => {
    if (!newTime.description || !newTime.hours) {
      toast.error('Fyll i beskrivning och timmar');
      return;
    }
    const entry: TimeEntry = {
      id: String(Date.now()),
      projectId: project.id,
      projectName: project.name,
      description: newTime.description,
      hours: Number(newTime.hours),
      date: newTime.date,
      assignee: project.assignee,
    };
    setTimeEntries([entry, ...timeEntries]);
    setTimeDialogOpen(false);
    setNewTime({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });
    toast.success('Tid registrerad!');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="mt-1 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-heading font-bold truncate">{project.name}</h1>
            <PriorityBadge priority={project.priority} />
          </div>
          <p className="text-muted-foreground text-sm mt-1">{project.client} · {project.assignee}</p>
        </div>
      </div>

      {/* Status + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
          <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">🔵 Väntande</SelectItem>
              <SelectItem value="working">🟠 Pågår</SelectItem>
              <SelectItem value="review">🟣 Granskning</SelectItem>
              <SelectItem value="done">🟢 Klar</SelectItem>
              <SelectItem value="stuck">🔴 Blockerad</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Uppgifter</p>
          <p className="text-2xl font-heading font-bold">{completedTasks}/{tasks.length}</p>
          <Progress value={tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0} className="h-1.5 mt-2" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Loggad tid</p>
          <p className="text-2xl font-heading font-bold">{totalHours}h</p>
          <p className="text-xs text-muted-foreground mt-1">{timeEntries.length} poster</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Budget</p>
          <div className="flex justify-between text-sm">
            <span className="font-heading font-bold">{(project.spent / 1000).toFixed(0)}k</span>
            <span className="text-muted-foreground">/ {(project.budget / 1000).toFixed(0)}k kr</span>
          </div>
          <Progress value={budgetPct} className="h-1.5 mt-2" />
          <p className="text-xs text-muted-foreground mt-1">Deadline: {project.deadline}</p>
        </motion.div>
      </div>

      {/* Tasks Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <span className="font-heading font-semibold text-sm">Uppgifter</span>
          </div>
          <span className="text-xs text-muted-foreground">{completedTasks} av {tasks.length} klara</span>
        </div>

        <div className="divide-y">
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />{task.assignee}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="px-5 py-3 border-t flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Lägg till en uppgift..."
            className="h-9"
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          />
          <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Time Entries Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-heading font-semibold text-sm">Tidslogg</span>
          </div>
          <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />Logga tid
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Logga tid – {project.name}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Beskrivning</Label><Input value={newTime.description} onChange={e => setNewTime({ ...newTime, description: e.target.value })} placeholder="Vad jobbade du med?" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Timmar</Label><Input type="number" step="0.5" value={newTime.hours} onChange={e => setNewTime({ ...newTime, hours: e.target.value })} placeholder="0" /></div>
                  <div><Label>Datum</Label><Input type="date" value={newTime.date} onChange={e => setNewTime({ ...newTime, date: e.target.value })} /></div>
                </div>
                <Button onClick={handleLogTime} className="w-full">Registrera</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="divide-y">
          {timeEntries.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Ingen tid loggad ännu</div>
          ) : (
            timeEntries.map(entry => (
              <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{entry.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CalendarDays className="h-3 w-3" />{entry.date}
                  </p>
                </div>
                <span className="font-heading font-bold text-sm">{entry.hours}h</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}