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
    keywords: ['projekt', 'projects', 'skapa projekt', 'nytt projekt'],
    answer:
      'Du hittar alla projekt under "Projekt" i sidomenyn. Där kan du skapa nya projekt, tilldela team-medlemmar, sätta deadlines och följa upp status. Klicka på "+ Nytt projekt" för att komma igång!',
  },
  {
    keywords: ['kontakt', 'kontakter', 'kund', 'kunder', 'leads'],
    answer:
      'Under "Kontakter" kan du hantera alla kunder och leads. Du kan lägga till nya kontakter, filtrera på status, och se kontakthistorik. Använd sökfältet för att snabbt hitta en specifik kontakt.',
  },
  {
    keywords: ['säljtavla', 'säljpipeline', 'pipeline', 'deals', 'affärer'],
    answer:
      'Säljtavlan visar din pipeline med drag-and-drop. Du kan flytta affärer mellan steg (Lead, Offert, Förhandling, Vunnen, Förlorad), se totalt värde per steg, och filtrera på ansvarig säljare.',
  },
  {
    keywords: ['tid', 'tidloggning', 'time', 'timmar', 'logga tid'],
    answer:
      'Under "Tidloggning" kan du registrera arbetad tid per projekt. Använd timern för att spåra tid i realtid, eller lägg till tid manuellt. Du kan även exportera tidrapporter.',
  },
  {
    keywords: ['google ads', 'ads', 'annons', 'annonser', 'kampanj', 'kampanjer', 'budget'],
    answer:
      'Google Ads-sektionen visar kampanjprestanda, budgetförbrukning och nyckeltal. Du kan koppla Google Ads-konton under Inställningar > Google Ads. Dashboarden uppdateras automatiskt.',
  },
  {
    keywords: ['roll', 'roller', 'behörighet', 'behörigheter', 'admin', 'användare'],
    answer:
      'Roller hanteras under "Användare". Det finns tre roller: Admin (full åtkomst), Projektledare (hantera projekt och kontakter), och Medlem (grundläggande åtkomst). Admins kan ändra roller.',
  },
  {
    keywords: ['inställning', 'inställningar', 'settings', 'konfigurera', 'profil'],
    answer:
      'Under "Inställningar" kan du anpassa företagsprofil, integrationsinställningar (Google Ads, Fortnox, GetAccept), white-label, och notifikationer. Klicka på kugghjulet i sidomenyn.',
  },
  {
    keywords: ['rapport', 'rapporter', 'statistik', 'analys', 'dashboard'],
    answer:
      'Rapporter hittar du på Dashboard-sidan och under "Rapporter". Där ser du försäljningsstatistik, projektöversikt, tidsrapporter och Google Ads-prestanda med interaktiva diagram.',
  },
  {
    keywords: ['navigera', 'hitta', 'var finns', 'hur hittar', 'meny', 'sidomeny'],
    answer:
      'Använd sidomenyn till vänster för att navigera. Huvudsektionerna är: Dashboard, Projekt, Kontakter, Säljtavla, Tidloggning, Google Ads, Rapporter, Användare och Inställningar. Du kan även använda sökfältet (Cmd+K) för snabbsökning.',
  },
  {
    keywords: ['hej', 'hallå', 'tjena', 'god morgon', 'god kväll', 'hejsan'],
    answer:
      'Hej! 👋 Jag är din AI-assistent för MarketFlow CRM. Jag kan hjälpa dig med frågor om projekt, kontakter, säljtavlan, tidloggning, Google Ads, roller och inställningar. Vad kan jag hjälpa dig med?',
  },
  {
    keywords: ['tack', 'tackar', 'bra', 'toppen', 'perfekt'],
    answer:
      'Glad att kunna hjälpa! Tveka inte att fråga om du behöver mer hjälp. 😊',
  },
  {
    keywords: ['hjälp', 'help', 'vad kan du', 'funktioner'],
    answer:
      'Jag kan hjälpa dig med:\n• Projekt – skapa och hantera projekt\n• Kontakter – kund- och lead-hantering\n• Säljtavla – pipeline och affärer\n• Tidloggning – spåra arbetstid\n• Google Ads – kampanjöversikt\n• Roller – behörigheter och användare\n• Inställningar – konfiguration\n• Rapporter – statistik och analys\n\nSkriv ett ämne så berättar jag mer!',
  },
  {
    keywords: ['fortnox', 'faktura', 'bokföring'],
    answer:
      'Fortnox-integrationen hittar du under Inställningar > Fortnox. Där kan du koppla ditt Fortnox-konto för att synka fakturor och bokföring. Kontakta admin om du behöver hjälp med att sätta upp kopplingen.',
  },
  {
    keywords: ['getaccept', 'offert', 'signera', 'avtal'],
    answer:
      'GetAccept-integrationen låter dig skicka offerter och avtal direkt från CRM:et. Koppla ditt konto under Inställningar > GetAccept. Du kan sedan skapa och följa upp dokument från projektvyn.',
  },
];

function getAIResponse(input: string): string {
  const lower = input.toLowerCase().trim();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.answer;
    }
  }

  return 'Tyvärr förstod jag inte riktigt din fråga. Prova att fråga om t.ex. projekt, kontakter, säljtavla, tidloggning, Google Ads, roller, inställningar eller rapporter, så hjälper jag dig!';
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
