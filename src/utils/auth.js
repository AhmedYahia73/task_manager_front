import Cookies from 'js-cookie';

const TOKEN_KEY = 'admin_auth_token';

// auth.js
export const setAuthToken = (token) => {
  const isProduction = window.location.protocol === 'https:';
  Cookies.set(TOKEN_KEY, token, { expires: 7, secure: isProduction }); 
};

export const getAuthToken = () => {
  return Cookies.get(TOKEN_KEY);
};

export const removeAuthToken = () => {
  Cookies.remove(TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const normalizeRole = (role) => {
  if (!role) return '';
  return String(role).toLowerCase().trim().replace(/[\s-]/g, '_');
};

export const isAdminRole = (role) => {
  const norm = normalizeRole(role);
  return norm === 'admin' || norm === 'super_admin' || norm === 'superadmin';
};

export const isValidRole = (role) => {
  const norm = normalizeRole(role);
  return (
    norm === 'admin' ||
    norm === 'super_admin' ||
    norm === 'superadmin' ||
    norm === 'engineer' ||
    norm === 'sales' ||
    norm === 'leader_sales' ||
    norm === 'leader' ||
    norm === 'tester'
  );
};

export const isLeaderSalesRole = (role) => {
  const norm = normalizeRole(role);
  return norm === 'leader_sales' || norm === 'leader';
};

export const isSalesRole = (role) => {
  const norm = normalizeRole(role);
  return norm === 'sales';
};

export const isAnySalesRole = (role) => {
  const norm = normalizeRole(role);
  return norm === 'sales' || norm === 'leader_sales' || norm === 'leader';
};

export const isEngineerRole = (role) => {
  const norm = normalizeRole(role);
  return norm === 'engineer' || norm === 'tester';
};

export const canViewEngineering = (role) => {
  const norm = normalizeRole(role);
  return (
    norm === 'admin' ||
    norm === 'super_admin' ||
    norm === 'engineer' ||
    norm === 'tester' ||
    norm === 'leader_sales' ||
    norm === 'leader'
  );
};
