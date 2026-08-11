import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '@/utils/auth';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useRoleNames } from '@/context/RoleNameContext';
import { useMutation } from '@/hooks/useMutation';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { getRoleNamePlural } = useRoleNames();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData?.name || 'Admin User';
  const userRole = userData?.role || 'Admin';
  const [isHrmOpen, setIsHrmOpen] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);

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
          if (item.adminOnly && userRole !== 'admin') return false;
          if (item.notAdmin && userRole === 'admin') return false;
          return true;
        })
        .map((item) => {
          if (item.subItems) {
            let isOpen = false;
            if (item.name === 'HRM') isOpen = isHrmOpen;
            else if (item.name === 'Applications') isOpen = isApplicationsOpen;
            else if (item.name === 'Company') isOpen = isCompanyOpen;

            const toggleOpen = () => {
              if (item.name === 'HRM') setIsHrmOpen(!isHrmOpen);
              else if (item.name === 'Applications') setIsApplicationsOpen(!isApplicationsOpen);
              else if (item.name === 'Company') setIsCompanyOpen(!isCompanyOpen);
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
                  <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="pl-6 pr-4 flex flex-col gap-1 overflow-hidden transition-all duration-300">
                    {item.subItems.map(sub => (
                      <NavLink
                        key={sub.name}
                        to={sub.path}
                        className={({ isActive }) =>
                          `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''} text-sm py-2 px-3 rounded-lg flex items-center gap-3 hover:text-foreground`
                        }
                      >
                        <span className="material-symbols-outlined text-[18px]">{sub.icon}</span>
                        <span>{sub.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="admin-sidebar__link-text">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar__footer">
        <div className="mb-4">
          <ThemeSwitcher />
        </div>
        <button
          onClick={handleLogout}
          className="admin-sidebar__link"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="admin-sidebar__link-text">Logout</span>
        </button>

        <div className="admin-sidebar__user">
          <div className="admin-sidebar__avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="admin-sidebar__user-info">
            <span className="admin-sidebar__user-name">{userName}</span>
            <span className="admin-sidebar__user-role">{userRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
