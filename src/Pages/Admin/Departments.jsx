import React, { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Edit2, Trash2, Search, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const Departments = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;
  const { data, loading, refresh } = useGet(`/api/admin/departments?page=${page}&limit=${limit}&search=${search}`);
  const { data: dependencies } = useGet('/api/admin/departments/dependencies');
  const { mutate, loading: mutationLoading } = useMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    zone_id: '',
    manager_id: '',
    status: true
  });

  const departments = data?.departments || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const zones = dependencies?.zones || [];
  const managers = dependencies?.managers || [];

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditingId(dept.id);
      setFormData({
        name: dept.name,
        description: dept.description || '',
        zone_id: dept.zone_id,
        manager_id: dept.manager_id,
        status: dept.status
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        zone_id: '',
        manager_id: '',
        status: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.zone_id || !formData.manager_id) {
      toast.error('Name, Zone, and Manager are required.');
      return;
    }

    const res = await mutate({
      method: editingId ? 'PUT' : 'POST',
      url: editingId ? `/api/admin/departments/${editingId}` : '/api/admin/departments',
      data: formData
    });

    if (res?.success) {
      toast.success(`Department ${editingId ? 'updated' : 'created'} successfully`);
      handleCloseModal();
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this department?')) {
      const res = await mutate({
        method: 'DELETE',
        url: `/api/admin/departments/${id}`
      });
      if (res?.success) {
        toast.success('Department deleted successfully');
        refresh();
      }
    }
  };

  const toggleStatus = async (dept) => {
    const res = await mutate({
      method: 'PUT',
      url: `/api/admin/departments/${dept.id}`,
      data: { ...dept, status: !dept.status }
    });
    if (res?.success) {
      toast.success(`Department ${!dept.status ? 'activated' : 'deactivated'}`);
      refresh();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-background min-h-screen relative text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Departments
          </h1>
          <p className="text-muted-foreground mt-1">Manage company departments, zones, and managers</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-white h-11 px-6 font-semibold">
          <Plus className="w-5 h-5 mr-2" />
          Add Department
        </Button>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search departments..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-10 bg-background"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Manager (Engineer)</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground font-medium">
                    No departments found.
                  </TableCell>
                </TableRow>
              ) : (
                departments.map(dept => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-semibold">{dept.name}</TableCell>
                    <TableCell>{dept.zone_name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {dept.manager_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => toggleStatus(dept)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${dept.status ? 'bg-green-500' : 'bg-muted-foreground'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dept.status ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(dept)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Department' : 'Create Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. IT Department" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Zone <span className="text-red-500">*</span></label>
              <select 
                required
                className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.zone_id} 
                onChange={e => setFormData({...formData, zone_id: e.target.value})}
              >
                <option value="" disabled>Select Zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Manager (Engineer) <span className="text-red-500">*</span></label>
              <select 
                required
                className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.manager_id} 
                onChange={e => setFormData({...formData, manager_id: e.target.value})}
              >
                <option value="" disabled>Select Manager</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional details..." />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border mt-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">Active departments can be used in the system</p>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: !formData.status})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.status ? 'bg-green-500' : 'bg-muted-foreground'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" disabled={mutationLoading}>
                {mutationLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? 'Save Changes' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
