import { useState, useRef } from 'react';
import {
  Settings as SettingsIcon, Palette, Building2, Upload, RotateCcw, Check,
  Eye, Type, Radius, Sun, Moon, Sparkles, Image, Shield, Users, Globe,
  Target, TrendingUp, Camera, Monitor, Clock, DollarSign, Save,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWhiteLabel, themePresets } from '@/hooks/useWhiteLabel';
import { useHourlyRate } from '@/hooks/useBilling';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const presetColors: Record<string, string> = {
  default: 'bg-violet-500',
  ocean: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  sunset: 'bg-rose-500',
  midnight: 'bg-indigo-700',
  minimal: 'bg-slate-500',
  agency: 'bg-purple-500',
  amber: 'bg-amber-500',
};

export default function Settings() {
  const { config, updateConfig, resetConfig, applyPreset } = useWhiteLabel();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'theme' | 'services' | 'billing' | 'roles'>('brand');

  // ── Billing / Hourly rate ──
  const { rate: hourlyRate, setRate: setHourlyRate } = useHourlyRate();
  const [rateInput, setRateInput] = useState<string>(String(hourlyRate));

  // ── Roles ──
  const ROLES_KEY = 'marketflow_roles';
  type RoleKey = 'super_admin' | 'sales' | 'production' | 'viewer';
  interface RolePermissions {
    contacts: boolean;
    projects: boolean;
    sales: boolean;
    invoices: boolean;
    timeTracking: boolean;
    automations: boolean;
    googleAds: boolean;
    reports: boolean;
    settings: boolean;
    users: boolean;
  }
  interface RoleConfig {
    name: string;
    description: string;
    color: string;
    permissions: RolePermissions;
    locked?: boolean;
  }

  const defaultRoles: Record<RoleKey, RoleConfig> = {
    super_admin: {
      name: 'Super Admin',
      description: 'Full tillgång till alla funktioner och inställningar',
      color: 'bg-red-500',
      locked: true,
      permissions: {
        contacts: true, projects: true, sales: true, invoices: true,
        timeTracking: true, automations: true, googleAds: true, reports: true,
        settings: true, users: true,
      },
    },
    sales: {
      name: 'Säljare',
      description: 'Hanterar kunder, offerter och fakturor',
      color: 'bg-blue-500',
      permissions: {
        contacts: true, projects: false, sales: true, invoices: true,
        timeTracking: false, automations: false, googleAds: false, reports: true,
        settings: false, users: false,
      },
    },
    production: {
      name: 'Produktion',
      description: 'Hanterar projekt, uppgifter och tidloggning',
      color: 'bg-emerald-500',
      permissions: {
        contacts: true, projects: true, sales: false, invoices: false,
        timeTracking: true, automations: true, googleAds: true, reports: true,
        settings: false, users: false,
      },
    },
    viewer: {
      name: 'Läsbehörighet',
      description: 'Kan se men inte ändra data',
      color: 'bg-gray-400',
      permissions: {
        contacts: true, projects: true, sales: true, invoices: true,
        timeTracking: true, automations: false, googleAds: true, reports: true,
        settings: false, users: false,
      },
    },
  };

  function loadRoles(): Record<RoleKey, RoleConfig> {
    try {
      const stored = localStorage.getItem(ROLES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultRoles;
  }

  function saveRoles(roles: Record<RoleKey, RoleConfig>) {
    try { localStorage.setItem(ROLES_KEY, JSON.stringify(roles)); } catch {}
  }

  const [roles, setRolesState] = useState<Record<RoleKey, RoleConfig>>(loadRoles);
  const setRoles = (updater: Record<RoleKey, RoleConfig> | ((prev: Record<RoleKey, RoleConfig>) => Record<RoleKey, RoleConfig>)) => {
    setRolesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRoles(next);
      return next;
    });
  };

  const permissionLabels: Record<keyof RolePermissions, { label: string; icon: any }> = {
    contacts: { label: 'Kunder', icon: Users },
    projects: { label: 'Projekt', icon: SettingsIcon },
    sales: { label: 'Säljtavla', icon: TrendingUp },
    invoices: { label: 'Fakturor', icon: Shield },
    timeTracking: { label: 'Tidloggning', icon: Clock },
    automations: { label: 'Automatiseringar', icon: Sparkles },
    googleAds: { label: 'Google Ads', icon: Globe },
    reports: { label: 'Rapporter', icon: Eye },
    settings: { label: 'Inställningar', icon: SettingsIcon },
    users: { label: 'Användare', icon: Users },
  };

  const togglePermission = (roleKey: RoleKey, perm: keyof RolePermissions) => {
    if (roleKey === 'super_admin') return; // Can't edit super admin
    setRoles(prev => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        permissions: {
          ...prev[roleKey].permissions,
          [perm]: !prev[roleKey].permissions[perm],
        },
      },
    }));
    toast.success('Behörighet uppdaterad');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error('Logotypen är för stor (max 500KB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateConfig({ logoUrl: reader.result as string });
      toast.success('Logotyp uppladdad!');
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    resetConfig();
    toast.success('Inställningar återställda till standard');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Inställningar</h1>
          <p className="text-muted-foreground">White Label & Utseende</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" /> Återställ
        </Button>
      </motion.div>

      {/* Tab navigation */}
      <motion.div variants={item} className="flex gap-2 border-b pb-3">
        {[
          { key: 'brand' as const, label: 'Varumärke', icon: Building2 },
          { key: 'theme' as const, label: 'Tema & Utseende', icon: Palette },
          { key: 'services' as const, label: 'Tjänster', icon: SettingsIcon },
          { key: 'billing' as const, label: 'Ekonomi & Tid', icon: DollarSign },
          { key: 'roles' as const, label: 'Roller', icon: Shield },
        ].map(tab => (
          <Button key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm" className="gap-1.5 rounded-xl"
            onClick={() => setActiveTab(tab.key)}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </Button>
        ))}
      </motion.div>

      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Branding */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-4 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Företagsinfo</h3>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Företagsnamn</Label>
                  <Input value={config.companyName} className="mt-1"
                    onChange={e => updateConfig({ companyName: e.target.value })}
                    placeholder="Ditt företagsnamn" />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Undertitel</Label>
                  <Input value={config.subtitle} className="mt-1"
                    onChange={e => updateConfig({ subtitle: e.target.value })}
                    placeholder="T.ex. CRM för Mediabyrå" />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Initialer (avatar)</Label>
                  <Input value={config.userInitials} className="mt-1 w-24"
                    maxLength={3}
                    onChange={e => updateConfig({ userInitials: e.target.value.toUpperCase() })} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logo Upload */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-4 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Image className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Logotyp</h3>
                </div>

                <div className="flex items-start gap-6">
                  {/* Preview */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg overflow-hidden">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-white font-heading font-bold text-2xl">
                          {config.companyName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Aktiv logotyp</span>
                  </div>

                  <div className="flex-1 space-y-3">
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                      onChange={handleLogoUpload} />
                    <Button variant="outline" className="w-full gap-2 rounded-xl"
                      onClick={() => logoInputRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Ladda upp egen logotyp
                    </Button>
                    {config.logoUrl && (
                      <Button variant="ghost" size="sm" className="w-full text-xs text-destructive"
                        onClick={() => updateConfig({ logoUrl: '' })}>
                        Ta bort logotyp
                      </Button>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      SVG, PNG eller JPG. Max 500KB.
                    </p>
                  </div>
                </div>

                {/* Logo Gallery */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Välj fördesignad logotyp</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { url: `${import.meta.env.BASE_URL}logos/flow.svg`, name: 'Flow', desc: 'Flödande M-linjer' },
                      { url: `${import.meta.env.BASE_URL}logos/circles.svg`, name: 'Circles', desc: 'Överlappande cirklar' },
                      { url: `${import.meta.env.BASE_URL}logos/arrow.svg`, name: 'Arrow', desc: 'Tillväxtpil' },
                      { url: `${import.meta.env.BASE_URL}logos/minimal.svg`, name: 'Minimal', desc: 'Tunn linje + accent' },
                      { url: `${import.meta.env.BASE_URL}logos/shield.svg`, name: 'Shield', desc: 'Sköld-emblem' },
                      { url: '', name: 'Bokstav', desc: 'Ingen logga (initial)' },
                    ].map(logo => {
                      const isActive = config.logoUrl === logo.url;
                      return (
                        <motion.div key={logo.name}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          className={`border rounded-xl p-2 cursor-pointer transition-all text-center ${
                            isActive ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5' : 'hover:border-primary/40 hover:shadow-sm'
                          }`}
                          onClick={() => updateConfig({ logoUrl: logo.url })}>
                          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center overflow-hidden shadow-sm mb-1.5">
                            {logo.url ? (
                              <img src={logo.url} alt={logo.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-white font-heading font-bold text-lg">
                                {config.companyName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium">{logo.name}</p>
                          <p className="text-[10px] text-muted-foreground">{logo.desc}</p>
                          {isActive && (
                            <Badge className="mt-1 text-[9px] h-4 bg-primary/10 text-primary border-primary/20">Aktiv</Badge>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar Preview */}
                <div className="border rounded-xl p-4 bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Sidebar-förhandsgranskning</p>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{
                    background: config.sidebarStyle === 'light' ? 'hsl(228 25% 97%)' : 'hsl(232 30% 10%)',
                  }}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-md overflow-hidden">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-white font-heading font-bold text-sm">
                          {config.companyName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm" style={{
                        color: config.sidebarStyle === 'light' ? 'hsl(228 30% 8%)' : 'hsl(0 0% 95%)',
                      }}>{config.companyName}</span>
                      <p className="text-[10px] -mt-0.5" style={{
                        color: config.sidebarStyle === 'light' ? 'hsl(228 10% 50%)' : 'hsl(232 15% 50%)',
                      }}>{config.subtitle}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Theme Presets */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Tema-mallar</h3>
                  <span className="text-xs text-muted-foreground">Klicka för att byta tema direkt</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(themePresets).map(([key, preset]) => (
                    <motion.div key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md ${
                        config.theme === key ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:border-primary/30'
                      }`}
                      onClick={() => applyPreset(key)}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-5 h-5 rounded-md ${presetColors[key]} shadow-sm`} />
                        <span className="text-xs font-semibold">{preset.name}</span>
                        {config.theme === key && <Check className="h-3 w-3 text-primary ml-auto" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                      {/* Mini preview */}
                      <div className="flex gap-1 mt-2">
                        <div className="h-1.5 flex-1 rounded-full" style={{
                          backgroundColor: `hsl(${preset.primary[0]} ${preset.primary[1]}% ${preset.primary[2]}%)`,
                        }} />
                        <div className="h-1.5 flex-1 rounded-full" style={{
                          backgroundColor: `hsl(${preset.primary[0]} ${preset.primary[1]}% ${preset.primary[2] + 20}%)`,
                        }} />
                        <div className="h-1.5 flex-1 rounded-full bg-muted" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Theme Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item}>
              <Card>
                <CardContent className="pt-5 pb-4 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-semibold text-sm">Anpassa färger</h3>
                  </div>

                  {/* Color preview */}
                  <div className="flex items-center gap-3 p-3 border rounded-xl bg-muted/20">
                    <div className="w-12 h-12 rounded-xl shadow-md" style={{
                      backgroundColor: `hsl(${config.primaryHue} ${config.primarySaturation}% ${config.primaryLightness}%)`,
                    }} />
                    <div>
                      <p className="text-xs font-medium">Primärfärg</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        hsl({config.primaryHue}, {config.primarySaturation}%, {config.primaryLightness}%)
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nyans (Hue)</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{config.primaryHue}°</span>
                    </div>
                    <div className="h-3 rounded-full mb-2" style={{
                      background: 'linear-gradient(to right, hsl(0 80% 60%), hsl(60 80% 60%), hsl(120 80% 60%), hsl(180 80% 60%), hsl(240 80% 60%), hsl(300 80% 60%), hsl(360 80% 60%))',
                    }} />
                    <Slider value={[config.primaryHue]} min={0} max={360} step={1}
                      onValueChange={([v]) => updateConfig({ primaryHue: v, theme: 'custom' })} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mättnad</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{config.primarySaturation}%</span>
                    </div>
                    <Slider value={[config.primarySaturation]} min={10} max={100} step={1}
                      onValueChange={([v]) => updateConfig({ primarySaturation: v, theme: 'custom' })} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ljushet</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{config.primaryLightness}%</span>
                    </div>
                    <Slider value={[config.primaryLightness]} min={25} max={75} step={1}
                      onValueChange={([v]) => updateConfig({ primaryLightness: v, theme: 'custom' })} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardContent className="pt-5 pb-4 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-semibold text-sm">Utseende</h3>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sidebar-stil</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {[
                        { value: 'dark' as const, label: 'Mörk', icon: Moon },
                        { value: 'light' as const, label: 'Ljus', icon: Sun },
                        { value: 'gradient' as const, label: 'Gradient', icon: Sparkles },
                      ].map(opt => (
                        <Button key={opt.value}
                          variant={config.sidebarStyle === opt.value ? 'default' : 'outline'}
                          size="sm" className="gap-1.5 rounded-xl"
                          onClick={() => updateConfig({ sidebarStyle: opt.value })}>
                          <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hörnradie</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{config.borderRadius}px</span>
                    </div>
                    <Slider value={[config.borderRadius]} min={0} max={24} step={1}
                      onValueChange={([v]) => updateConfig({ borderRadius: v })} />
                    <div className="flex gap-3 mt-3">
                      <div className="w-16 h-10 border-2 border-primary bg-primary/10" style={{ borderRadius: `${config.borderRadius}px` }} />
                      <div className="flex-1 flex items-center">
                        <p className="text-[10px] text-muted-foreground">
                          {config.borderRadius === 0 ? 'Helt skarpa hörn' :
                           config.borderRadius < 8 ? 'Subtila rundningar' :
                           config.borderRadius < 16 ? 'Standard rundning' :
                           'Mycket runda hörn'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Live preview card */}
                  <div className="border rounded-xl p-4 bg-muted/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Live-förhandsgranskning</p>
                    <div className="space-y-2">
                      <Button size="sm" className="rounded-xl gap-1.5">
                        <Check className="h-3 w-3" /> Primär knapp
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5 ml-2">
                        <Eye className="h-3 w-3" /> Sekundär knapp
                      </Button>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">Badge</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="secondary">Sekundär</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-5 pb-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <SettingsIcon className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-sm">Tjänster som visas</h3>
              </div>
              <p className="text-xs text-muted-foreground">Välj vilka tjänster som ska vara synliga i CRM:et. Perfekt för att white-labela till specifika byrå-vertikaler.</p>

              <div className="grid gap-3">
                {[
                  { key: 'showGoogleAds' as const, label: 'Google Ads', desc: 'SEM, PPC-kampanjer, budgethantering', icon: Globe },
                  { key: 'showMetaAds' as const, label: 'Meta Ads', desc: 'Facebook & Instagram annonsering', icon: Target },
                  { key: 'showSEO' as const, label: 'SEO', desc: 'Sökmotoroptimering, ranking, teknisk SEO', icon: TrendingUp },
                  { key: 'showFilmFoto' as const, label: 'Film / Foto', desc: 'Videoproduktion, fotografering, bildhantering', icon: Camera },
                  { key: 'showWebb' as const, label: 'Webb', desc: 'Webbdesign, utveckling, CMS', icon: Monitor },
                ].map(svc => (
                  <div key={svc.key} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <svc.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{svc.label}</p>
                        <p className="text-xs text-muted-foreground">{svc.desc}</p>
                      </div>
                    </div>
                    <Switch checked={config[svc.key]}
                      onCheckedChange={checked => updateConfig({ [svc.key]: checked })} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">Timpris</h3>
                    <p className="text-xs text-muted-foreground">Standardkostnad per timme som används för kostnads- & lönsamhetsberäkningar</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs">Timpris (kr/h)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={50}
                      value={rateInput}
                      onChange={e => setRateInput(e.target.value)}
                      className="rounded-lg"
                      placeholder="1750"
                    />
                    <Button
                      className="rounded-lg gap-1.5"
                      onClick={() => {
                        const n = Number(rateInput);
                        if (!Number.isFinite(n) || n <= 0) { toast.error('Ange ett giltigt timpris'); return; }
                        setHourlyRate(n);
                        toast.success(`Timpris sparat: ${n.toLocaleString('sv-SE')} kr/h`);
                      }}>
                      <Save className="h-4 w-4" /> Spara
                    </Button>
                  </div>
                  <div className="rounded-xl bg-muted/40 border p-4 text-xs space-y-1">
                    <p className="text-muted-foreground">Nuvarande timpris:</p>
                    <p className="text-2xl font-heading font-bold text-emerald-600">{hourlyRate.toLocaleString('sv-SE')} <span className="text-sm text-muted-foreground">kr/h</span></p>
                    <p className="text-muted-foreground mt-2">Ett 8-timmarsarbete motsvarar <span className="font-semibold text-foreground">{(hourlyRate * 8).toLocaleString('sv-SE')} kr</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">Så här används timpriset</h3>
                    <p className="text-xs text-muted-foreground">Kostnad & lönsamhet per projekt</p>
                  </div>
                </div>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Loggad tid på projekt → <span className="text-foreground">Kostnad = timmar × timpris</span></li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Projektets budget jämförs automatiskt mot kostnaden</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Resterande budget visas i realtid med statusfärg</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Tid kan loggas direkt på varje uppgift för exakt spårning</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Rollstruktur</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-5">
                  Konfigurera vilka funktioner varje roll har tillgång till. Super Admin har alltid full tillgång.
                </p>

                {/* Permissions matrix */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[180px]">Funktion</th>
                        {(Object.keys(roles) as RoleKey[]).map(roleKey => {
                          const role = roles[roleKey];
                          return (
                            <th key={roleKey} className="text-center py-2.5 px-2 min-w-[100px]">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`w-3 h-3 rounded-full ${role.color}`} />
                                <span className="text-xs font-semibold">{role.name}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(Object.keys(permissionLabels) as (keyof RolePermissions)[]).map(perm => {
                        const PermIcon = permissionLabels[perm].icon;
                        return (
                          <tr key={perm} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <PermIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">{permissionLabels[perm].label}</span>
                              </div>
                            </td>
                            {(Object.keys(roles) as RoleKey[]).map(roleKey => (
                              <td key={roleKey} className="text-center py-2.5 px-2">
                                <Switch
                                  checked={roles[roleKey].permissions[perm]}
                                  disabled={roleKey === 'super_admin'}
                                  onCheckedChange={() => togglePermission(roleKey, perm)}
                                  className="mx-auto"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.entries(roles) as [RoleKey, RoleConfig][]).map(([key, role]) => {
              const enabledCount = Object.values(role.permissions).filter(Boolean).length;
              const totalCount = Object.keys(role.permissions).length;
              return (
                <motion.div key={key} variants={item}>
                  <Card className={`overflow-hidden ${key === 'super_admin' ? 'ring-1 ring-primary/30' : ''}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-4 h-4 rounded-full ${role.color} shadow-sm`} />
                        <span className="font-heading font-semibold text-sm">{role.name}</span>
                        {key === 'super_admin' && (
                          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 ml-auto">Din roll</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{role.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{enabledCount}/{totalCount} funktioner</span>
                        <Progress value={(enabledCount / totalCount) * 100} className="w-16 h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
