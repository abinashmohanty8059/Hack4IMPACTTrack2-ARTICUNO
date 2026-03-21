import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Pill, 
  Cpu, 
  TrendingUp, 
  Activity 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../utils/utils';
import { supabase } from '../utils/supabase';

const OverviewCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div 
    whileHover={{ scale: 1.02, translateY: -5 }}
    className="glass rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all hover:shadow-glow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-xl bg-opacity-20", color)}>
        <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-secondary flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-text-muted text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-text-primary">{value}</p>
  </motion.div>
);

const PatientLiveCard = ({ name, risk, spo2, temp, status }) => {
  const isCritical = risk === 'High' || (spo2 && spo2 < 90) || (temp && temp > 101);
  const riskColor = isCritical ? 'danger' : risk === 'Medium' ? 'warning' : 'secondary';
  
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={cn(
        "glass rounded-xl p-5 border transition-all",
        isCritical ? "border-danger/50 shadow-glow-red animate-pulse-slow" : "border-white/10 hover:border-primary/20"
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-text-primary">{name}</h4>
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          `border-${riskColor}/30 text-${riskColor} bg-${riskColor}/10`
        )}>
          {isCritical ? 'Critical' : risk || 'Stable'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="space-y-1">
          <p className="text-text-muted text-xs">SpO₂</p>
          <p className={cn("font-mono font-bold", spo2 && spo2 < 90 ? "text-danger" : "text-text-primary")}>
            {spo2 ? `${spo2}%` : '--'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-text-muted text-xs">Temp</p>
          <p className={cn("font-mono font-bold", temp && temp > 100.5 ? "text-danger" : "text-text-primary")}>
            {temp ? `${temp}°F` : '--'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", status === 'missed' ? 'bg-danger' : 'bg-secondary')} />
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-tight">
            {status || 'Monitoring'}
          </span>
        </div>
        <button className="text-[11px] text-primary hover:text-white font-medium transition-colors">
          View Details →
        </button>
      </div>
    </motion.div>
  );
};

// Dummy data for chart fallback
const vitalsData = [
  { time: '08:00', spo2: 95, temp: 98.6 },
  { time: '10:00', spo2: 94, temp: 99.1 },
  { time: '12:00', spo2: 92, temp: 100.2 },
  { time: '14:00', spo2: 89, temp: 101.5 },
  { time: '16:00', spo2: 90, temp: 101.1 },
  { time: '18:00', spo2: 93, temp: 99.8 },
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalCount: 0,
    pendingMeds: 0,
    aiStatus: 'Active'
  });
  const [livePatients, setLivePatients] = useState([]);
  const [pendingMedsList, setPendingMedsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      console.log("🔄 Loading Dashboard metrics...");
      setLoading(true);
      setError(null);
      try {
        console.log("1. Fetching total patients count...");
        const { count: pCount, error: pSupaError } = await supabase.from('patients').select('*', { count: 'exact' });
        if (pSupaError) {
          console.error("Error fetching patient count:", pSupaError);
          throw pSupaError;
        }
        console.log("Total patients count:", pCount);
         console.log("2. Fetching pending & today's missed meds count...");
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: medLogs, error: mError } = await supabase
          .from('medication_logs')
          .select('*, patients(name)')
          .or(`status.eq.pending,status.eq.missed`)
          .gte('scheduled_time', `${todayStr}T00:00:00Z`);
        
        if (mError) throw mError;
        
        console.log("3. Fetching patient list for live status...");
        const { data: patients, error: pListError } = await supabase.from('patients').select('id, name');
        if (pListError) throw pListError;
        
        if (patients && patients.length > 0) {
          console.log(`4. Fetching vitals for ${patients.length} patients...`);
          const patientsWithVitals = await Promise.all(patients.map(async (p) => {
            try {
              const { data: vitals } = await supabase
                .from('vitals_logs')
                .select('spo2, temp, recorded_at')
                .eq('patient_id', p.id)
                .order('recorded_at', { ascending: false })
                .limit(1);
              
              const pLog = medLogs?.find(l => l.patient_id === p.id);

              return {
                ...p,
                spo2: vitals?.[0]?.spo2,
                temp: vitals?.[0]?.temp,
                status: pLog?.status || 'stable'
              };
            } catch (err) {
              console.error(`Error fetching vitals for patient ${p.id}:`, err);
              return p;
            }
          }));
          
          // Sort patients: Critical first
          const sortedPatients = [...patientsWithVitals].sort((a, b) => {
            const aCritical = (a.spo2 && a.spo2 < 90) || (a.temp && a.temp > 101);
            const bCritical = (b.spo2 && b.spo2 < 90) || (b.temp && b.temp > 101);
            if (aCritical && !bCritical) return -1;
            if (!aCritical && bCritical) return 1;
            return 0;
          });

          console.log("Dashboard data ready:", sortedPatients);
          setLivePatients(sortedPatients);
          setPendingMedsList(medLogs || []);
          
          const critical = patientsWithVitals.filter(p => (p.spo2 && p.spo2 < 90) || (p.temp && p.temp > 101)).length;
          
          setStats({
            totalPatients: pCount || 0,
            pendingMeds: medLogs?.length || 0,
            criticalCount: critical,
          });
        } else {
          console.warn("No patients found in system.");
          setStats(prev => ({ ...prev, totalPatients: 0, aiStatus: 'Operational' }));
        }
        // Set AI status here, as it's independent of patient count but dependent on successful data fetch
        setStats(prev => ({ ...prev, aiStatus: 'Operational' }));
      } catch (err) {
        console.error("❌ Dashboard data error:", err.message);
        setError(err.message);
        setStats(prev => ({ ...prev, aiStatus: 'Offline' })); // Set AI status to offline on error
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Medical Dashboard</h2>
          <p className="text-text-muted">Real-time health monitoring & AI analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass rounded-lg text-sm font-medium border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Live View
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard 
          title="Total Patients" 
          value={stats.totalPatients} 
          icon={Users} 
          color="bg-primary"
          trend={stats.totalPatients > 0 ? "+ Active" : "Empty"}
        />
        <OverviewCard 
          title="Critical Patients" 
          value={stats.criticalCount} 
          icon={AlertTriangle} 
          color="bg-danger"
          trend={stats.criticalCount > 0 ? "Urgent" : "None"}
        />
        <OverviewCard 
          title="Pending Meds" 
          value={stats.pendingMeds} 
          icon={Pill} 
          color="bg-warning"
        />
        <OverviewCard 
          title="System AI" 
          value={stats.aiStatus} 
          icon={Cpu} 
          color="bg-secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Status Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full" />
              Patient Live Status
            </h3>
            <span className="text-xs text-secondary font-medium animate-pulse flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
               LIVE FEED
            </span>
          </div>
          
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 glass animate-pulse rounded-xl" />)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {livePatients.map((p) => (
                <PatientLiveCard 
                  key={p.id}
                  name={p.name} 
                  risk={p.risk} 
                  spo2={p.spo2} 
                  temp={p.temp} 
                  status={p.status} 
                />
              ))}
              {livePatients.length === 0 && (
                <div className="col-span-2 text-center py-12 glass rounded-2xl text-text-muted italic">
                  No patients found in the system.
                </div>
              )}
            </div>
          )}
        </div>
        {/* Medication Alerts */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <span className="w-2 h-6 bg-warning rounded-full" />
            Action Required
          </h3>
          <div className="glass rounded-2xl p-6 border border-white/10 min-h-[400px] flex flex-col">
            <p className="text-sm font-medium text-text-muted mb-6">Medication Alerts (Today)</p>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-1">
              {pendingMedsList.length > 0 ? (
                pendingMedsList.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-white/5 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        med.status === 'missed' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                      )}>
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                          {med.patients?.name || 'Unknown Patient'}
                        </p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                          {med.status === 'missed' ? 'MISSED DOSE' : 'PENDING DISPENSE'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-text-muted">
                      {new Date(med.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                   <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                      <Pill className="w-6 h-6 text-secondary" />
                   </div>
                   <p className="text-sm font-medium text-text-muted italic">All clear! No pending actions.</p>
                </div>
              )}
            </div>
            
            <button className="w-full py-3 mt-6 border border-white/10 rounded-xl text-xs font-bold text-text-muted uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
               View Full Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
