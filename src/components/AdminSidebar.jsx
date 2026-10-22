import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken, isAdminRole, isLeaderSalesRole, isSalesRole, isEngineerRole } from '@/utils/auth';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useRoleNames } from '@/context/RoleNameContext';
import { useMutation } from '@/hooks/useMutation';
import { getActiveSalesProject } from '@/utils/salesProject';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { getRoleNamePlural } = useRoleNames();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData?.name || 'Admin User';
  const userRole = userData?.role || 'Admin';
  const isAdmin = isAdminRole(userRole);
  const isLeader = isLeaderSalesRole(userRole);
  const isSales = isSalesRole(userRole);
  const isEngineer = isEngineerRole(userRole);
  const [isHrmOpen, setIsHrmOpen] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSalesWorkspaceOpen, setIsSalesWorkspaceOpen] = useState(true);
  const activeSalesProject = getActiveSalesProject();

  const { mutate } = useMutation();

  const handleLogout = async () => {
    try {
      await mutate({ method: 'POST', url: '/api/admin/auth/logout' });
    } catch (error) {
      console.error("Logout API failed", error);
    }
    removeAuthToken();
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--mobile-open' : ''}`}>
      {/* Brand */}
      <div className="admin-sidebar__brand">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Taskito Logo" className="w-8 h-8 object-contain" />
            <h1 className="admin-sidebar__title">Taskito</h1>
          </div>
          <button className="md:hidden text-zinc-400 hover:text-white" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="admin-sidebar__subtitle">Enterprise Admin</p>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav">
        {[
          { 
            name: 'Dashboard', 
            path: (isLeader || isSales)
              ? (activeSalesProject?.id ? `/admin/sales-projects/${activeSalesProject.id}/dashboard` : '/admin/sales-projects')
              : '/admin/dashboard', 
            icon: 'dashboard' 
          },
          { name: 'Projects', path: '/admin/projects', icon: 'folder_copy', adminOrEngineer: true },
          { name: 'Sales Projects', path: '/admin/sales-projects', icon: 'storefront', adminOrLeaderOrSales: true },
          { name: 'Admins', path: '/admin/admins', icon: 'admin_panel_settings', adminOnly: true },
          { name: 'My HRM', path: '/admin/my-hrm', icon: 'event_note', notAdmin: true },
          { 
            name: 'HRM', 
            icon: 'manage_accounts', 
            adminOnly: true,
            subItems: [
              { name: 'Holiday Requests', path: '/admin/holiday-requests', icon: 'beach_access' },
              { name: 'Online Requests', path: '/admin/online-requests', icon: 'home_work' },
              { name: 'Employee Live', path: '/admin/employee-live', icon: 'monitor_heart' },
              { name: 'Attendance', path: '/admin/attendance', icon: 'how_to_reg' },
              { name: 'Payroll', path: '/admin/payroll', icon: 'account_balance_wallet' },
              { name: 'Holidays System', path: '/admin/holidays-system', icon: 'event_available' },
              { name: 'Permissions', path: '/admin/permissions', icon: 'verified_user' },
              { name: 'Bonuses', path: '/admin/bonuses', icon: 'payments' },
              { name: 'Deductions', path: '/admin/deductions', icon: 'money_off' },
            ]
          },
          { 
            name: 'Company', 
            icon: 'business', 
            adminOnly: true,
            subItems: [
              { name: 'Business Setup', path: '/admin/company-settings', icon: 'domain' },
              { name: 'Zones', path: '/admin/zones', icon: 'map' },
              { name: 'Departments', path: '/admin/departments', icon: 'apartment' },
              { name: getRoleNamePlural('engineer') + ' & ' + getRoleNamePlural('tester'), path: '/admin/users', icon: 'group' },
            ]
          },
          { name: 'Shifts', path: '/admin/shifts', icon: 'schedule', adminOnly: true },
          { name: 'Salaries', path: '/admin/salaries', icon: 'payments', adminOnly: true },
          { 
            name: 'Applications', 
            icon: 'work', 
            adminOnly: true,
            subItems: [
              { name: 'Applications List', path: '/admin/applications', icon: 'list_alt' },
              { name: 'Jobs', path: '/admin/jobs', icon: 'work_outline' },
              { name: 'Cities', path: '/admin/cities', icon: 'location_city' },
              { name: 'Qualifications', path: '/admin/qualifications', icon: 'school' },
            ]
          },
          { name: 'Settings', path: '/admin/settings', icon: 'settings', adminOnly: true },
        ]
        .filter(item => {
          if (item.adminOnly && !isAdmin) return false;
          if (item.adminOrEngineer && !isAdmin && !isEngineer) return false;
          if (item.adminOrLeaderOrSales && !isAdmin && !isLeader && !isSales) return false;
          if (item.notAdmin && isAdmin) return false;
          return true;
        })
        .map((item) => {
          if (item.subItems) {
            let isOpen = false;
            if (item.name === 'HRM') isOpen = isHrmOpen;
            else if (item.name === 'Applications') isOpen = isApplicationsOpen;
            else if (item.name === 'Company') isOpen = isCompanyOpen;
            else if (item.name === 'Sales') isOpen = isSalesOpen;

            const toggleOpen = () => {
              if (item.name === 'HRM') setIsHrmOpen(!isHrmOpen);
              else if (item.name === 'Applications') setIsApplicationsOpen(!isApplicationsOpen);
              else if (item.name === 'Company') setIsCompanyOpen(!isCompanyOpen);
              else if (item.name === 'Sales') setIsSalesOpen(!isSalesOpen);
            };

            return (
              <div key={item.name}>
                <button
                  onClick={toggleOpen}
                  className={`admin-sidebar__link w-full text-left justify-between ${isOpen ? 'bg-muted/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="admin-sidebar__link-text">{item.name}</span>
                  </div>
                  <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="pl-6 space-y-1 mt-1 border-l-2 border-border ml-4">
                    {item.subItems
                      .filter((subItem) => !subItem.adminOnly || isAdmin)
                      .map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          `admin-sidebar__link text-sm py-2 ${isActive ? 'admin-sidebar__link--active' : ''}`
                        }
                        onClick={onClose}
                      >
                        <span className="material-symbols-outlined text-sm">{subItem.icon}</span>
                        <span className="admin-sidebar__link-text">{subItem.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <React.Fragment key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
                }
                onClick={onClose}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="admin-sidebar__link-text">{item.name}</span>
              </NavLink>
              {item.name === 'Sales Projects' && activeSalesProject?.id && (
                <div className="space-y-1 mb-2">
                  <NavLink
                    to={`/admin/sales-projects/${activeSalesProject.id}/dashboard`}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 mx-3 mb-1 ${
                        isActive ? 'ring-1 ring-primary/40 bg-primary/15' : ''
                      }`
                    }
                    onClick={onClose}
                    title={`Active Project: ${activeSalesProject.name}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {activeSalesProject.logo ? (
                        <img
                          src={activeSalesProject.logo}
                          alt={activeSalesProject.name}
                          className="w-3.5 h-3.5 object-contain rounded bg-background p-0.5"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[14px]">storefront</span>
                      )}
                      <span className="truncate">{activeSalesProject.name}</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </NavLink>

                  {/* Scoped Sales Workspace Modules */}
                  <div className="pl-4 space-y-0.5 ml-4 border-l-2 border-border/70 my-1">
                    {[
                      { name: 'Dashboard', path: `/admin/sales-projects/${activeSalesProject.id}/dashboard`, icon: 'dashboard' },
                      { name: 'Visits', path: `/admin/sales-projects/${activeSalesProject.id}/visits`, icon: 'calendar_month' },
                      { name: 'Sales Deals', path: `/admin/sales-projects/${activeSalesProject.id}/deals`, icon: 'trending_up' },
                      { name: 'Leads', path: `/admin/sales-projects/${activeSalesProject.id}/leads`, icon: 'contacts' },
                      { name: 'Products', path: `/admin/sales-projects/${activeSalesProject.id}/products`, icon: 'inventory_2', adminOnly: true },
                      { name: 'Targets', path: `/admin/sales-projects/${activeSalesProject.id}/target`, icon: 'track_changes', adminOnly: true },
                      { name: 'Wishlist', path: `/admin/sales-projects/${activeSalesProject.id}/wishlist`, icon: 'favorite' },
                      { name: 'Status Requests', path: `/admin/sales-projects/${activeSalesProject.id}/requests`, icon: 'pending_actions', adminOrLeader: true },
                      { name: 'Visit Statuses', path: `/admin/sales-projects/${activeSalesProject.id}/visitstatus`, icon: 'tune', adminOnly: true },
                      { name: 'Sales Leaders', path: `/admin/sales-projects/${activeSalesProject.id}/leaders`, icon: 'supervisor_account', adminOnly: true },
                      { name: 'Sales Reps', path: `/admin/sales-projects/${activeSalesProject.id}/sales`, icon: 'badge', adminOrLeader: true },
                    ]
                      .filter((sub) => {
                        if (isAdmin) return true;
                        if (sub.adminOnly) return false;
                        if (sub.adminOrLeader) return isLeader;
                        return true;
                      })
                      .map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive }) =>
                            `admin-sidebar__link text-xs py-1.5 px-2.5 rounded-lg ${
                              isActive ? 'admin-sidebar__link--active' : ''
                            }`
                          }
                          onClick={onClose}
                        >
                          <span className="material-symbols-outlined text-[16px]">{sub.icon}</span>
                          <span className="admin-sidebar__link-text text-xs">{sub.name}</span>
                        </NavLink>
                      ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="admin-sidebar__footer">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="admin-sidebar__user-name truncate">{userName}</p>
              <p className="admin-sidebar__user-role capitalize">{userRole}</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
        
        <button
          onClick={handleLogout}
          className="admin-sidebar__logout-btn"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
