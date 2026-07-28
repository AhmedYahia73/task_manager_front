import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft, User } from 'lucide-react';
import { removeAuthToken } from '@/utils/auth';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const navigate = useNavigate();

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
    <nav className="h-16 flex items-center justify-between px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {/* زر الرجوع */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate(-1)}
        className="text-zinc-600 hover:text-primary dark:text-zinc-400"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      {/* قسم المستخدم وتسجيل الخروج */}
      <div className="flex items-center gap-4">
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
    </nav>
  );
};