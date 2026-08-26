import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, X, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const Salaries = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data: salariesData, loading: salariesLoading, refresh: refreshSalaries } = useGet(`/api/admin/salaries?page=${page}&limit=${limit}`);
  const { data: usersData, loading: usersLoading } = useGet(`/api/admin/user/selection-list`);
  const { mutate, loading: mutationLoading } = useMutation();

  const salariesList = salariesData?.Salaries || [];
  const pagination = salariesData?.pagination;
  const usersList = usersData?.Users || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    salary: ''
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ user_id: '', salary: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (salaryItem) => {
    setEditingId(salaryItem.id);
    setFormData({
      user_id: salaryItem.user_id,
      salary: salaryItem.salary
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id) return toast.error('Please select a user');
    if (!formData.salary) return toast.error('Salary amount is required');

    if (editingId) {
      const res = await mutate({ url: `/api/admin/salaries/${editingId}`, method: 'PUT', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Salary updated successfully');
        refreshSalaries();
        closeModal();
      }
    } else {
      const res = await mutate({ url: `/api/admin/salaries`, method: 'POST', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Salary created successfully');
        refreshSalaries();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    const res = await mutate({ url: `/api/admin/salaries/${id}`, method: 'DELETE' });
    if (res?.success) {
      toast.success(res.message || 'Salary deleted successfully');
      refreshSalaries();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-foreground tracking-tight">Salaries</h1>
          <p className="text-muted-foreground mt-1">Manage employee salaries and compensation.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 font-semibold">
          <Plus className="w-4 h-4" /> Add Salary
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Employee</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Salary</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {salariesLoading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading salaries...
                  </td>
                </tr>
              ) : salariesList.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-muted-foreground">
                    No salaries found. Add one to get started.
                  </td>
                </tr>
              ) : (
                salariesList.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      {item.userName}
                      <div className="text-xs text-muted-foreground font-normal">{item.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      ${Number(item.salary).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} className="text-muted-foreground hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive">
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                {editingId ? 'Edit Salary' : 'Add Salary'}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Employee *</label>
                  <select 
                    required
                    value={formData.user_id}
                    onChange={e => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  >
                    <option value="" disabled>Select an employee</option>
                    {usersList.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Salary Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      required 
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-8"
                      value={formData.salary} 
                      onChange={e => setFormData(prev => ({ ...prev, salary: e.target.value }))} 
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Salary'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salaries;
