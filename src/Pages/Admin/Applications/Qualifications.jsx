import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const Qualifications = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, loading, refresh } = useGet(`/api/admin/qualifications?page=${page}&limit=10&search=${search}`);
  const { mutate, loading: mutationLoading } = useMutation();

  const qualificationsList = data?.qualifications || [];
  const pagination = data?.pagination || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: true
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', status: true });
    setIsModalOpen(true);
  };

  const openEditModal = (qualification) => {
    setEditingId(qualification.id);
    setFormData({
      name: qualification.name,
      status: qualification.status
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/admin/qualifications/${editingId}` : '/api/admin/qualifications';
    const method = editingId ? 'PUT' : 'POST';

    const res = await mutate({ url, method, data: formData });
    if (res.success) {
      toast.success(res.message || (editingId ? 'Qualification updated successfully' : 'Qualification added successfully'));
      closeModal();
      refresh();
    } else {
      toast.error(res.message || 'An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this qualification?')) return;
    const res = await mutate({ url: `/api/admin/qualifications/${id}`, method: 'DELETE' });
    if (res.success) {
      toast.success(res.message || 'Qualification deleted successfully');
      refresh();
    } else {
      toast.error(res.message || 'An error occurred');
    }
  };

  const handleToggleStatus = async (qualification) => {
    const res = await mutate({ url: `/api/admin/qualifications/${qualification.id}`, method: 'PUT', data: { status: !qualification.status }, showToast: false });
    if (res.success) {
      toast.success('Status updated');
      refresh();
    } else {
      toast.error(res.message || 'Error updating status');
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Qualifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage qualifications for recruitment applications</p>
        </div>
        <div className="flex gap-4">
          <Input 
            placeholder="Search qualifications..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={openAddModal} className="flex items-center gap-2">
            <Plus size={16} />
            <span>Add Qualification</span>
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-4 font-semibold text-foreground">Name</th>
                  <th className="p-4 font-semibold text-foreground text-center">Status</th>
                  <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {qualificationsList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-muted-foreground">
                      No qualifications found.
                    </td>
                  </tr>
                ) : (
                  qualificationsList.map((qualification) => (
                    <tr key={qualification.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium text-foreground">
                        {qualification.name}
                      </td>
                      <td className="p-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={qualification.status}
                            onChange={() => handleToggleStatus(qualification)}
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(qualification)}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(qualification.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-foreground mb-6">
              {editingId ? 'Edit Qualification' : 'Add Qualification'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Qualification Name
                </label>
                <Input
                  required
                  placeholder="Enter qualification name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Qualification'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Qualifications;
