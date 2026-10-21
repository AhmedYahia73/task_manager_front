import React from 'react';
import { useRoleNames } from '@/context/RoleNameContext';

export const ProjectRoleBadge = ({ role, className = '', showLabel = true }) => {
  const { getRoleName } = useRoleNames();
  const normalized = (role || 'engineer').toLowerCase();

  if (normalized === 'leader') {
    return (
      <span 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide transition-all bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm ${className}`}
        title="Your role in this project: Team Leader"
      >
        <span className="material-symbols-outlined text-[15px] text-amber-500 animate-pulse">workspace_premium</span>
        {showLabel && <span>{getRoleName('tester') || 'Leader'}</span>}
      </span>
    );
  }

  if (normalized === 'admin') {
    return (
      <span 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide transition-all bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-sm ${className}`}
        title="Your role: System Administrator"
      >
        <span className="material-symbols-outlined text-[15px] text-purple-500">shield_person</span>
        {showLabel && <span>{getRoleName('admin') || 'Admin'}</span>}
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide transition-all bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm ${className}`}
      title="Your role in this project: Engineer"
    >
      <span className="material-symbols-outlined text-[15px] text-blue-500">engineering</span>
      {showLabel && <span>{getRoleName('engineer') || 'Engineer'}</span>}
    </span>
  );
};

export default ProjectRoleBadge;
