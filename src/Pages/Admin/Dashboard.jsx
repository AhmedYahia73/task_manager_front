import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleNames } from '@/context/RoleNameContext';
import { isLeaderSalesRole, isSalesRole } from '@/utils/auth';
import { getActiveSalesProject } from '@/utils/salesProject';
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

  const [copiedId, setCopiedId] = useState(null);

  const handleCopyPhone = (e, userId, phone) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(userId);
    toast.success('Phone number copied to clipboard');
    setTimeout(() => {
      setCopiedId((prev) => (prev === userId ? null : prev));
    }, 2000);
  };

  const handleOpenWhatsApp = (e, whatsapp) => {
    e.stopPropagation();
    if (!whatsapp) {
      toast.error('No WhatsApp number registered');
      return;
    }
    let cleanNumber = String(whatsapp).replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
      cleanNumber = '2' + cleanNumber;
    }
    window.open(`https://wa.me/${cleanNumber}`, '_blank', 'noopener,noreferrer');
  };

  const getAttendanceBadge = (attendance) => {
    if (!attendance) return null;
    switch (attendance.type) {
      case 'present_ontime':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500',
          icon: 'check_circle',
          label: attendance.label || 'On-Time',
          subtext: attendance.check_in_time ? `In ${attendance.check_in_time}` : ''
        };
      case 'present_late':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
          dot: 'bg-amber-500',
          icon: 'schedule',
          label: attendance.label || 'Late',
          subtext: attendance.check_in_time ? `In ${attendance.check_in_time}` : ''
        };
      case 'online':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
          dot: 'bg-blue-500',
          icon: 'wifi',
          label: attendance.label || 'Remote / Online',
          subtext: attendance.check_in_time ? `In ${attendance.check_in_time}` : ''
        };
      case 'absent':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
          dot: 'bg-rose-500',
          icon: 'cancel',
          label: attendance.label || 'Absent',
          subtext: 'No Check-in'
        };
      case 'upcoming':
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
          dot: 'bg-indigo-500',
          icon: 'pending_actions',
          label: attendance.label || 'Shift Upcoming',
          subtext: attendance.shift_start ? `Starts ${attendance.shift_start}` : ''
        };
      case 'holiday':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
          dot: 'bg-purple-500',
          icon: 'beach_access',
          label: attendance.label || 'Approved Leave',
          subtext: ''
        };
      case 'day_off':
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-400',
          icon: 'weekend',
          label: attendance.label || 'Day Off',
          subtext: ''
        };
      default:
        return {
          bg: 'bg-muted border-border text-muted-foreground',
          dot: 'bg-muted-foreground',
          icon: 'info',
          label: attendance.label || 'Not Specified',
          subtext: ''
        };
    }
  };

  if (isLeaderSalesRole(user?.role) || isSalesRole(user?.role)) {
    const activeProject = getActiveSalesProject();
    if (activeProject?.id) {
      return <Navigate to={`/admin/sales-projects/${activeProject.id}/dashboard`} replace />;
    }
    return <Navigate to="/admin/sales-projects" replace />;
  }

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

          <div className="p-4 sm:p-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 lg:gap-6">
                {leaderboardList.map((usr, index) => {
                  const attBadge = getAttendanceBadge(usr.today_attendance);
                  const tasksStats = usr.tasks_stats || { pending: 0, inprogress: 0, done: 0, approve: 0, edit: 0, total: 0 };
                  const hasWhatsApp = Boolean(
                    usr.whatsapp && 
                    String(usr.whatsapp).trim() !== '' && 
                    String(usr.whatsapp).toLowerCase() !== 'null' && 
                    String(usr.whatsapp).toLowerCase() !== 'undefined'
                  );
                  const rawWhatsApp = hasWhatsApp ? String(usr.whatsapp).trim() : null;

                  return (
                    <div 
                      key={usr.id} 
                      className={`relative bg-card rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between p-4 sm:p-5 md:p-6 overflow-hidden group ${
                        index === 0 
                          ? 'border-amber-400/50 shadow-amber-500/10 bg-gradient-to-b from-amber-500/[0.08] via-card to-card hover:border-amber-400' 
                          : index === 1 
                          ? 'border-slate-300 dark:border-slate-700 shadow-slate-500/10 bg-gradient-to-b from-slate-400/[0.08] via-card to-card hover:border-slate-400' 
                          : index === 2 
                          ? 'border-amber-600/40 shadow-amber-600/10 bg-gradient-to-b from-amber-600/[0.08] via-card to-card hover:border-amber-600' 
                          : 'border-border/80 hover:border-primary/40 bg-card hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Top Row: Rank Badge & Points Pill */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          {/* Rank Badge */}
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                            index === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30 ring-2 ring-amber-400/30' :
                            index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-400/30 ring-2 ring-slate-300/30' :
                            index === 2 ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-orange-500/30 ring-2 ring-orange-400/30' :
                            'bg-muted text-muted-foreground border border-border/80'
                          }`}>
                            <span className="material-symbols-outlined text-[15px]">
                              {index === 0 ? 'emoji_events' : index < 3 ? 'military_tech' : 'tag'}
                            </span>
                            <span>Rank #{index + 1}</span>
                          </div>

                          {/* Points Pill */}
                          <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs shadow-2xs shrink-0">
                            <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
                            <span className="font-black text-sm">{usr.total_points}</span>
                            <span className="text-[10px] font-bold text-primary/70 uppercase">PTS</span>
                          </div>
                        </div>

                        {/* User Identity Section: Avatar & Details */}
                        <div className="flex items-center gap-3 sm:gap-3.5 mb-3.5 min-w-0">
                          <div className="relative shrink-0">
                            {usr.image ? (
                              <img 
                                src={usr.image} 
                                alt={usr.name} 
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                                  index === 0 ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-card' :
                                  index === 1 ? 'ring-2 ring-slate-300 dark:ring-slate-600 ring-offset-2 ring-offset-card' :
                                  index === 2 ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-card' :
                                  'ring-2 ring-border ring-offset-2 ring-offset-card'
                                }`} 
                              />
                            ) : (
                              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shadow-sm transition-transform duration-300 group-hover:scale-105 ${
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
                              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center" title="1st Place">
                                <span className="material-symbols-outlined text-[13px]">emoji_events</span>
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors" title={usr.name}>
                              {usr.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {usr.role && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/80 truncate">
                                  {getRoleName(usr.role) || usr.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Today Attendance Status Badge */}
                        {attBadge && (
                          <div className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-semibold mb-3 ${attBadge.bg}`}>
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${attBadge.dot}`}></span>
                              <span className="material-symbols-outlined text-[16px] shrink-0">{attBadge.icon}</span>
                              <span className="truncate font-semibold text-[11px] sm:text-xs">{attBadge.label}</span>
                            </div>
                            {attBadge.subtext && (
                              <span className="text-[10px] sm:text-[11px] font-medium opacity-90 shrink-0 bg-background/60 dark:bg-black/20 px-2 py-0.5 rounded-md border border-current/10 whitespace-nowrap">
                                {attBadge.subtext}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tasks Pipeline Breakdown */}
                        <div className="w-full bg-muted/30 rounded-2xl p-2.5 sm:p-3 border border-border/60 mb-3">
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2 px-0.5">
                            <span className="flex items-center gap-1.5 text-foreground font-bold text-[11px] sm:text-xs">
                              <span className="material-symbols-outlined text-[15px] text-primary">splitscreen</span>
                              Task Pipeline
                            </span>
                            <span className="bg-background px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border border-border/70 text-muted-foreground">
                              {tasksStats.total} Total
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 text-center">
                            {/* Pending */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg sm:rounded-xl py-1 sm:py-1.5 px-0.5" title="Pending tasks">
                              <span className="block text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-semibold truncate">Pending</span>
                              <span className="block text-xs sm:text-sm font-black text-amber-800 dark:text-amber-300 mt-0.5">{tasksStats.pending}</span>
                            </div>
                            {/* In Progress */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl py-1 sm:py-1.5 px-0.5" title="In progress tasks">
                              <span className="block text-[9px] sm:text-[10px] text-blue-700 dark:text-blue-400 font-semibold truncate">Active</span>
                              <span className="block text-xs sm:text-sm font-black text-blue-800 dark:text-blue-300 mt-0.5">{tasksStats.inprogress}</span>
                            </div>
                            {/* Done */}
                            <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg sm:rounded-xl py-1 sm:py-1.5 px-0.5" title="Completed tasks">
                              <span className="block text-[9px] sm:text-[10px] text-teal-700 dark:text-teal-400 font-semibold truncate">Done</span>
                              <span className="block text-xs sm:text-sm font-black text-teal-800 dark:text-teal-300 mt-0.5">{tasksStats.done}</span>
                            </div>
                            {/* Approved */}
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg sm:rounded-xl py-1 sm:py-1.5 px-0.5" title="Approved tasks">
                              <span className="block text-[9px] sm:text-[10px] text-purple-700 dark:text-purple-400 font-semibold truncate">Approved</span>
                              <span className="block text-xs sm:text-sm font-black text-purple-800 dark:text-purple-300 mt-0.5">{tasksStats.approve}</span>
                            </div>
                            {/* Revision */}
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg sm:rounded-xl py-1 sm:py-1.5 px-0.5" title="Tasks needing revision">
                              <span className="block text-[9px] sm:text-[10px] text-rose-700 dark:text-rose-400 font-semibold truncate">Revision</span>
                              <span className="block text-xs sm:text-sm font-black text-rose-800 dark:text-rose-300 mt-0.5">{tasksStats.edit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Info Section: Phone & WhatsApp */}
                        <div className="w-full flex items-center gap-2 mb-3">
                          {/* Phone Button */}
                          {usr.phone ? (
                            <button
                              type="button"
                              onClick={(e) => handleCopyPhone(e, usr.id, usr.phone)}
                              className="flex-1 min-w-0 flex items-center justify-between px-2.5 sm:px-3 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted/70 text-xs text-foreground transition-all group/btn cursor-pointer shadow-2xs hover:border-primary/40"
                              title="Click to copy phone number"
                            >
                              <span className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="material-symbols-outlined text-[15px] text-muted-foreground group-hover/btn:text-primary transition-colors shrink-0">call</span>
                                <span className="font-mono text-[11px] sm:text-xs font-semibold text-foreground truncate" dir="ltr">{usr.phone}</span>
                              </span>
                              {copiedId === usr.id ? (
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md shrink-0 ml-1">
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                  <span className="hidden sm:inline">Copied</span>
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-[14px] text-muted-foreground/60 group-hover/btn:text-foreground transition-colors shrink-0 ml-1">content_copy</span>
                              )}
                            </button>
                          ) : (
                            <div className="flex-1 px-2.5 py-2 rounded-xl bg-muted/40 text-[11px] text-muted-foreground text-center font-medium">
                              No phone
                            </div>
                          )}

                          {/* WhatsApp Button - Strictly from key whatsapp */}
                          {hasWhatsApp && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenWhatsApp(e, rawWhatsApp)}
                              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                              title={`Open WhatsApp: ${rawWhatsApp}`}
                            >
                              <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">chat</span>
                              <span className="text-[11px] sm:text-xs">WhatsApp</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Action Bar matching https://taskito.wegostation.com/admin/users */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 select-none">
                          <span className="material-symbols-outlined text-[15px]">shield_person</span>
                          <span>Actions</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => { setAttendanceUserId(usr.id); setAttendanceUserName(usr.name); }} 
                            className="p-2 text-muted-foreground hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-teal-200/40" 
                            title="View Attendance Report"
                          >
                            <span className="material-symbols-outlined text-[19px]">calendar_month</span>
                          </button>

                          <button 
                            onClick={() => { setPointsUserId(usr.id); setPointsUserName(usr.name); }} 
                            className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-purple-200/40" 
                            title="View Points History"
                          >
                            <span className="material-symbols-outlined text-[19px]">analytics</span>
                          </button>

                          <button 
                            onClick={() => navigate(`/admin/tasks/all?user_id=${usr.id}`)} 
                            className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-200/40" 
                            title="View Assigned Tasks"
                          >
                            <span className="material-symbols-outlined text-[19px]">task</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
