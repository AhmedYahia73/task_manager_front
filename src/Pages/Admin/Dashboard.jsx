import React from 'react';
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
  const navigate = useNavigate();

  if (user?.role === 'engineer') {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pending Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/pending')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-[#684000] flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="bg-muted p-3 rounded-lg text-[#684000]">
              <span className="material-symbols-outlined text-3xl">assignment_late</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
              <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.pending_tasks ?? 0}</p>
            </div>
          </div>

          {/* Active Projects */}
          <div 
            onClick={() => navigate('/admin/projects')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-var(--primary) flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="bg-muted p-3 rounded-lg text-primary">
              <span className="material-symbols-outlined text-3xl">rocket_launch</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Projects</h3>
              <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.all_projects ?? 0}</p>
            </div>
          </div>

          {/* Delay Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/delay')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-[#ba1a1a] flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="bg-[#fef2f2] p-3 rounded-lg text-[#ba1a1a]">
              <span className="material-symbols-outlined text-3xl">alarm</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Delay Tasks</h3>
              <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.delay_tasks ?? 0}</p>
            </div>
          </div>

          {/* Engineers & Progress */}
          <div 
            onClick={() => navigate('/admin/users?role=engineer')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-muted p-3 rounded-lg text-primary">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground capitalize">{getRoleNamePlural('engineer')}</h3>
                <p className="text-3xl font-bold font-['Plus_Jakarta_Sans'] mt-1">{data?.engineers_count ?? 0}</p>
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

        </div>
      )}
    </div>
  );
};

export default Dashboard;
