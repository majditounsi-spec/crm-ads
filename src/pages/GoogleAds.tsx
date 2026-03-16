import { useState } from 'react';
import { mockContacts } from '@/data/contactData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

function parseServices(service: string): string[] {
  if (!service) return [];
  return service.split(/\s*[\+\,]\s*/).map(s => s.trim()).filter(Boolean);
}

export default function GoogleAds() {
  const [search, setSearch] = useState('');

  // Filter contacts that have Google ADS or ADS in their service
  const adsContacts = mockContacts.filter(c => {
    const services = parseServices(c.service);
    return services.some(s => s.toLowerCase().includes('ads'));
  });

  const filtered = adsContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.seller.toLowerCase().includes(search.toLowerCase())
  );

  const totalMonthlyBudget = adsContacts.reduce((s, c) => s + c.budget, 0);
  const totalYearlyBudget = totalMonthlyBudget * 12;

  // Generate monthly data per client based on their budget and start date
  const getMonthlyData = (contact: typeof mockContacts[0]) => {
    const startDate = contact.startDate ? new Date(contact.startDate) : null;
    const endDate = contact.endDate ? new Date(contact.endDate) : null;
    const currentYear = 2026;

    return MONTHS.map((_, monthIndex) => {
      if (!startDate) return null;
      const monthDate = new Date(currentYear, monthIndex, 1);
      if (monthDate < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) return null;
      if (endDate && monthDate > new Date(endDate.getFullYear(), endDate.getMonth(), 1)) return null;
      if (contact.status === 'paused' || contact.status === 'completed') return null;
      return contact.budget;
    });
  };

  // Calculate totals per month
  const monthlyTotals = MONTHS.map((_, monthIndex) => {
    return filtered.reduce((sum, contact) => {
      const data = getMonthlyData(contact);
      return sum + (data[monthIndex] || 0);
    }, 0);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Google ADS Översikt</h1>
        <p className="text-muted-foreground mt-1">Årskort – månadsvis spendöversikt för alla ADS-kunder</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">ADS-kunder</p>
            <p className="text-2xl font-heading font-bold text-foreground">{adsContacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Månadsbudget (totalt)</p>
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
            <p className="text-sm text-muted-foreground">Snitt/kund/mån</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              {adsContacts.length > 0 ? Math.round(totalMonthlyBudget / adsContacts.length).toLocaleString() : 0} kr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök kund..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Yearly card table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Årskort 2026
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">Kund</TableHead>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[100px]">Tjänster</TableHead>
                {MONTHS.map(m => (
                  <TableHead key={m} className="text-center min-w-[70px]">{m}</TableHead>
                ))}
                <TableHead className="text-center min-w-[90px] font-bold">Totalt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact, i) => {
                const monthlyData = getMonthlyData(contact);
                const yearTotal = monthlyData.reduce((s, v) => s + (v || 0), 0);

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
                          <span className="text-sm font-medium text-foreground">{val}</span>
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

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Inga ADS-kunder hittades</div>
          )}
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
