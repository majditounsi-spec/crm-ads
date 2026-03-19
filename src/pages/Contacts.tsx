import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { Contact, ContactStatus } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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
  Search, Plus, ExternalLink, Star, Pencil, Globe, Upload, FileText, X, ChevronDown, Trash2, Phone, Mail,
} from 'lucide-react';

const SERVICE_OPTIONS = ['SEO', 'WEBB', 'Google ADS', 'META'] as const;

function parseServices(service: string): string[] {
  if (!service) return [];
  return service.split(/\s*[\+\,]\s*/).map(s => s.trim()).filter(Boolean);
}

function formatServices(services: string[]): string {
  return services.join(' + ');
}

function ServiceMultiSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
        <Button variant="outline" className="w-full justify-between font-normal h-10 text-sm">
          <span className="truncate">{value || 'Välj tjänster...'}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        {SERVICE_OPTIONS.map(svc => (
          <label
            key={svc}
            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
          >
            <Checkbox
              checked={selected.includes(svc)}
              onCheckedChange={() => toggle(svc)}
            />
            {svc}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const statusConfig: Record<ContactStatus, { label: string; className: string }> = {
  active: { label: 'Aktiv', className: 'bg-[hsl(var(--status-done))] text-white' },
  paused: { label: 'Pausad', className: 'bg-[hsl(var(--status-working))] text-white' },
  completed: { label: 'Avslutad', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Väntande', className: 'bg-[hsl(var(--status-pending))] text-white' },
};

export default function Contacts() {
  const { contacts, loading, addContact: addContactDb, updateContact, updateField, deleteContact } = useContacts();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [newContact, setNewContact] = useState({
    name: '', website: '', platform: '', budget: 0, service: 'SEO',
    contactPerson: '', seller: '', startDate: '', endDate: '', comment: '',
    phone: '', emails: [''] as string[],
  });

  const filtered = contacts.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.seller.toLowerCase().includes(search.toLowerCase()) ||
      c.service.toLowerCase().includes(search.toLowerCase()) ||
      c.platform.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalBudget = contacts.reduce((s, c) => s + c.budget, 0);
  const activeCount = contacts.filter((c) => c.status === 'active').length;
  const avgBudget = contacts.length > 0 ? Math.round(totalBudget / contacts.length) : 0;

  const openDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setEditingContact({ ...contact });
    setIsDetailOpen(true);
  };

  const saveContact = async () => {
    if (!editingContact) return;
    const ok = await updateContact(editingContact);
    if (ok) {
      setSelectedContact(editingContact);
      toast.success(`${editingContact.name} har uppdaterats`);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name) {
      toast.error('Ange ett kundnamn');
      return;
    }
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
        phone: '', emails: [''],
      });
      toast.success(`${contact.name} har lagts till`);
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < rating ? 'fill-[hsl(var(--status-working))] text-[hsl(var(--status-working))]' : 'text-muted'}`}
      />
    ));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kontakter</h1>
          <p className="text-muted-foreground mt-1">Hantera kunder och kontaktinformation</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Lägg till kund
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Totalt kunder</p>
          <p className="text-2xl font-heading font-bold text-foreground">{contacts.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Aktiva</p>
          <p className="text-2xl font-heading font-bold text-[hsl(var(--status-done))]">{activeCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total budget</p>
          <p className="text-2xl font-heading font-bold text-foreground">{totalBudget.toLocaleString()} kr</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Snittbudget</p>
          <p className="text-2xl font-heading font-bold text-foreground">{avgBudget.toLocaleString()} kr</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök kund, säljare, plattform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="paused">Pausad</SelectItem>
            <SelectItem value="pending">Väntande</SelectItem>
            <SelectItem value="completed">Avslutad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kund</TableHead>
                <TableHead>Tjänst</TableHead>
                <TableHead>Plattform</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Säljare</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact, i) => (
                <motion.tr
                  key={contact.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer group"
                  onClick={() => openDetail(contact)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{contact.name}</span>
                      {contact.website && (
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ServiceMultiSelect
                      value={contact.service}
                      onChange={(v) => updateField(contact.id, 'service', v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{contact.platform || '—'}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      value={contact.budget}
                      onChange={(e) => updateField(contact.id, 'budget', Number(e.target.value))}
                      className="w-20 h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">{renderStars(contact.rating)}</div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={contact.seller}
                      onChange={(e) => updateField(contact.id, 'seller', e.target.value)}
                      placeholder="—"
                      className="w-28 h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={contact.status}
                      onValueChange={(v) => updateField(contact.id, 'status', v)}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="paused">Pausad</SelectItem>
                        <SelectItem value="pending">Väntande</SelectItem>
                        <SelectItem value="completed">Avslutad</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Inga kunder hittades</div>
          )}
        </CardContent>
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
                  <Input
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Webbplats</label>
                  <Input
                    value={editingContact.website}
                    onChange={(e) => setEditingContact({ ...editingContact, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Tjänst</label>
                  <ServiceMultiSelect
                    value={editingContact.service}
                    onChange={(v) => setEditingContact({ ...editingContact, service: v })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Plattform</label>
                  <Input
                    value={editingContact.platform}
                    onChange={(e) => setEditingContact({ ...editingContact, platform: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Budget (kr)</label>
                  <Input
                    type="number"
                    value={editingContact.budget}
                    onChange={(e) => setEditingContact({ ...editingContact, budget: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Kontaktperson</label>
                  <Input
                    value={editingContact.contactPerson}
                    onChange={(e) => setEditingContact({ ...editingContact, contactPerson: e.target.value })}
                    placeholder="Ange kontaktperson"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Säljare</label>
                  <Input
                    value={editingContact.seller}
                    onChange={(e) => setEditingContact({ ...editingContact, seller: e.target.value })}
                    placeholder="Ange säljare"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Telefonnummer
                  </label>
                  <Input
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    placeholder="070-123 45 67"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> E-postadresser
                  </label>
                  {editingContact.emails.map((email, idx) => (
                    <div key={idx} className="flex gap-1.5 mt-1">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const updated = [...editingContact.emails];
                          updated[idx] = e.target.value;
                          setEditingContact({ ...editingContact, emails: updated });
                        }}
                        placeholder="namn@exempel.se"
                      />
                      {editingContact.emails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-10 w-10"
                          onClick={() => {
                            const updated = editingContact.emails.filter((_, i) => i !== idx);
                            setEditingContact({ ...editingContact, emails: updated });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1.5"
                    onClick={() => setEditingContact({ ...editingContact, emails: [...editingContact.emails, ''] })}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Lägg till e-post
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select
                    value={editingContact.status}
                    onValueChange={(v) => setEditingContact({ ...editingContact, status: v as ContactStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="paused">Pausad</SelectItem>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="completed">Avslutad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Startdatum</label>
                  <Input
                    type="date"
                    value={editingContact.startDate}
                    onChange={(e) => setEditingContact({ ...editingContact, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Slutdatum</label>
                  <Input
                    type="date"
                    value={editingContact.endDate}
                    onChange={(e) => setEditingContact({ ...editingContact, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Kommentar</label>
                <Textarea
                  value={editingContact.comment}
                  onChange={(e) => setEditingContact({ ...editingContact, comment: e.target.value })}
                  placeholder="Lägg till kommentar..."
                  rows={3}
                />
              </div>

              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Dra och släpp dokument här eller klicka för att ladda upp
                </p>
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
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      if (editingContact) {
                        await deleteContact(editingContact.id);
                        setIsDetailOpen(false);
                      }
                    }}
                  >
                    Ta bort
                  </AlertDialogAction>
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
                <ServiceMultiSelect value={newContact.service} onChange={(v) => setNewContact({ ...newContact, service: v })} />
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
    </div>
  );
}
