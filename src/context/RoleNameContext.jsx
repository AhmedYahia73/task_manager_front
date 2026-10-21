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
      case 'leader':
      case 'project_leader':
        return roleNames.leader;
      case 'admin':
      case 'super_admin':
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
  if (!context) {
    const defaultRoleNames = {
      user: 'Engineer',
      leader: 'Tester',
      admin: 'Admin',
    };
    const getRoleName = (backendRole) => {
      switch (backendRole?.toLowerCase()) {
        case 'engineer':
          return defaultRoleNames.user;
        case 'tester':
        case 'leader':
        case 'project_leader':
          return defaultRoleNames.leader;
        case 'admin':
        case 'super_admin':
          return defaultRoleNames.admin;
        default:
          return backendRole || '';
      }
    };
    return {
      roleNames: defaultRoleNames,
      getRoleName,
      getRoleNamePlural: (backendRole) => getRoleName(backendRole) + 's',
      loading: false,
    };
  }
  return context;
};
