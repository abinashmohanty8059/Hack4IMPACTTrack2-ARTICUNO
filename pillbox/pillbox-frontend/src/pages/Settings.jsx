import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Brain, 
  Key, 
  Monitor, 
  Globe, 
  Shield, 
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle2
} from 'lucide-react';

const Settings = () => {
  const [aiProvider, setAiProvider] = useState('gemini');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">System Settings</h1>
        <p className="text-text-muted mt-1">Configure AI models, security, and interface preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="md:col-span-1 space-y-4">
          <SettingsNavButton icon={Brain} label="AI Models" active />
          <SettingsNavButton icon={Key} label="API Access" />
          <SettingsNavButton icon={Monitor} label="Interface" />
          <SettingsNavButton icon={Shield} label="Security" />
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-8">
          {/* AI Model Selection */}
          <div className="glass p-8 rounded-3xl border border-white/10 shadow-glow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em]">LLM Provider Configuration</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <ProviderCard 
                icon={Zap} 
                name="Google Gemini 3.1" 
                desc="Cloud-based, high performance, large context."
                active={aiProvider === 'gemini'}
                onClick={() => setAiProvider('gemini')}
                badge="Recommended"
              />
              <ProviderCard 
                icon={Cpu} 
                name="Local Ollama (Llama 3)" 
                desc="Privacy-first, offline capable, resource intensive."
                active={aiProvider === 'ollama'}
                onClick={() => setAiProvider('ollama')}
              />
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Auto-Fallback</p>
                  <p className="text-xs text-text-muted">Use Ollama if Gemini is unavailable</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="glass p-8 rounded-3xl border border-white/10 shadow-glow-sm">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-8">API Credentials</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Gemini API Key</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value="••••••••••••••••••••••••"
                    readOnly
                    className="w-full bg-card/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-text-muted focus:outline-none"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary uppercase">Rotate</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
             <button className="px-6 py-3 text-sm font-bold text-text-muted uppercase tracking-widest hover:text-text-primary transition-all">Cancel</button>
             <button 
              onClick={handleUpdate}
              className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-glow-sm transition-all flex items-center gap-2"
             >
                {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isUpdating ? 'Updating...' : 'Save Settings'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsNavButton = ({ icon: Icon, label, active }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary/20 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'}`}>
    <Icon className="w-5 h-5" />
    <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
  </button>
);

const ProviderCard = ({ icon: Icon, name, desc, active, onClick, badge }) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${active ? 'bg-primary/10 border-primary/50 shadow-glow-sm' : 'bg-card/30 border-white/10 hover:border-white/20'}`}
  >
    <div className={`p-3 rounded-xl ${active ? 'bg-primary text-white' : 'bg-white/5 text-text-muted'}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-text-primary tracking-tight">{name}</h4>
        {badge && (
          <span className="text-[10px] font-bold bg-secondary/20 text-secondary px-2 py-0.5 rounded-full uppercase">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Settings;
