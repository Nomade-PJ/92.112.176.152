import React, { useState } from 'react';
import { MenuIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './header/NotificationDropdown';
import UserMenu from './header/UserMenu';
import DeveloperContactModal from './header/DeveloperContactModal';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  
  const handleNewService = () => {
    navigate('/services/new');
  };

  const handleDeveloperContact = () => {
    setDeveloperModalOpen(true);
  };
  
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
          >
            <MenuIcon size={20} />
          </button>
          <div className="hidden md:flex flex-col">
            <span className="font-medium text-sm"></span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleNewService}
          >
            <PlusIcon size={16} />
            <span className="hidden sm:inline">Novo atendimento</span>
          </Button>
          
          <NotificationDropdown />
          
          <UserMenu onDeveloperContact={handleDeveloperContact} />
        </div>
      </div>

      <DeveloperContactModal 
        open={developerModalOpen} 
        onOpenChange={setDeveloperModalOpen} 
      />
    </header>
  );
};

export default Header;
