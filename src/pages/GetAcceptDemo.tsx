import { useState, useMemo } from 'react';
import { useGetAccept, type GetAcceptDeal } from '@/hooks/useGetAccept';
import { useFortnox } from '@/hooks/useFortnox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileSignature, Plus, Send, Eye, CheckCircle2, XCircle, AlertCircle, FileText,
  DollarSign, Clock, ArrowRight, Trash2, Receipt, RefreshCw, Link2, Settings,
  TrendingUp, Search, Filter, MoreHorizontal, ExternalLink, Mail, Building2, User,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  draft: { label: 'Utkast', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  sent: { label: 'Skickad', icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/40' },
  viewed: { label: 'Visad', icon: Eye, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/40' },
  signed: { label: 'Signerad', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
  rejected: { label: 'Avvisad', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/40' },
  expired: { label: 'Utgången', icon: AlertCircle, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' },
};

const pipelineStatuses = ['draft', 'sent', 'viewed', 'signed'] as const;

function DealCard({ deal, onDelete, onSelect }: { deal: GetAcceptDeal; onDelete: (id: string) => void; onSelect: (deal: GetAcceptDeal) => void }) {
  const cfg = statusConfig[deal.status];
  const StatusIcon = cfg.icon;
  const daysLeft = Math.ceil((new Date(deal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="bg-card rounded-xl border p-3.5 group hover:shadow-md transition-all cursor-pointer relative"
      onClick={() => onSelect(deal)}>
      <button onClick={e => { e.stopPropagation(); onDelete(deal.id); toast.success('Offert borttagen'); }}
        className="absolute top-2 right-2 h-6 w-6 p-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start justify-between mb-2 pr-6">
        <p className="font-medium text-sm leading-tight">{deal.name}</p>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
        <Building2 className="h-3 w-3" />{deal.company}
      </p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-heading font-bold">{deal.value.toLocaleString('sv-SE')} kr</span>
        <Badge className={`text-[10px] ${cfg.bgColor} ${cfg.color} border-0`}>
          <StatusIcon className="h-3 w-3 mr-1" />{cfg.label}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><User className="h-3 w-3" />{deal.recipientName}</span>
        {daysLeft > 0 ? (
          <span className={`flex items-center gap-1 ${daysLeft < 7 ? 'text-amber-600' : ''}`}>
            <Clock className="h-3 w-3" />{daysLeft} dagar kvar
          </span>
        ) : (
          <span className="text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Utgången</span>
        )}
      </div>
      {deal.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {deal.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{tag}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function GetAcceptDemo() {
  const { deals, config, connect, disconnect, syncDeals, updateDealStatus, deleteDeal, addDeal } = useGetAccept();
  const { createInvoiceFromDeal, isAlreadyInvoiced } = useFortnox();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<GetAcceptDeal | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [entityId, setEntityId] = useState('');
  const [newDeal, setNewDeal] = useState({ name: '', company: '', recipientName: '', recipientEmail: '', value: '', tags: '' });

  const filtered = useMemo(() => {
    if (!search) return deals;
    const s = search.toLowerCase();
    return deals.filter(d => d.name.toLowerCase().includes(s) || d.company.toLowerCase().includes(s) || d.recipientName.toLowerCase().includes(s));
  }, [deals, search]);

  // Stats
  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const signedValue = deals.filter(d => d.status === 'signed').reduce((s, d) => s + d.value, 0);
  const signedCount = deals.filter(d => d.status === 'signed').length;
  const pendingCount = deals.filter(d => ['sent', 'viewed'].includes(d.status)).length;
  const winRate = deals.length > 0 ? Math.round((signedCount / deals.length) * 100) : 0;

  const handleCreate = () => {
    if (!newDeal.name || !newDeal.company || !newDeal.value) { toast.error('Fyll i obligatoriska fält'); return; }
    const expires = new Date(); expires.setDate(expires.getDate() + 30);
    addDeal({
      name: newDeal.name,
      company: newDeal.company,
      value: Number(newDeal.value),
      status: 'draft',
      recipientEmail: newDeal.recipientEmail,
      recipientName: newDeal.recipientName,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: expires.toISOString().split('T')[0],
      tags: newDeal.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setCreateOpen(false);
    setNewDeal({ name: '', company: '', recipientName: '', recipientEmail: '', value: '', tags: '' });
    toast.success('Offert skapad!');
  };

  const handleCreateInvoice = async (deal: GetAcceptDeal) => {
    if (isAlreadyInvoiced(deal.id)) { toast.error('Faktura finns redan'); return; }
    await createInvoiceFromDeal(deal);
    toast.success('Faktura skapad i Fortnox!');
  };

  // Timeline steps for deal detail
  const timelineSteps = (deal: GetAcceptDeal) => {
    const steps = [
      { key: 'created', label: 'Skapad', date: deal.createdAt, done: true },
      { key: 'sent', label: 'Skickad', date: deal.status !== 'draft' ? deal.createdAt : null, done: deal.status !== 'draft' },
      { key: 'viewed', label: 'Visad', date: ['viewed', 'signed'].includes(deal.status) ? deal.createdAt : null, done: ['viewed', 'signed'].includes(deal.status) },
      { key: 'signed', label: 'Signerad', date: deal.signedAt || null, done: deal.status === 'signed' },
    ];
    return steps;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />GetAccept
          </h1>
          <p className="text-muted-foreground">Hantera offerter, e-signaturer och avtalsflöden</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => { syncDeals(); toast.success('Synkad!'); }}>
            <RefreshCw className="h-3.5 w-3.5" />Synka
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-xl"><Plus className="h-3.5 w-3.5" />Ny offert</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Skapa ny offert</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Offertnamn *</Label><Input value={newDeal.name} onChange={e => setNewDeal({ ...newDeal, name: e.target.value })} placeholder="T.ex. SEO Paket Q3" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Företag *</Label><Input value={newDeal.company} onChange={e => setNewDeal({ ...newDeal, company: e.target.value })} placeholder="Företagsnamn" /></div>
                  <div><Label>Värde (kr) *</Label><Input type="number" value={newDeal.value} onChange={e => setNewDeal({ ...newDeal, value: e.target.value })} placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Mottagare</Label><Input value={newDeal.recipientName} onChange={e => setNewDeal({ ...newDeal, recipientName: e.target.value })} placeholder="Namn" /></div>
                  <div><Label>E-post</Label><Input value={newDeal.recipientEmail} onChange={e => setNewDeal({ ...newDeal, recipientEmail: e.target.value })} placeholder="email@company.se" /></div>
                </div>
                <div><Label>Taggar (kommaseparerade)</Label><Input value={newDeal.tags} onChange={e => setNewDeal({ ...newDeal, tags: e.target.value })} placeholder="SEO, Google ADS" /></div>
                <Button onClick={handleCreate} className="w-full">Skapa offert</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Totala offerter', value: deals.length, icon: FileSignature, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Väntande signering', value: pendingCount, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Signerade', value: signedCount, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Totalt värde', value: `${(totalValue / 1000).toFixed(0)}k kr`, icon: DollarSign, color: 'text-violet-500 bg-violet-500/10' },
          { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-primary bg-primary/10' },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-xl font-heading font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök offerter..." className="pl-9 rounded-xl" />
        </div>
      </motion.div>

      {/* Pipeline Kanban */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStatuses.map(status => {
            const cfg = statusConfig[status];
            const StatusIcon = cfg.icon;
            const columnDeals = filtered.filter(d => d.status === status);
            const columnValue = columnDeals.reduce((s, d) => s + d.value, 0);

            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                    <span className="font-heading font-semibold text-sm">{cfg.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{columnDeals.length}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{(columnValue / 1000).toFixed(0)}k kr</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  <AnimatePresence>
                    {columnDeals.map(deal => (
                      <DealCard key={deal.id} deal={deal} onDelete={deleteDeal} onSelect={setSelectedDeal} />
                    ))}
                  </AnimatePresence>
                  {columnDeals.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl">
                      Inga offerter
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Rejected & Expired section */}
      {filtered.some(d => ['rejected', 'expired'].includes(d.status)) && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4 pb-3">
              <h3 className="font-heading font-semibold text-sm mb-3 text-muted-foreground">Avvisade & Utgångna</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {filtered.filter(d => ['rejected', 'expired'].includes(d.status)).map(deal => (
                  <DealCard key={deal.id} deal={deal} onDelete={deleteDeal} onSelect={setSelectedDeal} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Deal Detail Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={open => !open && setSelectedDeal(null)}>
        <DialogContent className="max-w-lg">
          {selectedDeal && (() => {
            const deal = selectedDeal;
            const cfg = statusConfig[deal.status];
            const StatusIcon = cfg.icon;
            const steps = timelineSteps(deal);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-primary" />{deal.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-2">
                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <Badge className={`${cfg.bgColor} ${cfg.color} border-0`}>
                      <StatusIcon className="h-3.5 w-3.5 mr-1" />{cfg.label}
                    </Badge>
                    <span className="text-lg font-heading font-bold">{deal.value.toLocaleString('sv-SE')} kr</span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-muted-foreground block">Företag</span><span className="font-medium">{deal.company}</span></div>
                    <div><span className="text-xs text-muted-foreground block">Mottagare</span><span className="font-medium">{deal.recipientName}</span></div>
                    <div><span className="text-xs text-muted-foreground block">E-post</span><span className="font-medium text-primary">{deal.recipientEmail}</span></div>
                    <div><span className="text-xs text-muted-foreground block">Utgår</span><span className="font-medium">{deal.expiresAt}</span></div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tidslinje</p>
                    <div className="flex items-center gap-1">
                      {steps.map((step, i) => (
                        <div key={step.key} className="flex items-center gap-1 flex-1">
                          <div className={`flex flex-col items-center`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                              {step.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                            </div>
                            <span className="text-[10px] mt-1 text-muted-foreground">{step.label}</span>
                          </div>
                          {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 rounded ${step.done ? 'bg-emerald-500' : 'bg-muted'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {deal.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {deal.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {deal.status === 'draft' && (
                      <Button size="sm" className="gap-1.5 flex-1" onClick={() => { updateDealStatus(deal.id, 'sent'); setSelectedDeal({ ...deal, status: 'sent' }); toast.success('Offert skickad!'); }}>
                        <Send className="h-3.5 w-3.5" />Skicka offert
                      </Button>
                    )}
                    {['sent', 'viewed'].includes(deal.status) && (
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => toast.success('Påminnelse skickad!')}>
                        <Mail className="h-3.5 w-3.5" />Skicka påminnelse
                      </Button>
                    )}
                    {deal.status === 'signed' && (
                      <Button size="sm" variant="outline" className="gap-1.5 flex-1"
                        disabled={isAlreadyInvoiced(deal.id)}
                        onClick={() => handleCreateInvoice(deal)}>
                        <Receipt className="h-3.5 w-3.5" />
                        {isAlreadyInvoiced(deal.id) ? 'Faktura skapad' : 'Skapa faktura'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive gap-1.5"
                      onClick={() => { deleteDeal(deal.id); setSelectedDeal(null); toast.success('Offert borttagen'); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Integration Settings */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-heading font-semibold text-sm">Integration</h3>
              </div>
              <Badge className={config.connected ? 'bg-emerald-100 text-emerald-600 border-emerald-500/20' : 'bg-gray-100 text-gray-600'}>
                {config.connected ? 'Ansluten' : 'Ej ansluten'}
              </Badge>
            </div>

            {config.connected ? (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-muted-foreground">Ansluten till GetAccept</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{deals.length} offerter synkade</p>
                </div>
                <Button variant="outline" size="sm" className="text-destructive" onClick={disconnect}>Koppla från</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Anslut GetAccept för att synka offerter och e-signaturer.</p>
                <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5"><Link2 className="h-3.5 w-3.5" />Anslut GetAccept</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-heading">Anslut GetAccept</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div><Label>API-nyckel</Label><Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="ga_xxxxxxxxxxxxxxxx" /></div>
                      <div><Label>Entity ID</Label><Input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx" /></div>
                      <Button className="w-full" onClick={() => { connect(apiKey, entityId); setConnectOpen(false); toast.success('GetAccept ansluten!'); }}>
                        Anslut
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
