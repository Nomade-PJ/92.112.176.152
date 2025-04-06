import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart2,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  Package,
  Settings,
  Smartphone,
  Users,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

interface MainNavProps {
  collapsed?: boolean;
}

const MainNav: React.FC<MainNavProps> = ({ collapsed = false }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  return (
    <div className="group flex flex-col gap-4 py-2">
      <nav className="grid gap-1 px-2">
        <Link
          to="/dashboard"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname === '/dashboard' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Home className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Dashboard</span>
        </Link>
        <Link
          to="/customers"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname.includes('/customers') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Users className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Clientes</span>
        </Link>
        <Link
          to="/devices"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname.includes('/devices') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Smartphone className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Dispositivos</span>
        </Link>
        <Link
          to="/services"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname.includes('/services') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Serviços</span>
        </Link>
        <Link
          to="/inventory"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname === '/inventory' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Package className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Estoque</span>
        </Link>
        <Link
          to="/documents"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname.includes('/documents') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <FileText className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Documentos</span>
        </Link>
        <Link
          to="/reports"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname === '/reports' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <BarChart2 className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Relatórios</span>
        </Link>
        
        {/* Test Reports Link - Apenas visível em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <Link
            to="/test-reports"
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              location.pathname === '/test-reports' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <BarChart className="mr-2 h-4 w-4" />
            <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Teste de Relatórios</span>
          </Link>
        )}
      </nav>
      <Separator />
      <nav className="grid gap-1 px-2">
        <Link
          to="/settings"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname === '/settings' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Configurações</span>
        </Link>
        <Link
          to="/trash-bin"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname === '/trash-bin' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Lixeira</span>
        </Link>
      </nav>
      <div className="mt-auto px-2">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={logout}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            className="mr-2 h-4 w-4"
          >
            <path
              d="M4 18H6V20H18V4H6V6H4V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V18ZM6 11H13V13H6V16L1 12L6 8V11Z"
              fill="currentColor"
            ></path>
          </svg>
          <span className={cn("", collapsed && "hidden group-hover:inline-block transition-all duration-300")}>Sair</span>
        </Button>
      </div>
    </div>
  );
};

export default MainNav; 