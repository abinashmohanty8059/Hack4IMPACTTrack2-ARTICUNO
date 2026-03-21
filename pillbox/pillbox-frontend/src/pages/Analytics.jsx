import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Users,
  Brain,
  Download
} from 'lucide-react';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:3000/insights/all');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for visualizations if API is not fully comprehensive yet
  const riskDistribution = [
    { name: 'Critical', value: 3, color: '#ff4d4d' },
    { name: 'High', value: 5, color: '#fbbf24' },
    { name: 'Moderate', value: 8, color: '#3b82f6' },
    { name: 'Stable', value: 12, color: '#10b981' },
  ];

  const vitalsTrend = [
    { time: '08:00', avgSpo2: 97, avgTemp: 98.6 },
    { time: '10:00', avgSpo2: 96, avgTemp: 99.1 },
    { time: '12:00', avgSpo2: 98, avgTemp: 98.4 },
    { time: '14:00', avgSpo2: 95, avgTemp: 99.5 },
    { time: '16:00', avgSpo2: 97, avgTemp: 98.8 },
    { time: '18:00', avgSpo2: 96, avgTemp: 98.2 },
  ];

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Ward Analytics</h1>
          <p className="text-text-muted mt-1">Real-time health insights and AI performance metrics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-xl text-sm font-medium hover:bg-card/50 transition-all">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnalyticCard 
          icon={Activity} 
          label="Total Vitals Logged" 
          value="1,248" 
          trend="+12% today" 
          color="primary"
        />
        <AnalyticCard 
          icon={AlertTriangle} 
          label="Anomalies Detected" 
          value="14" 
          trend="-2 from yesterday" 
          color="danger"
        />
        <AnalyticCard 
          icon={Users} 
          label="Active Patients" 
          value="28" 
          trend="Full Capacity" 
          color="secondary"
        />
        <AnalyticCard 
          icon={Brain} 
          label="AI Confidance" 
          value="94.2%" 
          trend="Highly Reliable" 
          color="purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vitals Trend Chart */}
        <div className="glass p-8 rounded-3xl border border-white/10 shadow-glow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em]">Avg Ward Vitals (24h)</h3>
            <TrendingUp className="text-primary w-5 h-5" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vitalsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[90, 105]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgSpo2" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6' }} 
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgTemp" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f43f5e' }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="glass p-8 rounded-3xl border border-white/10 shadow-glow-sm">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-8">Patient Risk Distribution</h3>
          <div className="grid grid-cols-2 items-center h-[300px]">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-text-muted group-hover:text-text-primary transition-colors">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="glass p-6 rounded-3xl border border-white/10 hover:border-primary/20 transition-all group">
    <div className={`p-3 rounded-2xl bg-${color}/10 w-fit mb-4 text-${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-bold text-text-primary mb-2 tracking-tight">{value}</p>
    <p className={`text-[10px] font-bold ${trend.includes('+') ? 'text-secondary' : trend.includes('-') ? 'text-danger' : 'text-primary'} uppercase tracking-widest`}>
      {trend}
    </p>
  </div>
);

export default Analytics;
