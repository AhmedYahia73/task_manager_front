import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { data, loading } = useGet('/api/admin/dashboard');
  const navigate = useNavigate();

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pending Tasks */}
          <div 
            onClick={() => navigate('/admin/tasks/pending')}
            className="bg-card p-6 rounded-xl shadow-sm border border-border border-l-4 border-l-[#684000] flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="bg-muted p-3 rounded-lg text-[#684000]">
              <span className="material-symbols-outlined text-3xl">assignment_late</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Pending Tasks</h3>
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

        </div>
      )}
    </div>
  );
};

export default Dashboard;
