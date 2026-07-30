import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '@/utils/auth';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useRoleNames } from '@/context/RoleNameContext';

export const AdminSidebar = () => {
  const { getRoleNamePlural } = useRoleNames();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData?.name || 'Admin User';
  const userRole = userData?.role || 'Admin';

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="admin-sidebar__brand">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Taskito Logo" className="w-8 h-8 object-contain" />
          <h1 className="admin-sidebar__title">Taskito</h1>
        </div>
        <p className="admin-sidebar__subtitle">Enterprise Admin</p>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav">
        {[
          { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
          { name: 'Projects', path: '/admin/projects', icon: 'folder_copy' },
          { name: 'Admins', path: '/admin/admins', icon: 'admin_panel_settings', adminOnly: true },
          { name: getRoleNamePlural('engineer') + ' & ' + getRoleNamePlural('tester'), path: '/admin/users', icon: 'group', adminOnly: true },
          { name: 'Settings', path: '/admin/settings', icon: 'settings', adminOnly: true },
        ]
        .filter(item => !item.adminOnly || userRole === 'admin')
        .map((item) => (
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
        ))}
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
