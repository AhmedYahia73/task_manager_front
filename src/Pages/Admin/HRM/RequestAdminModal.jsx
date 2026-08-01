import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { toast } from 'sonner';

export default function RequestAdminModal({ isOpen, onClose, onSuccess, initialData = null, type = 'holiday' }) {
  const { data: usersData } = useGet('/api/admin/user?limit=100');
  const { mutate, loading } = useMutation();
  
  const [formData, setFormData] = useState({
    userId: '',
    date: '',
    hours: '',
    reason: '',
    status: 'pending'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        userId: initialData.user?.id || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        hours: initialData.hours || '',
        reason: initialData.reason || '',
        status: initialData.status || 'pending'
      });
    } else {
      setFormData({
        userId: '',
        date: '',
        hours: '',
        reason: '',
        status: 'pending'
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId) return toast.error('Please select a user');
    if (!formData.date) return toast.error('Please select a date');

    let endpoint = `/api/admin/hrm/${type}-requests`;
    if (type === 'permission') endpoint = `/api/admin/hrm/permissions`;
    if (type === 'attendance') endpoint = `/api/admin/hrm/attendance`; // Wait, attendance might need a different endpoint, but for now we'll stick to requests.

    if (initialData) endpoint += `/${initialData.id}`;

    let payload = {
      userId: formData.userId,
      date: formData.date,
      status: formData.status
    };

    if (type === 'permission') {
      if (!formData.hours) return toast.error('Hours are required');
      payload.hours = Number(formData.hours);
      payload.reason = formData.reason;
    }

    const res = await mutate({
      method: initialData ? 'PUT' : 'POST',
      url: endpoint,
      data: payload
    });

    if (res?.success) {
      toast.success(res.message || 'Saved successfully');
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground capitalize">
            {initialData ? 'Edit' : 'Add'} {type}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!initialData && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">User</label>
                <select 
                  value={formData.userId} 
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="flex w-full h-11 items-center justify-between rounded-md border border-zinc-200 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950"
                >
                  <option value="">Select User...</option>
                  {usersData?.Users?.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Date</label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({ ...formData, date: e.target.value })} 
                required 
                className="h-11" 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {type === 'permission' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Hours</label>
                  <Input type="number" step="0.5" value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} required className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Reason</label>
                  <Input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="h-11" />
                </div>
              </>
            )}

            {initialData && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex w-full h-11 items-center justify-between rounded-md border border-zinc-200 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950"
                >
                  <option value="pending">Pending</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6">Cancel</Button>
              <Button type="submit" disabled={loading} className="h-11 px-6 bg-primary hover:bg-primary-hover text-white">
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
