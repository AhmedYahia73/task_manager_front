import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { isAuthenticated, removeAuthToken, isValidRole } from '@/utils/auth';
import { LoginPage } from '@/components/LoginPage';

// Removed Visits Pages since they are from the old template

import Dashboard from '@/Pages/Admin/Dashboard';
import Projects from '@/Pages/Admin/Projects';
import ProjectDetails from '@/Pages/Admin/ProjectDetails';
import Tasks from '@/Pages/Admin/Tasks';
import Admins from '@/Pages/Admin/Admins';
import Users from '@/Pages/Admin/Users';
import EmployeeLive from '@/Pages/Admin/EmployeeLive';
import { Settings } from '@/Pages/Admin/Settings';
import HolidayRequests from '@/Pages/Admin/HRM/HolidayRequests';
import OnlineRequests from '@/Pages/Admin/HRM/OnlineRequests';
import Attendance from '@/Pages/Admin/HRM/Attendance';
import HolidaysSystem from '@/Pages/Admin/HRM/HolidaysSystem';
import Permissions from '@/Pages/Admin/HRM/Permissions';
import MyHRM from '@/Pages/Admin/MyHRM';
import Zones from '@/Pages/Admin/Zones';
import Departments from '@/Pages/Admin/Departments';
import CompanySettings from '@/Pages/Admin/CompanySettings';
import Shifts from '@/Pages/Admin/Shifts';
import Salaries from '@/Pages/Admin/Salaries';
import Payroll from '@/Pages/Admin/HRM/Payroll';
import Bonuses from '@/Pages/Admin/HRM/Bonuses';
import Deductions from '@/Pages/Admin/HRM/Deductions';

import Cities from '@/Pages/Admin/Applications/Cities';
import Jobs from '@/Pages/Admin/Applications/Jobs';
import Qualifications from '@/Pages/Admin/Applications/Qualifications';
import ApplicationsList from '@/Pages/Admin/Applications/ApplicationsList';
import SalesProjects from '@/Pages/Admin/SalesProjects';


// Admin Route Wrapper - checks role
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  // Check valid system role
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!isValidRole(user?.role)) {
      removeAuthToken();
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  } catch {
    removeAuthToken();
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Smart redirect: authenticated users go to /admin/dashboard, otherwise /login
const SmartRedirect = () => {
  if (isAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

const NotFoundRedirect = () => {
  if (isAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

// Import FilteredTasks and TaskDetails
import FilteredTasks from '@/Pages/Admin/FilteredTasks';
import TaskDetails from '@/Pages/Admin/TaskDetails';

import Careers from '@/Pages/Public/Careers';
import Apply from '@/Pages/Public/Apply';

// Router Configuration
export const router = createBrowserRouter([
  {
    path: '/careers',
    element: <Careers />,
  },
  {
    path: '/careers/apply',
    element: <Apply />,
  },
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
      { path: 'sales-projects', element: <SalesProjects /> },
      { path: 'projects/:id', element: <ProjectDetails /> },
      { path: 'projects/:projectId/groups/:groupId/tasks', element: <Tasks /> },
      { path: 'projects/:projectId/groups/:groupId/tasks/:taskId', element: <TaskDetails /> },
      { path: 'tasks/detail/:taskId', element: <TaskDetails /> },
      { path: 'tasks/:taskId/view', element: <TaskDetails /> },
      { path: 'tasks/:type', element: <FilteredTasks /> },
      { path: 'admins', element: <Admins /> },
      { path: 'users', element: <Users /> },
      { path: 'employee-live', element: <EmployeeLive /> },
      { path: 'zones', element: <Zones /> },
      { path: 'departments', element: <Departments /> },
      { path: 'company-settings', element: <CompanySettings /> },
      { path: 'shifts', element: <Shifts /> },
      { path: 'salaries', element: <Salaries /> },
      { path: 'payroll', element: <Payroll /> },
      { path: 'bonuses', element: <Bonuses /> },
      { path: 'deductions', element: <Deductions /> },
      { path: 'settings', element: <Settings /> },
      { path: 'holiday-requests', element: <HolidayRequests /> },
      { path: 'online-requests', element: <OnlineRequests /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'holidays-system', element: <HolidaysSystem /> },
      { path: 'permissions', element: <Permissions /> },
      { path: 'my-hrm', element: <MyHRM /> },
      { path: 'cities', element: <Cities /> },
      { path: 'jobs', element: <Jobs /> },
      { path: 'qualifications', element: <Qualifications /> },
      { path: 'applications', element: <ApplicationsList /> },
    ],
  },

  {
    path: '/',
    element: <SmartRedirect />,
  },
  {
    path: '/home',
    element: <SmartRedirect />,
  },

  {
    path: '*',
    element: <NotFoundRedirect />,
  },
]);