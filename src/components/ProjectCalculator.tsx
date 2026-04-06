import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Globe, Target, TrendingUp, Camera, Monitor, Plus, Minus, Calculator,
  FileSignature, Trash2, Copy, Send,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Service Price List ──
export interface ServiceItem {
  id: string;
  category: string;
  name: string;
  description: string;
  priceType: 'monthly' | 'onetime' | 'hourly';
  basePrice: number;
  icon: any;
  color: string;
}

export const serviceCategories = [
  { key: 'seo', label: 'SEO', icon: TrendingUp, color: 'emerald' },
  { key: 'google-ads', label: 'Google Ads', icon: Globe, color: 'blue' },
  { key: 'meta-ads', label: 'Meta Ads', icon: Target, color: 'violet' },
  { key: 'webb', label: 'Webb', icon: Monitor, color: 'rose' },
  { key: 'film-foto', label: 'Film / Foto', icon: Camera, color: 'amber' },
];

export const servicePriceList: ServiceItem[] = [
  // SEO
  { id: 'seo-basic', category: 'seo', name: 'SEO Bas', description: 'Teknisk SEO, on-page optimering, sökordsanalys', priceType: 'monthly', basePrice: 8000, icon: TrendingUp, color: 'emerald' },
  { id: 'seo-standard', category: 'seo', name: 'SEO Standard', description: 'Bas + innehållsstrategi, länkbygge, månatlig rapport', priceType: 'monthly', basePrice: 15000, icon: TrendingUp, color: 'emerald' },
  { id: 'seo-premium', category: 'seo', name: 'SEO Premium', description: 'Standard + lokal SEO, Google Business, konkurrentanalys', priceType: 'monthly', basePrice: 25000, icon: TrendingUp, color: 'emerald' },
  { id: 'seo-audit', category: 'seo', name: 'SEO-audit', description: 'Djupgående teknisk analys med handlingsplan', priceType: 'onetime', basePrice: 12000, icon: TrendingUp, color: 'emerald' },

  // Google Ads
  { id: 'gads-setup', category: 'google-ads', name: 'Google Ads Setup', description: 'Kontouppsättning, kampanjstruktur, konverteringsspårning', priceType: 'onetime', basePrice: 8000, icon: Globe, color: 'blue' },
  { id: 'gads-mgmt', category: 'google-ads', name: 'Google Ads Förvaltning', description: 'Löpande optimering, budgethantering, A/B-tester', priceType: 'monthly', basePrice: 6000, icon: Globe, color: 'blue' },
  { id: 'gads-premium', category: 'google-ads', name: 'Google Ads Premium', description: 'Förvaltning + Shopping, Display, YouTube Ads', priceType: 'monthly', basePrice: 12000, icon: Globe, color: 'blue' },

  // Meta Ads
  { id: 'meta-setup', category: 'meta-ads', name: 'Meta Ads Setup', description: 'Pixel-installation, målgruppsbygge, kampanjstruktur', priceType: 'onetime', basePrice: 6000, icon: Target, color: 'violet' },
  { id: 'meta-mgmt', category: 'meta-ads', name: 'Meta Ads Förvaltning', description: 'Facebook & Instagram annonsering, löpande optimering', priceType: 'monthly', basePrice: 5000, icon: Target, color: 'violet' },
  { id: 'meta-content', category: 'meta-ads', name: 'Meta Content-paket', description: 'Annonsinnehåll: grafik, copy, A/B-varianter', priceType: 'monthly', basePrice: 8000, icon: Target, color: 'violet' },

  // Webb
  { id: 'webb-landing', category: 'webb', name: 'Landningssida', description: 'Konverteringsoptimerad one-pager', priceType: 'onetime', basePrice: 15000, icon: Monitor, color: 'rose' },
  { id: 'webb-standard', category: 'webb', name: 'Hemsida Standard', description: '5-10 sidor, responsiv design, CMS', priceType: 'onetime', basePrice: 35000, icon: Monitor, color: 'rose' },
  { id: 'webb-ecommerce', category: 'webb', name: 'E-handel', description: 'Webshop med produkthantering, betalning, frakt', priceType: 'onetime', basePrice: 65000, icon: Monitor, color: 'rose' },
  { id: 'webb-support', category: 'webb', name: 'Webbsupport', description: 'Underhåll, uppdateringar, säkerhet', priceType: 'monthly', basePrice: 3000, icon: Monitor, color: 'rose' },

  // Film/Foto
  { id: 'foto-basic', category: 'film-foto', name: 'Fotoproduktion Bas', description: 'Halvdags fotografering, 20 redigerade bilder', priceType: 'onetime', basePrice: 8000, icon: Camera, color: 'amber' },
  { id: 'foto-premium', category: 'film-foto', name: 'Fotoproduktion Premium', description: 'Heldags, 50+ bilder, styling, location', priceType: 'onetime', basePrice: 18000, icon: Camera, color: 'amber' },
  { id: 'video-short', category: 'film-foto', name: 'Kort video (30-60s)', description: 'Sociala medier-video, redigering, musik', priceType: 'onetime', basePrice: 12000, icon: Camera, color: 'amber' },
  { id: 'video-corporate', category: 'film-foto', name: 'Företagsvideo', description: 'Planering, filming, redigering, 2-5 min', priceType: 'onetime', basePrice: 35000, icon: Camera, color: 'amber' },
  { id: 'video-monthly', category: 'film-foto', name: 'Video-abonnemang', description: '2-4 videos/månad för sociala medier', priceType: 'monthly', basePrice: 15000, icon: Camera, color: 'amber' },
];

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const priceTypeLabels: Record<string, string> = {
  monthly: '/mån',
  onetime: 'engång',
  hourly: '/tim',
};

export interface SelectedService {
  serviceId: string;
  quantity: number;
  months: number; // for monthly services
  discount: number; // percentage
  customPrice?: number;
}

interface ProjectCalculatorProps {
  onCreateDeal?: (data: {
    name: string;
    company: string;
    recipientName: string;
    recipientEmail: string;
    value: number;
    tags: string[];
    description: string;
  }) => void;
  initialCompany?: string;
  initialContact?: string;
  initialEmail?: string;
}

export default function ProjectCalculator({ onCreateDeal, initialCompany = '', initialContact = '', initialEmail = '' }: ProjectCalculatorProps) {
  const [selected, setSelected] = useState<SelectedService[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [company, setCompany] = useState(initialCompany);
  const [contactName, setContactName] = useState(initialContact);
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [contractMonths, setContractMonths] = useState(12);

  const addService = (serviceId: string) => {
    if (selected.find(s => s.serviceId === serviceId)) return;
    const service = servicePriceList.find(s => s.id === serviceId);
    setSelected(prev => [...prev, {
      serviceId,
      quantity: 1,
      months: service?.priceType === 'monthly' ? contractMonths : 1,
      discount: 0,
    }]);
  };

  const removeService = (serviceId: string) => {
    setSelected(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  const updateService = (serviceId: string, updates: Partial<SelectedService>) => {
    setSelected(prev => prev.map(s => s.serviceId === serviceId ? { ...s, ...updates } : s));
  };

  const filteredServices = filterCategory === 'all'
    ? servicePriceList
    : servicePriceList.filter(s => s.category === filterCategory);

  // Calculate totals
  const calculations = useMemo(() => {
    let monthlyTotal = 0;
    let onetimeTotal = 0;
    const lines: { name: string; type: string; unitPrice: number; qty: number; months: number; discount: number; lineTotal: number }[] = [];

    selected.forEach(sel => {
      const service = servicePriceList.find(s => s.id === sel.serviceId);
      if (!service) return;
      const price = sel.customPrice ?? service.basePrice;
      const discountMul = 1 - (sel.discount / 100);

      if (service.priceType === 'monthly') {
        const lineTotal = price * sel.quantity * sel.months * discountMul;
        monthlyTotal += price * sel.quantity * discountMul;
        lines.push({ name: service.name, type: 'monthly', unitPrice: price, qty: sel.quantity, months: sel.months, discount: sel.discount, lineTotal });
      } else {
        const lineTotal = price * sel.quantity * discountMul;
        onetimeTotal += lineTotal;
        lines.push({ name: service.name, type: 'onetime', unitPrice: price, qty: sel.quantity, months: 1, discount: sel.discount, lineTotal });
      }
    });

    const subtotal = monthlyTotal * contractMonths + onetimeTotal;
    const globalDiscountAmount = subtotal * (globalDiscount / 100);
    const total = subtotal - globalDiscountAmount;

    return { monthlyTotal, onetimeTotal, subtotal, globalDiscountAmount, total, lines };
  }, [selected, globalDiscount, contractMonths]);

  const handleCreateDeal = () => {
    if (!company) { toast.error('Ange företagsnamn'); return; }
    if (selected.length === 0) { toast.error('Välj minst en tjänst'); return; }

    const name = projectName || `${company} - ${selected.map(s => {
      const svc = servicePriceList.find(x => x.id === s.serviceId);
      return svc?.name;
    }).filter(Boolean).join(' + ')}`;

    const tags = [...new Set(selected.map(s => {
      const svc = servicePriceList.find(x => x.id === s.serviceId);
      const cat = serviceCategories.find(c => c.key === svc?.category);
      return cat?.label || '';
    }).filter(Boolean))];

    const description = calculations.lines.map(l =>
      `${l.name}: ${l.unitPrice.toLocaleString('sv-SE')} kr${l.type === 'monthly' ? '/mån' : ''} x ${l.qty}${l.type === 'monthly' ? ` (${l.months} mån)` : ''}${l.discount > 0 ? ` (-${l.discount}%)` : ''} = ${l.lineTotal.toLocaleString('sv-SE')} kr`
    ).join('\n');

    if (onCreateDeal) {
      onCreateDeal({
        name,
        company,
        recipientName: contactName,
        recipientEmail: contactEmail,
        value: Math.round(calculations.total),
        tags,
        description,
      });
    }
    toast.success('Offert skapad från kalkyl!');
  };

  return (
    <div className="space-y-5">
      {/* Customer info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label className="text-xs">Företag *</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Företagsnamn" /></div>
        <div><Label className="text-xs">Offertnamn</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Auto-genereras om tomt" /></div>
        <div><Label className="text-xs">Kontaktperson</Label><Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Namn" /></div>
        <div><Label className="text-xs">E-post</Label><Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@foretag.se" /></div>
      </div>

      {/* Contract length */}
      <div className="flex items-center gap-4">
        <Label className="text-xs shrink-0">Avtalslängd</Label>
        <div className="flex gap-1">
          {[3, 6, 12, 24].map(m => (
            <Button key={m} size="sm" variant={contractMonths === m ? 'default' : 'outline'}
              className="h-7 px-3 text-xs rounded-lg" onClick={() => setContractMonths(m)}>
              {m} mån
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Service catalog - left side */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm">Tjänstekatalog</h3>
            <div className="flex gap-1 flex-wrap">
              <Button size="sm" variant={filterCategory === 'all' ? 'default' : 'outline'} className="h-6 px-2 text-[10px] rounded-md" onClick={() => setFilterCategory('all')}>Alla</Button>
              {serviceCategories.map(cat => (
                <Button key={cat.key} size="sm" variant={filterCategory === cat.key ? 'default' : 'outline'}
                  className="h-6 px-2 text-[10px] rounded-md gap-1" onClick={() => setFilterCategory(cat.key)}>
                  <cat.icon className="h-3 w-3" />{cat.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredServices.map(service => {
              const isSelected = selected.some(s => s.serviceId === service.id);
              return (
                <div key={service.id}
                  className={`flex items-center gap-3 p-3 border rounded-xl transition-all cursor-pointer hover:shadow-sm ${isSelected ? 'ring-2 ring-primary/30 bg-primary/5' : 'hover:bg-muted/30'}`}
                  onClick={() => isSelected ? removeService(service.id) : addService(service.id)}>
                  <div className={`p-2 rounded-lg ${colorMap[service.color]} shrink-0`}>
                    <service.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{service.name}</span>
                      <Badge variant="secondary" className="text-[9px] h-4">{priceTypeLabels[service.priceType]}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{service.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-heading font-bold">{service.basePrice.toLocaleString('sv-SE')} kr</span>
                    <span className="text-[10px] text-muted-foreground block">{priceTypeLabels[service.priceType]}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quote summary - right side */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-sm">Kalkyl</h3>
                <Badge variant="secondary" className="text-[10px] ml-auto">{selected.length} tjänster</Badge>
              </div>

              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Klicka på tjänster för att lägga till i kalkylen</p>
              ) : (
                <div className="space-y-2">
                  {selected.map(sel => {
                    const service = servicePriceList.find(s => s.id === sel.serviceId);
                    if (!service) return null;
                    const price = sel.customPrice ?? service.basePrice;
                    const discountMul = 1 - (sel.discount / 100);
                    const lineTotal = service.priceType === 'monthly'
                      ? price * sel.quantity * sel.months * discountMul
                      : price * sel.quantity * discountMul;

                    return (
                      <div key={sel.serviceId} className="border rounded-lg p-2.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-medium">{service.name}</span>
                            <Badge className={`ml-1.5 text-[8px] h-3.5 ${colorMap[service.color]} border-0`}>{priceTypeLabels[service.priceType]}</Badge>
                          </div>
                          <button onClick={() => removeService(sel.serviceId)} className="p-0.5 rounded hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Pris</Label>
                            <Input type="number" value={sel.customPrice ?? service.basePrice}
                              onChange={e => updateService(sel.serviceId, { customPrice: Number(e.target.value) })}
                              className="h-7 text-xs" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Rabatt %</Label>
                            <Input type="number" value={sel.discount} min={0} max={100}
                              onChange={e => updateService(sel.serviceId, { discount: Number(e.target.value) })}
                              className="h-7 text-xs" />
                          </div>
                        </div>
                        {service.priceType === 'monthly' && (
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Antal månader</Label>
                            <Input type="number" value={sel.months} min={1}
                              onChange={e => updateService(sel.serviceId, { months: Number(e.target.value) })}
                              className="h-7 text-xs" />
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-xs font-heading font-bold">{Math.round(lineTotal).toLocaleString('sv-SE')} kr</span>
                          {service.priceType === 'monthly' && (
                            <span className="text-[10px] text-muted-foreground block">{Math.round(price * discountMul).toLocaleString('sv-SE')} kr/mån</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Global discount */}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-[10px] text-muted-foreground">Totalrabatt</Label>
                      <span className="text-xs tabular-nums">{globalDiscount}%</span>
                    </div>
                    <Slider value={[globalDiscount]} min={0} max={50} step={1}
                      onValueChange={([v]) => setGlobalDiscount(v)} />
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-3 mt-2 space-y-1.5">
                    {calculations.monthlyTotal > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Löpande/mån</span>
                        <span className="font-medium">{calculations.monthlyTotal.toLocaleString('sv-SE')} kr/mån</span>
                      </div>
                    )}
                    {calculations.onetimeTotal > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Engångskostnad</span>
                        <span className="font-medium">{calculations.onetimeTotal.toLocaleString('sv-SE')} kr</span>
                      </div>
                    )}
                    {globalDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span>Rabatt ({globalDiscount}%)</span>
                        <span>-{Math.round(calculations.globalDiscountAmount).toLocaleString('sv-SE')} kr</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-heading font-semibold text-sm">Totalt</span>
                      <span className="font-heading font-bold text-lg">{Math.round(calculations.total).toLocaleString('sv-SE')} kr</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">exkl. moms ({contractMonths} mån avtal)</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Anteckningar</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="T.ex. speciella villkor..." rows={2} className="text-xs mt-1" />
                  </div>

                  {/* Actions */}
                  {onCreateDeal && (
                    <Button onClick={handleCreateDeal} className="w-full gap-1.5 rounded-xl">
                      <FileSignature className="h-4 w-4" />Skapa offert ({Math.round(calculations.total).toLocaleString('sv-SE')} kr)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
