import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, X, Network, Wifi } from 'lucide-react';
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
    status: true,
    router_ip_status: false,
    router_ip: ''
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', locations: [], status: true, router_ip_status: false, router_ip: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (zone) => {
    setEditingId(zone.id);
    let parsedLocations = zone.locations;
    while (typeof parsedLocations === 'string') {
      try {
        parsedLocations = JSON.parse(parsedLocations);
      } catch (e) {
        break;
      }
    }
    const ipStatus = zone.router_ip_status !== undefined ? Boolean(zone.router_ip_status) : Boolean(zone.router_mac_status);
    const ipValue = zone.router_ip || zone.router_mac || '';

    setFormData({
      name: zone.name,
      locations: Array.isArray(parsedLocations) ? parsedLocations : [],
      status: zone.status,
      router_ip_status: ipStatus,
      router_ip: ipValue
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

    const payload = {
      ...formData,
      // For backwards compatibility with both IP & MAC endpoints
      router_mac_status: formData.router_ip_status,
      router_mac: formData.router_ip
    };

    if (editingId) {
      const res = await mutate({ url: `/api/admin/zones/${editingId}`, method: 'PUT', data: payload });
      if (res?.success) {
        toast.success(res.message || 'Zone updated successfully');
        refresh();
        closeModal();
      }
    } else {
      const res = await mutate({ url: `/api/admin/zones`, method: 'POST', data: payload });
      if (res?.success) {
        toast.success(res.message || 'Zone created successfully');
        refresh();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;
    const res = await mutate({ url: `/api/admin/zones/${id}`, method: 'DELETE' });
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
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Router IP</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading zones...
                  </td>
                </tr>
              ) : zonesList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    No zones found. Create one to get started.
                  </td>
                </tr>
              ) : (
                zonesList.map((zone) => {
                  let hasLocations = false;
                  try {
                    let locs = zone.locations;
                    while (typeof locs === 'string') {
                      locs = JSON.parse(locs);
                    }
                    hasLocations = Array.isArray(locs) && locs.length >= 3;
                  } catch (e) {}
                  const isIpActive = zone.router_ip_status !== undefined ? zone.router_ip_status : zone.router_mac_status;
                  const ipValue = zone.router_ip || zone.router_mac;

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
                      {isIpActive && ipValue ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20">
                            {ipValue}
                          </span>
                        </div>
                      ) : ipValue ? (
                        <span className="font-mono text-xs text-muted-foreground opacity-75">
                          {ipValue} (Disabled)
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not set</span>
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
          <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-muted/20">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans']">{editingId ? 'Edit Zone' : 'Add Zone'}</h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Zone Name *</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                    placeholder="e.g. Cairo Main Office"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Perimeter (Map)</label>
                  <MapSelector 
                    locations={formData.locations}
                    onChange={(newPoly) => setFormData(prev => ({ ...prev, locations: newPoly }))}
                  />
                </div>

                {/* Router IP Verification Section */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label htmlFor="router_ip_status" className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                        <Wifi className="w-4 h-4 text-primary" />
                        Router IP Verification (التحقق من آي بي الراوتر)
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Require employees in this zone to connect from this specific router IP address
                      </p>
                    </div>
                    <input 
                      type="checkbox" 
                      id="router_ip_status"
                      checked={formData.router_ip_status} 
                      onChange={e => setFormData(prev => ({ ...prev, router_ip_status: e.target.checked }))} 
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {formData.router_ip_status && (
                    <div className="space-y-1.5 pt-1">
                      <label htmlFor="router_ip" className="text-xs font-semibold text-foreground">
                        Router IP Address (عنوان الـ IP للراوتر) *
                      </label>
                      <Input 
                        id="router_ip"
                        required={formData.router_ip_status}
                        value={formData.router_ip} 
                        onChange={e => setFormData(prev => ({ ...prev, router_ip: e.target.value }))} 
                        placeholder="e.g. 192.168.1.1 or your public IP"
                        className="font-mono bg-background"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="status"
                    checked={formData.status} 
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.checked }))} 
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="status" className="text-sm font-semibold cursor-pointer">Active</label>
                </div>
              </div>

              {/* Fixed Footer with Actions */}
              <div className="px-6 py-4 flex items-center justify-end gap-3 border-t shrink-0 bg-muted/20">
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
