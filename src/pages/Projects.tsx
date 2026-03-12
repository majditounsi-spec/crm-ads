import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Pencil, Check, X } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { mockProjects } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Project>>({});
  const [newProject, setNewProject] = useState({ name: '', client: '', status: 'pending' as ProjectStatus, priority: 'medium' as ProjectPriority, deadline: '', budget: '' });

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const startEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditData({ name: project.name, client: project.client, assignee: project.assignee, deadline: project.deadline, budget: project.budget });
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId) {
      updateProject(editingId, editData);
      toast.success('Projekt uppdaterat!');
      setEditingId(null);
      setEditData({});
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditData({});
  };

  const handleCreate = () => {
    if (!newProject.name || !newProject.client) {
      toast.error('Fyll i projektnamn och kund');
      return;
    }
    const project: Project = {
      id: String(Date.now()),
      name: newProject.name,
      client: newProject.client,
      status: newProject.status,
      priority: newProject.priority,
      deadline: newProject.deadline || '2026-05-01',
      budget: Number(newProject.budget) || 0,
      spent: 0,
      assignee: 'Ej tilldelad',
      tags: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjects([project, ...projects]);
    setDialogOpen(false);
    setNewProject({ name: '', client: '', status: 'pending', priority: 'medium', deadline: '', budget: '' });
    toast.success('Projekt skapat!');
  };

  const isEditing = (id: string) => editingId === id;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Projekt</h1>
          <p className="text-muted-foreground">{projects.length} projekt totalt</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as ProjectStatus | 'all')}>
            <SelectTrigger className="w-36 h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nytt Projekt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Skapa nytt projekt</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Projektnamn</Label><Input value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="T.ex. SEO Kampanj" /></div>
                <div><Label>Kund</Label><Input value={newProject.client} onChange={e => setNewProject({...newProject, client: e.target.value})} placeholder="Kundnamn" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={newProject.status} onValueChange={v => setNewProject({...newProject, status: v as ProjectStatus})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Väntande</SelectItem>
                        <SelectItem value="working">Pågår</SelectItem>
                        <SelectItem value="review">Granskning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioritet</Label>
                    <Select value={newProject.priority} onValueChange={v => setNewProject({...newProject, priority: v as ProjectPriority})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Projekt</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Kund</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Prioritet</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Ansvarig</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Budget</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Deadline</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((project, i) => {
                const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
                const editing = isEditing(project.id);
                return (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => !editing && navigate(`/projects/${project.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <Input
                          value={editData.name || ''}
                          onChange={e => setEditData({ ...editData, name: e.target.value })}
                          className="h-8 text-sm"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <p className="font-medium text-sm">{project.name}</p>
                          <div className="flex gap-1.5 mt-1">
                            {project.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{tag}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {editing ? (
                        <Input
                          value={editData.client || ''}
                          onChange={e => setEditData({ ...editData, client: e.target.value })}
                          className="h-8 text-sm"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : project.client}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <Select
                        value={project.status}
                        onValueChange={v => {
                          updateProject(project.id, { status: v as ProjectStatus });
                          toast.success('Status uppdaterad!');
                        }}
                      >
                        <SelectTrigger className="h-8 w-32 border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
                          <StatusBadge status={project.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <Select
                        value={project.priority}
                        onValueChange={v => {
                          updateProject(project.id, { priority: v as ProjectPriority });
                          toast.success('Prioritet uppdaterad!');
                        }}
                      >
                        <SelectTrigger className="h-8 w-28 border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
                          <PriorityBadge priority={project.priority} />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {editing ? (
                        <Input
                          value={editData.assignee || ''}
                          onChange={e => setEditData({ ...editData, assignee: e.target.value })}
                          className="h-8 text-sm"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : project.assignee}
                    </td>
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <Input
                          type="number"
                          value={editData.budget || 0}
                          onChange={e => setEditData({ ...editData, budget: Number(e.target.value) })}
                          className="h-8 text-sm w-24"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{(project.spent / 1000).toFixed(0)}k</span>
                            <span className="text-muted-foreground">{(project.budget / 1000).toFixed(0)}k kr</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {editing ? (
                        <Input
                          type="date"
                          value={editData.deadline || ''}
                          onChange={e => setEditData({ ...editData, deadline: e.target.value })}
                          className="h-8 text-sm"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : project.deadline}
                    </td>
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-status-done" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-status-stuck" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => startEdit(e, project)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
