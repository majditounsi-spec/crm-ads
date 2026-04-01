import { LayoutDashboard, FolderKanban, Clock, Zap, Settings, Users, BarChart3 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Projekt', url: '/projects', icon: FolderKanban },
  { title: 'Kontakter', url: '/contacts', icon: Users },
  { title: 'Google ADS', url: '/google-ads', icon: BarChart3 },
  { title: 'Tidloggning', url: '/time', icon: Clock },
  { title: 'Automationer', url: '/automations', icon: Zap },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-md glow-primary">
            <span className="text-white font-heading font-bold text-sm">M</span>
          </div>
          {!collapsed && (
            <div>
              <span className="font-heading font-bold text-lg text-sidebar-accent-foreground tracking-tight">MarketFlow</span>
              <p className="text-[10px] text-sidebar-muted -mt-0.5">CRM & Projekthantering</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
                      activeClassName="bg-gradient-to-r from-primary to-violet-600 text-white shadow-md hover:from-primary hover:to-violet-600 hover:text-white"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
                activeClassName="bg-gradient-to-r from-primary to-violet-600 text-white shadow-md"
              >
                <Settings className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="font-medium text-sm">Inställningar</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
