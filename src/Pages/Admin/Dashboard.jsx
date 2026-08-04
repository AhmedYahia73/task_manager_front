import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { Loader2, Users } from 'lucide-react';
import { useRoleNames } from '@/context/RoleNameContext';
import EngineerDashboard from './EngineerDashboard';

const CircularProgress = ({ value, total, colorClass, label }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? (value / total) * 100 : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-sm font-bold text-foreground leading-none">{Math.round(percent)}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{value} / {total}</span>
    </div>
  );
};

const Dashboard = () => {
  const { getRoleNamePlural } = useRoleNames();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { data, loading } = useGet('/api/admin/dashboard');
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Need to adjust for timezone offset to prevent picking the wrong day locally
  const offset = now.getTimezoneOffset() * 60000;
  const defaultFrom = new Date(firstDay.getTime() - offset).toISOString().split('T')[0];
  const defaultTo = new Date(lastDay.getTime() - offset).toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const { data: leaderboardRes, loading: leaderboardLoading } = useGet(`/api/admin/dashboard/leaderboard?from=${fromDate}&to=${toDate}`);
  const leaderboardList = leaderboardRes?.leaderboard || [];

  const navigate = useNavigate();

  if (user?.role === 'engineer' || user?.role === 'tester') {
    return <EngineerDashboard />;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-background min-h-screen relative text-foreground">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview and management of the system</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* Stats Overview */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          
          {/* Pending Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/pending')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-[#684000] flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="bg-muted p-3 rounded-lg text-[#684000]">
                <span className="material-symbols-outlined text-3xl">assignment_late</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
                <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.pending_tasks ?? 0}</p>
              </div>
            </div>
            <div className="flex justify-center items-end pt-3 border-t border-border mt-auto">
              <CircularProgress 
                value={data?.done_tasks ?? 0} 
                total={data?.pending_tasks ?? 0} 
                colorClass="stroke-blue-500" 
                label="Done / Pending" 
              />
            </div>
          </div>

          {/* Active Projects */}
          <div 
            onClick={() => navigate('/admin/projects')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-var(--primary) flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="bg-muted p-3 rounded-lg text-primary">
                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Projects</h3>
                <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.all_projects ?? 0}</p>
              </div>
            </div>
            <div className="flex justify-around items-end pt-3 border-t border-border mt-auto">
              <CircularProgress 
                value={data?.done_tasks ?? 0} 
                total={data?.total_tasks ?? 0} 
                colorClass="stroke-red-500" 
                label="Done Tasks" 
              />
              <CircularProgress 
                value={data?.approve_tasks ?? 0} 
                total={data?.total_tasks ?? 0} 
                colorClass="stroke-[#006c49]" 
                label="Approved" 
              />
            </div>
          </div>

          {/* Delay Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/delay')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-[#ba1a1a] flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="bg-[#fef2f2] p-3 rounded-lg text-[#ba1a1a]">
                <span className="material-symbols-outlined text-3xl">alarm</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Delay Tasks</h3>
                <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.delay_tasks ?? 0}</p>
              </div>
            </div>
            <div className="flex justify-center items-end pt-3 border-t border-border mt-auto">
              <CircularProgress 
                value={data?.done_tasks ?? 0} 
                total={data?.delay_tasks ?? 0} 
                colorClass="stroke-orange-500" 
                label="Done / Delay" 
              />
            </div>
          </div>

          {/* Total Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/all')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-purple-600 flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                <span className="material-symbols-outlined text-3xl">task</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
                <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.total_tasks ?? 0}</p>
              </div>
            </div>
            <div className="flex justify-around items-end pt-3 border-t border-border mt-auto">
              <CircularProgress 
                value={data?.done_tasks ?? 0} 
                total={data?.total_tasks ?? 0} 
                colorClass="stroke-red-500" 
                label="Done" 
              />
              <CircularProgress 
                value={data?.approve_tasks ?? 0} 
                total={data?.total_tasks ?? 0} 
                colorClass="stroke-[#006c49]" 
                label="Approved" 
              />
            </div>
          </div>

          {/* Engineers */}
          <div 
            onClick={() => navigate('/admin/users?role=engineer')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col justify-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="bg-muted p-3 rounded-lg text-primary">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground capitalize">{getRoleNamePlural('engineer')}</h3>
                <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.engineers_count ?? 0}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Leaderboard Section */}
      {!loading && user?.role !== 'engineer' && (
        <div className="mt-8 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-3xl">emoji_events</span>
                Top Performers
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Ranking based on completed tasks points</p>
            </div>
            
            <div className="flex items-center gap-3 bg-background p-2 rounded-xl border border-input shadow-sm w-full md:w-auto">
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs font-semibold text-muted-foreground">From:</span>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-foreground"
                />
              </div>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs font-semibold text-muted-foreground">To:</span>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="p-0">
            {leaderboardLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : leaderboardList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2 text-muted-foreground/50">sentiment_dissatisfied</span>
                <p>No points recorded for this period.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaderboardList.map((usr, index) => (
                  <div key={usr.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                        index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 
                        index === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'bg-background text-muted-foreground border border-border'
                      }`}>
                        #{index + 1}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        {usr.image ? (
                          <img src={usr.image} alt={usr.name} className="w-10 h-10 rounded-full object-cover border border-border shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shadow-sm">
                            {usr.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground">{usr.name}</p>
                          <p className="text-xs text-muted-foreground">{usr.phone}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                      <span className="material-symbols-outlined text-primary text-[18px]">workspace_premium</span>
                      <span className="font-black text-primary">{usr.total_points}</span>
                      <span className="text-xs font-semibold text-primary/70 uppercase">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
