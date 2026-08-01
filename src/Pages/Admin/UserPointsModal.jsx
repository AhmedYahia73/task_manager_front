import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { Loader2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UserPointsModal = ({ userId, userName, onClose }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: pointsData, loading: pointsLoading } = useGet(`/api/admin/dashboard/points-chart?year=${year}&user_id=${userId}`);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-border bg-background rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Points Overview: {userName}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors border border-transparent hover:border-border">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground font-['Plus_Jakarta_Sans']">Performance Stats</h3>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-background border border-input rounded-xl px-4 py-2 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>

          {/* Smart Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-5 rounded-2xl flex items-center gap-4 shadow-inner border border-purple-200/50 hover:shadow-md transition-shadow">
              <div className="bg-white/60 p-3 rounded-xl text-purple-700 shadow-sm">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-800/80 uppercase tracking-wider">All Time Points</p>
                <p className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-purple-900 mt-1">{pointsData?.totalPointsAllTime ?? 0}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-5 rounded-2xl flex items-center gap-4 shadow-inner border border-blue-200/50 hover:shadow-md transition-shadow">
              <div className="bg-white/60 p-3 rounded-xl text-blue-700 shadow-sm">
                <span className="material-symbols-outlined text-2xl">calendar_today</span>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800/80 uppercase tracking-wider">Points This Year</p>
                <p className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-blue-900 mt-1">
                  {pointsData?.chartData?.reduce((sum, item) => sum + item.points, 0) ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-5 rounded-2xl flex items-center gap-4 shadow-inner border border-emerald-200/50 hover:shadow-md transition-shadow">
              <div className="bg-white/60 p-3 rounded-xl text-emerald-700 shadow-sm">
                <span className="material-symbols-outlined text-2xl">today</span>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800/80 uppercase tracking-wider">Points This Month</p>
                <p className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-emerald-900 mt-1">
                  {pointsData?.chartData?.[new Date().getMonth()]?.points ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[320px] w-full mt-2 bg-background/50 rounded-2xl p-4 border border-border/50">
            {pointsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pointsData?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 6 }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="points" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 6, 6]} 
                    barSize={40}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserPointsModal;
