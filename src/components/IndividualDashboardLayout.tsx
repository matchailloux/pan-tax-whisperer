import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Home,
  FileText,
  BarChart3,
  Activity,
  Database,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Scale
  
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

const individualMenuItems = [
  {
    title: "Accueil",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Documents",
    url: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Analyse TVA",
    url: "/dashboard/analysis",
    icon: BarChart3,
  },
  {
    title: "Rapports",
    url: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Activité",
    url: "/dashboard/activity",
    icon: Activity,
  },
  {
    title: "Compliance",
    url: "/dashboard/compliance",
    icon: Scale,
  },
  {
    title: "Données",
    url: "/dashboard/data",
    icon: Database,
  },
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Aide",
    url: "/dashboard/help",
    icon: HelpCircle,
  },
];

function IndividualSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path) && !location.pathname.startsWith("/dashboard/firm");
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {individualMenuItems.map((item) => (
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

function IndividualTopBar() {
  const { user, signOut } = useAuth();

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-lg font-semibold">TVA Analysis Pro</h1>
          <p className="text-xs text-muted-foreground">Espace personnel</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Utilisateur individuel</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(user?.email || 'U')}
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

const IndividualDashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <IndividualSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <IndividualTopBar />
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default IndividualDashboardLayout;