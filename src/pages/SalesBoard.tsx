import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useContacts } from '@/hooks/useContacts';
import { useGetAccept, type GetAcceptDeal } from '@/hooks/useGetAccept';
import { useFortnox } from '@/hooks/useFortnox';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PriorityBadge } from '@/components/PriorityBadge';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, TrendingUp, Target, Calendar, Search, ExternalLink, Phone, Mail,
  FileText, CreditCard, Check, Send, Eye, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  FileSignature, Receipt, Link2, Settings,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const gaStatusLabels: Record<string, string> = {
  draft: 'Utkast', sent: 'Skickad', viewed: 'Visad', signed: 'Signerad', rejected: 'Avvisad', expired: 'Utgången',
};
const gaStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  viewed: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  signed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};
const gaStatusIcons: Record<string, any> = {
  draft: FileText, sent: Send, viewed: Eye, signed: CheckCircle2, rejected: XCircle, expired: AlertCircle,
};

const invoiceStatusLabels: Record<string, string> = {
  draft: 'Utkast', sent: 'Skickad', paid: 'Betald', overdue: 'Förfallen', cancelled: 'Makulerad',
};
const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  paid: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const pipelineStages = [
  { key: 'draft', label: 'Utkast', color: 'bg-gray-400', icon: FileText },
  { key: 'sent', label: 'Skickad', color: 'bg-blue-500', icon: Send },
  { key: 'viewed', label: 'Visad', color: 'bg-amber-500', icon: Eye },
  { key: 'signed', label: 'Signerad', color: 'bg-emerald-500', icon: CheckCircle2 },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function SalesBoard() {
  const navigate = useNavigate();
  const { deals: gaDeals, config: gaConfig, connect: connectGA, disconnect: disconnectGA, syncDeals } = useGetAccept();
  const { invoices, config: fnConfig, connect: connectFN, disconnect: disconnectFN, createInvoiceFromDeal, updateInvoiceStatus, isAlreadyInvoiced, totalRevenue, totalOutstanding } = useFortnox();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'pipeline' | 'invoices' | 'settings'>('pipeline');
  const [gaApiKey, setGaApiKey] = useState('');
  const [gaEntityId, setGaEntityId] = useState('');
  const [fnClientId, setFnClientId] = useState('');
  const [fnSecret, setFnSecret] = useState('');
  const [fnCompany, setFnCompany] = useState('');

  const filteredDeals = gaDeals.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.company.toLowerCase().includes(search.toLowerCase()) ||
    d.recipientName.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = gaDeals.reduce((s, d) => s + d.value, 0);
  const signedValue = gaDeals.filter(d => d.status === 'signed').reduce((s, d) => s + d.value, 0);
  const pendingValue = gaDeals.filter(d => ['sent', 'viewed'].includes(d.status)).reduce((s, d) => s + d.value, 0);

  const handleCreateInvoice = async (deal: GetAcceptDeal) => {
    if (isAlreadyInvoiced(deal.id)) {
      toast.error('Denna affär har redan fakturerats');
      return;
    }
    const inv = await createInvoiceFromDeal(deal);
    toast.success(`Faktura ${inv.invoiceNumber} skapad för ${deal.company}`);
  };

  const handleMarkPaid = (id: string) => {
    updateInvoiceStatus(id, 'paid');
    toast.success('Faktura markerad som betald');
  };

  const handleSendInvoice = (id: string) => {
    updateInvoiceStatus(id, 'sent');
    toast.success('Faktura skickad');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Säljtavla</h1>
          <p className="text-sm text-muted-foreground">
            {gaDeals.length} offerter via GetAccept · {invoices.length} fakturor i Fortnox
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
            {[
              { mode: 'pipeline' as const, label: 'Pipeline', icon: TrendingUp },
              { mode: 'invoices' as const, label: 'Fakturor', icon: Receipt },
              { mode: 'settings' as const, label: 'Kopplingar', icon: Settings },
            ].map(v => (
              <Button key={v.mode} variant={view === v.mode ? 'default' : 'ghost'} size="sm"
                className={`h-7 px-2.5 gap-1.5 rounded-md text-xs ${view === v.mode ? 'bg-primary text-white shadow-sm' : ''}`}
                onClick={() => setView(v.mode)}>
                <v.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{v.label}</span>
              </Button>
            ))}
          </div>
          {view === 'pipeline' && gaConfig.connected && (
            <Button size="sm" variant="outline" className="h-7 rounded-md gap-1.5 text-xs" onClick={() => { syncDeals(); toast.success('Synkad med GetAccept'); }}>
              <RefreshCw className="h-3 w-3" /> Synka
            </Button>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { title: 'Pipeline-värde', value: `${(totalValue / 1000).toFixed(0)}k`, icon: DollarSign, color: 'from-violet-500/10 to-violet-500/5', iconColor: 'text-violet-500 bg-violet-500/10' },
          { title: 'Väntande signering', value: `${(pendingValue / 1000).toFixed(0)}k`, icon: FileSignature, color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500 bg-amber-500/10' },
          { title: 'Signerat', value: `${(signedValue / 1000).toFixed(0)}k`, icon: CheckCircle2, color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Fakturerat & betalt', value: `${(totalRevenue / 1000).toFixed(0)}k`, icon: CreditCard, color: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500 bg-blue-500/10' },
        ].map(stat => (
          <motion.div key={stat.title} variants={item}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className={`pt-4 pb-3 bg-gradient-to-br ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                    <p className="text-lg sm:text-xl font-heading font-bold mt-1">{stat.value} kr</p>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.iconColor}`}><stat.icon className="h-4 w-4" /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {view === 'pipeline' ? (
        <>
          {/* Search */}
          <motion.div variants={item} className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Sök offert, företag..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-lg" />
          </motion.div>

          {!gaConfig.connected ? (
            <motion.div variants={item}>
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileSignature className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-heading font-semibold text-lg">Koppla GetAccept</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Anslut ditt GetAccept-konto för att se offerter, avtal och signeringar direkt i säljtavlan.</p>
                  <Button className="mt-4 rounded-lg" onClick={() => setView('settings')}>
                    <Link2 className="h-4 w-4 mr-2" /> Anslut GetAccept
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* ========== PIPELINE VIEW ========== */
            <motion.div variants={item} className="flex gap-3 sm:gap-4 overflow-x-auto pb-4">
              {pipelineStages.map(stage => {
                const stageDeals = filteredDeals.filter(d => d.status === stage.key);
                const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
                return (
                  <div key={stage.key} className="min-w-[250px] w-[250px] sm:min-w-[280px] sm:w-[280px] shrink-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                        <span className="font-heading font-semibold text-sm">{stage.label}</span>
                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stageDeals.length}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{(stageValue / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="space-y-2.5">
                      {stageDeals.map((deal, i) => {
                        const StatusIcon = gaStatusIcons[deal.status];
                        const invoiced = isAlreadyInvoiced(deal.id);
                        return (
                          <motion.div key={deal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="bg-card rounded-xl border p-3.5 group hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{deal.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{deal.company}</p>
                              </div>
                              <Badge className={`text-[10px] shrink-0 ${gaStatusColors[deal.status]}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{gaStatusLabels[deal.status]}
                              </Badge>
                            </div>

                            {deal.tags.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {deal.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{t}</span>)}
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                              <span className="font-heading font-bold text-sm">{deal.value.toLocaleString('sv-SE')} kr</span>
                              <span className="text-[10px] text-muted-foreground">{deal.recipientName}</span>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {deal.createdAt}</div>
                              <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {deal.recipientEmail}</div>
                            </div>

                            {/* Actions */}
                            {deal.status === 'signed' && (
                              <div className="mt-2 pt-2 border-t">
                                {invoiced ? (
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                    <Check className="h-3 w-3" /> Fakturerad via Fortnox
                                  </div>
                                ) : fnConfig.connected ? (
                                  <Button size="sm" variant="outline" className="h-7 w-full rounded-lg gap-1.5 text-xs" onClick={() => handleCreateInvoice(deal)}>
                                    <Receipt className="h-3 w-3" /> Skapa faktura i Fortnox
                                  </Button>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground">Koppla Fortnox för att fakturera</p>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      {stageDeals.length === 0 && (
                        <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">Inga offerter</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Rejected/Expired column */}
              <div className="min-w-[250px] w-[250px] sm:min-w-[280px] sm:w-[280px] shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="font-heading font-semibold text-sm">Avvisade / Utgångna</span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {filteredDeals.filter(d => ['rejected', 'expired'].includes(d.status)).length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {filteredDeals.filter(d => ['rejected', 'expired'].includes(d.status)).map(deal => (
                    <div key={deal.id} className="bg-card rounded-xl border p-3.5 opacity-60">
                      <p className="font-medium text-sm">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">{deal.company}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold">{deal.value.toLocaleString('sv-SE')} kr</span>
                        <Badge className={`text-[10px] ${gaStatusColors[deal.status]}`}>{gaStatusLabels[deal.status]}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : view === 'invoices' ? (
        /* ========== INVOICES VIEW ========== */
        <motion.div variants={item} className="space-y-4">
          {!fnConfig.connected ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-lg">Koppla Fortnox</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Anslut ditt Fortnox-konto för att skapa och hantera fakturor direkt från signerade offerter.</p>
                <Button className="mt-4 rounded-lg" onClick={() => setView('settings')}>
                  <Link2 className="h-4 w-4 mr-2" /> Anslut Fortnox
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Invoice summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground uppercase">Betalt</p><p className="text-lg font-bold text-emerald-600">{(totalRevenue / 1000).toFixed(0)}k kr</p></CardContent></Card>
                <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground uppercase">Utestående</p><p className="text-lg font-bold text-amber-600">{(totalOutstanding / 1000).toFixed(0)}k kr</p></CardContent></Card>
                <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground uppercase">Antal fakturor</p><p className="text-lg font-bold">{invoices.length}</p></CardContent></Card>
              </div>

              {/* Invoice table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-4 py-2.5">Faktura</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Kund</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5 hidden sm:table-cell">Beskrivning</th>
                        <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Belopp</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5">Status</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase px-3 py-2.5 hidden md:table-cell">Förfaller</th>
                        <th className="px-3 py-2.5 w-[100px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{inv.invoiceNumber}</td>
                          <td className="px-3 py-3 text-sm">{inv.customerName}</td>
                          <td className="px-3 py-3 text-sm text-muted-foreground hidden sm:table-cell truncate max-w-[200px]">{inv.description}</td>
                          <td className="px-3 py-3 text-sm font-bold text-right">{inv.totalAmount.toLocaleString('sv-SE')} kr</td>
                          <td className="px-3 py-3">
                            <Badge className={`text-[10px] ${invoiceStatusColors[inv.status]}`}>{invoiceStatusLabels[inv.status]}</Badge>
                          </td>
                          <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell">{inv.dueDate}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              {inv.status === 'draft' && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs rounded-md" onClick={() => handleSendInvoice(inv.id)}>
                                  <Send className="h-3 w-3 mr-1" /> Skicka
                                </Button>
                              )}
                              {inv.status === 'sent' && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs rounded-md text-emerald-600" onClick={() => handleMarkPaid(inv.id)}>
                                  <Check className="h-3 w-3 mr-1" /> Betald
                                </Button>
                              )}
                              {inv.status === 'paid' && (
                                <span className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /></span>
                              )}
                            </div>
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
          {/* GetAccept */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <FileSignature className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">GetAccept</h3>
                  <p className="text-xs text-muted-foreground">Offerter & e-signering</p>
                </div>
                {gaConfig.connected && <Badge className="ml-auto bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Ansluten</Badge>}
              </div>
              {gaConfig.connected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{gaDeals.length} offerter synkade</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => { syncDeals(); toast.success('Synkad!'); }}>
                      <RefreshCw className="h-3 w-3 mr-1.5" /> Synka
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg text-xs text-destructive" onClick={() => { disconnectGA(); toast.success('Frånkopplad'); }}>
                      Koppla från
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><Label className="text-xs">API-nyckel</Label><Input value={gaApiKey} onChange={e => setGaApiKey(e.target.value)} placeholder="ga_..." className="rounded-lg" /></div>
                  <div><Label className="text-xs">Entity ID</Label><Input value={gaEntityId} onChange={e => setGaEntityId(e.target.value)} placeholder="..." className="rounded-lg" /></div>
                  <Button className="w-full rounded-lg" onClick={() => { connectGA(gaApiKey || 'demo', gaEntityId || 'demo'); toast.success('Ansluten till GetAccept!'); }}>
                    <Link2 className="h-4 w-4 mr-2" /> Anslut
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fortnox */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">Fortnox</h3>
                  <p className="text-xs text-muted-foreground">Fakturering & bokföring</p>
                </div>
                {fnConfig.connected && <Badge className="ml-auto bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Ansluten</Badge>}
              </div>
              {fnConfig.connected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{fnConfig.companyName || 'Ditt företag'} · {invoices.length} fakturor</p>
                  <Button size="sm" variant="outline" className="rounded-lg text-xs text-destructive" onClick={() => { disconnectFN(); toast.success('Frånkopplad'); }}>
                    Koppla från
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><Label className="text-xs">Företagsnamn</Label><Input value={fnCompany} onChange={e => setFnCompany(e.target.value)} placeholder="Ditt företag AB" className="rounded-lg" /></div>
                  <div><Label className="text-xs">Client ID</Label><Input value={fnClientId} onChange={e => setFnClientId(e.target.value)} placeholder="..." className="rounded-lg" /></div>
                  <div><Label className="text-xs">Client Secret</Label><Input type="password" value={fnSecret} onChange={e => setFnSecret(e.target.value)} placeholder="..." className="rounded-lg" /></div>
                  <Button className="w-full rounded-lg" onClick={() => { connectFN(fnClientId || 'demo', fnSecret || 'demo', fnCompany || 'MarketFlow AB'); toast.success('Ansluten till Fortnox!'); }}>
                    <Link2 className="h-4 w-4 mr-2" /> Anslut
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
