import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { isAuthenticated } from '@/utils/auth';
import { LoginPage } from '@/components/LoginPage';

// Visits Pages (existing & working)
import Visits from '@/Pages/Visits/Visits';
import VisitsAdd from '@/Pages/Visits/VisitsAdd';

// Admin Pages
import Dashboard from '@/Pages/Admin/Dashboard';
import Projects from '@/Pages/Admin/Projects';
import ProjectDetails from '@/Pages/Admin/ProjectDetails';
import Tasks from '@/Pages/Admin/Tasks';

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
    if (role !== 'admin') {
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
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } catch { /* fallback to visits */ }
  return <Navigate to="/visits" replace />;
};

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
      { path: 'projects/:id/tasks', element: <Tasks /> },
      // Users & Settings placeholder - redirect to dashboard for now
      { path: 'users', element: <Dashboard /> },
      { path: 'settings', element: <Dashboard /> },
    ],
  },

  // Main App Routes (existing layout for non-admin roles)
  {
    path: '/',
    element: (<ProtectedRoute><MainLayout /></ProtectedRoute>),
    children: [
      { index: true, element: <SmartRedirect /> },
      { path: 'home', element: <SmartRedirect /> },

      // visits
      { path: 'visits', element: <Visits /> },
      { path: 'visits/add', element: <VisitsAdd /> },
      { path: 'visits/edit/:id', element: <VisitsAdd /> },
    ],
  },

  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);