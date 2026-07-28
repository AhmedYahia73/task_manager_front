import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { removeAuthToken } from '@/utils/auth';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData?.name || 'Admin';
  const userRole = userData?.role || 'Admin';

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Top App Bar */}
      <header className="admin-topbar">
        <div className="admin-topbar__search">
          <span className="material-symbols-outlined admin-topbar__search-icon">search</span>
          <input
            type="text"
            className="admin-topbar__search-input"
            placeholder="Search tasks or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-topbar__actions">
          <button className="admin-topbar__icon-btn" title="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="admin-topbar__icon-btn" title="Mail">
            <span className="material-symbols-outlined">mail</span>
          </button>
          <button className="admin-topbar__icon-btn" title="Chat">
            <span className="material-symbols-outlined">chat</span>
          </button>

          <div className="admin-topbar__divider"></div>

          <div className="admin-topbar__user">
            <div className="admin-topbar__user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="admin-topbar__user-info">
              <p className="admin-topbar__user-name">{userName}</p>
              <p className="admin-topbar__user-role">{userRole}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};
