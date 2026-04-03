import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Trash2, LayoutGrid, List, Calendar, Users, GripVertical, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

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
  pending: 'border-l-blue-500',
  working: 'border-l-amber-500',
  review: 'border-l-purple-500',
  done: 'border-l-emerald-500',
  stuck: 'border-l-red-500',
};

const statusDotColors: Record<ProjectStatus, string> = {
  pending: 'bg-blue-500',
  working: 'bg-amber-500',
  review: 'bg-purple-500',
  done: 'bg-emerald-500',
  stuck: 'bg-red-500',
};

const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Väntande',
  working: 'Pågår',
  review: 'Granskning',
  done: 'Klar',
  stuck: 'Blockerad',
};

type ViewMode = 'table' | 'kanban' | 'timeline';

/* ===== Sortable Kanban Card ===== */
function SortableCard({ project, navigate, onDelete }: { project: Project; navigate: (path: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`bg-card rounded-xl border border-l-[3px] ${statusColors[project.status]} p-3.5 cursor-pointer group hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-2">
        <button {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/60 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0" onClick={() => navigate(`/projects/${project.id}`)}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{project.name}</p>
            <PriorityBadge priority={project.priority} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
          {project.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {project.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{tag}</span>)}
            </div>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{(project.spent / 1000).toFixed(0)}k spenderat</span>
              <span>{(project.budget / 1000).toFixed(0)}k kr</span>
            </div>
            <Progress value={pct} className={`h-1 ${pct > 90 ? '[&>div]:bg-red-500' : ''}`} />
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1"><Users className="h-3 w-3" />{project.assignee}</div>
            <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.deadline}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-[10px] py-1 px-2 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Ta bort projekt?</AlertDialogTitle><AlertDialogDescription>Ta bort {project.name}? Detta kan inte ångras.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(project.id)}>Ta bort</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ===== Droppable Column ===== */
function DroppableColumn({ status, children, count }: { status: ProjectStatus; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  return (
    <div ref={setNodeRef} className="min-w-[250px] w-[250px] sm:min-w-[280px] sm:w-[280px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${statusDotColors[status]}`} />
        <span className="font-heading font-semibold text-sm">{statusLabels[status]}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className={`space-y-2.5 min-h-[80px] rounded-xl p-1 transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-dashed' : ''}`}>
        {children}
        {count === 0 && !isOver && <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">Dra projekt hit</div>}
      </div>
    </div>
  );
}

/* ===== Drag Overlay Card ===== */
function DragOverlayCard({ project }: { project: Project }) {
  const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  return (
    <div className={`bg-card rounded-xl border border-l-[3px] ${statusColors[project.status]} p-3.5 shadow-2xl w-[270px] rotate-2`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{project.name}</p>
        <PriorityBadge priority={project.priority} />
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
      <div className="mt-3">
        <Progress value={pct} className="h-1" />
      </div>
    </div>
  );
}

/* ===== Main Component ===== */
export default function Projects() {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', client: '', status: 'pending' as ProjectStatus, priority: 'medium' as ProjectPriority, deadline: '', budget: '', assignee: '' });

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);
  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const projectsByStatus = useMemo(() => {
    const map: Record<ProjectStatus, Project[]> = { pending: [], working: [], review: [], done: [], stuck: [] };
    filtered.forEach(p => map[p.status].push(p));
    return map;
  }, [filtered]);

  const handleDelete = (id: string) => {
    deleteProject(id);
    toast.success('Projekt borttaget!');
  };

  const handleCreate = () => {
    if (!newProject.name || !newProject.client) { toast.error('Fyll i projektnamn och kund'); return; }
    addProject({
      name: newProject.name, client: newProject.client, status: newProject.status,
      priority: newProject.priority, deadline: newProject.deadline || '2026-05-01',
      budget: Number(newProject.budget) || 0, spent: 0,
      assignee: newProject.assignee || 'Ej tilldelad', tags: [],
    });
    setDialogOpen(false);
    setNewProject({ name: '', client: '', status: 'pending', priority: 'medium', deadline: '', budget: '', assignee: '' });
    toast.success('Projekt skapat!');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over || !activeId) return;
    const overId = String(over.id);
    if (overId.startsWith('column-')) {
      const newStatus = overId.replace('column-', '') as ProjectStatus;
      const project = projects.find(p => p.id === activeId);
      if (project && project.status !== newStatus) {
        updateProject(activeId, { status: newStatus });
      }
    } else {
      const overProject = projects.find(p => p.id === overId);
      const dragProject = projects.find(p => p.id === activeId);
      if (overProject && dragProject && overProject.status !== dragProject.status) {
        updateProject(activeId, { status: overProject.status });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    if (over && activeId) {
      const draggedProject = projects.find(p => p.id === activeId);
      const overId = String(over.id);
      let targetStatus: ProjectStatus | null = null;

      if (overId.startsWith('column-')) {
        targetStatus = overId.replace('column-', '') as ProjectStatus;
      } else {
        const overProject = projects.find(p => p.id === overId);
        if (overProject) targetStatus = overProject.status;
      }

      if (targetStatus && draggedProject && draggedProject.status !== targetStatus) {
        updateProject(activeId, { status: targetStatus });
        toast.success(`Flyttad till ${statusLabels[targetStatus]}`);
      }
    }
    setActiveId(null);
  };

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const activeCount = projects.filter(p => p.status !== 'done').length;

  // Timeline data
  const timelineProjects = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [filtered]);

  const timelineMonths = useMemo(() => {
    const months = new Map<string, Project[]>();
    timelineProjects.forEach(p => {
      const d = new Date(p.deadline);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
      if (!months.has(key)) months.set(key, []);
      months.get(key)!.push(p);
    });
    return Array.from(months.entries()).map(([key, projs]) => {
      const d = new Date(projs[0].deadline);
      return { key, label: d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' }), projects: projs };
    });
  }, [timelineProjects]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Projekt</h1>
          <p className="text-sm text-muted-foreground">{projects.length} projekt · {activeCount} aktiva · {(totalBudget / 1000).toFixed(0)}k kr budget</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
            {([
              { mode: 'table' as ViewMode, icon: List, label: 'Tabell' },
              { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Kanban' },
              { mode: 'timeline' as ViewMode, icon: Clock, label: 'Tidslinje' },
            ]).map(v => (
              <Button key={v.mode} variant={viewMode === v.mode ? 'default' : 'ghost'} size="sm"
                className={`h-7 px-2.5 gap-1.5 rounded-md text-xs ${viewMode === v.mode ? 'bg-primary text-white shadow-sm' : ''}`}
                onClick={() => setViewMode(v.mode)}>
                <v.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{v.label}</span>
              </Button>
            ))}
          </div>

          <Select value={filter} onValueChange={(v) => setFilter(v as ProjectStatus | 'all')}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-lg"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="h-8 rounded-lg gap-1.5"><Plus className="h-3.5 w-3.5" />Nytt</Button></DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle className="font-heading">Skapa nytt projekt</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label className="text-xs">Projektnamn</Label><Input value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="T.ex. SEO Kampanj" className="rounded-lg" /></div>
                <div><Label className="text-xs">Kund</Label><Input value={newProject.client} onChange={e => setNewProject({...newProject, client: e.target.value})} placeholder="Kundnamn" className="rounded-lg" /></div>
                <div><Label className="text-xs">Ansvarig</Label><Input value={newProject.assignee} onChange={e => setNewProject({...newProject, assignee: e.target.value})} placeholder="Namn" className="rounded-lg" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Status</Label>
                    <Select value={newProject.status} onValueChange={v => setNewProject({...newProject, status: v as ProjectStatus})}>
                      <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Prioritet</Label>
                    <Select value={newProject.priority} onValueChange={v => setNewProject({...newProject, priority: v as ProjectPriority})}>
                      <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Deadline</Label><Input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} className="rounded-lg" /></div>
                  <div><Label className="text-xs">Budget (kr)</Label><Input type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} placeholder="0" className="rounded-lg" /></div>
                </div>
                <Button onClick={handleCreate} className="w-full rounded-lg">Skapa Projekt</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'kanban' ? (
          /* ========== KANBAN with DnD ========== */
          <motion.div key="kanban" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {statusOptions.map(status => {
                  const colProjects = projectsByStatus[status.value];
                  return (
                    <DroppableColumn key={status.value} status={status.value} count={colProjects.length}>
                      <SortableContext items={colProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {colProjects.map(project => (
                          <SortableCard key={project.id} project={project} navigate={navigate} onDelete={handleDelete} />
                        ))}
                      </SortableContext>
                    </DroppableColumn>
                  );
                })}
              </div>
              <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                {activeProject ? <DragOverlayCard project={activeProject} /> : null}
              </DragOverlay>
            </DndContext>
          </motion.div>

        ) : viewMode === 'timeline' ? (
          /* ========== TIMELINE VIEW ========== */
          <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            {timelineMonths.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Inga projekt att visa</p>}
            {timelineMonths.map(month => (
              <div key={month.key}>
                <h3 className="text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{month.label}</h3>
                <div className="relative pl-6 border-l-2 border-muted space-y-3">
                  {month.projects.map(project => {
                    const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
                    const daysLeft = Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={project.id}
                        className={`relative bg-card rounded-xl border border-l-[3px] ${statusColors[project.status]} p-4 cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div className={`absolute -left-[25px] w-3 h-3 rounded-full border-2 border-card ${statusDotColors[project.status]}`} />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{project.name}</p>
                              <StatusBadge status={project.status} />
                              <PriorityBadge priority={project.priority} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{project.client} · {project.assignee}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-500' : daysLeft < 7 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d försenad` : daysLeft === 0 ? 'Idag' : `${daysLeft}d kvar`}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{project.deadline}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={pct} className={`h-1.5 flex-1 ${pct > 90 ? '[&>div]:bg-red-500' : ''}`} />
                          <span className="text-[11px] text-muted-foreground shrink-0">{(project.spent / 1000).toFixed(0)}k / {(project.budget / 1000).toFixed(0)}k kr</span>
                        </div>
                        {project.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {project.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{tag}</span>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>

        ) : (
          /* ========== TABLE VIEW ========== */
          <motion.div key="table" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[900px]">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[4%]" />
                </colgroup>
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Projekt</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Kund</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Status</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Prioritet</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Ansvarig</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Budget</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Deadline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((project, i) => {
                    const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
                    return (
                      <motion.tr key={project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="monday-row group">
                        <td className="px-4 py-2.5 overflow-hidden">
                          <div className="cursor-pointer truncate" onClick={() => navigate(`/projects/${project.id}`)}>
                            <span className="text-sm font-medium hover:text-primary transition-colors">{project.name}</span>
                            {project.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {project.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 overflow-hidden">
                          <span className="text-sm truncate block">{project.client}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Select value={project.status} onValueChange={v => { updateProject(project.id, { status: v as ProjectStatus }); toast.success('Status uppdaterad'); }}>
                            <SelectTrigger className="h-7 w-full border-none bg-transparent p-0 px-1 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
                              <StatusBadge status={project.status} />
                            </SelectTrigger>
                            <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2.5">
                          <Select value={project.priority} onValueChange={v => { updateProject(project.id, { priority: v as ProjectPriority }); toast.success('Prioritet uppdaterad'); }}>
                            <SelectTrigger className="h-7 w-full border-none bg-transparent p-0 px-1 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
                              <PriorityBadge priority={project.priority} />
                            </SelectTrigger>
                            <SelectContent>{priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2.5 overflow-hidden">
                          <span className="text-sm truncate block">{project.assignee}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="space-y-1">
                            <div className="text-xs font-medium">{(project.spent / 1000).toFixed(0)}k / {(project.budget / 1000).toFixed(0)}k kr</div>
                            <Progress value={pct} className={`h-1 ${pct > 90 ? '[&>div]:bg-red-500' : ''}`} />
                            <div className="text-[10px] text-muted-foreground">{pct}% använt</div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs">{project.deadline}</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Ta bort projekt?</AlertDialogTitle><AlertDialogDescription>Ta bort {project.name}?</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Avbryt</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => handleDelete(project.id)}>Ta bort</AlertDialogAction></AlertDialogFooter>
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
