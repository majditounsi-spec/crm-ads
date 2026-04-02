import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Search, Command, Clock, LogOut, Settings, User, Shield, LogIn } from 'lucide-react';
import { useWhiteLabel } from '@/hooks/useWhiteLabel';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Link } from 'react-router-dom';

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
  const { config } = useWhiteLabel();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
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
          <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-5 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök projekt, kunder..."
                  className="pl-9 w-72 h-9 bg-muted/50 border-none rounded-xl focus-visible:bg-muted transition-colors"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Swedish Clock */}
              <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">{time}</span>
                <span className="text-xs capitalize">{date}</span>
              </div>

              <div className="hidden md:block w-px h-5 bg-border" />

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unread > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-[10px] text-white flex items-center justify-center font-bold pulse-soft">
                        {unread}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 rounded-xl overflow-hidden">
                  <div className="p-3 border-b bg-muted/30">
                    <h3 className="font-heading font-semibold text-sm">Notifikationer</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                        <p className="text-sm">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* User Profile or Login button */}
              {user ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 hover:bg-muted/50 rounded-xl px-2 py-1 transition-colors">
                      <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{user.initials}</span>
                          </div>
                        )}
                      </div>
                      <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-0 rounded-xl overflow-hidden">
                    <div className="p-4 border-b bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">{user.initials}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link to="/users"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors">
                        <Shield className="h-4 w-4 text-muted-foreground" /> Användare & Team
                      </Link>
                      <Link to="/settings"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors">
                        <Settings className="h-4 w-4 text-muted-foreground" /> Inställningar
                      </Link>
                      <div className="border-t my-1" />
                      <button onClick={signOut}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors w-full text-left">
                        <LogOut className="h-4 w-4" /> Logga ut
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Link to="/login">
                <Button variant="outline" size="sm" className="rounded-xl gap-2 h-8">
                  <LogIn className="h-3.5 w-3.5" /> Logga in
                </Button>
              </Link>
              )}
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
