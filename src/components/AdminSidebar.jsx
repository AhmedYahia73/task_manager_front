import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken, isAdminRole } from '@/utils/auth';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useRoleNames } from '@/context/RoleNameContext';
import { useMutation } from '@/hooks/useMutation';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { getRoleNamePlural } = useRoleNames();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData?.name || 'Admin User';
  const userRole = userData?.role || 'Admin';
  const isAdmin = isAdminRole(userRole);
  const isLeader = userRole?.toLowerCase() === 'leader';
  const isSales = userRole?.toLowerCase() === 'sales';
  const [isHrmOpen, setIsHrmOpen] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);

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
          { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
          { name: 'Projects', path: '/admin/projects', icon: 'folder_copy' },
          { 
            name: 'Sales', 
            icon: 'point_of_sale', 
            adminOrLeaderOrSales: true,
            subItems: [
              { name: 'Sales Projects', path: '/admin/sales-projects', icon: 'storefront' },
              { name: 'Admins', path: '/admin/sales/admins', icon: 'admin_panel_settings', adminOnly: true },
              { name: 'Leaders', path: '/admin/sales/leaders', icon: 'supervisor_account', adminOnly: true },
              { name: 'Sales', path: '/admin/sales/sales', icon: 'badge', adminOnly: true },
            ]
          },
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
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="admin-sidebar__link-text">{item.name}</span>
            </NavLink>
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
