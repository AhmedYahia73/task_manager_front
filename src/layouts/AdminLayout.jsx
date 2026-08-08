import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { removeAuthToken } from '@/utils/auth';
import { RoleNameProvider } from '@/context/RoleNameContext';
import { RoleSwitcherTabs } from '@/components/RoleSwitcherTabs';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData?.name || 'Admin';
  const userRole = userData?.role || 'Admin';

  return (
    <RoleNameProvider>
      <div className="admin-shell">
        {/* Sidebar */}
        <AdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Top App Bar */}
        <header className="admin-topbar">
          <button 
            className="admin-topbar__icon-btn md:hidden mr-2" 
            onClick={() => setIsMobileMenuOpen(true)}
            title="Menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
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
        <main className="admin-content flex flex-col h-full overflow-hidden">
          <RoleSwitcherTabs />
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </RoleNameProvider>
  );
};
