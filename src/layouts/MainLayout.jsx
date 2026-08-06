import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* التحكم في الهامش الجانبي بناءً على الحالة */}
      <div className={`flex-1 transition-all duration-300 md:${isSidebarOpen ? 'ml-64' : 'ml-20'} flex flex-col w-full`}>
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};