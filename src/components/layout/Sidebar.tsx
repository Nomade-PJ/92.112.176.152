import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon, 
  UsersIcon, 
  SmartphoneIcon, 
  WrenchIcon, 
  PackageIcon, 
  BarChartIcon, 
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  ReceiptIcon,
  PlusIcon,
  BadgeEuroIcon,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: HomeIcon },
    { path: '/customers', name: 'Clientes', icon: UsersIcon },
    { path: '/devices', name: 'Dispositivos', icon: SmartphoneIcon },
    { path: '/services', name: 'Serviços', icon: WrenchIcon },
    { path: '/documents', name: 'Documentos', icon: FileTextIcon },
    { path: '/inventory', name: 'Estoque', icon: PackageIcon },
    { path: '/reports', name: 'Relatórios', icon: BarChart3 },
    { path: '/settings', name: 'Configurações', icon: SettingsIcon },
  ];
  
  // Função para verificar se uma rota está ativa, incluindo subrotas
  const isRouteActive = (path: string) => {
    // Check exact match first
    if (location.pathname === path) return true;
    
    // Check if it's a subroute (e.g. /customers/new should highlight /customers)
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    
    return false;
  };
  
  return (
    <motion.div 
      className="h-screen bg-sidebar border-r border-sidebar-border"
      initial={{ width: collapsed ? 80 : 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-xl text-sidebar-foreground"
              >
                Paulo Cell
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? 
              <ChevronRightIcon size={20} className="text-sidebar-foreground" /> : 
              <ChevronLeftIcon size={20} className="text-sidebar-foreground" />
            }
          </button>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto scrollbar-none">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-3 py-3 rounded-lg transition-all
                    ${isRouteActive(item.path) 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'}
                  `}
                >
                  <item.icon size={20} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 font-medium"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src="/logo.svg" alt="Paulo Cell Logo" className="w-full h-full object-cover" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3"
                >
                  <div className="font-medium text-sidebar-foreground">Paulo Cell Sistema</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
