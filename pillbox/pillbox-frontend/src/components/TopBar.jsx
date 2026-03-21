import React from 'react';
import { Search, Bell, User, Settings as SettingsIcon } from 'lucide-react';

const TopBar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="h-16 glass sticky top-0 z-40 px-8 flex items-center justify-between border-b border-white/10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search patients, vitals, or history..."
            className="w-full bg-card/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-text-muted hover:bg-card hover:text-text-primary transition-all group">
          <Bell className="w-5 h-5 group-hover:animate-bounce" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-background" />
        </button>

        {/* Profile */}
        <div
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Doctor</p>
            <p className="text-xs text-text-muted italic">Chief Resident</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:shadow-glow-sm transition-all overflow-hidden bg-card">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
