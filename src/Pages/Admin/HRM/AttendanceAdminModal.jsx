import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { toast } from 'sonner';

export default function AttendanceAdminModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { data: usersData } = useGet('/api/admin/user?limit=100');
  const { mutate, loading } = useMutation();
  
  const [formData, setFormData] = useState({
    userId: '',
    from: '',
    to: '',
    onsite: false,
    isRequestOnline: false
  });

  const formatDatetime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        userId: initialData.user?.id || '',
        from: formatDatetime(initialData.from),
        to: formatDatetime(initialData.to),
        onsite: !!initialData.onsite,
        isRequestOnline: !!initialData.isRequestOnline
      });
    } else {
      setFormData({
        userId: '',
        from: '',
        to: '',
        onsite: false,
        isRequestOnline: false
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId) return toast.error('Please select a user');
    if (!formData.from) return toast.error('Please select check-in time');

    const endpoint = initialData ? `/api/admin/hrm/attendance/${initialData.id}` : `/api/admin/hrm/attendance`;
    
    const payload = {
      userId: formData.userId,
      from: formData.from,
      to: formData.to || null,
      onsite: formData.onsite,
      isRequestOnline: formData.isRequestOnline
    };

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
            {initialData ? 'Edit' : 'Add'} Attendance
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 max-h-[70vh] overflow-y-auto">
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
              <label className="text-sm font-semibold text-foreground">Check-in (From)</label>
              <Input type="datetime-local" value={formData.from} onChange={e => setFormData({ ...formData, from: e.target.value })} required className="h-11" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Check-out (To)</label>
              <Input type="datetime-local" value={formData.to} onChange={e => setFormData({ ...formData, to: e.target.value })} className="h-11" />
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                <input type="checkbox" checked={formData.onsite} onChange={e => setFormData({ ...formData, onsite: e.target.checked })} className="w-4 h-4 rounded border-zinc-300" />
                On-site
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                <input type="checkbox" checked={formData.isRequestOnline} onChange={e => setFormData({ ...formData, isRequestOnline: e.target.checked })} className="w-4 h-4 rounded border-zinc-300" />
                Online Request
              </label>
            </div>

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
