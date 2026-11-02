import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGet } from '@/hooks/useGet';
import { isAuthenticated } from '@/utils/auth';

const RoleNameContext = createContext();

export const RoleNameProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(() => isAuthenticated());

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuth(isAuthenticated());
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('user-profile-updated', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('user-profile-updated', handleAuthChange);
    };
  }, []);

  const { data, loading } = useGet(isAuth ? '/api/admin/dashboard/usersName' : null);

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
      case 'leader_sales':
        return 'Sales Leader';
      case 'sales':
        return 'Sales Rep';
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
        case 'leader_sales':
          return 'Sales Leader';
        case 'sales':
          return 'Sales Rep';
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
