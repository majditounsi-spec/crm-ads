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
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ExternalLink, Search, TrendingUp, Plus, CalendarDays, RefreshCw, Settings, Loader2, Wifi, WifiOff, BarChart3, DollarSign, Users, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Contact } from '@/types/crm';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function parseServices(service: string): string[] {
  if (!service) return [];
  return service.split(/\s*[\+\,]\s*/).map(s => s.trim()).filter(Boolean);
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

  const adsContacts = useMemo(() =>
    contacts.filter(c => {
      const services = parseServices(c.service);
      return services.some(s => s.toLowerCase().includes('ads'));
    }),
    [contacts]
  );

  const adsContactIds = useMemo(() => adsContacts.map(c => c.id), [adsContacts]);

  const { from: monthFrom, to: monthTo } = getDateRange(selectedYear, selectedMonth);
  const yearFrom = `${selectedYear}-01-01`;
  const yearTo = `${selectedYear}-12-31`;

  const { budgets, loading: budgetsLoading, addBudgetEntry } = useGoogleAdsBudgets(adsContactIds, yearFrom, yearTo);
  const loading = contactsLoading || budgetsLoading;

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
  const totalImpressions = monthlyBudgets.reduce((s, b) => s + b.impressions, 0);
  const totalClicks = monthlyBudgets.reduce((s, b) => s + b.clicks, 0);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isConfigured = config && config.developerToken && config.clientId && config.clientSecret && config.refreshToken;

  const getDailyDataForContact = (contactId: string) => {
    const contactBudgets = monthlyBudgets.filter(b => b.contactId === contactId);
    const dailyMap: Record<number, { budget: number; spend: number; impressions: number; clicks: number }> = {};
    for (const b of contactBudgets) {
      const day = new Date(b.date).getDate();
      if (!dailyMap[day]) dailyMap[day] = { budget: 0, spend: 0, impressions: 0, clicks: 0 };
      dailyMap[day].budget += b.dailyBudget;
      dailyMap[day].spend += b.dailySpend;
      dailyMap[day].impressions += b.impressions;
      dailyMap[day].clicks += b.clicks;
    }
    return dailyMap;
  };

  const getMonthlyBudgetData = (contact: Contact) => {
    const startDate = contact.startDate ? new Date(contact.startDate) : null;
    const endDate = contact.endDate ? new Date(contact.endDate) : null;
    return MONTHS.map((_, monthIndex) => {
      if (!startDate) return null;
      const monthDate = new Date(selectedYear, monthIndex, 1);
      if (monthDate < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) return null;
      if (endDate && monthDate > new Date(endDate.getFullYear(), endDate.getMonth(), 1)) return null;
      if (contact.status === 'paused' || contact.status === 'completed') return null;
      const { from, to } = getDateRange(selectedYear, monthIndex);
      const monthBudgets = budgets.filter(b => b.contactId === contact.id && b.date >= from && b.date <= to);
      const actualSpend = monthBudgets.reduce((s, b) => s + b.dailySpend, 0);
      return { plannedBudget: contact.budget, actualSpend, hasData: monthBudgets.length > 0 };
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
      contactId: addContactId, date: addDate, campaignName: addCampaign || 'Huvudkampanj',
      dailyBudget: parseFloat(addBudget) || 0, dailySpend: parseFloat(addSpend) || 0,
      impressions: parseInt(addImpressions) || 0, clicks: parseInt(addClicks) || 0,
      conversions: parseFloat(addConversions) || 0,
    });
    if (result) {
      toast.success('Budgetdata sparad');
      setAddDialogOpen(false);
      setAddCampaign(''); setAddBudget(''); setAddSpend('');
      setAddImpressions(''); setAddClicks(''); setAddConversions('');
    }
  };

  const handleSync = () => {
    if (!isConfigured) {
      setShowSettings(true);
      toast.error('Konfigurera Google Ads API först');
      return;
    }
    syncBudgets(yearFrom, yearTo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Google ADS</h1>
          <p className="text-muted-foreground">Dagliga budgetar och spendöversikt för {adsContacts.length} ADS-kunder</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
            API
          </Button>
          <Button
            variant={isConfigured ? 'default' : 'outline'}
            size="sm"
            className={`gap-2 ${isConfigured ? 'bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90' : ''}`}
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synkar...' : 'Synka Google Ads'}
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Manuell data</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Lägg till daglig budgetdata</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Kund</label>
                  <select className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm" value={addContactId} onChange={(e) => setAddContactId(e.target.value)}>
                    <option value="">Välj kund...</option>
                    {adsContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium">Datum</label><Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} /></div>
                <div><label className="text-sm font-medium">Kampanjnamn</label><Input placeholder="Huvudkampanj" value={addCampaign} onChange={(e) => setAddCampaign(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">Daglig budget (kr)</label><Input type="number" placeholder="0" value={addBudget} onChange={(e) => setAddBudget(e.target.value)} /></div>
                  <div><label className="text-sm font-medium">Daglig spend (kr)</label><Input type="number" placeholder="0" value={addSpend} onChange={(e) => setAddSpend(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-sm font-medium">Visningar</label><Input type="number" placeholder="0" value={addImpressions} onChange={(e) => setAddImpressions(e.target.value)} /></div>
                  <div><label className="text-sm font-medium">Klick</label><Input type="number" placeholder="0" value={addClicks} onChange={(e) => setAddClicks(e.target.value)} /></div>
                  <div><label className="text-sm font-medium">Konverteringar</label><Input type="number" placeholder="0" value={addConversions} onChange={(e) => setAddConversions(e.target.value)} /></div>
                </div>
                <Button onClick={handleAddBudget} className="w-full">Spara</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* API Status Banner */}
      {!isConfigured && !showSettings && (
        <motion.div variants={item}>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Google Ads API ej ansluten</p>
                  <p className="text-xs text-muted-foreground">Konfigurera API-nycklar för att synka budgetdata automatiskt</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>Konfigurera</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isConfigured && !showSettings && (
        <motion.div variants={item}>
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="py-3 flex items-center gap-3">
              <Wifi className="h-4 w-4 text-emerald-500" />
              <p className="text-sm text-emerald-600 font-medium">Google Ads API ansluten</p>
              {config?.lastSyncedAt && (
                <span className="text-xs text-muted-foreground">· Senast synkad: {new Date(config.lastSyncedAt).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}</span>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showSettings && <motion.div variants={item}><GoogleAdsSettings /></motion.div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: 'ADS-kunder', value: adsContacts.length, icon: Users, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { title: 'Månadsbudget', value: `${(totalMonthlyBudget / 1000).toFixed(0)}k kr`, icon: DollarSign, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
          { title: 'Årsbudget', value: `${(totalYearlyBudget / 1000).toFixed(0)}k kr`, icon: TrendingUp, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { title: `Spend ${MONTHS[selectedMonth]}`, value: totalDailySpendThisMonth > 0 ? `${(totalDailySpendThisMonth / 1000).toFixed(1)}k kr` : '—', icon: BarChart3, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
          { title: 'Visningar', value: totalImpressions > 0 ? totalImpressions.toLocaleString('sv-SE') : '—', icon: Target, color: 'from-rose-500/10 to-rose-500/5', iconColor: 'text-rose-500 bg-rose-500/10' },
          { title: 'Klick', value: totalClicks > 0 ? totalClicks.toLocaleString('sv-SE') : '—', icon: Target, color: 'from-cyan-500/10 to-cyan-500/5', iconColor: 'text-cyan-500 bg-cyan-500/10' },
        ].map(stat => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={`pt-4 pb-3 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                    <p className="text-xl font-heading font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.iconColor}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Month Selector + Search */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök kund..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap rounded-xl bg-muted/50 p-1">
          {MONTHS.map((m, i) => (
            <Button
              key={m}
              variant={selectedMonth === i ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedMonth(i)}
              className={`text-xs px-2.5 h-7 rounded-lg ${selectedMonth === i ? 'bg-gradient-to-r from-primary to-violet-600 text-white shadow-sm' : ''}`}
            >
              {m}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Daily Budget Table */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Daglig budget – {MONTHS[selectedMonth]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="sticky left-0 bg-muted/30 z-10 min-w-[160px]">Kund</TableHead>
                  <TableHead className="text-center min-w-[80px]">CRM Budget</TableHead>
                  {days.map(d => (
                    <TableHead key={d} className="text-center min-w-[50px] text-xs">{d}</TableHead>
                  ))}
                  <TableHead className="text-center min-w-[80px] font-bold">Totalt</TableHead>
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
                      className="monday-row border-b"
                    >
                      <TableCell className="sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{contact.name}</span>
                          {contact.website && (
                            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {contact.googleAdsCustomerId && (
                          <span className="text-[10px] text-muted-foreground">{contact.googleAdsCustomerId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-medium text-muted-foreground">{contact.budget.toLocaleString('sv-SE')} kr</span>
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
                              <span className="text-muted-foreground/20 text-xs">·</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <span className="font-bold text-sm">
                          {totalSpend > 0 ? `${totalSpend.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr` : '—'}
                        </span>
                      </TableCell>
                    </motion.tr>
                  );
                })}

                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell className="sticky left-0 bg-muted/50 z-10">Totalt</TableCell>
                  <TableCell className="text-center">{filtered.reduce((s, c) => s + c.budget, 0).toLocaleString('sv-SE')} kr</TableCell>
                  {days.map(d => {
                    const dayTotal = filtered.reduce((sum, c) => {
                      const data = getDailyDataForContact(c.id);
                      return sum + (data[d]?.spend || 0);
                    }, 0);
                    return <TableCell key={d} className="text-center text-xs">{dayTotal > 0 ? Math.round(dayTotal) : '·'}</TableCell>;
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
      </motion.div>

      {/* Yearly overview */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Årskort {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="sticky left-0 bg-muted/30 z-10 min-w-[160px]">Kund</TableHead>
                  <TableHead className="sticky left-0 bg-muted/30 z-10 min-w-[90px]">Tjänster</TableHead>
                  {MONTHS.map(m => <TableHead key={m} className="text-center min-w-[70px]">{m}</TableHead>)}
                  <TableHead className="text-center min-w-[90px] font-bold">Totalt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contact, i) => {
                  const monthlyData = getMonthlyBudgetData(contact);
                  const yearTotal = monthlyData.reduce((s, v) => s + (v?.plannedBudget || 0), 0);
                  return (
                    <motion.tr key={contact.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="monday-row border-b">
                      <TableCell className="sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{contact.name}</span>
                          {contact.website && (
                            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="h-3 w-3" /></a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {parseServices(contact.service).map(svc => (
                            <Badge key={svc} variant="secondary" className="text-[10px] px-1.5 py-0">{svc}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      {monthlyData.map((val, mi) => (
                        <TableCell key={mi} className="text-center">
                          {val !== null ? (
                            <div>
                              <span className="text-xs font-medium">{val.plannedBudget.toLocaleString('sv-SE')}</span>
                              {val.hasData && (
                                <div className={`text-[10px] ${val.actualSpend > val.plannedBudget ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                                  {val.actualSpend.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/20">·</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span className="font-bold text-sm">{yearTotal > 0 ? `${yearTotal.toLocaleString('sv-SE')} kr` : '—'}</span>
                      </TableCell>
                    </motion.tr>
                  );
                })}

                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell className="sticky left-0 bg-muted/50 z-10">Totalt</TableCell>
                  <TableCell></TableCell>
                  {monthlyTotals.map((total, mi) => (
                    <TableCell key={mi} className="text-center text-xs">{total > 0 ? total.toLocaleString('sv-SE') : '—'}</TableCell>
                  ))}
                  <TableCell className="text-center text-primary font-bold">
                    {monthlyTotals.reduce((s, v) => s + v, 0).toLocaleString('sv-SE')} kr
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notes */}
      {filtered.filter(c => c.comment).length > 0 && (
        <motion.div variants={item}>
          <h2 className="text-base font-heading font-semibold mb-3">Anteckningar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.filter(c => c.comment).map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-muted-foreground text-sm mt-1">{c.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
