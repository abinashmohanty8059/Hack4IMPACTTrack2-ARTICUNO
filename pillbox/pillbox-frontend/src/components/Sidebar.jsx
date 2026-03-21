import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  User,
  BarChart3, 
  MessageSquare, 
  Settings, 
  Pill 
} from 'lucide-react';
import { cn } from '../utils/utils';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group",
      active 
        ? "bg-primary/20 text-primary border-l-4 border-primary shadow-glow-sm" 
        : "text-text-muted hover:bg-card/50 hover:text-text-primary"
    )}
  >
    <Icon className={cn(
      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
      active ? "text-primary" : "text-text-muted group-hover:text-text-primary"
    )} />
    <span className="font-medium">{label}</span>
  </button>
);

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-60 glass border-r border-white/10 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-glow-sm">
          <Pill className="text-primary w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
          PillBox AI
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-card/30 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-text-muted">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-medium text-text-primary">AI Systems Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
