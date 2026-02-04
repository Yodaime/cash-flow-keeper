import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Store, 
  Users, 
  FileText,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from './Layout';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fechamentos', href: '/fechamentos', icon: Receipt },
  { name: 'Lojas', href: '/lojas', icon: Store },
  { name: 'Usuários', href: '/usuarios', icon: Users },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Estoque', href: '/estoque', icon: Package, adminOnly: true },
];

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const superAdminNavigation = [
  { name: 'Organizações', href: '/organizacoes', icon: Store },
];

const roleLabels = {
  funcionaria: 'Funcionária',
  gerente: 'Gerente',
  administrador: 'Administrador',
  super_admin: 'Super Admin',
};

export function Sidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useLayout();
  const { profile, role, signOut } = useAuth();

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'administrador' || role === 'super_admin';

  const visibleNavigation = navigation.filter((item: NavItem) => 
    !item.adminOnly || isAdmin
  );
  
  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <span className="text-primary font-bold text-sm">CF</span>
              </div>
              <span className="font-display text-xl text-sidebar-foreground">
                Closer<span className="text-sidebar-primary">Flow</span>
              </span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center mx-auto">
              <span className="text-primary font-bold text-sm">CF</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleNavigation.map((item: NavItem) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
          
          {/* Super Admin Only */}
          {isSuperAdmin && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    Super Admin
                  </p>
                </div>
              )}
              {superAdminNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-destructive/20 text-destructive"
                        : "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-destructive")} />
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-sidebar-foreground">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.name || 'Carregando...'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {role ? roleLabels[role] : ''}
                </p>
              </div>
            )}
            {!collapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
