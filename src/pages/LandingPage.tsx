import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Zap, Users, Clock, Palette, Globe, Check, ChevronDown, Star,
  ArrowRight, Shield, Sparkles, LineChart, Target,
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">MarketFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Funktioner</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Priser</a>
          <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Omdömen</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Logga in</Link>
          <Link to="/" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
            Starta gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" /> Nytt: AI-driven prognostisering
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            CRM byggt för<br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">mediebyråer</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hantera kunder, kampanjer, budgetar och projekt — allt i ett. Designat specifikt för byråer som jobbar med Google Ads, Meta, SEO och produktion.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-lg">
              Starta gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#pricing" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border px-8 py-3.5 rounded-full text-sm font-medium hover:bg-muted/50 transition-colors">
              Se priser
            </a>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground">Ingen kreditkort krävs · 14 dagars gratis provperiod</motion.p>
        </motion.div>

        {/* App preview */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 rounded-2xl border bg-card shadow-2xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
          <div className="h-8 bg-muted/50 border-b flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-[11px] text-muted-foreground ml-2">MarketFlow — Dashboard</span>
          </div>
          <div className="p-6 bg-gradient-to-br from-background to-muted/30">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Aktiva kunder', value: '47', color: 'text-blue-500' },
                { label: 'Pågående projekt', value: '23', color: 'text-emerald-500' },
                { label: 'Månadsintäkt', value: '847k', color: 'text-purple-500' },
                { label: 'Google Ads spend', value: '234k', color: 'text-amber-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-card rounded-xl border p-3 text-left">
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-card rounded-xl border p-4 h-32">
                <p className="text-xs font-medium mb-2">Intäktsprognos</p>
                <div className="flex items-end gap-1 h-16">
                  {[40, 55, 48, 62, 58, 75, 82, 70, 88, 92, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-500/20 dark:bg-blue-500/30 rounded-sm relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-sm" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-xl border p-4">
                <p className="text-xs font-medium mb-3">Pipeline</p>
                <div className="space-y-2">
                  {[{ l: 'Bekräftat', w: '80%', c: 'bg-emerald-500' }, { l: 'Sannolikt', w: '60%', c: 'bg-blue-500' }, { l: 'Potentiellt', w: '35%', c: 'bg-purple-500' }].map(b => (
                    <div key={b.l}>
                      <p className="text-[10px] text-muted-foreground">{b.l}</p>
                      <div className="h-1.5 bg-muted rounded-full mt-0.5"><div className={`h-full ${b.c} rounded-full`} style={{ width: b.w }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  { icon: Target, title: 'Google Ads Integration', desc: 'Synka budgetar och kampanjdata direkt. Se spend, klick och konverteringar i realtid.' },
  { icon: Zap, title: 'Automatiseringar', desc: 'Bygg visuella flöden som skickar mail, uppdaterar status och triggar åtgärder automatiskt.' },
  { icon: LineChart, title: 'AI Prognoser', desc: 'Prediktera intäkter och identifiera trender med maskininlärning baserat på er data.' },
  { icon: Clock, title: 'Tidrapportering', desc: 'Logga timmar per projekt med live-timer. Perfekt för fakturering och resurspanering.' },
  { icon: Users, title: 'Kontakt-CRM', desc: 'Hantera alla kunder med inline-redigering, taggar, betyg och komplett kontakthistorik.' },
  { icon: Palette, title: 'White Label', desc: 'Anpassa logga, färger och tema. Visa ert varumärke — inte vårt.' },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-sm font-semibold text-blue-500 uppercase tracking-wider">Funktioner</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Allt din byrå behöver</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground mt-4 max-w-xl mx-auto">Från kundhantering till kampanjoptimering — ett system istället för tio.</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <motion.div key={f.title} variants={fadeUp} className="bg-card rounded-2xl border p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: 'Starter', monthly: 499, yearly: 399,
    desc: 'Perfekt för små byråer som vill komma igång.',
    features: ['Upp till 5 användare', '100 kontakter', 'Projekthantering', 'Tidrapportering', 'E-postsupport'],
    cta: 'Starta gratis',
  },
  {
    name: 'Professional', monthly: 999, yearly: 799, popular: true,
    desc: 'För växande byråer som behöver mer kraft.',
    features: ['Upp till 25 användare', 'Obegränsade kontakter', 'Google Ads integration', 'Automatiseringar', 'AI prognoser', 'White label', 'Prioriterad support'],
    cta: 'Starta gratis',
  },
  {
    name: 'Enterprise', monthly: 1999, yearly: 1599,
    desc: 'För stora byråer med avancerade behov.',
    features: ['Obegränsade användare', 'Obegränsade kontakter', 'Alla integrationer', 'Avancerade automatiseringar', 'AI prognoser & rapporter', 'White label', 'Dedikerad kundansvarig', 'SLA & onboarding'],
    cta: 'Kontakta oss',
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <section id="pricing" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.p variants={fadeUp} className="text-sm font-semibold text-blue-500 uppercase tracking-wider">Priser</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Enkla, transparenta priser</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground mt-4">Välj månads- eller årsbetalning. Spara upp till 20% med årsplan.</motion.p>
          <motion.div variants={fadeUp} className="mt-6 inline-flex items-center bg-card border rounded-full p-1 gap-1">
            <button onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!yearly ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              Månad
            </button>
            <button onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${yearly ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              År <span className="text-emerald-500 text-xs ml-1">-20%</span>
            </button>
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map(plan => (
            <motion.div key={plan.name} variants={fadeUp}
              className={`bg-card rounded-2xl border p-6 flex flex-col ${plan.popular ? 'ring-2 ring-blue-500 relative shadow-xl' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Populärast
                </div>
              )}
              <h3 className="font-semibold text-xl">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{yearly ? plan.yearly : plan.monthly}</span>
                <span className="text-muted-foreground">kr/mån</span>
              </div>
              {yearly && (
                <p className="text-xs text-muted-foreground mt-1">
                  Faktureras {plan.yearly * 12} kr/år · <span className="text-emerald-500">Spara {(plan.monthly - plan.yearly) * 12} kr/år</span>
                </p>
              )}
              <Link to="/"
                className={`mt-6 w-full inline-flex items-center justify-center py-3 rounded-full text-sm font-semibold transition-all ${
                  plan.popular ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25' : 'bg-foreground text-background hover:opacity-90'
                }`}>
                {plan.cta}
              </Link>
              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: 'Anna Lindström', role: 'VD, NordMedia AB', text: 'MarketFlow har förändrat hur vi hanterar våra 40+ kunder. Google Ads-integrationen sparar oss timmar varje vecka.', stars: 5 },
  { name: 'Erik Johansson', role: 'Projektledare, DigitalByrån', text: 'Äntligen ett CRM som förstår hur en mediabyrå fungerar. Automationerna är fantastiska och UI:t är rent och snyggt.', stars: 5 },
  { name: 'Maria Svensson', role: 'Grundare, SvenskSEO', text: 'Vi bytte från tre olika verktyg till MarketFlow. Bästa beslutet vi gjort. Allt finns på ett ställe nu.', stars: 5 },
  { name: 'Johan Berg', role: 'CTO, MediaHouse Nordic', text: 'White label-funktionen är perfekt. Vi visar vårt eget varumärke mot kunder. Proffsigt och genomtänkt.', stars: 5 },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.p variants={fadeUp} className="text-sm font-semibold text-blue-500 uppercase tracking-wider">Omdömen</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Älskad av svenska byråer</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-5">
          {testimonials.map(t => (
            <motion.div key={t.name} variants={fadeUp} className="bg-card rounded-2xl border p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const faqs = [
  { q: 'Kan jag testa MarketFlow gratis?', a: 'Ja! Du får 14 dagars gratis provperiod på alla planer. Inget kreditkort krävs.' },
  { q: 'Hur fungerar Google Ads-integrationen?', a: 'Du kopplar ditt Google Ads-konto och MarketFlow synkar automatiskt kampanjdata, budgetar och resultat. Du ser allt direkt i dashboarden.' },
  { q: 'Kan jag anpassa utseendet med vårt varumärke?', a: 'Absolut! Med White Label kan du ändra logga, färger, och tema. Dina kunder ser ert varumärke — inte vårt.' },
  { q: 'Stödjer ni Meta Ads också?', a: 'Ja, vi har integration med Meta Ads (Facebook & Instagram), Google Ads, Analytics, Mailchimp, Slack, Fortnox och fler.' },
  { q: 'Hur säker är min data?', a: 'Vi använder Supabase med krypterad kommunikation (TLS), row-level security och dagliga backuper. Din data är säker.' },
  { q: 'Kan jag byta plan när som helst?', a: 'Ja, du kan uppgradera eller nedgradera när du vill. Ändringen träder i kraft direkt.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-24 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.p variants={fadeUp} className="text-sm font-semibold text-blue-500 uppercase tracking-wider">FAQ</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Vanliga frågor</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-card rounded-xl border overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-sm hover:bg-muted/30 transition-colors">
                {faq.q}
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight">
            Redo att effektivisera<br />din byrå?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
            Starta din gratis provperiod idag. Ingen kreditkort krävs, inga förpliktelser.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-lg">
              Kom igång gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-semibold">MarketFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">CRM & projekthantering byggt för mediebyråer.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Produkt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Funktioner</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Priser</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Integrationer</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Hjälpcenter</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Kontakta oss</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Juridiskt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Integritetspolicy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Användarvillkor</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cookiepolicy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© 2026 MarketFlow. Alla rättigheter förbehållna.</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" /> GDPR-kompatibel · <Globe className="h-3 w-3 ml-1" /> Hostad i EU
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
