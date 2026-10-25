import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft, User, Menu, Timer } from 'lucide-react';
import { removeAuthToken } from '@/utils/auth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import UserRequestsModal from '@/components/UserRequestsModal';

export const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // استرجاع بيانات المستخدم من LocalStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData?.name || 'User';

  const handleLogout = () => {
    // إزالة التوكن من الكوكيز
    removeAuthToken();
    // مسح بيانات المستخدم من الـ LocalStorage
    localStorage.removeItem('user');
    // التوجيه لصفحة الدخول
    navigate('/login', { replace: true });
  };

  return (
    <nav className="h-16 flex items-center justify-between px-6 bg-card border-b border-zinc-200 ">
      <div className="flex items-center gap-2">
        {/* زر فتح القائمة للموبايل */}
        {toggleSidebar && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden text-zinc-600 hover:text-primary"
          >
            <Menu className="w-6 h-6" />
          </Button>
        )}
        {/* زر الرجوع */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="text-zinc-600 hover:text-primary hidden md:inline-flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* قسم المستخدم وتسجيل الخروج */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95 shadow-xs"
          title="Submit Request (تقديم طلب)"
          type="button"
        >
          <Timer className="w-3.5 h-3.5" />
          <span>New Request</span>
        </button>

        <NotificationBell />
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <User className="w-4 h-4" />
          <span> Hello , {userName}</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {isRequestModalOpen && (
        <UserRequestsModal onClose={() => setIsRequestModalOpen(false)} />
      )}
    </nav>
  );
};