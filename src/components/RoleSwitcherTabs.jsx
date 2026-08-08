import React from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { setAuthToken } from '@/utils/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const RoleSwitcherTabs = () => {
  const { data: roleNamesData } = useGet('/api/admin/auth/settings/names');
  const { mutate } = useMutation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentRole = user?.role || 'engineer';

  // Only show these tabs if the user is a tester or engineer
  if (currentRole !== 'tester' && currentRole !== 'engineer') {
    return null;
  }

  const handleRoleSwitch = async (newRole) => {
    if (currentRole === newRole) return;
    
    const toastId = toast.loading('Switching workspace...');
    try {
      const res = await mutate({
        method: 'POST',
        url: '/api/admin/auth/switch-role',
        data: { role: newRole }
      });
      
      if (res?.data?.data) {
        const { token, user: newUser } = res.data.data;
        setAuthToken(token);
        localStorage.setItem('user', JSON.stringify(newUser));
        toast.success(`Switched to ${newRole === 'tester' ? (roleNamesData?.leader || 'Leader') : (roleNamesData?.user || 'Employee')} workspace`, { id: toastId });
        window.location.reload();
      } else {
        toast.error('Failed to switch role', { id: toastId });
      }
    } catch (err) {
      toast.error('Error switching role', { id: toastId });
    }
  };

  const tabs = [
    { 
      id: 'engineer', 
      label: roleNamesData?.user || 'Employee', 
      icon: 'engineering',
      colorClass: 'text-primary'
    },
    { 
      id: 'tester', 
      label: roleNamesData?.leader || 'Leader', 
      icon: 'workspace_premium',
      colorClass: 'text-amber-500'
    }
  ];

  return (
    <div className="w-full bg-background/70 backdrop-blur-xl border-b border-border/40 z-30 pt-3 pb-3 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="w-full max-w-md mx-auto">
        <div className="relative flex w-full p-1.5 bg-muted/50 rounded-full border border-border/30 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleRoleSwitch(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-bold transition-colors duration-300 z-10 ${
                currentRole === tab.id ? tab.colorClass : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              {currentRole === tab.id && (
                <motion.div
                  layoutId="activeRoleTabIndicator"
                  className="absolute inset-0 bg-background rounded-full shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] border border-border/50"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                <span className="tracking-wide">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
