import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { MapSelector } from '@/components/MapSelector';

const Zones = () => {
  const { data, loading, refresh } = useGet(`/api/admin/zones`);
  const { mutate, loading: mutationLoading } = useMutation();

  const zonesList = data?.Zones || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    locations: [],
    status: true
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', locations: [], status: true });
    setIsModalOpen(true);
  };

  const openEditModal = (zone) => {
    setEditingId(zone.id);
    let parsedLocations = zone.locations;
    if (typeof parsedLocations === 'string') {
      try {
        parsedLocations = JSON.parse(parsedLocations);
      } catch (e) {
        parsedLocations = [];
      }
    }
    setFormData({
      name: zone.name,
      locations: parsedLocations || [],
      status: zone.status
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

    if (editingId) {
      const res = await mutate(`/api/admin/zones/${editingId}`, 'PUT', formData);
      if (res?.success) {
        toast.success(res.message || 'Zone updated successfully');
        refresh();
        closeModal();
      }
    } else {
      const res = await mutate(`/api/admin/zones`, 'POST', formData);
      if (res?.success) {
        toast.success(res.message || 'Zone created successfully');
        refresh();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;
    const res = await mutate(`/api/admin/zones/${id}`, 'DELETE');
    if (res?.success) {
      toast.success(res.message || 'Zone deleted successfully');
      refresh();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-foreground tracking-tight">Zones & Locations</h1>
          <p className="text-muted-foreground mt-1">Manage office zones and check-in perimeters.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 font-semibold">
          <Plus className="w-4 h-4" /> Add Zone
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Has Perimeter</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading zones...
                  </td>
                </tr>
              ) : zonesList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    No zones found. Create one to get started.
                  </td>
                </tr>
              ) : (
                zonesList.map((zone) => {
                  let hasLocations = false;
                  try {
                    const locs = typeof zone.locations === 'string' ? JSON.parse(zone.locations) : zone.locations;
                    hasLocations = locs && locs.length >= 3;
                  } catch (e) {}
                  return (
                  <tr key={zone.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{zone.name}</td>
                    <td className="px-6 py-4">
                      {hasLocations ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
                          Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Not Configured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {zone.status ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(zone)} className="text-muted-foreground hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                )}
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans']">{editingId ? 'Edit Zone' : 'Add Zone'}</h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Zone Name *</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. Cairo Main Office"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Perimeter (Map)</label>
                  <MapSelector 
                    locations={formData.locations}
                    onChange={(newPoly) => setFormData({ ...formData, locations: newPoly })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="status"
                    checked={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.checked })} 
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="status" className="text-sm font-semibold cursor-pointer">Active</label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Zone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zones;
