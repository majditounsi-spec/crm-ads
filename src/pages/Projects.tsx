import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Trash2, LayoutGrid, List, Calendar, Users, GripVertical, Clock, Columns3, Eye, EyeOff, ArrowUp, ArrowDown, ChevronRight, ChevronDown, CheckCircle2, UserPlus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/types/crm';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Project, ProjectStatus, ProjectPriority } from '@/types/crm';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useHourlyRate, getProjectHours, computeProfitability } from '@/hooks/useBilling';
import { toast } from 'sonner';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

// ── Avatar helpers (Monday.com style) ──
const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-fuchsia-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getProjectAssignees(project: Project): string[] {
  if (project.assignees && project.assignees.length > 0) return project.assignees;
  if (project.assignee && project.assignee !== 'Ej tilldelad') return [project.assignee];
  return [];
}

function AvatarCircle({ name, size = 'sm', showTooltip = true }: { name: string; size?: 'sm' | 'md'; showTooltip?: boolean }) {
  const s = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs';
  return (
    <div className={`${s} rounded-full ${getAvatarColor(name)} text-white font-semibold flex items-center justify-center ring-2 ring-card shrink-0 cursor-default`}
      title={showTooltip ? name : undefined}>
      {getInitials(name)}
    </div>
  );
}

function AssigneeSelector({ assignees, allMembers, onChange }: { assignees: string[]; allMembers: string[]; onChange: (assignees: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggleMember = (name: string) => {
    if (assignees.includes(name)) {
      onChange(assignees.filter(a => a !== name));
    } else {
      onChange([...assignees, name]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-0.5 cursor-pointer" onClick={() => setOpen(!open)}>
        {assignees.length > 0 ? (
          <div className="flex -space-x-2">
            {assignees.slice(0, 4).map(name => (
              <AvatarCircle key={name} name={name} />
            ))}
            {assignees.length > 4 && (
              <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-card">
                +{assignees.length - 4}
              </div>
            )}
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors">
            <UserPlus className="h-3 w-3 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-xl shadow-lg p-2 w-56 max-h-64 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1">Tilldela personal</p>
            {allMembers.map(name => {
              const isSelected = assignees.includes(name);
              return (
                <button key={name} onClick={() => toggleMember(name)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'}`}>
                  <AvatarCircle name={name} size="sm" showTooltip={false} />
                  <span className="flex-1 text-left text-xs font-medium truncate">{name}</span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
            {assignees.length > 0 && (
              <button onClick={() => { onChange([]); setOpen(false); }}
                className="w-full text-center text-[10px] text-muted-foreground hover:text-destructive mt-1 pt-1 border-t">
                Rensa alla
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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

/* ===== Column Configuration ===== */
type ColumnKey = 'name' | 'client' | 'status' | 'priority' | 'assignee' | 'budget' | 'deadline' | 'tags' | 'spent' | 'timeLogged';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  width: string;
}

const allColumns: ColumnDef[] = [
  { key: 'name', label: 'Projekt', width: '22%' },
  { key: 'client', label: 'Företag', width: '12%' },
  { key: 'status', label: 'Status', width: '10%' },
  { key: 'priority', label: 'Prioritet', width: '9%' },
  { key: 'assignee', label: 'Ansvarig', width: '11%' },
  { key: 'budget', label: 'Budget', width: '12%' },
  { key: 'timeLogged', label: 'Loggad tid', width: '12%' },
  { key: 'deadline', label: 'Deadline', width: '10%' },
  { key: 'tags', label: 'Taggar', width: '10%' },
  { key: 'spent', label: 'Spenderat', width: '10%' },
];

const defaultColumnOrder: ColumnKey[] = ['name', 'client', 'status', 'priority', 'assignee', 'budget', 'timeLogged', 'deadline'];
const COLUMN_STORAGE_KEY = 'marketflow_project_columns_v2';

function loadColumnConfig(): ColumnKey[] {
  try {
    const stored = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return defaultColumnOrder;
}

function saveColumnConfig(columns: ColumnKey[]) {
  try {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns));
  } catch {}
}

// ── Task helpers for subtasks ──
function loadProjectTasks(projectId: string): Task[] {
  try {
    const stored = localStorage.getItem(`marketflow_tasks_${projectId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveProjectTasks(projectId: string, tasks: Task[]) {
  try {
    localStorage.setItem(`marketflow_tasks_${projectId}`, JSON.stringify(tasks));
  } catch {}
}

function RenderAssigneeCell({ project, teamMembers, updateProject }: { project: Project; teamMembers: string[]; updateProject: (id: string, updates: Partial<Project>) => void }) {
  const assignees = getProjectAssignees(project);
  return (
    <AssigneeSelector
      assignees={assignees}
      allMembers={teamMembers}
      onChange={(newAssignees) => {
        updateProject(project.id, {
          assignees: newAssignees,
          assignee: newAssignees[0] || 'Ej tilldelad',
        });
        toast.success('Personal uppdaterad');
      }}
    />
  );
}

function renderCell(project: Project, col: ColumnKey, navigate: (path: string) => void, updateProject: (id: string, updates: Partial<Project>) => void, teamMembers?: string[], hourlyRate: number = 1750) {
  const hours = getProjectHours(project.id);
  const profit = computeProfitability(project.budget, hours, hourlyRate);
  const pct = Math.round(profit.budgetUsedPct);
  switch (col) {
    case 'name':
      return (
        <div className="cursor-pointer min-w-0" onClick={() => navigate(`/projects/${project.id}`)}>
          <span className="text-sm font-semibold hover:text-primary transition-colors block truncate">{project.name}</span>
          {(project.client || project.tags.filter(t => !t.startsWith('deal:')).length > 0) && (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {project.tags.filter(t => !t.startsWith('deal:')).slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
        </div>
      );
    case 'client':
      return <span className="text-sm truncate block">{project.client}</span>;
    case 'status':
      return (
        <Select value={project.status} onValueChange={v => { updateProject(project.id, { status: v as ProjectStatus }); toast.success('Status uppdaterad'); }}>
          <SelectTrigger className="h-7 w-full border-none bg-transparent p-0 px-1 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
            <StatusBadge status={project.status} />
          </SelectTrigger>
          <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      );
    case 'priority':
      return (
        <Select value={project.priority} onValueChange={v => { updateProject(project.id, { priority: v as ProjectPriority }); toast.success('Prioritet uppdaterad'); }}>
          <SelectTrigger className="h-7 w-full border-none bg-transparent p-0 px-1 shadow-none focus:ring-0 [&>svg]:opacity-0 hover:[&>svg]:opacity-100">
            <PriorityBadge priority={project.priority} />
          </SelectTrigger>
          <SelectContent>{priorityOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
      );
    case 'assignee':
      // Rendered separately via RenderAssigneeCell for state management
      return null;
    case 'budget':
      return (
        <div className="space-y-1">
          <div className="text-xs font-medium tabular-nums">{project.budget.toLocaleString('sv-SE')} <span className="text-muted-foreground">kr</span></div>
          <Progress value={Math.min(100, pct)} className={`h-1 ${profit.status === 'over' ? '[&>div]:bg-red-500' : profit.status === 'warning' ? '[&>div]:bg-amber-500' : ''}`} />
        </div>
      );
    case 'timeLogged':
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-xs font-medium tabular-nums">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {hours.toFixed(1)}h
          </div>
          <div className={`text-[10px] tabular-nums font-medium ${profit.status === 'over' ? 'text-red-500' : profit.status === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {profit.cost.toLocaleString('sv-SE')} kr ({pct}%)
          </div>
        </div>
      );
    case 'spent':
      return <span className="text-xs font-medium tabular-nums">{profit.cost.toLocaleString('sv-SE')} kr</span>;
    case 'deadline':
      return <span className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{project.deadline}</span>;
    case 'tags':
      return project.tags.length > 0 ? (
        <div className="flex gap-1 flex-wrap">
          {project.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>)}
        </div>
      ) : <span className="text-xs text-muted-foreground">—</span>;
    default:
      return null;
  }
}

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
            <div className="flex -space-x-1.5">
              {getProjectAssignees(project).slice(0, 3).map(name => (
                <div key={name} className={`h-6 w-6 rounded-full ${getAvatarColor(name)} text-white text-[9px] font-semibold flex items-center justify-center ring-2 ring-card`} title={name}>
                  {getInitials(name)}
                </div>
              ))}
              {getProjectAssignees(project).length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground text-[9px] font-semibold flex items-center justify-center ring-2 ring-card">
                  +{getProjectAssignees(project).length - 3}
                </div>
              )}
              {getProjectAssignees(project).length === 0 && <span className="text-muted-foreground">Ej tilldelad</span>}
            </div>
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
  const { memberNames } = useTeamMembers();
  const { rate: hourlyRate } = useHourlyRate();
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', client: '', status: 'pending' as ProjectStatus, priority: 'medium' as ProjectPriority, deadline: '', budget: '', assignee: '', assignees: [] as string[] });
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(loadColumnConfig);
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dragCol, setDragCol] = useState<ColumnKey | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnKey | null>(null);

  const handleColumnSort = useCallback((key: ColumnKey) => {
    if (sortColumn === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortColumn(null); setSortDirection('asc'); }
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const handleColDragStart = useCallback((key: ColumnKey) => {
    setDragCol(key);
  }, []);

  const handleColDragOver = useCallback((e: React.DragEvent, key: ColumnKey) => {
    e.preventDefault();
    setDragOverCol(key);
  }, []);

  const handleColDrop = useCallback((targetKey: ColumnKey) => {
    if (dragCol && dragCol !== targetKey) {
      setVisibleColumns(prev => {
        const next = [...prev];
        const fromIdx = next.indexOf(dragCol);
        const toIdx = next.indexOf(targetKey);
        if (fromIdx < 0 || toIdx < 0) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, dragCol);
        saveColumnConfig(next);
        return next;
      });
    }
    setDragCol(null);
    setDragOverCol(null);
  }, [dragCol]);

  const moveColumn = useCallback((key: ColumnKey, direction: 'up' | 'down') => {
    setVisibleColumns(prev => {
      const idx = prev.indexOf(key);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      saveColumnConfig(next);
      return next;
    });
  }, []);

  const toggleColumn = useCallback((key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      if (next.length === 0) return prev; // Don't allow empty
      saveColumnConfig(next);
      return next;
    });
  }, []);

  const filteredBase = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const filtered = useMemo(() => {
    if (!sortColumn) return filteredBase;
    return [...filteredBase].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'name': cmp = a.name.localeCompare(b.name, 'sv'); break;
        case 'client': cmp = a.client.localeCompare(b.client, 'sv'); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'priority': {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          cmp = (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
          break;
        }
        case 'assignee': {
          const aNames = getProjectAssignees(a).join(', ');
          const bNames = getProjectAssignees(b).join(', ');
          cmp = aNames.localeCompare(bNames, 'sv');
          break;
        }
        case 'budget': cmp = a.budget - b.budget; break;
        case 'spent': cmp = a.spent - b.spent; break;
        case 'deadline': cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); break;
        case 'tags': cmp = a.tags.join(',').localeCompare(b.tags.join(','), 'sv'); break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [filteredBase, sortColumn, sortDirection]);

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
      assignee: newProject.assignees[0] || newProject.assignee || 'Ej tilldelad',
      assignees: newProject.assignees.length > 0 ? newProject.assignees : undefined,
      tags: [],
    });
    setDialogOpen(false);
    setNewProject({ name: '', client: '', status: 'pending', priority: 'medium', deadline: '', budget: '', assignee: '', assignees: [] });
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

  // Subtask state
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectTasks, setProjectTasks] = useState<Record<string, Task[]>>({});
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  const toggleExpand = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
        // Load tasks if not already loaded
        if (!projectTasks[projectId]) {
          setProjectTasks(pt => ({ ...pt, [projectId]: loadProjectTasks(projectId) }));
        }
      }
      return next;
    });
  }, [projectTasks]);

  const addTask = useCallback((projectId: string) => {
    const title = newTaskInputs[projectId]?.trim();
    if (!title) return;
    const project = projects.find(p => p.id === projectId);
    const newTask: Task = {
      id: String(Date.now()),
      projectId,
      title,
      completed: false,
      assignee: project?.assignee || '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjectTasks(prev => {
      const tasks = [...(prev[projectId] || []), newTask];
      saveProjectTasks(projectId, tasks);
      return { ...prev, [projectId]: tasks };
    });
    setNewTaskInputs(prev => ({ ...prev, [projectId]: '' }));
    toast.success('Uppgift tillagd');
  }, [newTaskInputs, projects]);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    setProjectTasks(prev => {
      const tasks = (prev[projectId] || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      saveProjectTasks(projectId, tasks);
      return { ...prev, [projectId]: tasks };
    });
  }, []);

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    setProjectTasks(prev => {
      const tasks = (prev[projectId] || []).filter(t => t.id !== taskId);
      saveProjectTasks(projectId, tasks);
      return { ...prev, [projectId]: tasks };
    });
    toast.success('Uppgift borttagen');
  }, []);

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
          {/* Column settings */}
          {viewMode === 'table' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs">
                  <Columns3 className="h-3.5 w-3.5" /> Kolumner
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visa & ordna kolumner</p>
                <p className="text-[10px] text-muted-foreground mb-2">Dra kolumner för att ändra ordning. Klicka ögat för att visa/dölja.</p>
                <div className="space-y-1">
                  {/* Show visible columns in order first, then hidden ones */}
                  {[...visibleColumns.map(k => allColumns.find(c => c.key === k)!), ...allColumns.filter(c => !visibleColumns.includes(c.key))].map(col => {
                    const isVisible = visibleColumns.includes(col.key);
                    const idx = visibleColumns.indexOf(col.key);
                    return (
                      <div key={col.key}
                        draggable={isVisible}
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', col.key); }}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromKey = e.dataTransfer.getData('text/plain') as ColumnKey;
                          if (fromKey && fromKey !== col.key && isVisible) {
                            setVisibleColumns(prev => {
                              const next = [...prev];
                              const fromIdx = next.indexOf(fromKey);
                              const toIdx = next.indexOf(col.key);
                              if (fromIdx < 0 || toIdx < 0) return prev;
                              next.splice(fromIdx, 1);
                              next.splice(toIdx, 0, fromKey);
                              saveColumnConfig(next);
                              return next;
                            });
                          }
                        }}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${isVisible ? 'bg-muted/50 cursor-grab active:cursor-grabbing' : 'opacity-50'}`}>
                        <button onClick={() => toggleColumn(col.key)} className="shrink-0">
                          {isVisible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        {isVisible && <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                        <span className="flex-1 text-xs font-medium">{col.label}</span>
                        {isVisible && (
                          <div className="flex gap-0.5">
                            <button onClick={() => moveColumn(col.key, 'up')} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-20">
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button onClick={() => moveColumn(col.key, 'down')} disabled={idx === visibleColumns.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-20">
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-7" onClick={() => { setVisibleColumns(defaultColumnOrder); saveColumnConfig(defaultColumnOrder); setSortColumn(null); }}>
                  Återställ standard
                </Button>
              </PopoverContent>
            </Popover>
          )}

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
                <div>
                  <Label className="text-xs">Tilldela personal</Label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 min-h-[36px] p-2 border rounded-lg bg-background">
                    {newProject.assignees.map(name => (
                      <div key={name} className="flex items-center gap-1 bg-primary/10 text-primary rounded-full pl-1 pr-2 py-0.5">
                        <AvatarCircle name={name} size="sm" showTooltip={false} />
                        <span className="text-xs font-medium">{name}</span>
                        <button onClick={() => setNewProject(p => ({ ...p, assignees: p.assignees.filter(a => a !== name) }))} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <Select value="" onValueChange={v => {
                      if (v && !newProject.assignees.includes(v)) {
                        setNewProject(p => ({ ...p, assignees: [...p.assignees, v] }));
                      }
                    }}>
                      <SelectTrigger className="h-7 w-auto min-w-[120px] border-none shadow-none text-xs text-muted-foreground gap-1 p-0 px-1">
                        <UserPlus className="h-3 w-3" /><span>Lägg till...</span>
                      </SelectTrigger>
                      <SelectContent>
                        {memberNames.filter(n => !newProject.assignees.includes(n)).map(name => (
                          <SelectItem key={name} value={name}>
                            <div className="flex items-center gap-2">
                              <div className={`h-5 w-5 rounded-full ${getAvatarColor(name)} text-white text-[8px] font-semibold flex items-center justify-center`}>{getInitials(name)}</div>
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
              <table className="w-full table-fixed min-w-[700px]">
                <colgroup>
                  {visibleColumns.map(key => {
                    const col = allColumns.find(c => c.key === key);
                    return <col key={key} style={{ width: col?.width || '12%' }} />;
                  })}
                  <col style={{ width: '4%' }} />
                </colgroup>
                <thead>
                  <tr className="border-b bg-muted/30">
                    {visibleColumns.map(key => {
                      const col = allColumns.find(c => c.key === key)!;
                      const isSorted = sortColumn === key;
                      const isDragTarget = dragOverCol === key && dragCol !== key;
                      return (
                        <th key={key}
                          draggable
                          onDragStart={() => handleColDragStart(key)}
                          onDragOver={(e) => handleColDragOver(e, key)}
                          onDrop={() => handleColDrop(key)}
                          onDragEnd={() => { setDragCol(null); setDragOverCol(null); }}
                          onClick={() => handleColumnSort(key)}
                          className={`text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none hover:text-foreground hover:bg-muted/50 transition-colors ${isDragTarget ? 'bg-primary/10 border-l-2 border-primary' : ''} ${dragCol === key ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-30 cursor-grab shrink-0" />
                            <span>{col.label}</span>
                            {isSorted && (
                              sortDirection === 'asc'
                                ? <ArrowUp className="h-3 w-3 text-primary shrink-0" />
                                : <ArrowDown className="h-3 w-3 text-primary shrink-0" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((project, i) => {
                    const isExpanded = expandedProjects.has(project.id);
                    const tasks = projectTasks[project.id] || [];
                    const completedCount = tasks.filter(t => t.completed).length;
                    return (
                      <React.Fragment key={project.id}>
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className={`monday-row group ${isExpanded ? 'bg-muted/20' : ''}`}>
                          {visibleColumns.map((key, ci) => (
                            <td key={key} className={`py-2.5 align-middle overflow-hidden ${ci === 0 ? 'pl-3 pr-2' : 'px-3'}`}>
                              {key === 'assignee' ? (
                                <RenderAssigneeCell project={project} teamMembers={memberNames} updateProject={updateProject} />
                              ) : ci === 0 ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <button onClick={(e) => { e.stopPropagation(); toggleExpand(project.id); }}
                                    className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors -ml-0.5">
                                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                  </button>
                                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                                    <div className="text-sm font-semibold hover:text-primary transition-colors truncate">{project.name}</div>
                                    {(tasks.length > 0 || project.tags.filter(t => !t.startsWith('deal:')).length > 0) && (
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        {tasks.length > 0 && (
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                            <CheckCircle2 className="h-2.5 w-2.5" />{completedCount}/{tasks.length}
                                          </span>
                                        )}
                                        {project.tags.filter(t => !t.startsWith('deal:')).slice(0, 3).map(tag => (
                                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                renderCell(project, key, navigate, updateProject, memberNames, hourlyRate)
                              )}
                            </td>
                          ))}
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
                        {/* Subtask rows */}
                        {isExpanded && (
                          <>
                            {tasks.map(task => (
                              <tr key={task.id} className="bg-muted/10 hover:bg-muted/20 transition-colors group/task">
                                <td colSpan={Math.ceil(visibleColumns.length / 2)} className="px-3 py-1.5 pl-12">
                                  <div className="flex items-center gap-2">
                                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(project.id, task.id)} />
                                    <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                                  </div>
                                </td>
                                <td colSpan={visibleColumns.length - Math.ceil(visibleColumns.length / 2)} className="px-3 py-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{task.assignee || '—'}</span>
                                    <button onClick={() => deleteTask(project.id, task.id)}
                                      className="opacity-0 group-hover/task:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10">
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                  </div>
                                </td>
                                <td></td>
                              </tr>
                            ))}
                            <tr className="bg-muted/10">
                              <td colSpan={visibleColumns.length + 1} className="px-3 py-1.5 pl-12">
                                <div className="flex items-center gap-2">
                                  <Input value={newTaskInputs[project.id] || ''} onChange={e => setNewTaskInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                                    placeholder="Lägg till uppgift..." className="h-7 text-sm bg-transparent border-none shadow-none focus-visible:ring-1 flex-1 max-w-sm"
                                    onKeyDown={e => e.key === 'Enter' && addTask(project.id)} />
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => addTask(project.id)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          </>
                        )}
                      </React.Fragment>
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
