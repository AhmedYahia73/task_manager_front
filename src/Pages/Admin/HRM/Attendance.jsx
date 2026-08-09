import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { Clock, Phone, User as UserIcon, MapPin, Laptop, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AttendanceAdminModal from './AttendanceAdminModal';
import { useMutation } from '@/hooks/useMutation';

export default function Attendance() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, loading, refresh } = useGet(`/api/admin/hrm/attendance?page=${page}&limit=${limit}`);
  const { mutate } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  const attendanceRecords = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const res = await mutate({
      method: 'DELETE',
      url: `/api/admin/hrm/attendance/${id}`
    });
    if (res?.success) refresh();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-8 h-8 text-primary" />
          Employee Attendance
        </h1>
        {isAdmin && (
          <Button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Record
          </Button>
        )}
      </div> 

      <AttendanceAdminModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); refresh(); }}
        initialData={editData}
      />
    </div>
  );
}
