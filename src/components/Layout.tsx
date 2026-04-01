import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Search, Plus, Command, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projekt',
  '/contacts': 'Kontakter',
  '/google-ads': 'Google ADS',
  '/time': 'Tidloggning',
  '/automations': 'Automationer',
};

function useSwedishClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short', day: 'numeric', month: 'short' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);
  return { time, date };
}

export function Layout() {
  const location = useLocation();
  const { time, date } = useSwedishClock();
  const [notifications] = useState([
    { id: 1, text: 'Nordic Food deadline om 2 dagar', time: '1h sedan', read: false },
    { id: 2, text: 'GreenEnergy projekt blockerat', time: '3h sedan', read: false },
    { id: 3, text: 'Budget varning: TechStart AB 62%', time: '5h sedan', read: true },
  ]);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök projekt, kunder..."
                  className="pl-9 w-72 h-9 bg-secondary/50 border-none focus-visible:bg-secondary transition-colors"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Swedish Clock */}
              <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">{time}</span>
                <span className="text-xs capitalize">{date}</span>
              </div>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                        {unread}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-3 border-b">
                    <h3 className="font-heading font-semibold text-sm">Notifikationer</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                        <p className="text-sm">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* User */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <span className="text-primary-foreground text-sm font-medium">MT</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
