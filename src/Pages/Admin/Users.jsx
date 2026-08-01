import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleNames } from '@/context/RoleNameContext';
import UserPointsModal from './UserPointsModal';

const Users = () => {
  const { getRoleName, getRoleNamePlural } = useRoleNames();
  const [searchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';

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

  const { data, loading, refresh } = useGet(`/api/admin/user?page=${page}&limit=10&search=${debouncedSearch}${roleFilter ? `&role=${roleFilter}` : ''}`);
  const { mutate, loading: mutationLoading } = useMutation();

  const usersList = data?.Users || [];
  const pagination = data?.pagination || { totalPages: 1, page: 1 };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pointsUserId, setPointsUserId] = useState(null);
  const [pointsUserName, setPointsUserName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    role: 'engineer',
    image: null,
  });

  const openModal = (userItem = null) => {
    if (userItem) {
      setEditingId(userItem.id);
      setFormData({
        name: userItem.name,
        email: userItem.email,
        phone: userItem.phone,
        password: '', // Don't fill password on edit
        status: userItem.status,
        role: userItem.role,
        image: userItem.image || null,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', password: '', status: 'active', role: 'engineer', image: null });
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
      url: editingId ? `/api/admin/user/${editingId}` : '/api/admin/user',
      data: payload
    });

    if (response?.success) {
      closeModal();
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/user/${id}`
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
          <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{getRoleNamePlural('engineer')} & {getRoleNamePlural('tester')}</h1>
          <p className="text-muted-foreground mt-1">Manage {getRoleNamePlural('engineer').toLowerCase()} and {getRoleNamePlural('tester').toLowerCase()}</p>
        </div>
        <Button onClick={() => openModal()} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add {getRoleName('engineer')}
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
                <th className="px-6 py-4">{getRoleName('engineer').toUpperCase()}</th>
                <th className="px-6 py-4">CONTACT</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">PROGRESS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loading && usersList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                usersList.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {userItem.image ? (
                        <img 
                          src={userItem.image} 
                          alt={userItem.name} 
                          className="w-10 h-10 rounded-full object-cover border border-border" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-lg border border-border">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{userItem.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-muted-foreground">{userItem.email}</p>
                      <p className="text-muted-foreground text-xs">{userItem.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        userItem.role === 'engineer' 
                          ? 'bg-primary-light text-primary' 
                          : 'bg-[#fff0e0] text-[#ba5a00]'
                      }`}>
                        {getRoleName(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        userItem.status === 'active' 
                          ? 'bg-[#e0f3eb] text-[#006c49]' 
                          : 'bg-[#fef2f2] text-[#ba1a1a]'
                      }`}>
                        {userItem.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 w-32">
                        <div className="flex flex-col gap-1" title={`Approved: ${userItem.progress || 0}%`}>
                          <div className="flex justify-between text-[10px] font-medium text-[#006c49]">
                            <span>Approve</span>
                            <span>{userItem.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#006c49] h-full" style={{ width: `${userItem.progress || 0}%` }}></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1" title={`Done: ${userItem.done_progress || 0}%`}>
                          <div className="flex justify-between text-[10px] font-medium text-red-600">
                            <span>Done</span>
                            <span>{userItem.done_progress || 0}%</span>
                          </div>
                          <div className="w-full bg-red-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: `${userItem.done_progress || 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setPointsUserId(userItem.id); setPointsUserName(userItem.name); }} className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View Points">
                          <span className="material-symbols-outlined text-[18px]">analytics</span>
                        </button>
                        <button onClick={() => openModal(userItem)} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors" title="Edit User">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(userItem.id)} className="p-2 text-muted-foreground hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-lg transition-colors">
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

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{editingId ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                
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
                  <Input name="name" value={formData.name} onChange={handleInputChange} required className="h-11" placeholder="User Name" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required className="h-11" placeholder="user@example.com" />
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
                  <label className="text-sm font-semibold text-foreground">Role</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange}
                    className="flex w-full h-11 items-center justify-between rounded-md border border-zinc-200 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="engineer">{getRoleName('engineer')}</option>
                    <option value="tester">{getRoleName('tester')}</option>
                  </select>
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
              </form>
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-3 bg-background">
              <Button type="button" variant="outline" onClick={closeModal} className="h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" form="user-form" disabled={mutationLoading} className="h-11 px-6 bg-primary hover:bg-primary-hover text-white">
                {mutationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Points Modal */}
      {pointsUserId && (
        <UserPointsModal 
          userId={pointsUserId} 
          userName={pointsUserName} 
          onClose={() => setPointsUserId(null)} 
        />
      )}

    </div>
  );
};

export default Users;
