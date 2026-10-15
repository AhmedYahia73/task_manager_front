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
    norm === 'tester' ||
    norm === 'engineer'
  );
};