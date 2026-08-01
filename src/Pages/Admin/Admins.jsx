import React, { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const Admins = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, refresh } = useGet(`/api/admin/admin?page=${page}&limit=10&search=${debouncedSearch}`);
  const { mutate, loading: mutationLoading } = useMutation();

  const admins = data?.admins || [];
  const pagination = data?.pagination || { totalPages: 1, page: 1 };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    image: null,
  });

  const openModal = (admin = null) => {
    if (admin) {
      setEditingId(admin.id);
      setFormData({
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        password: '', // Don't fill password on edit
        status: admin.status,
        image: admin.image || null,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', password: '', status: 'active', image: null });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, image: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // Remove password from payload if it's empty during edit
    if (editingId && !payload.password) {
      delete payload.password;
    }

    const response = await mutate({
      method: editingId ? 'PUT' : 'POST',
      url: editingId ? `/api/admin/admin/${editingId}` : '/api/admin/admin',
      data: payload
    });

    if (response?.success) {
      closeModal();
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/admin/${id}`
    });

    if (response?.success) {
      refresh();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-background min-h-screen relative text-foreground">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">Admins</h1>
          <p className="text-muted-foreground mt-1">Manage system administrators and their access</p>
        </div>
        <Button onClick={() => openModal()} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Admin
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex items-center gap-3">
        <Search className="text-muted-foreground w-5 h-5" />
        <Input 
          type="text" 
          placeholder="Search by name, email or phone..." 
          className="border-none shadow-none focus-visible:ring-0 text-[15px] w-full p-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">ADMIN</th>
                <th className="px-6 py-4">PHONE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loading && admins.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {admin.image ? (
                        <img 
                          src={admin.image} 
                          alt={admin.name} 
                          className="w-10 h-10 rounded-full object-cover border border-border" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-lg border border-border">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{admin.name}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{admin.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{admin.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        admin.status === 'active' 
                          ? 'bg-[#e0f3eb] text-[#006c49]' 
                          : 'bg-[#fef2f2] text-[#ba1a1a]'
                      }`}>
                        {admin.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(admin)} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(admin.id)} className="p-2 text-muted-foreground hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center bg-background">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-muted-foreground"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              Page {page} of {pagination.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="text-muted-foreground"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editingId ? 'Edit Admin' : 'Add New Admin'}</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {formData.image ? (
                    <img 
                      src={formData.image}
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-border shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted text-muted-foreground flex items-center justify-center border-2 border-border shadow-sm">
                      <span className="material-symbols-outlined text-3xl">person</span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-card p-1.5 rounded-full border border-border shadow-sm cursor-pointer hover:bg-muted transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Name</label>
                <Input name="name" value={formData.name} onChange={handleInputChange} required className="h-11" placeholder="Admin Name" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required className="h-11" placeholder="admin@example.com" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Phone Number</label>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} required className="h-11" placeholder="+1234567890" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">{editingId ? 'New Password (Optional)' : 'Password'}</label>
                <Input name="password" type="password" value={formData.password} onChange={handleInputChange} required={!editingId} className="h-11" placeholder="••••••••" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange}
                  className="flex w-full h-11 items-center justify-between rounded-md border border-zinc-200 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal} className="h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" disabled={mutationLoading} className="h-11 px-6 bg-primary hover:bg-primary-hover text-white">
                  {mutationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Admin'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admins;
