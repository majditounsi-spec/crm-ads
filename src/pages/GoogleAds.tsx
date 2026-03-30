import { useState, useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useGoogleAdsBudgets } from '@/hooks/useGoogleAdsBudgets';
import { useGoogleAdsConfig } from '@/hooks/useGoogleAdsConfig';
import GoogleAdsSettings from '@/components/GoogleAdsSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ExternalLink, Search, TrendingUp, Plus, CalendarDays, RefreshCw, Settings, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Contact } from '@/types/crm';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

function parseServices(service: string): string[] {
  if (!service) return [];
  return service.split(/\s*[\+\,]\s*/).map(s => s.trim()).filter(Boolean);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('sv-SE');
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getDateRange(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = getDaysInMonth(year, month);
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export default function GoogleAds() {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addContactId, setAddContactId] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addCampaign, setAddCampaign] = useState('');
  const [addBudget, setAddBudget] = useState('');
  const [addSpend, setAddSpend] = useState('');
  const [addImpressions, setAddImpressions] = useState('');
  const [addClicks, setAddClicks] = useState('');
  const [addConversions, setAddConversions] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const { contacts, loading: contactsLoading } = useContacts();
  const { config, syncing, syncBudgets } = useGoogleAdsConfig();

  // Filter contacts that have Google ADS or ADS in their service
  const adsContacts = useMemo(() =>
    contacts.filter(c => {
      const services = parseServices(c.service);
      return services.some(s => s.toLowerCase().includes('ads'));
    }),
    [contacts]
  );

  const adsContactIds = useMemo(() => adsContacts.map(c => c.id), [adsContacts]);

  // Get date range for selected month (for daily view)
  const { from: monthFrom, to: monthTo } = getDateRange(selectedYear, selectedMonth);

  // Also fetch full year for the yearly overview
  const yearFrom = `${selectedYear}-01-01`;
  const yearTo = `${selectedYear}-12-31`;

  const { budgets, loading: budgetsLoading, addBudgetEntry } = useGoogleAdsBudgets(adsContactIds, yearFrom, yearTo);

  const loading = contactsLoading || budgetsLoading;

  // Filter budgets for the selected month
  const monthlyBudgets = useMemo(() =>
    budgets.filter(b => b.date >= monthFrom && b.date <= monthTo),
    [budgets, monthFrom, monthTo]
  );

  const filtered = adsContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.seller.toLowerCase().includes(search.toLowerCase())
  );

  const totalMonthlyBudget = adsContacts.reduce((s, c) => s + c.budget, 0);
  const totalYearlyBudget = totalMonthlyBudget * 12;
  const totalDailySpendThisMonth = monthlyBudgets.reduce((s, b) => s + b.dailySpend, 0);
  const totalDailyBudgetThisMonth = monthlyBudgets.reduce((s, b) => s + b.dailyBudget, 0);

  // Build daily data per contact for the selected month
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDailyDataForContact = (contactId: string) => {
    const contactBudgets = monthlyBudgets.filter(b => b.contactId === contactId);
    const dailyMap: Record<number, { budget: number; spend: number; impressions: number; clicks: number }> = {};

    for (const b of contactBudgets) {
      const day = new Date(b.date).getDate();
      if (!dailyMap[day]) {
        dailyMap[day] = { budget: 0, spend: 0, impressions: 0, clicks: 0 };
      }
      dailyMap[day].budget += b.dailyBudget;
      dailyMap[day].spend += b.dailySpend;
      dailyMap[day].impressions += b.impressions;
      dailyMap[day].clicks += b.clicks;
    }

    return dailyMap;
  };

  // Yearly overview: monthly totals from budget data
  const getMonthlyBudgetData = (contact: Contact) => {
    const startDate = contact.startDate ? new Date(contact.startDate) : null;
    const endDate = contact.endDate ? new Date(contact.endDate) : null;

    return MONTHS.map((_, monthIndex) => {
      // Check if contact is active in this month
      if (!startDate) return null;
      const monthDate = new Date(selectedYear, monthIndex, 1);
      if (monthDate < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) return null;
      if (endDate && monthDate > new Date(endDate.getFullYear(), endDate.getMonth(), 1)) return null;
      if (contact.status === 'paused' || contact.status === 'completed') return null;

      // Sum actual spend from budget data for this month
      const { from, to } = getDateRange(selectedYear, monthIndex);
      const monthBudgets = budgets.filter(b =>
        b.contactId === contact.id && b.date >= from && b.date <= to
      );
      const actualSpend = monthBudgets.reduce((s, b) => s + b.dailySpend, 0);

      return {
        plannedBudget: contact.budget,
        actualSpend,
        hasData: monthBudgets.length > 0,
      };
    });
  };

  const monthlyTotals = MONTHS.map((_, monthIndex) => {
    return filtered.reduce((sum, contact) => {
      const data = getMonthlyBudgetData(contact);
      return sum + (data[monthIndex]?.plannedBudget || 0);
    }, 0);
  });

  const handleAddBudget = async () => {
    if (!addContactId || !addDate || !addBudget) {
      toast.error('Fyll i kontakt, datum och budget');
      return;
    }

    const result = await addBudgetEntry({
      contactId: addContactId,
      date: addDate,
      campaignName: addCampaign || 'Huvudkampanj',
      dailyBudget: parseFloat(addBudget) || 0,
      dailySpend: parseFloat(addSpend) || 0,
      impressions: parseInt(addImpressions) || 0,
      clicks: parseInt(addClicks) || 0,
      conversions: parseFloat(addConversions) || 0,
    });

    if (result) {
      toast.success('Budgetdata sparad');
      setAddDialogOpen(false);
      setAddCampaign('');
      setAddBudget('');
      setAddSpend('');
      setAddImpressions('');
      setAddClicks('');
      setAddConversions('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Google ADS Översikt</h1>
          <p className="text-muted-foreground mt-1">Dagliga budgetar och spendöversikt för alla ADS-kunder</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
            Inställningar
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => syncBudgets(yearFrom, yearTo)}
            disabled={syncing || !config?.developerToken}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synkar...' : 'Synka från Google Ads'}
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Lägg till manuellt
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till daglig budgetdata</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Kund</label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={addContactId}
                  onChange={(e) => setAddContactId(e.target.value)}
                >
                  <option value="">Välj kund...</option>
                  {adsContacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Datum</label>
                <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Kampanjnamn</label>
                <Input placeholder="Huvudkampanj" value={addCampaign} onChange={(e) => setAddCampaign(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Daglig budget (kr)</label>
                  <Input type="number" placeholder="0" value={addBudget} onChange={(e) => setAddBudget(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Daglig spend (kr)</label>
                  <Input type="number" placeholder="0" value={addSpend} onChange={(e) => setAddSpend(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Visningar</label>
                  <Input type="number" placeholder="0" value={addImpressions} onChange={(e) => setAddImpressions(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Klick</label>
                  <Input type="number" placeholder="0" value={addClicks} onChange={(e) => setAddClicks(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Konverteringar</label>
                  <Input type="number" placeholder="0" value={addConversions} onChange={(e) => setAddConversions(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddBudget} className="w-full">Spara</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && <GoogleAdsSettings />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">ADS-kunder</p>
            <p className="text-2xl font-heading font-bold text-foreground">{adsContacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Månadsbudget (CRM)</p>
            <p className="text-2xl font-heading font-bold text-foreground">{totalMonthlyBudget.toLocaleString()} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Årsbudget (totalt)</p>
            <p className="text-2xl font-heading font-bold text-[hsl(var(--status-done))]">{totalYearlyBudget.toLocaleString()} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Spend {MONTHS[selectedMonth]}</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              {totalDailySpendThisMonth > 0 ? `${totalDailySpendThisMonth.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Budget {MONTHS[selectedMonth]}</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              {totalDailyBudgetThisMonth > 0 ? `${totalDailyBudgetThisMonth.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Month Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök kund..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {MONTHS.map((m, i) => (
            <Button
              key={m}
              variant={selectedMonth === i ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMonth(i)}
              className="text-xs px-2"
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {/* Daily Budget Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Daglig budget – {MONTHS[selectedMonth]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[160px]">Kund</TableHead>
                <TableHead className="text-center min-w-[80px]">CRM Budget</TableHead>
                {days.map(d => (
                  <TableHead key={d} className="text-center min-w-[55px] text-xs">{d}</TableHead>
                ))}
                <TableHead className="text-center min-w-[80px] font-bold">Totalt spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact, i) => {
                const dailyData = getDailyDataForContact(contact.id);
                const totalSpend = Object.values(dailyData).reduce((s, d) => s + d.spend, 0);

                return (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{contact.name}</span>
                        {contact.website && (
                          <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {contact.googleAdsCustomerId && (
                        <span className="text-xs text-muted-foreground">{contact.googleAdsCustomerId}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-muted-foreground">{contact.budget} kr</span>
                    </TableCell>
                    {days.map(d => {
                      const data = dailyData[d];
                      return (
                        <TableCell key={d} className="text-center p-1">
                          {data ? (
                            <div className="text-xs" title={`Budget: ${data.budget} kr\nSpend: ${data.spend} kr\nKlick: ${data.clicks}\nVisningar: ${data.impressions}`}>
                              <span className={`font-medium ${data.spend > data.budget ? 'text-red-500' : 'text-foreground'}`}>
                                {Math.round(data.spend)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <span className="font-bold text-foreground text-sm">
                        {totalSpend > 0 ? `${totalSpend.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr` : '—'}
                      </span>
                    </TableCell>
                  </motion.tr>
                );
              })}

              {/* Totals row */}
              <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
                <TableCell className="sticky left-0 bg-muted/50 z-10 text-foreground">Totalt</TableCell>
                <TableCell className="text-center text-foreground">
                  {filtered.reduce((s, c) => s + c.budget, 0)} kr
                </TableCell>
                {days.map(d => {
                  const dayTotal = filtered.reduce((sum, c) => {
                    const data = getDailyDataForContact(c.id);
                    return sum + (data[d]?.spend || 0);
                  }, 0);
                  return (
                    <TableCell key={d} className="text-center text-xs text-foreground">
                      {dayTotal > 0 ? Math.round(dayTotal) : '—'}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center text-primary font-bold">
                  {(() => {
                    const total = filtered.reduce((sum, c) => {
                      const data = getDailyDataForContact(c.id);
                      return sum + Object.values(data).reduce((s, d) => s + d.spend, 0);
                    }, 0);
                    return total > 0 ? `${total.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr` : '—';
                  })()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Inga ADS-kunder hittades</div>
          )}
        </CardContent>
      </Card>

      {/* Yearly overview table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Årskort {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[160px]">Kund</TableHead>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[90px]">Tjänster</TableHead>
                {MONTHS.map(m => (
                  <TableHead key={m} className="text-center min-w-[70px]">{m}</TableHead>
                ))}
                <TableHead className="text-center min-w-[90px] font-bold">Totalt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact, i) => {
                const monthlyData = getMonthlyBudgetData(contact);
                const yearTotal = monthlyData.reduce((s, v) => s + (v?.plannedBudget || 0), 0);

                return (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{contact.name}</span>
                        {contact.website && (
                          <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {parseServices(contact.service).map(svc => (
                          <Badge key={svc} variant="secondary" className="text-xs">{svc}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    {monthlyData.map((val, mi) => (
                      <TableCell key={mi} className="text-center">
                        {val !== null ? (
                          <div>
                            <span className="text-sm font-medium text-foreground">{val.plannedBudget}</span>
                            {val.hasData && (
                              <div className="text-xs text-muted-foreground">
                                {val.actualSpend.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <span className="font-bold text-foreground">{yearTotal > 0 ? `${yearTotal.toLocaleString()} kr` : '—'}</span>
                    </TableCell>
                  </motion.tr>
                );
              })}

              {/* Totals row */}
              <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
                <TableCell className="sticky left-0 bg-muted/50 z-10 text-foreground">Totalt</TableCell>
                <TableCell></TableCell>
                {monthlyTotals.map((total, mi) => (
                  <TableCell key={mi} className="text-center text-foreground">
                    {total > 0 ? total.toLocaleString() : '—'}
                  </TableCell>
                ))}
                <TableCell className="text-center text-primary font-bold text-base">
                  {monthlyTotals.reduce((s, v) => s + v, 0).toLocaleString()} kr
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-client comment cards */}
      {filtered.filter(c => c.comment).length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Anteckningar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.filter(c => c.comment).map(c => (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <p className="font-medium text-foreground text-sm">{c.name}</p>
                  <p className="text-muted-foreground text-sm mt-1">{c.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
