import { useState, useCallback, useEffect, useRef } from 'react';
import { useGetAccept, type GetAcceptDeal } from '@/hooks/useGetAccept';
import { useFortnox } from '@/hooks/useFortnox';
import { useProjects } from '@/hooks/useProjects';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, Search, Plus, Calendar, Mail, Phone,
  FileText, CreditCard, Check, Send, Eye, RefreshCw, CheckCircle2, XCircle,
  FileSignature, Receipt, Link2, Settings, LayoutGrid, List, Trash2,
  User, Building2, Tag, ArrowRight, Sparkles, PartyPopper, ChevronDown, ChevronRight,
  Pencil, GripVertical, Save,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

// ── Lead types ──
export type LeadStage = 'lead' | 'contact' | 'offer' | 'negotiation' | 'won' | 'lost';

export interface SalesLead {
  id: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  title: string;
  value: number;
  stage: LeadStage;
  assignee: string;
  tags: string[];
  notes: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  getAcceptDealId?: string;
}

const LEADS_KEY = 'marketflow_sales_leads';

const stageConfig: Record<LeadStage, { label: string; color: string; dotColor: string; icon: any }> = {
  lead: { label: 'Lead', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dotColor: 'bg-slate-400', icon: User },
  contact: { label: 'Kontaktad', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dotColor: 'bg-blue-500', icon: Phone },
  offer: { label: 'Offert skickad', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', dotColor: 'bg-violet-500', icon: FileText },
  negotiation: { label: 'Förhandling', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dotColor: 'bg-amber-500', icon: TrendingUp },
  won: { label: 'Vunnen!', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dotColor: 'bg-emerald-500', icon: PartyPopper },
  lost: { label: 'Förlorad', color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400', dotColor: 'bg-red-500', icon: XCircle },
};

const stageOrder: LeadStage[] = ['lead', 'contact', 'offer', 'negotiation', 'won'];

const sampleLeads: SalesLead[] = [
  { id: 'sl-1', company: 'TechStart AB', contactName: 'Anna Karlsson', contactEmail: 'anna@techstart.se', contactPhone: '070-123 4567', title: 'SEO Paket Q2', value: 45000, stage: 'won', assignee: 'Kevin', tags: ['SEO'], notes: 'Vill starta i maj', source: 'Hemsida', createdAt: '2026-03-15', updatedAt: '2026-03-20', getAcceptDealId: 'ga-1' },
  { id: 'sl-2', company: 'Nordic Food AB', contactName: 'Erik Svensson', contactEmail: 'erik@nordicfood.se', contactPhone: '073-555 1234', title: 'Google Ads Kampanj', value: 85000, stage: 'offer', assignee: 'Alban', tags: ['Google ADS'], notes: 'Budget godkänd av chef', source: 'Referens', createdAt: '2026-03-28', updatedAt: '2026-03-28' },
  { id: 'sl-3', company: 'FashionBrand Sthlm', contactName: 'Lisa Berg', contactEmail: 'lisa@fashionbrand.se', contactPhone: '076-999 8877', title: 'Meta + SEO Bundle', value: 120000, stage: 'negotiation', assignee: 'Elin', tags: ['META', 'SEO'], notes: 'Vill ha rabatt på årsavtal', source: 'LinkedIn', createdAt: '2026-03-30', updatedAt: '2026-04-02' },
  { id: 'sl-4', company: 'GreenEnergy AB', contactName: 'Johan Nilsson', contactEmail: 'johan@greenenergy.se', contactPhone: '070-111 2233', title: 'Film/Foto Produktion', value: 65000, stage: 'lead', assignee: 'Dan', tags: ['Film/Foto'], notes: '', source: 'Mässa', createdAt: '2026-04-01', updatedAt: '2026-04-01' },
  { id: 'sl-5', company: 'DataVision AB', contactName: 'Maria Lindberg', contactEmail: 'maria@datavision.se', contactPhone: '073-444 5566', title: 'Webb & SEO Årsavtal', value: 180000, stage: 'won', assignee: 'Roine', tags: ['WEBB', 'SEO'], notes: 'Stort konto, hög prio', source: 'Kall prospekt', createdAt: '2026-02-10', updatedAt: '2026-02-15', getAcceptDealId: 'ga-5' },
  { id: 'sl-6', company: 'HealthPlus AB', contactName: 'Peter Holm', contactEmail: 'peter@healthplus.se', contactPhone: '070-777 8899', title: 'Google Ads Optimering', value: 35000, stage: 'lost', assignee: 'Jonas', tags: ['Google ADS'], notes: 'Valde annan byrå', source: 'Google', createdAt: '2026-03-01', updatedAt: '2026-03-15' },
  { id: 'sl-7', company: 'BuildPro Nordic', contactName: 'Sara Ekström', contactEmail: 'sara@buildpro.se', contactPhone: '076-333 2211', title: 'Social Media Paket', value: 55000, stage: 'contact', assignee: 'Therese', tags: ['META'], notes: 'Bokat möte 10 april', source: 'Instagram', createdAt: '2026-04-02', updatedAt: '2026-04-05' },
  { id: 'sl-8', company: 'SportLife Sverige', contactName: 'Anders Jonsson', contactEmail: 'anders@sportlife.se', contactPhone: '070-666 5544', title: 'Komplett Mediabyrå-paket', value: 250000, stage: 'offer', assignee: 'Skhodran', tags: ['Google ADS', 'META', 'SEO', 'Film/Foto'], notes: 'Stort kontrakt, VD beslut', source: 'Referens', createdAt: '2026-04-01', updatedAt: '2026-04-07' },
  { id: 'sl-9', company: 'EduTech AB', contactName: 'Karin Lund', contactEmail: 'karin@edutech.se', contactPhone: '073-888 7766', title: 'SEO + Content', value: 40000, stage: 'lead', assignee: 'Hussein', tags: ['SEO'], notes: '', source: 'Hemsida', createdAt: '2026-04-05', updatedAt: '2026-04-05' },
  { id: 'sl-10', company: 'CleanHome AB', contactName: 'Magnus Ström', contactEmail: 'magnus@cleanhome.se', contactPhone: '070-222 3344', title: 'Webb Redesign', value: 75000, stage: 'contact', assignee: 'Anell', tags: ['WEBB'], notes: 'Vill ha offert inom en vecka', source: 'Kall prospekt', createdAt: '2026-04-03', updatedAt: '2026-04-06' },
];

function loadLeads(): SalesLead[] {
  try {
    const stored = localStorage.getItem(LEADS_KEY);
    if (stored) { const p = JSON.parse(stored); if (Array.isArray(p) && p.length > 0) return p; }
  } catch {}
  saveLeads(sampleLeads);
  return sampleLeads;
}

function saveLeads(leads: SalesLead[]) {
  try { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); } catch {}
}

// ── Confetti Animation ──
function ConfettiExplosion({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 600,
    y: -(Math.random() * 400 + 100),
    rotate: Math.random() * 720 - 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
        className="text-center z-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.5 }}
          className="text-6xl mb-2">🎉</motion.div>
        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-3xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
          Affären är vunnen!
        </motion.h2>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-lg text-muted-foreground mt-1">
          Projekt skapas automatiskt...
        </motion.p>
      </motion.div>
      {particles.map(p => (
        <motion.div key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
          style={{ width: p.size, height: p.size, backgroundColor: p.color, position: 'absolute', borderRadius: p.size > 8 ? '50%' : '2px' }}
        />
      ))}
    </div>
  );
}

// ── Avatar helper ──
const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-fuchsia-500'];
function getAvatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type ViewMode = 'kanban' | 'list';
type TabMode = 'pipeline' | 'invoices' | 'settings';

export default function SalesBoard() {
  const navigate = useNavigate();
  const { deals: gaDeals, config: gaConfig, connect: connectGA, disconnect: disconnectGA, syncDeals, addDeal, updateDealStatus } = useGetAccept();
  const { invoices, config: fnConfig, connect: connectFN, disconnect: disconnectFN, createInvoiceFromDeal, updateInvoiceStatus, isAlreadyInvoiced, totalRevenue, totalOutstanding } = useFortnox();
  const { projects, addProject } = useProjects();
  const { memberNames } = useTeamMembers();

  const [leads, setLeadsState] = useState<SalesLead[]>(loadLeads);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tab, setTab] = useState<TabMode>('pipeline');
  const [showConfetti, setShowConfetti] = useState(false);
  const [wonLead, setWonLead] = useState<SalesLead | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [editingLead, setEditingLead] = useState<SalesLead | null>(null);
  const [gaApiKey, setGaApiKey] = useState('');
  const [gaEntityId, setGaEntityId] = useState('');
  const [fnClientId, setFnClientId] = useState('');
  const [fnSecret, setFnSecret] = useState('');
  const [fnCompany, setFnCompany] = useState('');

  const [newLead, setNewLead] = useState({
    company: '', contactName: '', contactEmail: '', contactPhone: '',
    title: '', value: '', assignee: '', tags: '', notes: '', source: '',
  });

  const setLeads = useCallback((updater: SalesLead[] | ((prev: SalesLead[]) => SalesLead[])) => {
    setLeadsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLeads(next);
      return next;
    });
  }, []);

  const addLead = useCallback(() => {
    if (!newLead.company || !newLead.title) { toast.error('Fyll i företag och rubrik'); return; }
    const lead: SalesLead = {
      id: `sl-${Date.now()}`,
      company: newLead.company, contactName: newLead.contactName,
      contactEmail: newLead.contactEmail, contactPhone: newLead.contactPhone,
      title: newLead.title, value: Number(newLead.value) || 0,
      stage: 'lead', assignee: newLead.assignee || memberNames[0] || '',
      tags: newLead.tags ? newLead.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: newLead.notes, source: newLead.source,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setLeads(prev => [lead, ...prev]);
    setIsAddOpen(false);
    setNewLead({ company: '', contactName: '', contactEmail: '', contactPhone: '', title: '', value: '', assignee: '', tags: '', notes: '', source: '' });
    toast.success(`Lead "${lead.title}" skapad`);
  }, [newLead, memberNames, setLeads]);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success('Lead borttagen');
  }, [setLeads]);

  const updateLeadField = useCallback((id: string, field: keyof SalesLead, value: any) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value, updatedAt: new Date().toISOString().split('T')[0] } : l));
  }, [setLeads]);

  const moveLeadToStage = useCallback((id: string, newStage: LeadStage) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    if (newStage === 'won' && lead.stage !== 'won') {
      // Celebration!
      const updatedLead = { ...lead, stage: 'won' as LeadStage, updatedAt: new Date().toISOString().split('T')[0] };
      setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
      setWonLead(updatedLead);
      setShowConfetti(true);

      // Auto-create project
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 60);
      const alreadyCreated = projects.some(p => p.tags.includes(`deal:${id}`));
      if (!alreadyCreated) {
        addProject({
          name: updatedLead.title,
          client: updatedLead.company,
          status: 'pending',
          priority: updatedLead.value >= 100000 ? 'high' : updatedLead.value >= 50000 ? 'medium' : 'low',
          deadline: deadline.toISOString().split('T')[0],
          budget: updatedLead.value,
          spent: 0,
          assignee: updatedLead.assignee || 'Ej tilldelad',
          tags: [...updatedLead.tags, `deal:${id}`],
        });
      }
      return;
    }

    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage, updatedAt: new Date().toISOString().split('T')[0] } : l));
    toast.success(`Flyttad till ${stageConfig[newStage].label}`);
  }, [leads, setLeads, projects, addProject]);

  const isProjectCreated = useCallback((leadId: string) => {
    return projects.some(p => p.tags.includes(`deal:${leadId}`));
  }, [projects]);

  // Drag & drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', leadId); } catch {}
  }, []);
  const handleDragEnd = useCallback(() => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  }, []);
  const handleDragOverStage = useCallback((e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  }, []);
  const handleDropStage = useCallback((e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    const id = draggedLeadId || (() => { try { return e.dataTransfer.getData('text/plain'); } catch { return null; } })();
    if (id) {
      const lead = leads.find(l => l.id === id);
      if (lead && lead.stage !== stage) moveLeadToStage(id, stage);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  }, [draggedLeadId, leads, moveLeadToStage]);

  // Edit lead
  const openEdit = useCallback((lead: SalesLead) => setEditingLead({ ...lead }), []);
  const saveEditedLead = useCallback(() => {
    if (!editingLead) return;
    if (!editingLead.company || !editingLead.title) { toast.error('Fyll i företag och rubrik'); return; }
    const updated = { ...editingLead, updatedAt: new Date().toISOString().split('T')[0] };
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setEditingLead(null);
    toast.success('Lead uppdaterad');
  }, [editingLead, setLeads]);

  const filteredLeads = leads.filter(l => {
    const s = search.toLowerCase();
    return !s || l.company.toLowerCase().includes(s) || l.title.toLowerCase().includes(s) ||
      l.contactName.toLowerCase().includes(s) || l.assignee.toLowerCase().includes(s);
  });

  const activeLeads = filteredLeads.filter(l => l.stage !== 'lost');
  const totalValue = activeLeads.reduce((s, l) => s + l.value, 0);
  const wonValue = filteredLeads.filter(l => l.stage === 'won').reduce((s, l) => s + l.value, 0);
  const pipelineValue = filteredLeads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + l.value, 0);
  const winRate = leads.filter(l => ['won', 'lost'].includes(l.stage)).length > 0
    ? Math.round(leads.filter(l => l.stage === 'won').length / leads.filter(l => ['won', 'lost'].includes(l.stage)).length * 100) : 0;

  const handleSendInvoice = (id: string) => { updateInvoiceStatus(id, 'sent'); toast.success('Faktura skickad'); };
  const handleMarkPaid = (id: string) => { updateInvoiceStatus(id, 'paid'); toast.success('Faktura markerad som betald'); };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && <ConfettiExplosion onDone={() => { setShowConfetti(false); if (wonLead) { toast.success(`Projekt "${wonLead.title}" skapat till produktion!`); setWonLead(null); } }} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Säljtavla</h1>
          <p className="text-sm text-muted-foreground">{activeLeads.length} aktiva leads · {leads.filter(l => l.stage === 'won').length} vunna</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Tab switcher */}
          <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
            {([
              { mode: 'pipeline' as TabMode, label: 'Pipeline', icon: TrendingUp },
              { mode: 'invoices' as TabMode, label: 'Fakturor', icon: Receipt },
              { mode: 'settings' as TabMode, label: 'Kopplingar', icon: Settings },
            ]).map(v => (
              <Button key={v.mode} variant={tab === v.mode ? 'default' : 'ghost'} size="sm"
                className={`h-7 px-2.5 gap-1.5 rounded-md text-xs ${tab === v.mode ? 'bg-primary text-white shadow-sm' : ''}`}
                onClick={() => setTab(v.mode)}>
                <v.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{v.label}</span>
              </Button>
            ))}
          </div>
          {tab === 'pipeline' && (
            <>
              {/* View toggle */}
              <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" className={`h-7 px-2 rounded-md text-xs ${viewMode === 'kanban' ? 'bg-primary text-white' : ''}`} onClick={() => setViewMode('kanban')}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className={`h-7 px-2 rounded-md text-xs ${viewMode === 'list' ? 'bg-primary text-white' : ''}`} onClick={() => setViewMode('list')}>
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button size="sm" className="h-7 rounded-lg gap-1.5 text-xs" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Ny lead
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { title: 'Pipeline-värde', value: `${(pipelineValue / 1000).toFixed(0)}k`, icon: DollarSign, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { title: 'Vunnet', value: `${(wonValue / 1000).toFixed(0)}k`, icon: PartyPopper, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Win rate', value: `${winRate}%`, icon: TrendingUp, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
          { title: 'Fakturerat', value: `${(totalRevenue / 1000).toFixed(0)}k`, icon: CreditCard, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
        ].map(stat => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={`pt-4 pb-3 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                    <p className="text-lg sm:text-xl font-heading font-bold mt-1">{stat.value}{stat.title !== 'Win rate' ? ' kr' : ''}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.iconColor}`}><stat.icon className="h-4 w-4" /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {tab === 'pipeline' ? (
        <>
          {/* Search */}
          <motion.div variants={item} className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Sök lead, företag, säljare..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-lg" />
          </motion.div>

          <AnimatePresence mode="wait">
            {viewMode === 'kanban' ? (
              /* ========== KANBAN VIEW ========== */
              <motion.div key="kanban" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-4">
                {stageOrder.map(stage => {
                  const stageLeads = filteredLeads.filter(l => l.stage === stage);
                  const stageValue = stageLeads.reduce((s, l) => s + l.value, 0);
                  const cfg = stageConfig[stage];
                  const isDragOver = dragOverStage === stage;
                  return (
                    <div key={stage}
                      className={`min-w-[270px] w-[270px] sm:min-w-[300px] sm:w-[300px] shrink-0 rounded-xl transition-colors ${isDragOver ? 'bg-primary/5 ring-2 ring-primary/30' : ''}`}
                      onDragOver={(e) => handleDragOverStage(e, stage)}
                      onDragLeave={() => setDragOverStage(prev => prev === stage ? null : prev)}
                      onDrop={(e) => handleDropStage(e, stage)}>
                      <div className="flex items-center justify-between mb-3 px-1 pt-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                          <span className="font-heading font-semibold text-sm">{cfg.label}</span>
                          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stageLeads.length}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{(stageValue / 1000).toFixed(0)}k kr</span>
                      </div>
                      <div className="space-y-2.5 min-h-[120px] px-1 pb-1">
                        {stageLeads.map((lead, i) => {
                          const StageIcon = cfg.icon;
                          const isDragging = draggedLeadId === lead.id;
                          return (
                            <motion.div key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }} transition={{ delay: i * 0.03 }}
                              draggable
                              onDragStart={(e) => handleDragStart(e as any, lead.id)}
                              onDragEnd={handleDragEnd}
                              className={`bg-card rounded-xl border p-3.5 group hover:shadow-md transition-all relative cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40 scale-95' : ''} ${stage === 'won' ? 'ring-1 ring-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1 flex items-start gap-1.5">
                                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{lead.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />{lead.company}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={`text-[10px] shrink-0 ${cfg.color}`}>
                                  <StageIcon className="h-3 w-3 mr-1" />{cfg.label}
                                </Badge>
                              </div>

                              {/* Tags */}
                              {lead.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {lead.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{t}</span>)}
                                </div>
                              )}

                              {/* Value + Assignee */}
                              <div className="mt-3 flex items-center justify-between">
                                <span className="font-heading font-bold text-sm">{lead.value.toLocaleString('sv-SE')} kr</span>
                                <div className="flex items-center gap-1.5">
                                  <div className={`h-6 w-6 rounded-full ${getAvatarColor(lead.assignee)} text-white text-[9px] font-bold flex items-center justify-center`}>
                                    {getInitials(lead.assignee)}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{lead.assignee}</span>
                                </div>
                              </div>

                              {/* Contact info */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                                <span>{lead.contactName}</span>
                                <span>{lead.createdAt}</span>
                              </div>

                              {/* Stage move buttons */}
                              <div className="mt-2 pt-2 border-t flex gap-1 flex-wrap">
                                {stage !== 'won' && (
                                  <>
                                    {stageOrder.filter(s => s !== stage && s !== 'won').map(s => (
                                      <Button key={s} size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded-md gap-1"
                                        onClick={() => moveLeadToStage(lead.id, s)}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${stageConfig[s].dotColor}`} />{stageConfig[s].label}
                                      </Button>
                                    ))}
                                    <Button size="sm" variant="default" className="h-6 px-2 text-[10px] rounded-md gap-1 bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => moveLeadToStage(lead.id, 'won')}>
                                      <Sparkles className="h-3 w-3" /> Vunnen!
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded-md gap-1 text-red-500 hover:text-red-600"
                                      onClick={() => moveLeadToStage(lead.id, 'lost')}>
                                      <XCircle className="h-3 w-3" /> Förlorad
                                    </Button>
                                  </>
                                )}
                                {stage === 'won' && isProjectCreated(lead.id) && (
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                    <Check className="h-3 w-3" /> Projekt skapat
                                  </div>
                                )}
                              </div>

                              {/* Edit + Delete */}
                              <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                  onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                        {stageLeads.length === 0 && (
                          <div className={`rounded-xl border border-dashed p-6 text-center text-xs transition-colors ${isDragOver ? 'border-primary/50 text-primary bg-primary/5' : 'text-muted-foreground'}`}>
                            {isDragOver ? 'Släpp här' : 'Dra hit eller klicka + Ny lead'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Lost column */}
                <div
                  className={`min-w-[270px] w-[270px] sm:min-w-[300px] sm:w-[300px] shrink-0 opacity-80 rounded-xl transition-colors ${dragOverStage === 'lost' ? 'bg-red-500/5 ring-2 ring-red-500/30 opacity-100' : ''}`}
                  onDragOver={(e) => handleDragOverStage(e, 'lost')}
                  onDragLeave={() => setDragOverStage(prev => prev === 'lost' ? null : prev)}
                  onDrop={(e) => handleDropStage(e, 'lost')}>
                  <div className="flex items-center gap-2 mb-3 px-1 pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="font-heading font-semibold text-sm">Förlorade</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{filteredLeads.filter(l => l.stage === 'lost').length}</span>
                  </div>
                  <div className="space-y-2.5 min-h-[120px] px-1 pb-1">
                    {filteredLeads.filter(l => l.stage === 'lost').map(lead => {
                      const isDragging = draggedLeadId === lead.id;
                      return (
                      <div key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e as any, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-card rounded-xl border p-3.5 group relative cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40 scale-95' : ''}`}>
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{lead.title}</p>
                            <p className="text-xs text-muted-foreground">{lead.company}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold">{lead.value.toLocaleString('sv-SE')} kr</span>
                          <Badge className="text-[10px] bg-red-100 text-red-600">Förlorad</Badge>
                        </div>
                        <div className="mt-2 flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded-md gap-1" onClick={() => moveLeadToStage(lead.id, 'lead')}>
                            <ArrowRight className="h-3 w-3" /> Återaktivera
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      );
                    })}
                    {filteredLeads.filter(l => l.stage === 'lost').length === 0 && (
                      <div className={`rounded-xl border border-dashed p-6 text-center text-xs transition-colors ${dragOverStage === 'lost' ? 'border-red-500/50 text-red-600 bg-red-500/5' : 'text-muted-foreground'}`}>
                        {dragOverStage === 'lost' ? 'Släpp här' : 'Inga förlorade'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ========== LIST VIEW ========== */
              <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="w-8"></th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Lead</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Företag</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Steg</th>
                        <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Värde</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Ansvarig</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Kontakt</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Taggar</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Datum</th>
                        <th className="w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredLeads.filter(l => l.stage !== 'lost').map((lead, i) => {
                        const cfg = stageConfig[lead.stage];
                        const StageIcon = cfg.icon;
                        const isExpanded = expandedRows.has(lead.id);
                        return (
                          <> 
                            <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                              className={`hover:bg-muted/30 transition-colors group ${lead.stage === 'won' ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                              <td className="px-2 py-2.5">
                                <button onClick={() => setExpandedRows(prev => { const n = new Set(prev); n.has(lead.id) ? n.delete(lead.id) : n.add(lead.id); return n; })}
                                  className="p-0.5 rounded hover:bg-muted transition-colors">
                                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                </button>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="text-sm font-medium">{lead.title}</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="text-sm flex items-center gap-1"><Building2 className="h-3 w-3 text-muted-foreground" />{lead.company}</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <Select value={lead.stage} onValueChange={v => moveLeadToStage(lead.id, v as LeadStage)}>
                                  <SelectTrigger className="h-7 w-auto border-none bg-transparent shadow-none p-0 px-1 focus:ring-0">
                                    <Badge className={`text-[10px] ${cfg.color}`}><StageIcon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[...stageOrder, 'lost' as LeadStage].map(s => (
                                      <SelectItem key={s} value={s}>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${stageConfig[s].dotColor}`} />
                                          {stageConfig[s].label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className="text-sm font-bold tabular-nums">{lead.value.toLocaleString('sv-SE')} kr</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <Select value={lead.assignee} onValueChange={v => updateLeadField(lead.id, 'assignee', v)}>
                                  <SelectTrigger className="h-7 w-auto border-none bg-transparent shadow-none p-0 px-1 focus:ring-0">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`h-5 w-5 rounded-full ${getAvatarColor(lead.assignee)} text-white text-[8px] font-bold flex items-center justify-center`}>
                                        {getInitials(lead.assignee)}
                                      </div>
                                      <span className="text-xs">{lead.assignee}</span>
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {memberNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="text-xs text-muted-foreground">{lead.contactName}</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1 flex-wrap">
                                  {lead.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{t}</span>)}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-muted-foreground">{lead.updatedAt}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {lead.stage !== 'won' && (
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded-md gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30"
                                      onClick={() => moveLeadToStage(lead.id, 'won')}>
                                      <Sparkles className="h-3 w-3" /> Vunnen
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary" onClick={() => openEdit(lead)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteLead(lead.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                            {/* Expanded detail row */}
                            {isExpanded && (
                              <tr key={`${lead.id}-detail`} className="bg-muted/10">
                                <td></td>
                                <td colSpan={9} className="px-3 py-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Kontaktinfo</p>
                                      <div className="space-y-1 text-xs">
                                        <p className="flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" />{lead.contactName}</p>
                                        <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" />{lead.contactEmail}</p>
                                        <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" />{lead.contactPhone}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Detaljer</p>
                                      <div className="space-y-1 text-xs">
                                        <p><span className="text-muted-foreground">Källa:</span> {lead.source || '—'}</p>
                                        <p><span className="text-muted-foreground">Skapad:</span> {lead.createdAt}</p>
                                        <p><span className="text-muted-foreground">Uppdaterad:</span> {lead.updatedAt}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Anteckningar</p>
                                      <Textarea value={lead.notes} onChange={e => updateLeadField(lead.id, 'notes', e.target.value)}
                                        className="text-xs h-20 resize-none" placeholder="Lägg till anteckningar..." />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : tab === 'invoices' ? (
        /* ========== INVOICES VIEW ========== */
        <motion.div variants={item} className="space-y-4">
          {!fnConfig.connected ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-lg">Koppla Fortnox</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Anslut Fortnox för att hantera fakturor.</p>
                <Button className="mt-4 rounded-lg" onClick={() => setTab('settings')}><Link2 className="h-4 w-4 mr-2" /> Anslut Fortnox</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground uppercase">Betalt</p><p className="text-lg font-bold text-emerald-600">{(totalRevenue / 1000).toFixed(0)}k kr</p></CardContent></Card>
                <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground uppercase">Utestående</p><p className="text-lg font-bold text-amber-600">{(totalOutstanding / 1000).toFixed(0)}k kr</p></CardContent></Card>
                <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground uppercase">Antal fakturor</p><p className="text-lg font-bold">{invoices.length}</p></CardContent></Card>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/30">
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-4 py-2.5">Faktura</th>
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Kund</th>
                      <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Belopp</th>
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Status</th>
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5 hidden md:table-cell">Förfaller</th>
                      <th className="px-3 py-2.5 w-24"></th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{inv.invoiceNumber}</td>
                          <td className="px-3 py-3 text-sm">{inv.customerName}</td>
                          <td className="px-3 py-3 text-sm font-bold text-right">{inv.totalAmount.toLocaleString('sv-SE')} kr</td>
                          <td className="px-3 py-3">
                            <Badge className={`text-[10px] ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : inv.status === 'sent' ? 'bg-blue-100 text-blue-600' : inv.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                              {inv.status === 'paid' ? 'Betald' : inv.status === 'sent' ? 'Skickad' : inv.status === 'overdue' ? 'Förfallen' : inv.status === 'draft' ? 'Utkast' : inv.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell">{inv.dueDate}</td>
                          <td className="px-3 py-3">
                            {inv.status === 'draft' && <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleSendInvoice(inv.id)}><Send className="h-3 w-3 mr-1" />Skicka</Button>}
                            {inv.status === 'sent' && <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-emerald-600" onClick={() => handleMarkPaid(inv.id)}><Check className="h-3 w-3 mr-1" />Betald</Button>}
                            {inv.status === 'paid' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </motion.div>
      ) : (
        /* ========== SETTINGS VIEW ========== */
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><FileSignature className="h-5 w-5 text-white" /></div>
                <div><h3 className="font-heading font-semibold">GetAccept</h3><p className="text-xs text-muted-foreground">Offerter & e-signering</p></div>
                {gaConfig.connected && <Badge className="ml-auto bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Ansluten</Badge>}
              </div>
              {gaConfig.connected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{gaDeals.length} offerter synkade</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => { syncDeals(); toast.success('Synkad!'); }}><RefreshCw className="h-3 w-3 mr-1.5" />Synka</Button>
                    <Button size="sm" variant="outline" className="rounded-lg text-xs text-destructive" onClick={() => { disconnectGA(); toast.success('Frånkopplad'); }}>Koppla från</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><Label className="text-xs">API-nyckel</Label><Input value={gaApiKey} onChange={e => setGaApiKey(e.target.value)} placeholder="ga_..." className="rounded-lg" /></div>
                  <div><Label className="text-xs">Entity ID</Label><Input value={gaEntityId} onChange={e => setGaEntityId(e.target.value)} placeholder="..." className="rounded-lg" /></div>
                  <Button className="w-full rounded-lg" onClick={() => { connectGA(gaApiKey || 'demo', gaEntityId || 'demo'); toast.success('Ansluten till GetAccept!'); }}><Link2 className="h-4 w-4 mr-2" />Anslut</Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"><Receipt className="h-5 w-5 text-white" /></div>
                <div><h3 className="font-heading font-semibold">Fortnox</h3><p className="text-xs text-muted-foreground">Fakturering & bokföring</p></div>
                {fnConfig.connected && <Badge className="ml-auto bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Ansluten</Badge>}
              </div>
              {fnConfig.connected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{fnConfig.companyName || 'Ditt företag'} · {invoices.length} fakturor</p>
                  <Button size="sm" variant="outline" className="rounded-lg text-xs text-destructive" onClick={() => { disconnectFN(); toast.success('Frånkopplad'); }}>Koppla från</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><Label className="text-xs">Företagsnamn</Label><Input value={fnCompany} onChange={e => setFnCompany(e.target.value)} placeholder="Ditt företag AB" className="rounded-lg" /></div>
                  <div><Label className="text-xs">Client ID</Label><Input value={fnClientId} onChange={e => setFnClientId(e.target.value)} placeholder="..." className="rounded-lg" /></div>
                  <div><Label className="text-xs">Client Secret</Label><Input type="password" value={fnSecret} onChange={e => setFnSecret(e.target.value)} placeholder="..." className="rounded-lg" /></div>
                  <Button className="w-full rounded-lg" onClick={() => { connectFN(fnClientId || 'demo', fnSecret || 'demo', fnCompany || 'MarketFlow AB'); toast.success('Ansluten till Fortnox!'); }}><Link2 className="h-4 w-4 mr-2" />Anslut</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="font-heading">Ny säljlead</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Företag *</Label><Input value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} placeholder="Företagsnamn" className="rounded-lg" /></div>
              <div><Label className="text-xs">Rubrik *</Label><Input value={newLead.title} onChange={e => setNewLead({...newLead, title: e.target.value})} placeholder="T.ex. SEO Paket Q2" className="rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Kontaktperson</Label><Input value={newLead.contactName} onChange={e => setNewLead({...newLead, contactName: e.target.value})} placeholder="Namn" className="rounded-lg" /></div>
              <div><Label className="text-xs">Värde (kr)</Label><Input type="number" value={newLead.value} onChange={e => setNewLead({...newLead, value: e.target.value})} placeholder="0" className="rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">E-post</Label><Input value={newLead.contactEmail} onChange={e => setNewLead({...newLead, contactEmail: e.target.value})} placeholder="namn@foretag.se" className="rounded-lg" /></div>
              <div><Label className="text-xs">Telefon</Label><Input value={newLead.contactPhone} onChange={e => setNewLead({...newLead, contactPhone: e.target.value})} placeholder="070-..." className="rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Ansvarig säljare</Label>
                <Select value={newLead.assignee} onValueChange={v => setNewLead({...newLead, assignee: v})}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Välj säljare" /></SelectTrigger>
                  <SelectContent>{memberNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Källa</Label><Input value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} placeholder="Hemsida, LinkedIn..." className="rounded-lg" /></div>
            </div>
            <div><Label className="text-xs">Taggar (kommaseparerade)</Label><Input value={newLead.tags} onChange={e => setNewLead({...newLead, tags: e.target.value})} placeholder="SEO, Google ADS, META..." className="rounded-lg" /></div>
            <div><Label className="text-xs">Anteckningar</Label><Textarea value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} rows={2} placeholder="Eventuella anteckningar..." className="rounded-lg" /></div>
            <Button onClick={addLead} className="w-full rounded-lg gap-1.5"><Plus className="h-4 w-4" />Skapa lead</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={!!editingLead} onOpenChange={(open) => { if (!open) setEditingLead(null); }}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Redigera lead
            </DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Företag *</Label>
                  <Input value={editingLead.company} onChange={e => setEditingLead({ ...editingLead, company: e.target.value })} className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs">Rubrik *</Label>
                  <Input value={editingLead.title} onChange={e => setEditingLead({ ...editingLead, title: e.target.value })} className="rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Kontaktperson</Label>
                  <Input value={editingLead.contactName} onChange={e => setEditingLead({ ...editingLead, contactName: e.target.value })} className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs">Värde (kr)</Label>
                  <Input type="number" value={editingLead.value} onChange={e => setEditingLead({ ...editingLead, value: Number(e.target.value) || 0 })} className="rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">E-post</Label>
                  <Input value={editingLead.contactEmail} onChange={e => setEditingLead({ ...editingLead, contactEmail: e.target.value })} className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs">Telefon</Label>
                  <Input value={editingLead.contactPhone} onChange={e => setEditingLead({ ...editingLead, contactPhone: e.target.value })} className="rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Steg</Label>
                  <Select value={editingLead.stage} onValueChange={(v) => setEditingLead({ ...editingLead, stage: v as LeadStage })}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[...stageOrder, 'lost' as LeadStage].map(s => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stageConfig[s].dotColor}`} />
                            {stageConfig[s].label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ansvarig säljare</Label>
                  <Select value={editingLead.assignee} onValueChange={(v) => setEditingLead({ ...editingLead, assignee: v })}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Välj säljare" /></SelectTrigger>
                    <SelectContent>{memberNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Källa</Label>
                <Input value={editingLead.source} onChange={e => setEditingLead({ ...editingLead, source: e.target.value })} placeholder="Hemsida, LinkedIn..." className="rounded-lg" />
              </div>
              <div>
                <Label className="text-xs">Taggar (kommaseparerade)</Label>
                <Input
                  value={editingLead.tags.join(', ')}
                  onChange={e => setEditingLead({ ...editingLead, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="rounded-lg" />
              </div>
              <div>
                <Label className="text-xs">Anteckningar</Label>
                <Textarea value={editingLead.notes} onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })} rows={3} className="rounded-lg" />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setEditingLead(null)} className="rounded-lg">Avbryt</Button>
                <Button variant="destructive" onClick={() => { deleteLead(editingLead.id); setEditingLead(null); }} className="rounded-lg gap-1.5">
                  <Trash2 className="h-4 w-4" /> Ta bort
                </Button>
                <Button onClick={saveEditedLead} className="rounded-lg gap-1.5">
                  <Save className="h-4 w-4" /> Spara
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
