import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, MoreHorizontal } from 'lucide-react';
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
import { Project, ProjectStatus, ProjectPriority } from '@/types/crm';
import { toast } from 'sonner';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', status: 'pending' as ProjectStatus, priority: 'medium' as ProjectPriority, deadline: '', budget: '' });

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

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
              <SelectItem value="working">Pågår</SelectItem>
              <SelectItem value="pending">Väntande</SelectItem>
              <SelectItem value="review">Granskning</SelectItem>
              <SelectItem value="done">Klar</SelectItem>
              <SelectItem value="stuck">Blockerad</SelectItem>
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
                        <SelectItem value="low">Låg</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">Hög</SelectItem>
                        <SelectItem value="critical">Kritisk</SelectItem>
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((project, i) => {
                const pct = Math.round((project.spent / project.budget) * 100);
                return (
                  <motion.tr key={project.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-sm">{project.name}</p>
                      <div className="flex gap-1.5 mt-1">
                        {project.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm">{project.client}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={project.status} /></td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={project.priority} /></td>
                    <td className="px-5 py-3.5 text-sm">{project.assignee}</td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{(project.spent / 1000).toFixed(0)}k</span>
                          <span className="text-muted-foreground">{(project.budget / 1000).toFixed(0)}k kr</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{project.deadline}</td>
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
