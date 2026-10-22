import React from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { isAuthenticated, removeAuthToken, isValidRole, isAdminRole, isSalesRole } from '@/utils/auth';
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
import SalesAdmins from '@/Pages/Admin/Sales/SalesAdmins';
import SalesLeaders from '@/Pages/Admin/Sales/SalesLeaders';
import SalesReps from '@/Pages/Admin/Sales/SalesReps';
import SalesDeals from '@/Pages/Admin/Sales/SalesDeals';
import SalesDashboard from '@/Pages/Admin/Sales/SalesDashboard';
import Visits from '@/Pages/Admin/Sales/Visits/Visits';
import VisitsAdd from '@/Pages/Admin/Sales/Visits/VisitsAdd';
import Leads from '@/Pages/Admin/Sales/Leads/Leads';
import LeadsAdd from '@/Pages/Admin/Sales/Leads/LeadsAdd';
import Products from '@/Pages/Admin/Sales/Products/Products';
import ProductsAdd from '@/Pages/Admin/Sales/Products/ProductsAdd';
import Target from '@/Pages/Admin/Sales/Target/Target';
import TargetAdd from '@/Pages/Admin/Sales/Target/TargetAdd';
import WishList from '@/Pages/Admin/Sales/WishList/WishList';
import WishListAdd from '@/Pages/Admin/Sales/WishList/WishListAdd';
import PendingRequests from '@/Pages/Admin/Sales/StatusRequests/Requests';
import HistoryRequests from '@/Pages/Admin/Sales/StatusRequests/HistoryRequests';
import VisitStatus from '@/Pages/Admin/Sales/VisitStatus/VisitStatus';
import VisitStatusAdd from '@/Pages/Admin/Sales/VisitStatus/VisitStatusAdd';


import { SalesProjectWorkspaceLayout } from '@/layouts/SalesProjectWorkspaceLayout';
import { getActiveSalesProjectId } from '@/utils/salesProject';

// Smart guard for legacy/direct sales URLs:
// If a sales project is active in storage, redirect to that project's subpath.
// Otherwise, redirect to /admin/sales-projects (forces selecting a project first).
const RequireActiveSalesProject = ({ subpath: defaultSubpath }) => {
  const location = useLocation();
  const activeProjectId = getActiveSalesProjectId();
  if (!activeProjectId) {
    return <Navigate to="/admin/sales-projects" replace />;
  }
  let subpath = defaultSubpath;
  if (!subpath) {
    subpath = location.pathname.replace(/^\/(admin\/)?/, '');
    subpath = subpath.replace(/^sales\//, '');
  }
  if (!subpath || subpath === 'sales') subpath = 'dashboard';
  return <Navigate to={`/admin/sales-projects/${activeProjectId}/${subpath}`} replace />;
};

// Strict guard for admin-only modules within a sales workspace (Products, Target, Visit Status, Leaders)
const AdminOnlySalesWorkspaceRoute = ({ children }) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!isAdminRole(user?.role)) {
      return <Navigate to="dashboard" replace />;
    }
  } catch {
    return <Navigate to="dashboard" replace />;
  }
  return children;
};

// Strict guard: Leads Add is for Leader and Admin only (sales cannot add leads)
const LeaderOrAdminOnlyRoute = ({ children, fallback = "../leads" }) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (isSalesRole(user?.role)) {
      return <Navigate to={fallback} replace />;
    }
  } catch {
    return <Navigate to={fallback} replace />;
  }
  return children;
};

// General dashboard guard: sales users are redirected to their sales project workspace
const GeneralDashboardRoute = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (isSalesRole(user?.role)) {
      const activeProjectId = getActiveSalesProjectId();
      return <Navigate to={activeProjectId ? `/admin/sales-projects/${activeProjectId}/dashboard` : '/admin/sales-projects'} replace />;
    }
  } catch {}
  return <Dashboard />;
};

// HRM route guard: sales users cannot access HRM modules
const NonSalesMyHRMRoute = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (isSalesRole(user?.role)) {
      const activeProjectId = getActiveSalesProjectId();
      return <Navigate to={activeProjectId ? `/admin/sales-projects/${activeProjectId}/dashboard` : '/admin/sales-projects'} replace />;
    }
  } catch {}
  return <MyHRM />;
};

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

// Smart redirect: authenticated sales go to sales project, others to /admin/dashboard, otherwise /login
const SmartRedirect = () => {
  if (isAuthenticated()) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (isSalesRole(user?.role)) {
        const activeProjectId = getActiveSalesProjectId();
        return <Navigate to={activeProjectId ? `/admin/sales-projects/${activeProjectId}/dashboard` : '/admin/sales-projects'} replace />;
      }
    } catch {}
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

const NotFoundRedirect = () => {
  if (isAuthenticated()) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (isSalesRole(user?.role)) {
        const activeProjectId = getActiveSalesProjectId();
        return <Navigate to={activeProjectId ? `/admin/sales-projects/${activeProjectId}/dashboard` : '/admin/sales-projects'} replace />;
      }
    } catch {}
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
      { index: true, element: <SmartRedirect /> },
      { path: 'dashboard', element: <GeneralDashboardRoute /> },
      { path: 'projects', element: <Projects /> },
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
      { path: 'my-hrm', element: <NonSalesMyHRMRoute /> },
      { path: 'cities', element: <Cities /> },
      { path: 'jobs', element: <Jobs /> },
      { path: 'qualifications', element: <Qualifications /> },
      { path: 'applications', element: <ApplicationsList /> },
      // Main Sales Projects Directory
      { path: 'sales-projects', element: <SalesProjects /> },

      // Scoped Sales Project Workspace Layout
      {
        path: 'sales-projects/:projectId',
        element: <SalesProjectWorkspaceLayout />,
        children: [
          { index: true, element: <SalesDashboard /> },
          { path: 'dashboard', element: <SalesDashboard /> },
          { path: 'visits', element: <Visits /> },
          { path: 'visits/add', element: <VisitsAdd /> },
          { path: 'visits/:id/edit', element: <VisitsAdd /> },
          { path: 'leads', element: <Leads /> },
          { path: 'leads/add', element: <LeaderOrAdminOnlyRoute><LeadsAdd /></LeaderOrAdminOnlyRoute> },
          { path: 'leads/:id/edit', element: <LeaderOrAdminOnlyRoute><LeadsAdd /></LeaderOrAdminOnlyRoute> },
          { path: 'products', element: <AdminOnlySalesWorkspaceRoute><Products /></AdminOnlySalesWorkspaceRoute> },
          { path: 'products/add', element: <AdminOnlySalesWorkspaceRoute><ProductsAdd /></AdminOnlySalesWorkspaceRoute> },
          { path: 'products/:id/edit', element: <AdminOnlySalesWorkspaceRoute><ProductsAdd /></AdminOnlySalesWorkspaceRoute> },
          { path: 'target', element: <AdminOnlySalesWorkspaceRoute><Target /></AdminOnlySalesWorkspaceRoute> },
          { path: 'target/add', element: <AdminOnlySalesWorkspaceRoute><TargetAdd /></AdminOnlySalesWorkspaceRoute> },
          { path: 'target/:id/edit', element: <AdminOnlySalesWorkspaceRoute><TargetAdd /></AdminOnlySalesWorkspaceRoute> },
          { path: 'wishlist', element: <WishList /> },
          { path: 'wishlist/add', element: <WishListAdd /> },
          { path: 'wishlist/:id/edit', element: <WishListAdd /> },
          { path: 'requests', element: <PendingRequests /> },
          { path: 'history-requests', element: <HistoryRequests /> },
          { path: 'visitstatus', element: <AdminOnlySalesWorkspaceRoute><VisitStatus /></AdminOnlySalesWorkspaceRoute> },
          { path: 'visitstatus/add', element: <AdminOnlySalesWorkspaceRoute><VisitStatusAdd /></AdminOnlySalesWorkspaceRoute> },
          { path: 'visitstatus/:id/edit', element: <AdminOnlySalesWorkspaceRoute><VisitStatusAdd /></AdminOnlySalesWorkspaceRoute> },
          { path: 'admins', element: <Navigate to="../dashboard" replace /> },
          { path: 'leaders', element: <AdminOnlySalesWorkspaceRoute><SalesLeaders /></AdminOnlySalesWorkspaceRoute> },
          { path: 'sales', element: <SalesReps /> },
          { path: 'sales-reps', element: <SalesReps /> },
          { path: 'deals', element: <SalesDeals /> },
          { path: 'sales-deals', element: <SalesDeals /> },
          { path: '*', element: <Navigate to="dashboard" replace /> },
        ],
      },

      // Strict Guards for legacy/direct sales routes (Forces project selection)
      { path: 'sales/dashboard', element: <RequireActiveSalesProject subpath="dashboard" /> },
      { path: 'sales/visits', element: <RequireActiveSalesProject subpath="visits" /> },
      { path: 'sales/visits/add', element: <RequireActiveSalesProject subpath="visits/add" /> },
      { path: 'sales/visits/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'sales/leads', element: <RequireActiveSalesProject subpath="leads" /> },
      { path: 'sales/leads/add', element: <LeaderOrAdminOnlyRoute fallback="/admin/sales-projects"><RequireActiveSalesProject subpath="leads/add" /></LeaderOrAdminOnlyRoute> },
      { path: 'sales/leads/:id/edit', element: <LeaderOrAdminOnlyRoute fallback="/admin/sales-projects"><RequireActiveSalesProject subpath="leads" /></LeaderOrAdminOnlyRoute> },
      { path: 'sales/products', element: <RequireActiveSalesProject subpath="products" /> },
      { path: 'sales/products/add', element: <RequireActiveSalesProject subpath="products/add" /> },
      { path: 'sales/products/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'sales/target', element: <RequireActiveSalesProject subpath="target" /> },
      { path: 'sales/target/add', element: <RequireActiveSalesProject subpath="target/add" /> },
      { path: 'sales/target/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'sales/wishlist', element: <RequireActiveSalesProject subpath="wishlist" /> },
      { path: 'sales/wishlist/add', element: <RequireActiveSalesProject subpath="wishlist/add" /> },
      { path: 'sales/wishlist/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'sales/requests', element: <RequireActiveSalesProject subpath="requests" /> },
      { path: 'sales/history-requests', element: <RequireActiveSalesProject subpath="history-requests" /> },
      { path: 'sales/visitstatus', element: <RequireActiveSalesProject subpath="visitstatus" /> },
      { path: 'sales/visitstatus/add', element: <RequireActiveSalesProject subpath="visitstatus/add" /> },
      { path: 'sales/visitstatus/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'sales/leaders', element: <RequireActiveSalesProject subpath="leaders" /> },
      { path: 'sales/sales', element: <RequireActiveSalesProject subpath="sales" /> },

      // Direct Aliases with Strict Guards
      { path: 'visits', element: <RequireActiveSalesProject subpath="visits" /> },
      { path: 'visits/add', element: <RequireActiveSalesProject subpath="visits/add" /> },
      { path: 'visits/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'leads', element: <RequireActiveSalesProject subpath="leads" /> },
      { path: 'leads/add', element: <RequireActiveSalesProject subpath="leads/add" /> },
      { path: 'leads/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'products', element: <RequireActiveSalesProject subpath="products" /> },
      { path: 'products/add', element: <RequireActiveSalesProject subpath="products/add" /> },
      { path: 'products/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'target', element: <RequireActiveSalesProject subpath="target" /> },
      { path: 'target/add', element: <RequireActiveSalesProject subpath="target/add" /> },
      { path: 'target/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'wishlist', element: <RequireActiveSalesProject subpath="wishlist" /> },
      { path: 'wishlist/add', element: <RequireActiveSalesProject subpath="wishlist/add" /> },
      { path: 'wishlist/:id/edit', element: <RequireActiveSalesProject /> },
      { path: 'requests', element: <RequireActiveSalesProject subpath="requests" /> },
      { path: 'history-requests', element: <RequireActiveSalesProject subpath="history-requests" /> },
      { path: 'visitstatus', element: <RequireActiveSalesProject subpath="visitstatus" /> },
      { path: 'visitstatus/add', element: <RequireActiveSalesProject subpath="visitstatus/add" /> },
      { path: 'visitstatus/:id/edit', element: <RequireActiveSalesProject /> },
    ],
  },

  // Direct Root Aliases for Sales Modules (in case called without /admin)
  { path: '/visits', element: <RequireActiveSalesProject subpath="visits" /> },
  { path: '/visits/add', element: <RequireActiveSalesProject subpath="visits/add" /> },
  { path: '/visits/:id/edit', element: <RequireActiveSalesProject /> },
  { path: '/leads', element: <RequireActiveSalesProject subpath="leads" /> },
  { path: '/leads/add', element: <RequireActiveSalesProject subpath="leads/add" /> },
  { path: '/leads/:id/edit', element: <RequireActiveSalesProject /> },
  { path: '/products', element: <RequireActiveSalesProject subpath="products" /> },
  { path: '/products/add', element: <RequireActiveSalesProject subpath="products/add" /> },
  { path: '/products/:id/edit', element: <RequireActiveSalesProject /> },
  { path: '/target', element: <RequireActiveSalesProject subpath="target" /> },
  { path: '/target/add', element: <RequireActiveSalesProject subpath="target/add" /> },
  { path: '/target/:id/edit', element: <RequireActiveSalesProject /> },
  { path: '/wishlist', element: <RequireActiveSalesProject subpath="wishlist" /> },
  { path: '/wishlist/add', element: <RequireActiveSalesProject subpath="wishlist/add" /> },
  { path: '/wishlist/:id/edit', element: <RequireActiveSalesProject /> },
  { path: '/requests', element: <RequireActiveSalesProject subpath="requests" /> },
  { path: '/history-requests', element: <RequireActiveSalesProject subpath="history-requests" /> },
  { path: '/visitstatus', element: <RequireActiveSalesProject subpath="visitstatus" /> },
  { path: '/visitstatus/add', element: <RequireActiveSalesProject subpath="visitstatus/add" /> },
  { path: '/visitstatus/:id/edit', element: <RequireActiveSalesProject /> },

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