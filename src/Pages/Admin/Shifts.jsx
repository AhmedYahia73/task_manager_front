import React, { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const Shifts = () => {
  const { data, loading, refresh } = useGet(`/api/admin/shifts`);
  const { data: zonesData } = useGet(`/api/admin/zones/lists`);
  const { mutate, loading: mutationLoading } = useMutation();

  const shiftsList = data?.Shifts || [];
  const zonesList = zonesData?.Zones || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    zone_id: '',
    from: '',
    to: ''
  });

  const formatTimeForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', zone_id: '', from: '', to: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (shift) => {
    setEditingId(shift.id);
    setFormData({
      name: shift.name,
      zone_id: shift.zone_id,
      from: formatTimeForInput(shift.from),
      to: formatTimeForInput(shift.to)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required');
    if (!formData.zone_id) return toast.error('Zone is required');
    if (!formData.from || !formData.to) return toast.error('Time range is required');

    if (editingId) {
      const res = await mutate({ url: `/api/admin/shifts/${editingId}`, method: 'PUT', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Shift updated successfully');
        refresh();
        closeModal();
      }
    } else {
      const res = await mutate({ url: `/api/admin/shifts`, method: 'POST', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Shift created successfully');
        refresh();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    const res = await mutate({ url: `/api/admin/shifts/${id}`, method: 'DELETE' });
    if (res?.success) {
      toast.success(res.message || 'Shift deleted successfully');
      refresh();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-foreground tracking-tight">Work Shifts</h1>
          <p className="text-muted-foreground mt-1">Manage office shifts and their zones.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 font-semibold">
          <Plus className="w-4 h-4" /> Add Shift
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Zone</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">From</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">To</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading shifts...
                  </td>
                </tr>
              ) : shiftsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    No shifts found. Create one to get started.
                  </td>
                </tr>
              ) : (
                shiftsList.map((shift) => (
                  <tr key={shift.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{shift.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{shift.zone_name}</td>
                    <td className="px-6 py-4 font-mono text-xs bg-muted/20">{formatTimeForInput(shift.from)}</td>
                    <td className="px-6 py-4 font-mono text-xs bg-muted/20">{formatTimeForInput(shift.to)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(shift)} className="text-muted-foreground hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border flex flex-col my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans']">{editingId ? 'Edit Shift' : 'Add Shift'}</h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Shift Name *</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. Morning Shift"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Zone *</label>
                  <select 
                    required 
                    value={formData.zone_id} 
                    onChange={e => setFormData({ ...formData, zone_id: e.target.value })} 
                    className="flex w-full h-11 items-center justify-between rounded-md border border-zinc-200 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select Zone</option>
                    {zonesList.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">From Time *</label>
                    <Input 
                      required 
                      type="time"
                      value={formData.from} 
                      onChange={e => setFormData({ ...formData, from: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">To Time *</label>
                    <Input 
                      required 
                      type="time"
                      value={formData.to} 
                      onChange={e => setFormData({ ...formData, to: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Shift'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
