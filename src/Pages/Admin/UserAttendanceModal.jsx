import React from 'react';
import { X } from 'lucide-react';
import AttendanceReport from '@/components/AttendanceReport';

export default function UserAttendanceModal({ userId, userName, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-border bg-card">
          <h2 className="text-xl font-bold text-foreground">
            Attendance Report: <span className="text-primary">{userName}</span>
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-5">
          <AttendanceReport userId={userId} />
        </div>
      </div>
    </div>
  );
}
