import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { removeAuthToken, isAdminRole } from '@/utils/auth';
import { RoleNameProvider } from '@/context/RoleNameContext';
import { CompanyHeader } from '@/components/CompanyHeader';
import { CompanyFooter } from '@/components/CompanyFooter';
import { NotificationBell } from '@/components/NotificationBell';
import UserRequestsModal from '@/components/UserRequestsModal';
import AttendanceAdminModal from '@/Pages/Admin/HRM/AttendanceAdminModal';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [userData, setUserData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setUserData(e.detail);
      } else {
        try {
          setUserData(JSON.parse(localStorage.getItem('user') || '{}'));
        } catch {}
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  const userName = userData?.name || 'Admin';
  const userRole = userData?.role || 'Admin';
  const userImage = userData?.image;
  const isAdmin = isAdminRole(userRole);

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
            {/* Quick Attendance Button - Only visible for Admin role */}
            {isAdmin && (
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all active:scale-95 shadow-xs cursor-pointer"
                title="Attendance (تسجيل حضور وانصراف)"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span className="hidden sm:inline">Attendance</span>
              </button>
            )}

            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95 shadow-xs"
              title="Submit Request (تقديم طلب)"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              <span className="hidden sm:inline">New Request</span>
            </button>

            <NotificationBell />
            <button className="admin-topbar__icon-btn" title="Mail">
              <span className="material-symbols-outlined">mail</span>
            </button>
            <button className="admin-topbar__icon-btn" title="Chat">
              <span className="material-symbols-outlined">chat</span>
            </button>

            <div className="admin-topbar__divider"></div>

            <button
              onClick={() => navigate('/admin/profile')}
              className="admin-topbar__user text-left cursor-pointer hover:bg-muted/40 transition-colors rounded-xl px-2 py-1 -mr-1"
              title="My Profile"
              type="button"
            >
              <div className="admin-topbar__user-avatar overflow-hidden ring-1 ring-border">
                {userImage ? (
                  <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="admin-topbar__user-info">
                <p className="admin-topbar__user-name hover:text-primary transition-colors">{userName}</p>
                <p className="admin-topbar__user-role">{userRole}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="admin-content flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-auto flex flex-col">
            <div className="px-6 md:px-8 pt-6 md:pt-8 w-full max-w-full">
              <CompanyHeader />
            </div>
            
            <div className="flex-1 w-full max-w-full">
              <Outlet />
            </div>
            
            <div className="px-6 md:px-8 pb-6 md:pb-8 w-full max-w-full mt-auto">
              <CompanyFooter />
            </div>
          </div>
        </main>

        {isRequestModalOpen && (
          <UserRequestsModal onClose={() => setIsRequestModalOpen(false)} />
        )}

        {isAdmin && isAttendanceModalOpen && (
          <AttendanceAdminModal
            isOpen={isAttendanceModalOpen}
            onClose={() => setIsAttendanceModalOpen(false)}
            onSuccess={() => setIsAttendanceModalOpen(false)}
          />
        )}
      </div>
    </RoleNameProvider>
  );
};
