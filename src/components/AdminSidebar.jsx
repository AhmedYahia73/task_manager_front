import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '@/utils/auth';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
  { name: 'Projects', path: '/admin/projects', icon: 'folder_copy' },
  { name: 'Users', path: '/admin/users', icon: 'group' },
  { name: 'Settings', path: '/admin/settings', icon: 'settings' },
];

export const AdminSidebar = () => {
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
        <h1 className="admin-sidebar__title">TaskFlow Pro</h1>
        <p className="admin-sidebar__subtitle">Enterprise Admin</p>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav">
        {navItems.map((item) => (
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
