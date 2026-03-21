import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  User,
  Bot,
  AlertCircle,
  Pill,
  FileText,
  MoreVertical,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIChat = () => {
  const [messages, setMessages] = useState(() => {
    const cached = localStorage.getItem('pillbox_chat_history');
    return cached ? JSON.parse(cached) : [
      { id: 1, role: 'ai', content: "Hello Doctor. I am ready to assist with your patient data analysis. What would you like to review today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('pillbox_chat_history', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userQuery = input;
    const newMessage = {
      id: messages.length + 1,
      role: 'user',
      content: userQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery })
      });

      if (!response.ok) throw new Error('Failed to fetch AI response');

      const data = await response.json();

      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'ai',
        content: data.answer || "I apologize, I couldn't process that request properly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'ai',
        content: "I'm having trouble connecting to the clinical intelligence engine. Please ensure the backend is running.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
      {/* Chat Header */}
      <div className="glass rounded-t-3xl p-6 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-glow-sm">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Clinical AI Assistant</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs text-text-muted font-medium uppercase tracking-tight">AI Integrated</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to clear the chat history?")) {
              const initialMsg = [{ id: 1, role: 'ai', content: "Hello Dr. Sharma. I am ready to assist with your patient data analysis. What would you like to review today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
              setMessages(initialMsg);
              localStorage.removeItem('pillbox_chat_history');
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-[10px] font-bold text-text-muted hover:text-danger hover:border-danger/30 transition-all uppercase tracking-widest border border-white/5"
        >
          <MoreVertical className="w-4 h-4" />
          Clear History
        </button>
      </div>

      {/* Chat Messages */}
      <div
        ref={scrollRef}
        className="flex-1 glass border-x border-white/10 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-900/40"
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${msg.role === 'user'
                    ? 'bg-primary/20 border-primary/30 text-primary'
                    : 'bg-card border-white/10 text-white shadow-glow-sm'
                  }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl border ${msg.role === 'user'
                      ? 'bg-primary text-white border-primary/50 rounded-tr-none'
                      : 'glass-glow text-text-primary border-white/10 rounded-tl-none'
                    }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] text-text-muted font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-card border border-white/10 flex items-center justify-center text-white shadow-glow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass-glow px-4 py-3 rounded-2xl rounded-tl-none border border-white/10 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Input Area */}
      <div className="glass rounded-b-3xl p-6 border border-white/10 space-y-4">
        {/* Quick Buttons */}
        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
          <QuickButton icon={AlertCircle} label="Critical Patients" onClick={() => setInput("Show me all patients with critical risk status")} />
          <QuickButton icon={Pill} label="Missed Meds" onClick={() => setInput("Identify patients who missed their last dose")} />
          <QuickButton icon={FileText} label="Summary" onClick={() => setInput("Generate a daily clinical summary report")} />
        </div>

        <div className="relative flex items-end gap-3">
          <button className="p-3 hover:bg-white/5 rounded-xl transition-colors text-text-muted group">
            <Paperclip className="w-5 h-5 group-hover:text-primary transition-colors" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask me anything about patient data..."
              rows={1}
              className="w-full glass bg-card/50 border border-white/10 rounded-2xl py-3 px-4 text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-glow-sm hover:shadow-glow-md flex-shrink-0"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickButton = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all whitespace-nowrap group"
  >
    <Icon className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors" />
    <span className="text-xs font-semibold text-text-muted group-hover:text-text-primary transition-colors uppercase tracking-wider">{label}</span>
  </button>
);

export default AIChat;
