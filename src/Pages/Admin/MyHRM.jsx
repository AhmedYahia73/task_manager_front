import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserAttendance } from '@/components/UserAttendance';
import AttendanceReport from '@/components/AttendanceReport';
import UserRequestsModal from '@/components/UserRequestsModal';

const MyHRM = () => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen relative text-foreground">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black font-['Plus_Jakarta_Sans'] bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent pb-1">
            My HRM
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your attendance and requests</p>
        </div>
        <Button 
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add_task</span>
          New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Section */}
        <UserAttendance />

        {/* User Attendance Report Section */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 group relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border/50 overflow-hidden transition-all duration-300 mt-2">
          <h3 className="text-xl font-bold text-foreground font-['Plus_Jakarta_Sans'] flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-teal-500">calendar_month</span>
            My Monthly Attendance Report
          </h3>
          <AttendanceReport userId={null} />
        </div>
      </div>

      {isRequestModalOpen && (
        <UserRequestsModal onClose={() => setIsRequestModalOpen(false)} />
      )}
    </div>
  );
};

export default MyHRM;
