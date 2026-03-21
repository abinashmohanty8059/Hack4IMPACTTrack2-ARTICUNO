import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  Activity, 
  Thermometer, 
  Droplets,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  BrainCircuit,
  AlertCircle,
  Pill
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';
import { supabase } from '../utils/supabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    console.log("🔄 Fetching patients from Supabase...");
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from('patients')
        .select('*')
        .order('name');
      
      if (supaError) throw supaError;

      if (data && data.length > 0) {
        // Fetch latest vitals for each patient to show correct status in list
        const patientsWithStatus = await Promise.all(data.map(async (p) => {
          const { data: vitals } = await supabase
            .from('vitals_logs')
            .select('spo2')
            .eq('patient_id', p.id)
            .order('recorded_at', { ascending: false })
            .limit(1);
          
          return { ...p, spo2: vitals?.[0]?.spo2 };
        }));

        console.log("✅ Patients fetched with status:", patientsWithStatus.length);
        setPatients(patientsWithStatus);
        setSelectedId(data[0].id);
      } else {
        console.warn("⚠️ No patients found in database.");
      }
    } catch (err) {
      console.error("❌ Supabase fetch error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchPatientDetails(selectedId);
    }
  }, [selectedId]);

  const fetchPatientDetails = async (id) => {
    // Fetch Vitals
    const { data: vitals, error: vError } = await supabase
      .from('vitals_logs')
      .select('spo2, temp, recorded_at')
      .eq('patient_id', id)
      .order('recorded_at', { ascending: true })
      .limit(20);

    if (!vError) {
      const formattedVitals = vitals.map(v => ({
        time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spo2: v.spo2,
        temp: v.temp
      }));
      setVitalsHistory(formattedVitals);
    }

    // Fetch Medication Logs
    const { data: logs, error: lError } = await supabase
      .from('medication_logs')
      .select('status, scheduled_time, medication_name')
      .eq('patient_id', id)
      .order('scheduled_time', { ascending: false })
      .limit(5);

    if (!lError) {
      setMedLogs(logs);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskLevel = (vitals) => {
    if (!vitals || vitals.length === 0) return 'Stable';
    const latest = vitals[vitals.length - 1];
    if (latest.spo2 < 90 || latest.temp > 102) return 'High';
    if (latest.spo2 < 94 || latest.temp > 100.5) return 'Medium';
    return 'Stable';
  };

  const currentRisk = getRiskLevel(vitalsHistory);

  const selectedPatient = patients.find(p => p.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-8 h-[calc(100vh-140px)]">
      {/* LEFT — Patient List */}
      <div className="w-80 flex flex-col gap-4">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 glass rounded-2xl border border-white/10 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          {error && (
            <div className="p-4 mb-2 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs">
              <p className="font-bold mb-1">Connection Error</p>
              <p className="opacity-80">{error}</p>
              <button 
                onClick={fetchPatients}
                className="mt-2 text-primary hover:underline font-bold"
              >
                Retry Connection
              </button>
            </div>
          )}

          {filteredPatients.length === 0 && !loading && !error && (
            <div className="text-center py-12 px-4">
              <p className="text-text-muted text-sm italic mb-4">
                {searchTerm ? "No results found" : "No patients found"}
              </p>
              {!searchTerm && (
                <button 
                  onClick={fetchPatients}
                  className="px-4 py-2 glass rounded-lg text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                >
                  Refresh Data
                </button>
              )}
            </div>
          )}

          {filteredPatients.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all group",
                selectedId === p.id 
                  ? "bg-primary/20 border border-primary/30 shadow-glow-sm" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  (p.spo2 && p.spo2 < 90) ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                  (p.spo2 && p.spo2 < 94) ? 'bg-warning' : 'bg-secondary'
                )} />
                <span className={cn(
                  "font-medium text-sm transition-colors",
                  selectedId === p.id ? "text-text-primary" : "text-text-muted group-hover:text-text-primary"
                )}>
                  {p.name}
                </span>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 transition-all duration-300",
                selectedId === p.id ? "text-primary translate-x-1" : "text-text-muted opacity-0 group-hover:opacity-100"
              )} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {selectedPatient ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="glass-glow rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <div className={cn(
                      "px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-xs uppercase tracking-widest",
                      currentRisk === 'High' ? "border-danger/30 text-danger bg-danger/10 shadow-glow-red" : 
                      currentRisk === 'Medium' ? "border-warning/30 text-warning bg-warning/10" :
                      "border-secondary/30 text-secondary bg-secondary/10"
                    )}>
                      {currentRisk} Risk Profile
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-glow-md">
                    {selectedPatient.name[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-text-primary">{selectedPatient.name}</h2>
                    <div className="flex items-center gap-4 mt-2 text-text-muted text-sm">
                      <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {selectedPatient.device_id}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> System Connected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vitals Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VitalBox 
                  icon={Droplets} 
                  label="Oxygen Saturation" 
                  value={vitalsHistory.length > 0 ? `${vitalsHistory[vitalsHistory.length-1].spo2}%` : '--'} 
                  color={vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length-1].spo2 < 90 ? "text-danger" : "text-secondary"} 
                />
                <VitalBox 
                  icon={Thermometer} 
                  label="Body Temperature" 
                  value={vitalsHistory.length > 0 ? `${vitalsHistory[vitalsHistory.length-1].temp}°F` : '--'} 
                  color={vitalsHistory.length > 0 && vitalsHistory[vitalsHistory.length-1].temp > 100 ? "text-danger" : "text-secondary"} 
                />
              </div>

              {/* Graph */}
              <div className="glass rounded-3xl p-8 border border-white/10">
                <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Vitals Trend (Latest Logs)
                </h3>
                <div className="h-64">
                  {vitalsHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Line type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-text-muted italic">
                      No vitals data recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Med Log & AI Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                <div className="glass rounded-3xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Pill className="w-5 h-5 text-warning" />
                      Recent Medication Activity
                    </h3>
                    <div className="space-y-3">
                      {medLogs.length > 0 ? medLogs.map((log, idx) => (
                        <MedLogItem 
                          key={idx}
                          time={new Date(log.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          dose={log.medication_name || "Prescribed Dose"} 
                          status={log.status} 
                          icon={log.status === 'dispensed' ? CheckCircle2 : log.status === 'missed' ? XCircle : Clock} 
                          color={log.status === 'dispensed' ? "text-secondary" : log.status === 'missed' ? "text-danger" : "text-warning"} 
                          bg={log.status === 'dispensed' ? "bg-secondary/10" : log.status === 'missed' ? "bg-danger/10" : "bg-warning/10"} 
                        />
                      )) : (
                        <div className="text-center py-8 text-text-muted italic text-sm">
                          No medication logs found.
                        </div>
                      )}
                    </div>
                </div>

                <div className="glass-glow rounded-3xl p-6 border border-primary/20 bg-primary/5">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
                      Clinical Intelligence Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-background/50 rounded-2xl border border-white/5 text-sm leading-relaxed">
                        {vitalsHistory.length > 0 ? (
                          <p>
                            Patient is currently showing {vitalsHistory[vitalsHistory.length-1].spo2 < 90 ? <span className="text-danger font-bold">low oxygen saturation</span> : "stable oxygen levels"}. 
                            Temperature is {vitalsHistory[vitalsHistory.length-1].temp > 100 ? <span className="text-danger font-bold">elevated</span> : "normal"}.
                            Recommend continued observation.
                          </p>
                        ) : (
                          <p className="text-text-muted italic">Waiting for sufficient data to generate clinical summary.</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-secondary/10 border border-secondary/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          AI Monitoring Active
                        </p>
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-xl">
            Select a patient to view details
          </div>
        )}
      </div>
    </div>
  );
};

const VitalBox = ({ icon: Icon, label, value, trend, color }) => (
  <div className="glass rounded-2xl p-6 border border-white/10 flex items-center gap-4">
    <div className={cn("p-4 rounded-xl bg-card border border-white/5", color)}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs text-text-muted font-medium mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
    </div>
  </div>
);

const MedLogItem = ({ time, dose, status, icon: Icon, color, bg }) => (
  <div className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5">
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg, color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{dose}</p>
        <p className="text-xs text-text-muted">{time}</p>
      </div>
    </div>
    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md", bg, color)}>
      {status}
    </span>
  </div>
);


export default Patients;
