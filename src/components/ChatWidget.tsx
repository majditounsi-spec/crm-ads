import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bot, Users, Send, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface TeamMessage {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// AI assistant – rule-based keyword matcher
// ---------------------------------------------------------------------------

interface Rule {
  keywords: string[];
  answer: string;
}

const RULES: Rule[] = [
  {
    keywords: ['projekt', 'projects', 'skapa projekt', 'nytt projekt', 'projektöversikt', 'projekttavla'],
    answer:
      'Du hittar alla projekt under "Projekt" i sidomenyn. Där kan du skapa nya projekt, tilldela team-medlemmar, sätta deadlines och följa upp status. Klicka på "+ Nytt projekt" för att komma igång! Varje projekt har en detaljvy med uppgifter, budget, tidloggning och tilldelade medlemmar.',
  },
  {
    keywords: ['kontakt', 'kontakter', 'kund', 'kunder', 'leads', 'crm', 'kundregister'],
    answer:
      'Under "Kontakter" kan du hantera alla kunder och leads. Du kan lägga till nya kontakter, filtrera på status, och se kontakthistorik. Använd sökfältet för att snabbt hitta en specifik kontakt. Du kan även koppla kontakter till projekt och säljtavlan.',
  },
  {
    keywords: ['säljtavla', 'säljpipeline', 'pipeline', 'deals', 'affärer', 'sälja', 'försäljning'],
    answer:
      'Säljtavlan visar din pipeline med drag-and-drop. Du kan flytta affärer mellan steg (Lead, Offert, Förhandling, Vunnen, Förlorad), se totalt värde per steg, och filtrera på ansvarig säljare. Varje deal kan kopplas till en kontakt och ett projekt.',
  },
  {
    keywords: ['tid', 'tidloggning', 'time', 'timmar', 'logga tid', 'timer', 'tidrapport', 'tidsspårning'],
    answer:
      'Under "Tidloggning" kan du registrera arbetad tid per projekt och uppgift. Använd timern för att spåra tid i realtid, eller lägg till tid manuellt. Tiden räknas mot projektbudgeten med ditt timpris (standard 1750 kr/h). Du kan se sammanställningen under projektöversikten.',
  },
  {
    keywords: ['google ads', 'ads', 'annons', 'annonser', 'kampanj', 'kampanjer'],
    answer:
      'Google Ads-sektionen visar kampanjprestanda, budgetförbrukning och nyckeltal per konto. Du kan sätta manuell månadsbudget per konto, se daglig och årlig förbrukning, och jämföra mot budget. Koppla konton under Inställningar > Google Ads.',
  },
  {
    keywords: ['budget', 'månadsbudget', 'kostnad', 'kostnader', 'pris'],
    answer:
      'Budget hanteras på flera ställen:\n• Projektbudget – sätts i projektets detaljvy och räknas av med loggad tid (1750 kr/h)\n• Google Ads månadsbudget – sätts per konto under Google Ads-fliken\n• Säljtavlan – visar värdet på varje affär i pipelinen',
  },
  {
    keywords: ['roll', 'roller', 'behörighet', 'behörigheter', 'admin', 'rättigheter', 'åtkomst'],
    answer:
      'Roller hanteras under "Användare" i sidomenyn. Det finns roller som Admin (full åtkomst), Manager, Produktion (ser bara tilldelade projekt) och Viewer. Under Inställningar > Roller kan du konfigurera exakt vilka funktioner varje roll har tillgång till.',
  },
  {
    keywords: ['användare', 'team', 'teammedlem', 'medlem', 'bjud in', 'lägga till användare'],
    answer:
      'Under "Användare" kan du hantera teammedlemmar. Där kan du lägga till nya användare, tilldela roller (Admin, Manager, Produktion, Viewer) och se vilka som är online. Varje användares roll styr vilka delar av systemet de har åtkomst till.',
  },
  {
    keywords: ['inställning', 'inställningar', 'settings', 'konfigurera', 'profil', 'konfiguration'],
    answer:
      'Under "Inställningar" kan du anpassa:\n• Företagsprofil – namn, logotyp, färger\n• Integrationer – Google Ads, Fortnox, GetAccept\n• White-label – anpassa utseende\n• Roller – konfigurera behörigheter per roll\n• Notifikationer – vad som ska meddelas',
  },
  {
    keywords: ['rapport', 'rapporter', 'statistik', 'analys', 'dashboard', 'översikt'],
    answer:
      'Rapporter hittar du på Dashboard-sidan och under "Rapporter". Där ser du försäljningsstatistik, projektöversikt, tidsrapporter och Google Ads-prestanda med interaktiva diagram. Du kan filtrera på tidsperiod och exportera data.',
  },
  {
    keywords: ['navigera', 'hitta', 'var finns', 'hur hittar', 'meny', 'sidomeny', 'var är'],
    answer:
      'Använd sidomenyn till vänster för att navigera. Huvudsektionerna är: Dashboard, Säljtavla, Projekt, Kontakter, Tidloggning, Google Ads, Rapporter, Användare och Inställningar. Du kan även använda sökfältet (Cmd+K) för snabbsökning.',
  },
  {
    keywords: ['hej', 'hallå', 'tjena', 'god morgon', 'god kväll', 'hejsan', 'hejhej', 'hey', 'hi'],
    answer:
      'Hej! 👋 Jag är din AI-assistent för MarketFlow CRM. Jag kan hjälpa dig med frågor om systemets alla funktioner — projekt, kontakter, säljtavlan, tidloggning, Google Ads, roller, inställningar och mer. Ställ gärna en fråga!',
  },
  {
    keywords: ['tack', 'tackar', 'bra', 'toppen', 'perfekt', 'underbart', 'grymt', 'nice'],
    answer:
      'Glad att kunna hjälpa! Tveka inte att fråga om du behöver mer hjälp. 😊',
  },
  {
    keywords: ['hjälp', 'help', 'vad kan du', 'funktioner', 'hur fungerar', 'guide', 'manual'],
    answer:
      'Jag kan hjälpa dig med allt i MarketFlow CRM:\n• Projekt – skapa, hantera och följa upp projekt\n• Kontakter – kund- och lead-hantering\n• Säljtavla – pipeline med drag-and-drop\n• Tidloggning – spåra arbetstid med timer\n• Google Ads – kampanjöversikt och budget\n• Roller & Användare – behörigheter och team\n• Inställningar – integrations och konfiguration\n• Rapporter – statistik och analys\n\nSkriv vad du undrar över så hjälper jag dig!',
  },
  {
    keywords: ['fortnox', 'faktura', 'bokföring', 'fakturera'],
    answer:
      'Fortnox-integrationen hittar du under Inställningar > Fortnox. Där kan du koppla ditt Fortnox-konto för att synka fakturor och bokföring. När det är kopplat kan du skapa fakturor direkt från projekt.',
  },
  {
    keywords: ['getaccept', 'offert', 'signera', 'avtal', 'dokument'],
    answer:
      'GetAccept-integrationen låter dig skicka offerter och avtal direkt från CRM:et. Koppla ditt konto under Inställningar > GetAccept. Du kan sedan skapa och följa upp dokument från projektvyn.',
  },
  {
    keywords: ['uppgift', 'uppgifter', 'task', 'tasks', 'todo', 'att göra'],
    answer:
      'Uppgifter hanteras i varje projekts detaljvy. Klicka på ett projekt för att se och skapa uppgifter. Du kan tilldela uppgifter till teammedlemmar, sätta deadlines och markera som klara. Loggad tid kopplas automatiskt till uppgiften.',
  },
  {
    keywords: ['deadline', 'förfaller', 'datum', 'tidsplan', 'schema'],
    answer:
      'Deadlines sätts på projektnivå och uppgiftsnivå. Du ser kommande deadlines på Dashboard och i projektöversikten. Projekt som närmar sig deadline markeras med varningsfärg.',
  },
  {
    keywords: ['drag', 'drop', 'dra', 'flytta', 'sortera'],
    answer:
      'Drag-and-drop används på säljtavlan för att flytta affärer mellan pipeline-steg. Dra ett kort från ett steg (t.ex. "Lead") och släpp det i ett annat (t.ex. "Offert") för att uppdatera status.',
  },
  {
    keywords: ['logga in', 'login', 'inloggning', 'konto', 'lösenord', 'registrera'],
    answer:
      'Du loggar in via login-sidan. Om du inte har ett konto kan din admin bjuda in dig under "Användare". Glömt lösenordet? Kontakta din systemadministratör för att återställa det.',
  },
  {
    keywords: ['dark mode', 'mörkt', 'ljust', 'tema', 'dark', 'light', 'utseende'],
    answer:
      'Du kan byta tema via ikonerna i övre högra hörnet av appen. Det finns tre lägen: Ljust, Mörkt, och System (följer datorns inställning). Ändringen sparas automatiskt.',
  },
  {
    keywords: ['notifikation', 'notis', 'varning', 'påminnelse', 'meddelande'],
    answer:
      'Notifikationer visas via klockan i övre högra hörnet. Du får varningar om deadlines, budgetöverskridanden och blockerade projekt. Du kan markera alla som lästa eller stänga enskilda notifikationer.',
  },
  {
    keywords: ['exportera', 'export', 'ladda ner', 'pdf', 'csv', 'excel'],
    answer:
      'Du kan exportera data från flera ställen: tidrapporter, kontaktlistor och rapporter. Kolla efter export-knappen (nedåtpil-ikon) i respektive sektion. Data kan exporteras som CSV.',
  },
  {
    keywords: ['sök', 'söka', 'search', 'filtrera', 'filter'],
    answer:
      'Sökfältet hittar du i övre menyn (genväg: Cmd+K eller Ctrl+K). Du kan söka på projekt, kontakter och mer. I listor finns även filterfunktioner för att t.ex. filtrera på status, ansvarig eller datum.',
  },
  {
    keywords: ['white label', 'white-label', 'varumärke', 'logotyp', 'logo', 'färg', 'färger', 'branding'],
    answer:
      'Under Inställningar > White-label kan du anpassa systemets utseende med egen logotyp, företagsnamn och färger. Ändringarna visas direkt i sidomenyn och i appen.',
  },
  {
    keywords: ['automation', 'automatisering', 'automatisk', 'workflow', 'flöde'],
    answer:
      'Automationer hittar du under "Automationer" i sidomenyn. Där kan du sätta upp regler som automatiskt utför handlingar, t.ex. flytta affärer, skicka notifikationer eller uppdatera status baserat på triggers.',
  },
  {
    keywords: ['vad är', 'berätta om', 'förklara', 'hur använder', 'hur gör jag', 'hur kan jag'],
    answer:
      'Berätta gärna mer specifikt vad du vill veta! Jag kan hjälpa med:\n• Hur man skapar projekt och uppgifter\n• Hur tidloggning och budget fungerar\n• Hur säljtavlan och pipeline funkar\n• Hur man hanterar kontakter och leads\n• Hur roller och behörigheter sätts upp\n• Hur Google Ads-kopplingen fungerar\n• Hur man konfigurerar inställningar',
  },
  {
    keywords: ['problem', 'funkar inte', 'fel', 'bugg', 'bug', 'trasig', 'error', 'crash'],
    answer:
      'Om något inte fungerar som förväntat, prova följande:\n1. Ladda om sidan (Ctrl+Shift+R)\n2. Rensa webbläsarens cache\n3. Kolla att du har rätt behörighet (fråga admin)\n4. Om problemet kvarstår, kontakta din systemadministratör med en beskrivning av felet.',
  },
  {
    keywords: ['snabbkommando', 'genväg', 'kortkommando', 'tangent', 'shortcut'],
    answer:
      'Tillgängliga snabbkommandon:\n• Cmd/Ctrl + K – Öppna sök\n• Sidomenyn – Navigera mellan sektioner\n• Enter – Skicka meddelande i chatten\nFler genvägar kan tillkomma i framtida uppdateringar.',
  },
  {
    keywords: ['online', 'aktiv', 'aktiva', 'vem är', 'vilka är', 'inloggade'],
    answer:
      'Du kan se vilka som är online via team-chatten (klicka på "Team"-fliken i denna chatt). Antalet online-användare visas som en badge. Systemet uppdateras var 10:e sekund.',
  },
  {
    keywords: ['chatt', 'chat', 'meddelande', 'team chatt', 'teamchatt', 'broadcast'],
    answer:
      'Team-chatten (fliken "Team" här) låter dig skicka meddelanden till alla som är online i systemet. Meddelanden synkas i realtid mellan alla öppna flikar. De senaste 50 meddelandena sparas.',
  },
];

function getAIResponse(input: string): string {
  const lower = input.toLowerCase().trim();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.answer;
    }
  }

  return 'Jag hittade inget direkt svar på det. Här är några saker jag kan hjälpa dig med:\n\n• Projekt & uppgifter\n• Kontakter & kunder\n• Säljtavla & pipeline\n• Tidloggning & budget\n• Google Ads & kampanjer\n• Roller & behörigheter\n• Inställningar & integrationer\n• Team-chatt & online-användare\n\nSkriv t.ex. "hur gör jag" eller "berätta om projekt" så hjälper jag dig vidare!';
}

// ---------------------------------------------------------------------------
// Team chat – BroadcastChannel + localStorage
// ---------------------------------------------------------------------------

const TEAM_MESSAGES_KEY = 'marketflow_chat_messages';
const MAX_TEAM_MESSAGES = 50;
const BROADCAST_CHANNEL_NAME = 'marketflow_team_chat';

function loadTeamMessages(): TeamMessage[] {
  try {
    const raw = localStorage.getItem(TEAM_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTeamMessages(messages: TeamMessage[]) {
  const trimmed = messages.slice(-MAX_TEAM_MESSAGES);
  localStorage.setItem(TEAM_MESSAGES_KEY, JSON.stringify(trimmed));
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-1">skriver...</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Widget
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const { user } = useAuth();
  const { onlineCount } = useOnlineUsers();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');

  // AI chat state
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: 'Hej! 👋 Jag är din AI-assistent. Fråga mig om projekt, kontakter, säljtavlan, eller något annat i MarketFlow CRM!',
      sender: 'bot',
      timestamp: Date.now(),
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  // Team chat state
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>(loadTeamMessages);
  const [teamInput, setTeamInput] = useState('');
  const teamScrollRef = useRef<HTMLDivElement>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // ---------------------------------------------------------------------------
  // BroadcastChannel for team chat
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastRef.current = bc;

    bc.onmessage = (event: MessageEvent<TeamMessage>) => {
      setTeamMessages((prev) => {
        const next = [...prev, event.data].slice(-MAX_TEAM_MESSAGES);
        saveTeamMessages(next);
        return next;
      });
    };

    return () => {
      bc.close();
    };
  }, []);

  // Auto-scroll AI chat
  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, isTyping]);

  // Auto-scroll Team chat
  useEffect(() => {
    if (teamScrollRef.current) {
      teamScrollRef.current.scrollTop = teamScrollRef.current.scrollHeight;
    }
  }, [teamMessages]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const sendAiMessage = useCallback(() => {
    const text = aiInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: Date.now(),
    };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        text: getAIResponse(text),
        sender: 'bot',
        timestamp: Date.now(),
      };
      setAiMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 600);
  }, [aiInput]);

  const sendTeamMessage = useCallback(() => {
    const text = teamInput.trim();
    if (!text || !user) return;

    const msg: TeamMessage = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      senderName: user.name,
      senderId: user.id,
      timestamp: Date.now(),
    };

    setTeamMessages((prev) => {
      const next = [...prev, msg].slice(-MAX_TEAM_MESSAGES);
      saveTeamMessages(next);
      return next;
    });
    setTeamInput('');

    // Broadcast to other tabs/windows
    broadcastRef.current?.postMessage(msg);
  }, [teamInput, user]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl shadow-2xl border bg-card flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">Chatt</h3>
                {onlineCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {onlineCount} online
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  title="Minimera"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  title="Stäng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="mx-3 mt-2 shrink-0">
                <TabsTrigger value="ai" className="flex-1 gap-1.5 text-xs">
                  <Bot className="h-3.5 w-3.5" />
                  AI-assistent
                </TabsTrigger>
                <TabsTrigger value="team" className="flex-1 gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  Team-chatt
                </TabsTrigger>
              </TabsList>

              {/* AI Tab */}
              <TabsContent
                value="ai"
                className="flex-1 flex flex-col min-h-0 mt-0 px-3 pb-3"
              >
                {/* Messages */}
                <ScrollArea className="flex-1 min-h-0 mt-2">
                  <div ref={aiScrollRef} className="space-y-3 pr-2">
                    {aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'bot' && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          {msg.text}
                          <div
                            className={`text-[10px] mt-1 ${
                              msg.sender === 'user'
                                ? 'text-primary-foreground/60'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-md">
                          <TypingIndicator />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="flex items-center gap-2 mt-2 shrink-0">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendAiMessage();
                      }
                    }}
                    placeholder="Skriv en fråga..."
                    className="flex-1 h-9 text-sm rounded-lg"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg"
                    onClick={sendAiMessage}
                    disabled={!aiInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent
                value="team"
                className="flex-1 flex flex-col min-h-0 mt-0 px-3 pb-3"
              >
                {!user ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    Logga in för att använda team-chatten
                  </div>
                ) : (
                  <>
                    {/* Online indicator */}
                    <div className="flex items-center gap-1.5 mt-2 mb-1 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">
                        {onlineCount} {onlineCount === 1 ? 'användare' : 'användare'} online
                      </span>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 min-h-0">
                      <div ref={teamScrollRef} className="space-y-3 pr-2">
                        {teamMessages.length === 0 && (
                          <div className="text-center text-sm text-muted-foreground py-8">
                            Inga meddelanden ännu. Var den första att skriva!
                          </div>
                        )}
                        {teamMessages.map((msg) => {
                          const isMe = msg.senderId === user.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && (
                                  <span className="text-[11px] font-medium text-muted-foreground mb-0.5 block">
                                    {msg.senderName}
                                  </span>
                                )}
                                <div
                                  className={`rounded-2xl px-3 py-2 text-sm ${
                                    isMe
                                      ? 'bg-primary text-primary-foreground rounded-br-md'
                                      : 'bg-muted rounded-bl-md'
                                  }`}
                                >
                                  {msg.text}
                                  <div
                                    className={`text-[10px] mt-1 ${
                                      isMe
                                        ? 'text-primary-foreground/60'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {formatTime(msg.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="flex items-center gap-2 mt-2 shrink-0">
                      <Input
                        value={teamInput}
                        onChange={(e) => setTeamInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendTeamMessage();
                          }
                        }}
                        placeholder="Skriv ett meddelande..."
                        className="flex-1 h-9 text-sm rounded-lg"
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-lg"
                        onClick={sendTeamMessage}
                        disabled={!teamInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
