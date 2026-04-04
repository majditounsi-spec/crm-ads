import {
  LayoutDashboard, FolderKanban, Clock, Zap, Users, BarChart3, TrendingUp, Link2, Activity,
  Sliders, FileSignature, PieChart,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useWhiteLabel } from '@/hooks/useWhiteLabel';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  visibilityKey?: string;
}

const allNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Projekt', url: '/projects', icon: FolderKanban },
  { title: 'Kontakter', url: '/contacts', icon: Users },
  { title: 'Säljtavla', url: '/sales', icon: TrendingUp },
  { title: 'Google ADS', url: '/google-ads', icon: BarChart3, visibilityKey: 'showGoogleAds' },
  { title: 'Tidloggning', url: '/time', icon: Clock },
  { title: 'Automationer', url: '/automations', icon: Zap },
  { title: 'GetAccept', url: '/getaccept', icon: FileSignature },
  { title: 'Rapporter', url: '/reports', icon: PieChart },
  { title: 'Integrationer', url: '/integrations', icon: Link2 },
  { title: 'Aktivitetslogg', url: '/activity', icon: Activity },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { config } = useWhiteLabel();

  const navItems = allNavItems.filter(item => {
    if (!item.visibilityKey) return true;
    return (config as any)[item.visibilityKey] !== false;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-b from-[hsl(215,100%,55%)] to-[hsl(215,100%,45%)] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden shrink-0">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="text-white font-bold text-sm tracking-tight drop-shadow-sm">
                {config.companyName.charAt(0)}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-heading font-semibold text-[15px] text-sidebar-accent-foreground tracking-tight block truncate">
                {config.companyName}
              </span>
              <p className="text-[10px] text-sidebar-muted -mt-0.5 truncate">{config.subtitle}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2.5 mt-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-[8px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
                      activeClassName="bg-white/[0.08] text-white shadow-[0_0.5px_2px_rgba(0,0,0,0.2)] hover:bg-white/[0.1] hover:text-white"
                    >
                      <item.icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
                      {!collapsed && <span className="font-medium text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-[8px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
                activeClassName="bg-white/[0.08] text-white shadow-[0_0.5px_2px_rgba(0,0,0,0.2)]"
              >
                <Sliders className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="font-medium text-[13px]">Inställningar</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
