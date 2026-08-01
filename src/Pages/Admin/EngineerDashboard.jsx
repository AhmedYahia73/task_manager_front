import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { Loader2, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useRoleNames } from '@/context/RoleNameContext';

const CircularProgress = ({ value, total, colorClass, label }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? (value / total) * 100 : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted/30"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-lg font-bold text-foreground leading-none">{Math.round(percent)}%</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-full">{value} / {total}</span>
    </div>
  );
};

const EngineerDashboard = () => {
  const { getRoleNamePlural } = useRoleNames();
  const { data, loading } = useGet('/api/admin/dashboard');
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen relative text-foreground">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black font-['Plus_Jakarta_Sans'] bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent pb-1">
          My Workspace
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Welcome back! Here's your task overview.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* My Pending Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/pending')}
            className="group relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border/50 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 flex items-start gap-4 mb-6">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3.5 rounded-xl text-amber-700 shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Tasks</h3>
                <p className="text-4xl font-black font-['Plus_Jakarta_Sans'] mt-1 text-foreground">{data?.pending_tasks ?? 0}</p>
              </div>
            </div>
            <div className="relative z-10 bg-amber-500/10 text-amber-700 text-sm py-2 px-4 rounded-lg font-medium flex items-center justify-between">
              View Tasks <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>

          {/* My Delay Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/delay')}
            className="group relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border/50 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 flex items-start gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-3.5 rounded-xl text-red-700 shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Delayed Tasks</h3>
                <p className="text-4xl font-black font-['Plus_Jakarta_Sans'] mt-1 text-foreground">{data?.delay_tasks ?? 0}</p>
              </div>
            </div>
            <div className="relative z-10 bg-red-500/10 text-red-700 text-sm py-2 px-4 rounded-lg font-medium flex items-center justify-between">
              Action Required <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>

          {/* My Progress */}
          <div 
            className="group relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border/50 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="relative z-10 flex items-start gap-4 mb-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/30 p-3.5 rounded-xl text-primary shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">My Progress</h3>
                <p className="text-sm text-muted-foreground mt-1">Completed tasks ratio</p>
              </div>
            </div>
            <div className="relative z-10 flex justify-center items-end py-2">
              <CircularProgress 
                value={data?.done_tasks ?? 0} 
                total={data?.total_tasks ?? 0} 
                colorClass="stroke-primary" 
                label="Done Tasks" 
              />
            </div>
          </div>
          
          {/* Team Members */}
          <div 
            className="col-span-1 md:col-span-2 lg:col-span-3 group relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border/50 flex items-center gap-6 overflow-hidden cursor-default transition-all duration-300"
          >
             <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-4 rounded-xl text-indigo-700 shadow-inner">
                <Users className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Team Members</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-foreground">{data?.engineers_count ?? 0}</p>
                  <span className="text-muted-foreground text-sm font-medium capitalize">{getRoleNamePlural('engineer')} in system</span>
                </div>
              </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default EngineerDashboard;
