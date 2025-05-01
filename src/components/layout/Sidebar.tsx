
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Calendar, Home, LucideIcon, Settings, BookOpen, List, PlusCircle, ListTodo } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
  variant: 'default' | 'ghost';
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      variant: location.pathname === '/dashboard' ? 'default' : 'ghost',
    },
    {
      title: 'Schedule',
      icon: Calendar,
      href: '/schedule',
      variant: location.pathname === '/schedule' ? 'default' : 'ghost',
    },
    {
      title: 'Events',
      icon: List,
      href: '/events',
      variant: location.pathname === '/events' ? 'default' : 'ghost',
    },
    {
      title: 'Priority List',
      icon: ListTodo,
      href: '/priority-list',
      variant: location.pathname === '/priority-list' ? 'default' : 'ghost',
    },
    {
      title: 'Generate Plan',
      icon: BookOpen,
      href: '/plan',
      variant: location.pathname === '/plan' ? 'default' : 'ghost',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/settings',
      variant: location.pathname === '/settings' ? 'default' : 'ghost',
    },
  ];

  return (
    <div
      className={cn(
        'bg-sidebar text-sidebar-foreground flex h-full flex-col border-r transition-all duration-300',
        open ? 'w-64' : 'w-0 md:w-16'
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          {open ? (
            <span className="text-xl font-bold">NextLevel</span>
          ) : (
            <span className="text-xl font-bold">NL</span>
          )}
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={cn(
                'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                item.variant === 'default' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', open ? 'mr-2' : 'mx-auto')} />
              {open && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4">
        <Link to="/events">
          <Button className={cn("w-full", open ? "" : "px-2")}>
            <PlusCircle className={cn("h-4 w-4", open ? "mr-2" : "")} />
            {open && "New Event"}
          </Button>
        </Link>
      </div>
      
      {user && (
        <div className="border-t p-4">
          <div className={cn(
            "flex items-center gap-2",
            !open && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-next-purple-dark flex items-center justify-center text-white font-medium">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {open && (
              <div className="truncate">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60">Level {user.level || 1}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
