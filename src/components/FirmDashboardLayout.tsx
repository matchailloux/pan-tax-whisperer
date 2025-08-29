import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Home,
  Users,
  FileText,
  BarChart3,
  Activity,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Building2
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const firmMenuItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard/firm",
    icon: Home,
  },
  {
    title: "Clients",
    url: "/dashboard/firm/clients",
    icon: Users,
  },
  {
    title: "Rapports globaux",
    url: "/dashboard/firm/reports",
    icon: BarChart3,
  },
  {
    title: "Activité",
    url: "/dashboard/firm/activity",
    icon: Activity,
  },
  {
    title: "Paramètres cabinet",
    url: "/dashboard/firm/settings",
    icon: Settings,
  },
  {
    title: "Aide",
    url: "/dashboard/firm/help",
    icon: HelpCircle,
  },
];

function FirmSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/dashboard/firm") {
      return location.pathname === "/dashboard/firm";
    }
    return location.pathname.startsWith(path);
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            <Building2 className="h-4 w-4 mr-2" />
            Cabinet Comptable
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {firmMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={isActive(item.url) ? "bg-accent text-accent-foreground" : ""}
                  >
                    <Link to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function FirmTopBar() {
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {organization?.name || 'Cabinet Comptable'}
          </h1>
          <p className="text-xs text-muted-foreground">Interface cabinet</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Expert-comptable</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(user?.email || 'EC')}
            </AvatarFallback>
          </Avatar>
        </div>

        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

const FirmDashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <FirmSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <FirmTopBar />
          <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-background via-muted/30 to-accent/5">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default FirmDashboardLayout;