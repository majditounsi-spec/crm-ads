import { useState } from 'react';
import {
  Globe, Target, TrendingUp, Camera, Mail, MessageSquare, FileText, Phone,
  CreditCard, Cloud, Link2, CheckCircle2, XCircle, Settings, ExternalLink,
  Zap, BarChart3, Video, Headphones, PenTool, ArrowRight, Search, Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  color: string;
  features: string[];
}

const integrations: Integration[] = [
  // Marknadsföring
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Synka kampanjdata, budget och konverteringar direkt i CRM:et.',
    icon: Globe,
    category: 'Marknadsföring',
    status: 'connected',
    color: 'bg-blue-500',
    features: ['Budgetsynk', 'Konverteringsspårning', 'Kampanjrapporter'],
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads (Facebook & Instagram)',
    description: 'Hantera Meta-kampanjer, leads och annonsbudget.',
    icon: Target,
    category: 'Marknadsföring',
    status: 'available',
    color: 'bg-blue-600',
    features: ['Lead Forms', 'Kampanjdata', 'Audience sync'],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Synka kontakter och trigga e-postkampanjer automatiskt.',
    icon: Mail,
    category: 'Marknadsföring',
    status: 'available',
    color: 'bg-amber-500',
    features: ['Kontaktsynk', 'Kampanjrapporter', 'Automatiserade flöden'],
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Spåra webbplatstrafik och konverteringar per kund.',
    icon: BarChart3,
    category: 'Marknadsföring',
    status: 'available',
    color: 'bg-orange-500',
    features: ['Trafik per kund', 'Konverteringsdata', 'Realtidsrapporter'],
  },
  {
    id: 'semrush',
    name: 'SEMrush / Ahrefs',
    description: 'SEO-rankingsdata, domänanalys och sökordsövervakning.',
    icon: TrendingUp,
    category: 'Marknadsföring',
    status: 'available',
    color: 'bg-emerald-500',
    features: ['Ranking-tracker', 'Backlinks', 'Domänauktoritet'],
  },

  // Ekonomi
  {
    id: 'fortnox',
    name: 'Fortnox',
    description: 'Automatisk fakturering, bokföring och kundreskontran.',
    icon: FileText,
    category: 'Ekonomi & Faktura',
    status: 'available',
    color: 'bg-emerald-600',
    features: ['Automatfakturor', 'Kundreskontra', 'Bokföring'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Hantera betalningar och prenumerationer.',
    icon: CreditCard,
    category: 'Ekonomi & Faktura',
    status: 'available',
    color: 'bg-violet-500',
    features: ['Betalningar', 'Prenumerationer', 'Fakturor'],
  },
  {
    id: 'visma',
    name: 'Visma eEkonomi',
    description: 'Integration med Visma för bokföring och löner.',
    icon: FileText,
    category: 'Ekonomi & Faktura',
    status: 'coming_soon',
    color: 'bg-red-500',
    features: ['Bokföring', 'Löner', 'Moms'],
  },

  // Kommunikation
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notifikationer, @mentions och automatiseringar till Slack-kanaler.',
    icon: MessageSquare,
    category: 'Kommunikation',
    status: 'available',
    color: 'bg-purple-500',
    features: ['Kanalnotiser', 'Bot-kommandon', 'Workflow triggers'],
  },
  {
    id: 'gmail',
    name: 'Gmail / Google Workspace',
    description: '2-vägs e-postsynk, kalenderintegration och kontakter.',
    icon: Mail,
    category: 'Kommunikation',
    status: 'connected',
    color: 'bg-red-500',
    features: ['E-postsynk', 'Kalender', 'Kontaktsynk'],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Möten, chatt och fildelning integrerat.',
    icon: Video,
    category: 'Kommunikation',
    status: 'coming_soon',
    color: 'bg-blue-700',
    features: ['Mötesbokning', 'Chattnotiser', 'Fildelning'],
  },
  {
    id: 'telavox',
    name: 'Telavox',
    description: 'Ring direkt från CRM:et och logga alla samtal automatiskt.',
    icon: Phone,
    category: 'Kommunikation',
    status: 'available',
    color: 'bg-teal-500',
    features: ['Click-to-call', 'Samtalslogg', 'Inspelning'],
  },

  // Dokument & Signatur
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Dela filer och dokument direkt i kundkorten.',
    icon: Cloud,
    category: 'Dokument & Signatur',
    status: 'available',
    color: 'bg-yellow-500',
    features: ['Fildelning', 'Mappstruktur per kund', 'Realtidsredigering'],
  },
  {
    id: 'scrive',
    name: 'Scrive',
    description: 'Digitala signaturer för avtal och offerter.',
    icon: PenTool,
    category: 'Dokument & Signatur',
    status: 'available',
    color: 'bg-indigo-500',
    features: ['E-signering', 'Avtalsmallar', 'Spårning'],
  },

  // Produktion
  {
    id: 'frame-io',
    name: 'Frame.io',
    description: 'Granska och godkänn film/foto-leveranser med kunden.',
    icon: Camera,
    category: 'Produktion',
    status: 'available',
    color: 'bg-violet-600',
    features: ['Videogranskning', 'Kundkommentarer', 'Versionshantering'],
  },

  // Automation
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Koppla ihop med 5000+ appar via no-code automationer.',
    icon: Zap,
    category: 'Automationshubbar',
    status: 'available',
    color: 'bg-orange-500',
    features: ['5000+ appar', 'No-code', 'Multi-step zaps'],
  },
  {
    id: 'make',
    name: 'Make.com (Integromat)',
    description: 'Avancerade automationsflöden med visuell byggare.',
    icon: Link2,
    category: 'Automationshubbar',
    status: 'available',
    color: 'bg-violet-500',
    features: ['Visuella flöden', 'Avancerad logik', 'HTTP/Webhooks'],
  },
];

const categories = [...new Set(integrations.map(i => i.category))];

const statusLabels: Record<string, { label: string; className: string }> = {
  connected: { label: 'Ansluten', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  available: { label: 'Tillgänglig', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  coming_soon: { label: 'Kommer snart', className: 'bg-muted text-muted-foreground border-border' },
};

export default function Integrations() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const connected = integrations.filter(i => i.status === 'connected').length;

  const filtered = integrations.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || i.category === filterCategory;
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const handleConnect = (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      toast.info(`${integration.name} kommer snart!`);
    } else if (integration.status === 'connected') {
      toast.info(`${integration.name} är redan ansluten`);
    } else {
      toast.success(`Ansluter till ${integration.name}...`);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Integrationer</h1>
          <p className="text-muted-foreground">{connected} anslutna · {integrations.length} tillgängliga</p>
        </div>
      </motion.div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'Anslutna', value: connected, color: 'from-emerald-500/10 to-emerald-500/5', icon: CheckCircle2, iconColor: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Tillgängliga', value: integrations.filter(i => i.status === 'available').length, color: 'from-blue-500/10 to-blue-500/5', icon: Link2, iconColor: 'text-blue-500 bg-blue-500/10' },
          { title: 'Kategorier', value: categories.length, color: 'from-violet-500/10 to-violet-500/5', icon: Filter, iconColor: 'text-violet-500 bg-violet-500/10' },
          { title: 'Kommer snart', value: integrations.filter(i => i.status === 'coming_soon').length, color: 'from-amber-500/10 to-amber-500/5', icon: Zap, iconColor: 'text-amber-500 bg-amber-500/10' },
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

      {/* Filters */}
      <motion.div variants={item} className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök integration..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Alla kategorier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kategorier</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 rounded-xl"><SelectValue placeholder="Alla status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla status</SelectItem>
            <SelectItem value="connected">Anslutna</SelectItem>
            <SelectItem value="available">Tillgängliga</SelectItem>
            <SelectItem value="coming_soon">Kommer snart</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Integration cards by category */}
      {categories
        .filter(cat => filterCategory === 'all' || cat === filterCategory)
        .map(category => {
          const categoryItems = filtered.filter(i => i.category === category);
          if (categoryItems.length === 0) return null;
          return (
            <motion.div key={category} variants={item}>
              <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {categoryItems.map((integration) => {
                  const st = statusLabels[integration.status];
                  return (
                    <motion.div key={integration.id} variants={item}
                      className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md group ${
                        integration.status === 'coming_soon' ? 'opacity-60' : ''
                      }`}>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl ${integration.color} text-white shrink-0`}>
                            <integration.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">{integration.name}</h3>
                              <Badge variant="outline" className={`text-[10px] px-1.5 h-4 shrink-0 ${st.className}`}>
                                {st.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{integration.description}</p>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {integration.features.map(f => (
                                <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{f}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          {integration.status === 'connected' ? (
                            <>
                              <span className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" /> Aktiv
                              </span>
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                <Settings className="h-3 w-3" /> Inställningar
                              </Button>
                            </>
                          ) : integration.status === 'available' ? (
                            <>
                              <span className="text-xs text-muted-foreground">Ej ansluten</span>
                              <Button size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => handleConnect(integration)}>
                                <Link2 className="h-3 w-3" /> Anslut
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">Under utveckling</span>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" disabled>
                                Kommer snart
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
    </motion.div>
  );
}
