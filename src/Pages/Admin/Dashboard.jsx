import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { Loader2, Users } from 'lucide-react';
import { useRoleNames } from '@/context/RoleNameContext';
import EngineerDashboard from './EngineerDashboard';
import UserPointsModal from './UserPointsModal';
import UserAttendanceModal from './UserAttendanceModal';

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
  const { getRoleName, getRoleNamePlural } = useRoleNames();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { data, loading } = useGet('/api/admin/dashboard');

  const [pointsUserId, setPointsUserId] = useState(null);
  const [pointsUserName, setPointsUserName] = useState('');
  const [attendanceUserId, setAttendanceUserId] = useState(null);
  const [attendanceUserName, setAttendanceUserName] = useState('');
  
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
          
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
                colorClass="stroke-red-500" 
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

          {/* Today Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/today')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-blue-500 flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
                <span className="material-symbols-outlined text-3xl">today</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Today Tasks</h3>
                <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.today_tasks ?? 0}</p>
              </div>
            </div>
            <div className="flex justify-around items-end pt-3 border-t border-border mt-auto">
              <CircularProgress 
                value={data?.today_done_tasks ?? 0} 
                total={data?.today_tasks ?? 0} 
                colorClass="stroke-blue-500" 
                label="Done" 
              />
              <CircularProgress 
                value={data?.today_approve_tasks ?? 0} 
                total={data?.all_today_tasks ?? data?.today_tasks ?? 0} 
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
                colorClass="stroke-red-500" 
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

          <div className="p-6">
            {leaderboardLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : leaderboardList.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2 text-muted-foreground/50">sentiment_dissatisfied</span>
                <p>No points recorded for this period.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {leaderboardList.map((usr, index) => (
                  <div 
                    key={usr.id} 
                    className={`relative bg-card rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between p-5 overflow-hidden group ${
                      index === 0 
                        ? 'border-amber-400/50 shadow-amber-500/5 bg-gradient-to-b from-amber-500/[0.08] via-card to-card' 
                        : index === 1 
                        ? 'border-slate-300 dark:border-slate-700 shadow-slate-500/5 bg-gradient-to-b from-slate-400/[0.08] via-card to-card' 
                        : index === 2 
                        ? 'border-orange-400/50 shadow-orange-500/5 bg-gradient-to-b from-orange-500/[0.08] via-card to-card' 
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {/* Top Row: Rank Badge & Points Pill */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {/* Rank Badge */}
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-sm ${
                        index === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30 ring-2 ring-amber-400/30' :
                        index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-400/30 ring-2 ring-slate-300/30' :
                        index === 2 ? 'bg-gradient-to-r from-orange-500 to-amber-700 text-white shadow-orange-500/30 ring-2 ring-orange-400/30' :
                        'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {index < 3 && <span className="material-symbols-outlined text-[14px]">military_tech</span>}
                        <span>#{index + 1}</span>
                      </div>

                      {/* Points Pill */}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs shadow-sm">
                        <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
                        <span className="font-black text-sm">{usr.total_points}</span>
                        <span className="text-[10px] font-semibold text-primary/70 uppercase">pts</span>
                      </div>
                    </div>

                    {/* User Profile Avatar & Info */}
                    <div className="flex flex-col items-center text-center my-2">
                      <div className="relative">
                        {usr.image ? (
                          <img 
                            src={usr.image} 
                            alt={usr.name} 
                            className={`w-16 h-16 rounded-full object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                              index === 0 ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-card' :
                              index === 1 ? 'ring-2 ring-slate-300 dark:ring-slate-600 ring-offset-2 ring-offset-card' :
                              index === 2 ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-card' :
                              'ring-2 ring-border ring-offset-2 ring-offset-card'
                            }`} 
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                            index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-400 ring-offset-2 ring-offset-card' :
                            index === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-2 ring-slate-300 ring-offset-2 ring-offset-card' :
                            index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 ring-2 ring-orange-400 ring-offset-2 ring-offset-card' :
                            'bg-primary/10 text-primary ring-2 ring-border ring-offset-2 ring-offset-card'
                          }`}>
                            {usr.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Top 3 Trophy Badge on Avatar */}
                        {index === 0 && (
                          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center">
                            <span className="material-symbols-outlined text-[13px]">emoji_events</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-foreground text-sm mt-3 truncate max-w-full px-2" title={usr.name}>
                        {usr.name}
                      </h3>

                      {usr.phone && (
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] text-muted-foreground/70">call</span>
                          <span dir="ltr">{usr.phone}</span>
                        </p>
                      )}

                      {usr.role && (
                        <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground border border-border/80">
                          {getRoleName(usr.role)}
                        </span>
                      )}
                    </div>

                    {/* Action Icons matching https://taskito.wegostation.com/admin/users (except edit, delete) */}
                    <div className="flex items-center justify-center gap-2 pt-3 mt-4 border-t border-border/60 bg-muted/20 -mx-5 -mb-5 px-4 py-2.5">
                      <button 
                        onClick={() => { setAttendanceUserId(usr.id); setAttendanceUserName(usr.name); }} 
                        className="p-2 text-muted-foreground hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors cursor-pointer" 
                        title="View Attendance"
                      >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      </button>

                      <button 
                        onClick={() => { setPointsUserId(usr.id); setPointsUserName(usr.name); }} 
                        className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer" 
                        title="View Points"
                      >
                        <span className="material-symbols-outlined text-[18px]">analytics</span>
                      </button>

                      <button 
                        onClick={() => navigate(`/admin/tasks/all?user_id=${usr.id}`)} 
                        className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer" 
                        title="View Tasks"
                      >
                        <span className="material-symbols-outlined text-[18px]">task</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Points Modal */}
      {pointsUserId && (
        <UserPointsModal 
          userId={pointsUserId} 
          userName={pointsUserName} 
          onClose={() => setPointsUserId(null)} 
        />
      )}

      {/* User Attendance Modal */}
      {attendanceUserId && (
        <UserAttendanceModal 
          userId={attendanceUserId} 
          userName={attendanceUserName} 
          onClose={() => setAttendanceUserId(null)} 
        />
      )}

    </div>
  );
};

export default Dashboard;
