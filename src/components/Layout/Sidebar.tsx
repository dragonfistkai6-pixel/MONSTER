import React from 'react';
import { 
  Sprout, 
  TestTube, 
  Cpu, 
  Package, 
  BarChart3, 
  Search,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, onTabChange }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      { id: 'tracking', label: 'Track Batch', icon: Search },
      { id: 'audit', label: 'Audit Log', icon: FileText }
    ];

    if (user?.role === 1) { // Collector
      return [
        { id: 'collection', label: 'Collector Group', icon: Sprout },
        ...commonItems
      ];
    }

    if (user?.role === 2) { // Tester
      return [
        { id: 'quality', label: 'Testing Labs', icon: TestTube },
        ...commonItems
      ];
    }

    if (user?.role === 3) { // Processor
      return [
        { id: 'processing', label: 'Processing Unit', icon: Cpu },
        ...commonItems
      ];
    }

    if (user?.role === 4) { // Manufacturer
      return [
        { id: 'manufacturing', label: 'Manufacturing Plant', icon: Package },
        ...commonItems
      ];
    }

    // Consumer role (role 6)
    return [
      { id: 'consumer', label: 'Verify Product', icon: Shield },
      { id: 'rating', label: 'Rate Platform', icon: BarChart3 }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`
      fixed top-[73px] left-0 z-40 h-[calc(100vh-73px)] w-64 
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:h-[calc(100vh-73px)]
      bg-white/90 backdrop-blur-md border-r border-green-100
    `}>
      <nav className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex items-center space-x-3 w-full px-4 py-3 rounded-lg
                    text-sm font-medium transition-all duration-200
                    ${activeTab === item.id 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                      : 'text-green-700 hover:bg-green-50 hover:text-green-800'
                    }
                  `}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Role Indicator */}
        <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="text-center">
            <p className="text-xs text-green-600 font-medium mb-1">Your Role</p>
            <p className="text-sm font-bold text-green-800 capitalize">
              {user?.role === 1 ? 'Collector' : 
               user?.role === 2 ? 'Tester' : 
               user?.role === 3 ? 'Processor' : 
               user?.role === 4 ? 'Manufacturer' : 
               'Consumer'}
            </p>
            <p className="text-xs text-green-600 mt-1">{user?.organization}</p>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;