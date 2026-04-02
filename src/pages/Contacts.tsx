import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { Contact, ContactStatus } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Search, Plus, ExternalLink, Star, Globe, Upload, FileText, X, ChevronDown, Trash2, Phone, Mail, Eye, EyeOff,
} from 'lucide-react';

const SERVICE_OPTIONS = ['SEO', 'WEBB', 'Google ADS', 'META', 'Film/Foto'] as const;

const ALL_COLUMNS = [
  { key: 'name', label: 'Kund', defaultVisible: true, minWidth: '180px' },
  { key: 'contactPerson', label: 'Kontaktperson', defaultVisible: true, minWidth: '140px' },
  { key: 'phone', label: 'Telefon', defaultVisible: true, minWidth: '130px' },
  { key: 'email', label: 'E-post', defaultVisible: true, minWidth: '180px' },
  { key: 'service', label: 'Tjänst', defaultVisible: true, minWidth: '160px' },
  { key: 'platform', label: 'Plattform', defaultVisible: true, minWidth: '120px' },
  { key: 'budget', label: 'Budget', defaultVisible: true, minWidth: '110px' },
  { key: 'seller', label: 'Säljare', defaultVisible: true, minWidth: '130px' },
  { key: 'status', label: 'Status', defaultVisible: true, minWidth: '130px' },
  { key: 'rating', label: 'Rating', defaultVisible: true, minWidth: '90px' },
  { key: 'startDate', label: 'Startdatum', defaultVisible: false, minWidth: '130px' },
  { key: 'endDate', label: 'Slutdatum', defaultVisible: false, minWidth: '130px' },
  { key: 'website', label: 'Webbplats', defaultVisible: false, minWidth: '160px' },
  { key: 'googleAdsCustomerId', label: 'Google Ads ID', defaultVisible: false, minWidth: '140px' },
  { key: 'comment', label: 'Kommentar', defaultVisible: false, minWidth: '200px' },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]['key'];

function parseServices(service: string): string[] {
  if (!service) return [];
  return service.split(/\s*[\+\,]\s*/).map(s => s.trim()).filter(Boolean);
}

function formatServices(services: string[]): string {
  return services.join(' + ');
}

function InlineServiceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = parseServices(value);
  const toggle = (svc: string) => {
    const next = selected.includes(svc)
      ? selected.filter(s => s !== svc)
      : [...selected, svc];
    onChange(formatServices(next));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors text-sm min-h-[32px] flex items-center gap-1 flex-wrap">
          {selected.length > 0 ? selected.map(s => (
            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium">
              {s}
            </Badge>
          )) : <span className="text-muted-foreground">—</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="start">
        {SERVICE_OPTIONS.map(svc => (
          <label key={svc} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm">
            <Checkbox checked={selected.includes(svc)} onCheckedChange={() => toggle(svc)} />
            {svc}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const statusConfig: Record<ContactStatus, { label: string; className: string }> = {
  active: { label: 'Aktiv', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  paused: { label: 'Pausad', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  completed: { label: 'Avslutad', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  pending: { label: 'Väntande', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20' },
};

const inlineInputClass = "border-none bg-transparent shadow-none h-8 px-2 text-sm rounded-md hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors";

export default function Contacts() {
  const { contacts, loading, addContact: addContactDb, updateContact, updateField, deleteContact } = useContacts();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [sortKey, setSortKey] = useState<ColumnKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const [newContact, setNewContact] = useState({
    name: '', website: '', platform: '', budget: 0, service: 'SEO',
    contactPerson: '', seller: '', startDate: '', endDate: '', comment: '',
    phone: '', emails: [''] as string[], googleAdsCustomerId: '',
  });

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSort = (key: ColumnKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = contacts
    .filter((c) => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        c.name.toLowerCase().includes(s) ||
        c.seller.toLowerCase().includes(s) ||
        c.service.toLowerCase().includes(s) ||
        c.platform.toLowerCase().includes(s) ||
        c.contactPerson.toLowerCase().includes(s) ||
        c.phone.toLowerCase().includes(s) ||
        c.emails.some(e => e.toLowerCase().includes(s));
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'budget' || sortKey === 'rating') {
        av = a[sortKey]; bv = b[sortKey];
      } else if (sortKey === 'email') {
        av = a.emails[0] || ''; bv = b.emails[0] || '';
      } else {
        av = (a[sortKey as keyof Contact] as string || '').toLowerCase();
        bv = (b[sortKey as keyof Contact] as string || '').toLowerCase();
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const totalBudget = contacts.reduce((s, c) => s + c.budget, 0);
  const activeCount = contacts.filter((c) => c.status === 'active').length;
  const avgBudget = contacts.length > 0 ? Math.round(totalBudget / contacts.length) : 0;

  const openDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setEditingContact({ ...contact, emails: contact.emails.length > 0 ? contact.emails : [''] });
    setIsDetailOpen(true);
  };

  const saveContact = async () => {
    if (!editingContact) return;
    const toSave = { ...editingContact, emails: editingContact.emails.filter(e => e.trim() !== '') };
    const ok = await updateContact(toSave);
    if (ok) {
      setSelectedContact(toSave);
      toast.success(`${toSave.name} har uppdaterats`);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name) { toast.error('Ange ett kundnamn'); return; }
    const contact = await addContactDb({
      ...newContact,
      emails: newContact.emails.filter(e => e.trim() !== ''),
      rating: 1,
      status: 'pending' as ContactStatus,
      hasReport: false,
    });
    if (contact) {
      setIsAddOpen(false);
      setNewContact({
        name: '', website: '', platform: '', budget: 0, service: 'SEO',
        contactPerson: '', seller: '', startDate: '', endDate: '', comment: '',
        phone: '', emails: [''], googleAdsCustomerId: '',
      });
      toast.success(`${contact.name} har lagts till`);
    }
  };

  const renderStars = (rating: number, contactId: string) =>
    Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 cursor-pointer transition-colors ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`}
        onClick={(e) => { e.stopPropagation(); updateField(contactId, 'rating', i + 1); }}
      />
    ));

  const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.has(c.key));

  const renderCell = (contact: Contact, colKey: ColumnKey) => {
    switch (colKey) {
      case 'name':
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{contact.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <button
                onClick={() => openDetail(contact)}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block text-left"
              >
                {contact.name}
              </button>
            </div>
            {contact.website && (
              <a href={contact.website} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary shrink-0">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        );
      case 'contactPerson':
        return (
          <Input value={contact.contactPerson} placeholder="—"
            onChange={(e) => updateField(contact.id, 'contactPerson', e.target.value)}
            className={inlineInputClass} />
        );
      case 'phone':
        return (
          <Input value={contact.phone} placeholder="—"
            onChange={(e) => updateField(contact.id, 'phone', e.target.value)}
            className={inlineInputClass} />
        );
      case 'email':
        return (
          <Input value={contact.emails[0] || ''} placeholder="—" type="email"
            onChange={(e) => {
              const updated = [...contact.emails];
              updated[0] = e.target.value;
              updateField(contact.id, 'emails', updated.filter(x => x.trim()));
            }}
            className={inlineInputClass} />
        );
      case 'service':
        return <InlineServiceSelect value={contact.service} onChange={(v) => updateField(contact.id, 'service', v)} />;
      case 'platform':
        return (
          <Input value={contact.platform} placeholder="—"
            onChange={(e) => updateField(contact.id, 'platform', e.target.value)}
            className={inlineInputClass} />
        );
      case 'budget':
        return (
          <div className="flex items-center gap-1">
            <Input type="number" value={contact.budget}
              onChange={(e) => updateField(contact.id, 'budget', Number(e.target.value))}
              className={`${inlineInputClass} text-right tabular-nums`} />
            <span className="text-xs text-muted-foreground shrink-0">kr</span>
          </div>
        );
      case 'seller':
        return (
          <Input value={contact.seller} placeholder="—"
            onChange={(e) => updateField(contact.id, 'seller', e.target.value)}
            className={inlineInputClass} />
        );
      case 'status':
        return (
          <Select value={contact.status} onValueChange={(v) => updateField(contact.id, 'status', v)}>
            <SelectTrigger className="border-none bg-transparent shadow-none h-8 px-1 text-xs hover:bg-muted/50 focus:ring-1 focus:ring-primary/30">
              <Badge variant="outline" className={`${statusConfig[contact.status].className} text-[11px] px-2 py-0.5 border`}>
                {statusConfig[contact.status].label}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <Badge variant="outline" className={`${cfg.className} text-[11px] px-2 py-0.5 border`}>{cfg.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'rating':
        return <div className="flex gap-0.5 px-2">{renderStars(contact.rating, contact.id)}</div>;
      case 'startDate':
        return (
          <Input type="date" value={contact.startDate}
            onChange={(e) => updateField(contact.id, 'startDate', e.target.value)}
            className={`${inlineInputClass} text-xs`} />
        );
      case 'endDate':
        return (
          <Input type="date" value={contact.endDate}
            onChange={(e) => updateField(contact.id, 'endDate', e.target.value)}
            className={`${inlineInputClass} text-xs`} />
        );
      case 'website':
        return (
          <Input value={contact.website} placeholder="—"
            onChange={(e) => updateField(contact.id, 'website', e.target.value)}
            className={inlineInputClass} />
        );
      case 'googleAdsCustomerId':
        return (
          <Input value={contact.googleAdsCustomerId} placeholder="—"
            onChange={(e) => updateField(contact.id, 'googleAdsCustomerId', e.target.value)}
            className={`${inlineInputClass} font-mono text-xs`} />
        );
      case 'comment':
        return (
          <Input value={contact.comment} placeholder="—"
            onChange={(e) => updateField(contact.id, 'comment', e.target.value)}
            className={inlineInputClass} />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Kontakter</h1>
          <p className="text-muted-foreground text-sm">{contacts.length} kunder · {totalBudget.toLocaleString('sv-SE')} kr total budget</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Lägg till kund
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'Totalt kunder', value: contacts.length, color: 'from-violet-500/10 to-violet-500/5' },
          { title: 'Aktiva', value: activeCount, color: 'from-emerald-500/10 to-emerald-500/5' },
          { title: 'Total budget', value: `${(totalBudget / 1000).toFixed(0)}k kr`, color: 'from-blue-500/10 to-blue-500/5' },
          { title: 'Snittbudget', value: `${avgBudget.toLocaleString('sv-SE')} kr`, color: 'from-amber-500/10 to-amber-500/5' },
        ].map(stat => (
          <Card key={stat.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className={`pt-4 pb-3 bg-gradient-to-br ${stat.color}`}>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
              <p className="text-xl font-heading font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök kund, säljare, telefon, e-post..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla status</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Column visibility toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Kolumner <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1.5" align="end">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visa / dölj kolumner</p>
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm">
                <Checkbox checked={visibleColumns.has(col.key)} onCheckedChange={() => toggleColumn(col.key)} />
                {col.label}
              </label>
            ))}
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} resultat</span>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b">
                {activeColumns.map(col => (
                  <th key={col.key}
                    style={{ minWidth: col.minWidth }}
                    className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5 cursor-pointer hover:text-foreground select-none transition-colors whitespace-nowrap"
                    onClick={() => handleSort(col.key)}>
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-primary text-[10px]">{sortAsc ? '▲' : '▼'}</span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="w-10 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact, i) => (
                <motion.tr key={contact.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                >
                  {activeColumns.map(col => (
                    <td key={col.key} className="px-2 py-1" onClick={(e) => { if (col.key !== 'name') e.stopPropagation(); }}>
                      {renderCell(contact, col.key)}
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort {contact.name}?</AlertDialogTitle>
                          <AlertDialogDescription>Detta kan inte ångras.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteContact(contact.id)}>Ta bort</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Inga kunder hittades</p>
            </div>
          )}
        </div>
      </Card>

      {/* Detail / Edit Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <Globe className="h-5 w-5 text-primary" />
              {editingContact?.name}
            </DialogTitle>
          </DialogHeader>

          {editingContact && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Kundnamn</label>
                  <Input value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Webbplats</label>
                  <Input value={editingContact.website}
                    onChange={(e) => setEditingContact({ ...editingContact, website: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Tjänst</label>
                  <InlineServiceSelect value={editingContact.service}
                    onChange={(v) => setEditingContact({ ...editingContact, service: v })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Plattform</label>
                  <Input value={editingContact.platform}
                    onChange={(e) => setEditingContact({ ...editingContact, platform: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Budget (kr)</label>
                  <Input type="number" value={editingContact.budget}
                    onChange={(e) => setEditingContact({ ...editingContact, budget: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Kontaktperson</label>
                  <Input value={editingContact.contactPerson}
                    onChange={(e) => setEditingContact({ ...editingContact, contactPerson: e.target.value })}
                    placeholder="Ange kontaktperson" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Säljare</label>
                  <Input value={editingContact.seller}
                    onChange={(e) => setEditingContact({ ...editingContact, seller: e.target.value })}
                    placeholder="Ange säljare" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Telefonnummer
                  </label>
                  <Input value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    placeholder="070-123 45 67" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> E-postadresser
                  </label>
                  {editingContact.emails.map((email, idx) => (
                    <div key={idx} className="flex gap-1.5 mt-1">
                      <Input type="email" value={email}
                        onChange={(e) => {
                          const updated = [...editingContact.emails];
                          updated[idx] = e.target.value;
                          setEditingContact({ ...editingContact, emails: updated });
                        }}
                        placeholder="namn@exempel.se" />
                      {editingContact.emails.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10"
                          onClick={() => setEditingContact({ ...editingContact, emails: editingContact.emails.filter((_, i) => i !== idx) })}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="mt-1.5"
                    onClick={() => setEditingContact({ ...editingContact, emails: [...editingContact.emails, ''] })}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Lägg till e-post
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={editingContact.status}
                    onValueChange={(v) => setEditingContact({ ...editingContact, status: v as ContactStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Startdatum</label>
                  <Input type="date" value={editingContact.startDate}
                    onChange={(e) => setEditingContact({ ...editingContact, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Slutdatum</label>
                  <Input type="date" value={editingContact.endDate}
                    onChange={(e) => setEditingContact({ ...editingContact, endDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Kommentar</label>
                <Textarea value={editingContact.comment}
                  onChange={(e) => setEditingContact({ ...editingContact, comment: e.target.value })}
                  placeholder="Lägg till kommentar..." rows={3} />
              </div>

              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Dra och släpp dokument här eller klicka för att ladda upp</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLSX (max 10MB)</p>
                {editingContact.hasReport && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">A-360 Rapport finns</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Ta bort</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ta bort kund?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Är du säker på att du vill ta bort {editingContact?.name}? Detta kan inte ångras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      if (editingContact) { await deleteContact(editingContact.id); setIsDetailOpen(false); }
                    }}>Ta bort</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Stäng</Button>
              <Button onClick={saveContact}>Spara ändringar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Lägg till ny kund</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Kundnamn *</label>
              <Input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Webbplats</label>
                <Input value={newContact.website} onChange={(e) => setNewContact({ ...newContact, website: e.target.value })} placeholder="https://" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Plattform</label>
                <Input value={newContact.platform} onChange={(e) => setNewContact({ ...newContact, platform: e.target.value })} placeholder="Wordpress" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Tjänst</label>
                <InlineServiceSelect value={newContact.service} onChange={(v) => setNewContact({ ...newContact, service: v })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Budget (kr)</label>
                <Input type="number" value={newContact.budget} onChange={(e) => setNewContact({ ...newContact, budget: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Kontaktperson</label>
                <Input value={newContact.contactPerson} onChange={(e) => setNewContact({ ...newContact, contactPerson: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Säljare</label>
                <Input value={newContact.seller} onChange={(e) => setNewContact({ ...newContact, seller: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Telefonnummer
                </label>
                <Input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="070-123 45 67" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> E-postadresser
                </label>
                {newContact.emails.map((email, idx) => (
                  <div key={idx} className="flex gap-1.5 mt-1">
                    <Input type="email" value={email}
                      onChange={(e) => {
                        const updated = [...newContact.emails];
                        updated[idx] = e.target.value;
                        setNewContact({ ...newContact, emails: updated });
                      }}
                      placeholder="namn@exempel.se" />
                    {newContact.emails.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10"
                        onClick={() => setNewContact({ ...newContact, emails: newContact.emails.filter((_, i) => i !== idx) })}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-1.5"
                  onClick={() => setNewContact({ ...newContact, emails: [...newContact.emails, ''] })}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Lägg till e-post
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Startdatum</label>
                <Input type="date" value={newContact.startDate} onChange={(e) => setNewContact({ ...newContact, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Slutdatum</label>
                <Input type="date" value={newContact.endDate} onChange={(e) => setNewContact({ ...newContact, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Kommentar</label>
              <Textarea value={newContact.comment} onChange={(e) => setNewContact({ ...newContact, comment: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Avbryt</Button>
            <Button onClick={handleAddContact}>Lägg till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
