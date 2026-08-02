import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { isAuthenticated } from '@/utils/auth';
import { LoginPage } from '@/components/LoginPage';

// Removed Visits Pages since they are from the old template

import Dashboard from '@/Pages/Admin/Dashboard';
import Projects from '@/Pages/Admin/Projects';
import ProjectDetails from '@/Pages/Admin/ProjectDetails';
import Tasks from '@/Pages/Admin/Tasks';
import Admins from '@/Pages/Admin/Admins';
import Users from '@/Pages/Admin/Users';
import { Settings } from '@/Pages/Admin/Settings';
import HolidayRequests from '@/Pages/Admin/HRM/HolidayRequests';
import OnlineRequests from '@/Pages/Admin/HRM/OnlineRequests';
import Attendance from '@/Pages/Admin/HRM/Attendance';
import HolidaysSystem from '@/Pages/Admin/HRM/HolidaysSystem';
import Permissions from '@/Pages/Admin/HRM/Permissions';
import MyHRM from '@/Pages/Admin/MyHRM';
import Zones from '@/Pages/Admin/Zones';
import Shifts from '@/Pages/Admin/Shifts';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Wrapper - checks role
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  // Check admin role
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role?.toLowerCase?.() || '';
    if (role !== 'admin' && role !== 'tester' && role !== 'engineer') {
      return <Navigate to="/home" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Smart redirect based on role
const SmartRedirect = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role?.toLowerCase?.() || '';
    if (role === 'admin' || role === 'tester' || role === 'engineer') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } catch { /* fallback to login */ }
  return <Navigate to="/login" replace />;
};

const NotFoundRedirect = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/" replace />;
};

// Import FilteredTasks
import FilteredTasks from '@/Pages/Admin/FilteredTasks';

// Router Configuration
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Admin Routes (separate layout)
  {
    path: '/admin',
    element: (<AdminRoute><AdminLayout /></AdminRoute>),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:id', element: <ProjectDetails /> },
      { path: 'projects/:projectId/groups/:groupId/tasks', element: <Tasks /> },
      { path: 'tasks/:type', element: <FilteredTasks /> },
      { path: 'admins', element: <Admins /> },
      { path: 'users', element: <Users /> },
      { path: 'zones', element: <Zones /> },
      { path: 'shifts', element: <Shifts /> },
      { path: 'settings', element: <Settings /> },
      { path: 'holiday-requests', element: <HolidayRequests /> },
      { path: 'online-requests', element: <OnlineRequests /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'holidays-system', element: <HolidaysSystem /> },
      { path: 'permissions', element: <Permissions /> },
      { path: 'my-hrm', element: <MyHRM /> },
    ],
  },

  // Main App Routes (existing layout for non-admin roles)
  {
    path: '/',
    element: (<ProtectedRoute><MainLayout /></ProtectedRoute>),
    children: [
      { index: true, element: <SmartRedirect /> },
      { path: 'home', element: <SmartRedirect /> },
    ],
  },

  {
    path: '*',
    element: <NotFoundRedirect />,
  },
]);