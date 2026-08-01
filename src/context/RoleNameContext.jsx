import React, { createContext, useContext } from 'react';
import { useGet } from '@/hooks/useGet';

const RoleNameContext = createContext();

export const RoleNameProvider = ({ children }) => {
  const { data, loading } = useGet('/api/admin/dashboard/usersName');

  // fallback defaults in case API fails or returns empty
  const roleNames = {
    user: data?.user || 'Engineer',
    leader: data?.leader || 'Tester',
    admin: data?.admin || 'Admin',
  };

  const getRoleName = (backendRole) => {
    switch (backendRole?.toLowerCase()) {
      case 'engineer':
        return roleNames.user;
      case 'tester':
        return roleNames.leader;
      case 'admin':
        return roleNames.admin;
      default:
        return backendRole; // fallback to whatever was passed
    }
  };

  const getRoleNamePlural = (backendRole) => {
    return getRoleName(backendRole) + 's';
  };

  return (
    <RoleNameContext.Provider value={{ roleNames, getRoleName, getRoleNamePlural, loading }}>
      {children}
    </RoleNameContext.Provider>
  );
};

export const useRoleNames = () => {
  const context = useContext(RoleNameContext);
  if (context === undefined) {
    throw new Error('useRoleNames must be used within a RoleNameProvider');
  }
  return context;
};
