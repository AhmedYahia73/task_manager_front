import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { Clock, Phone, User as UserIcon, MapPin, Laptop, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AttendanceAdminModal from './AttendanceAdminModal';
import { useMutation } from '@/hooks/useMutation';

export default function Attendance() {
  const { data, loading, refetch } = useGet('/api/admin/hrm/attendance');
  const { mutate } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const attendanceRecords = data?.attendance || [];

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const res = await mutate({
      method: 'DELETE',
      url: `/api/admin/hrm/attendance/${id}`
    });
    if (res?.success) refetch();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-8 h-8 text-primary" />
          Employee Attendance
        </h1>
        <Button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Record
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No attendance records found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {attendanceRecords.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2">
                 {record.onsite ? (
                   <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-bl-xl shadow-sm">
                     <MapPin className="w-3 h-3" /> On-site
                   </span>
                 ) : record.isRequestOnline ? (
                   <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-bl-xl shadow-sm">
                     <Laptop className="w-3 h-3" /> Online Req
                   </span>
                 ) : (
                   <span className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-bl-xl shadow-sm">
                     <Laptop className="w-3 h-3" /> Remote
                   </span>
                 )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                {record.user.image ? (
                  <img src={record.user.image} alt={record.user.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                    <UserIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{record.user.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Phone className="w-3 h-3" /> {record.user.phone}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-3 mt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium text-foreground">{new Date(record.from).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium text-foreground">{new Date(record.to).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-1 bg-muted/20 -mx-4 -mb-4 px-4 pb-4 rounded-b-xl">
                  <span className="text-muted-foreground font-medium">Total Hours:</span>
                  <span className="font-bold text-primary">{record.hours} hrs</span>
                </div>
              </div>

              <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                  <button onClick={() => { setEditData(record); setModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors bg-card shadow-sm border border-border/50" title="Edit">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(record.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-card shadow-sm border border-border/50" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AttendanceAdminModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); refetch(); }}
        initialData={editData}
      />
    </div>
  );
}
