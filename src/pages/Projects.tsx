import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Trash2, LayoutGrid, List, Calendar, Users, DollarSign, GripVertical } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, ProjectStatus, ProjectPriority } from '@/types/crm';
import { toast } from 'sonner';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'pending', label: 'Väntande' },
  { value: 'working', label: 'Pågår' },
  { value: 'review', label: 'Granskning' },
  { value: 'done', label: 'Klar' },
  { value: 'stuck', label: 'Blockerad' },
];

const priorityOptions: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Låg' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'Hög' },
  { value: 'critical', label: 'Kritisk' },
];

const statusColors: Record<ProjectStatus, string> = {
  pending: 'border-t-[hsl(var(--status-pending))]',
  working: 'border-t-[hsl(var(--status-working))]',
  review: 'border-t-[hsl(var(--status-review))]',
  done: 'border-t-[hsl(var(--status-done))]',
  stuck: 'border-t-[hsl(var(--status-stuck))]',
};

const statusBgColors: Record<ProjectStatus, string> = {
  pending: 'bg-[hsl(var(--status-pending))]',
  working: 'bg-[hsl(var(--status-working))]',
  review: 'bg-[hsl(var(--status-review))]',
  done: 'bg-[hsl(var(--status-done))]',
  stuck: 'bg-[hsl(var(--status-stuck))]',
};

const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Väntande',
  working: 'Pågår',
  review: 'Granskning',
  done: 'Klar',
  stuck: 'Blockerad',
};

type ViewMode = 'table' | 'kanban';

export default function Projects() {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', status: 'pending' as ProjectStatus, priority: 'medium' as ProjectPriority, deadline: '', budget: '', assignee: '' });

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProject(id);
    toast.success('Projekt borttaget!');
  };

  const handleCreate = () => {
    if (!newProject.name || !newProject.client) {
      toast.error('Fyll i projektnamn och kund');
      return;
    }
    addProject({
      name: newProject.name,
      client: newProject.client,
      status: newProject.status,
      priority: newProject.priority,
      deadline: newProject.deadline || '2026-05-01',
      budget: Number(newProject.budget) || 0,
      spent: 0,
      assignee: newProject.assignee || 'Ej tilldelad',
      tags: [],
    });
    setDialogOpen(false);
    setNewProject({ name: '', client: '', status: 'pending', priority: 'medium', deadline: '', budget: '', assignee: '' });
    toast.success('Projekt skapat!');
  };

  const moveProject = (id: string, newStatus: ProjectStatus) => {
    updateProject(id, { status: newStatus });
    toast.success(`Flyttad till ${statusLabels[newStatus]}`);
  };

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const activeCount = projects.filter(p => p.status !== 'done').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Projekt</h1>
          <p className="text-muted-foreground">{projects.length} projekt · {activeCount} aktiva · {(totalBudget / 1000).toFixed(0)}k kr budget</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border bg-muted/50 p-0.5">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className={`h-7 px-2.5 gap-1.5 rounded-lg ${viewMode === 'table' ? 'bg-gradient-to-r from-primary to-violet-600 text-white' : ''}`} onClick={() => setViewMode('table')}>
              <List className="h-3.5 w-3.5" /><span className="hidden sm:inline text-xs">Tabell</span>
            </Button>
            <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" className={`h-7 px-2.5 gap-1.5 rounded-lg ${viewMode === 'kanban' ? 'bg-gradient-to-r from-primary to-violet-600 text-white' : ''}`} onClick={() => setViewMode('kanban')}>
              <LayoutGrid className="h-3.5 w-3.5" /><span className="hidden sm:inline text-xs">Kanban</span>
            </Button>
          </div>

          <Select value={filter} onValueChange={(v) => setFilter(v as ProjectStatus | 'all')}>
            <SelectTrigger className="w-36 h-9"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nytt Projekt</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Skapa nytt projekt</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Projektnamn</Label><Input value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="T.ex. SEO Kampanj" /></div>
                <div><Label>Kund</Label><Input value={newProject.client} onChange={e => setNewProject({...newProject, client: e.target.value})} placeholder="Kundnamn" /></div>
                <div><Label>Ansvarig</Label><Input value={newProject.assignee} onChange={e => setNewProject({...newProject, assignee: e.target.value})} placeholder="Namn" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Status</Label>
                    <Select value={newProject.status} onValueChange={v => setNewProject({...newProject, status: v as ProjectStatus})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Prioritet</Label>
                    <Select value={newProject.priority} onValueChange={v => setNewProject({...newProject, priority: v as ProjectPriority})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Deadline</Label><Input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} /></div>
                  <div><Label>Budget (kr)</Label><Input type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} placeholder="0" /></div>
                </div>
                <Button onClick={handleCreate} className="w-full">Skapa Projekt</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'kanban' ? (
          /* ========== KANBAN VIEW ========== */
          <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-4 overflow-x-auto pb-4">
            {statusOptions.map(status => {
              const columnProjects = projects.filter(p => p.status === status.value);
              return (
                <div key={status.value} className="min-w-[280px] w-[280px] shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`w-3 h-3 rounded-sm ${statusBgColors[status.value]}`} />
                    <span className="font-heading font-semibold text-sm">{status.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{columnProjects.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {columnProjects.map((project, i) => {
                      const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
                      return (
                        <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className={`kanban-card bg-card rounded-xl border border-t-[3px] ${statusColors[project.status]} p-3.5 cursor-pointer group`}
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">{project.name}</p>
                            <PriorityBadge priority={project.priority} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{project.client}</p>
                          {project.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {project.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">{tag}</span>)}
                            </div>
                          )}
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                              <span>{(project.spent / 1000).toFixed(0)}k spenderat</span>
                              <span>{(project.budget / 1000).toFixed(0)}k kr</span>
                            </div>
                            <Progress value={pct} className={`h-1.5 ${pct > 90 ? '[&>div]:bg-red-500' : ''}`} />
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-3 w-3 text-primary" /></div>
                              <span className="text-[11px] text-muted-foreground">{project.assignee}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Calendar className="h-3 w-3" />{project.deadline}</div>
                          </div>
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            {statusOptions.filter(s => s.value !== project.status).slice(0, 2).map(s => (
                              <button key={s.value} onClick={() => moveProject(project.id, s.value)} className="flex-1 text-[10px] py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors truncate px-1">{s.label}</button>
                            ))}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="text-[10px] py-1 px-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Ta bort projekt?</AlertDialogTitle><AlertDialogDescription>Ta bort {project.name}? Detta kan inte ångras.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(e) => handleDelete(e, project.id)}>Ta bort</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </motion.div>
                      );
                    })}
                    {columnProjects.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">Inga projekt</div>}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* ========== TABLE VIEW (Monday-style inline editing) ========== */
          <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 min-w-[200px]">Projekt</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 min-w-[140px]">Kund</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-[130px]">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-[110px]">Prioritet</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 min-w-[120px]">Ansvarig</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-[160px]">Budget</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-[120px]">Deadline</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((project, i) => {
                    const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
                    return (
                      <motion.tr key={project.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="monday-row group">
                        {/* Project name - click to navigate */}
                        <td className="px-4 py-3">
                          <div className="cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                            <Input
                              value={project.name}
                              onChange={e => { e.stopPropagation(); updateProject(project.id, { name: e.target.value }); }}
                              onClick={e => e.stopPropagation()}
                              className="h-8 text-sm font-medium border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-2 -mx-2"
                            />
                            <div className="flex gap-1.5 mt-1 px-2 -mx-2">
                              {project.tags.map(tag => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{tag}</span>)}
                            </div>
                          </div>
                        </td>
                        {/* Client - inline editable */}
                        <td className="px-3 py-3">
                          <Input
                            value={project.client}
                            onChange={e => updateProject(project.id, { client: e.target.value })}
                            className="h-8 text-sm border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-2"
                          />
                        </td>
                        {/* Status - dropdown */}
                        <td className="px-3 py-3">
                          <Select value={project.status} onValueChange={v => { updateProject(project.id, { status: v as ProjectStatus }); toast.success('Status uppdaterad!'); }}>
                            <SelectTrigger className="h-8 w-full border-none bg-transparent p-0 px-1 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
                              <StatusBadge status={project.status} />
                            </SelectTrigger>
                            <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        {/* Priority - dropdown */}
                        <td className="px-3 py-3">
                          <Select value={project.priority} onValueChange={v => { updateProject(project.id, { priority: v as ProjectPriority }); toast.success('Prioritet uppdaterad!'); }}>
                            <SelectTrigger className="h-8 w-full border-none bg-transparent p-0 px-1 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
                              <PriorityBadge priority={project.priority} />
                            </SelectTrigger>
                            <SelectContent>{priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        {/* Assignee - inline editable */}
                        <td className="px-3 py-3">
                          <Input
                            value={project.assignee}
                            onChange={e => updateProject(project.id, { assignee: e.target.value })}
                            className="h-8 text-sm border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-2"
                          />
                        </td>
                        {/* Budget - inline editable with progress */}
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={project.budget}
                                onChange={e => updateProject(project.id, { budget: Number(e.target.value) })}
                                className="h-7 text-xs w-20 border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-2"
                              />
                              <span className="text-[10px] text-muted-foreground">kr</span>
                            </div>
                            <Progress value={pct} className={`h-1.5 ${pct > 90 ? '[&>div]:bg-red-500' : ''}`} />
                            <span className="text-[10px] text-muted-foreground">{(project.spent / 1000).toFixed(0)}k spenderat</span>
                          </div>
                        </td>
                        {/* Deadline - inline editable */}
                        <td className="px-3 py-3">
                          <Input
                            type="date"
                            value={project.deadline}
                            onChange={e => updateProject(project.id, { deadline: e.target.value })}
                            className="h-8 text-sm border-none bg-transparent p-0 shadow-none focus-visible:ring-1 focus-visible:bg-background hover:bg-muted/50 rounded-lg px-1"
                          />
                        </td>
                        {/* Delete */}
                        <td className="px-3 py-3">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Ta bort projekt?</AlertDialogTitle><AlertDialogDescription>Ta bort {project.name}? Detta kan inte ångras.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(e) => handleDelete(e, project.id)}>Ta bort</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
