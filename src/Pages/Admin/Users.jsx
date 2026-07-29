import React, { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const Users = () => {
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

  const { data, loading, refresh } = useGet(`/api/admin/user?page=${page}&limit=10&search=${debouncedSearch}`);
  const { mutate, loading: mutationLoading } = useMutation();

  const usersList = data?.Users || [];
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
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/user/${id}`
    });

    if (response?.success) {
      refresh();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#f8f9fa] min-h-screen relative text-[#191c1d]">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">Users</h1>
          <p className="text-[#464555] mt-1">Manage engineers and testers</p>
        </div>
        <Button onClick={() => openModal()} className="bg-[#3525cd] hover:bg-[#2b1da8] text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#edeeef] flex items-center gap-3">
        <Search className="text-[#464555] w-5 h-5" />
        <Input 
          type="text" 
          placeholder="Search by name, email or phone..." 
          className="border-none shadow-none focus-visible:ring-0 text-[15px] w-full p-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#edeeef] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#464555] font-semibold border-b border-[#edeeef]">
              <tr>
                <th className="px-6 py-4">USER</th>
                <th className="px-6 py-4">CONTACT</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loading && usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3525cd] mx-auto" />
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#464555]">
                    No users found.
                  </td>
                </tr>
              ) : (
                usersList.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {userItem.image ? (
                        <img 
                          src={userItem.image} 
                          alt={userItem.name} 
                          className="w-10 h-10 rounded-full object-cover border border-[#edeeef]" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#f3f4f5] text-[#3525cd] flex items-center justify-center font-bold text-lg border border-[#edeeef]">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#191c1d]">{userItem.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#464555]">{userItem.email}</p>
                      <p className="text-[#464555] text-xs">{userItem.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        userItem.role === 'engineer' 
                          ? 'bg-[#e0e0ff] text-[#3525cd]' 
                          : 'bg-[#fff0e0] text-[#ba5a00]'
                      }`}>
                        {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(userItem)} className="p-2 text-[#464555] hover:text-[#3525cd] hover:bg-[#f3f4f5] rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(userItem.id)} className="p-2 text-[#464555] hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-lg transition-colors">
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
          <div className="p-4 border-t border-[#edeeef] flex justify-between items-center bg-[#f8f9fa]">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[#464555]"
            >
              Previous
            </Button>
            <span className="text-sm text-[#464555] font-medium">
              Page {page} of {pagination.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="text-[#464555]"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[#edeeef]">
              <h2 className="text-lg font-bold text-[#191c1d]">{editingId ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={closeModal} className="text-[#464555] hover:bg-[#f3f4f5] p-1.5 rounded-lg transition-colors">
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
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#edeeef] shadow-sm"
                    />
                  ) : (
                      <div className="w-24 h-24 rounded-full bg-[#f3f4f5] text-[#464555] flex items-center justify-center border-2 border-[#edeeef] shadow-sm">
                        <span className="material-symbols-outlined text-3xl">person</span>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full border border-[#edeeef] shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className="material-symbols-outlined text-[16px] text-[#3525cd]">edit</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#191c1d]">Name</label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} required className="h-11" placeholder="User Name" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#191c1d]">Email Address</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required className="h-11" placeholder="user@example.com" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#191c1d]">Phone Number</label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} required className="h-11" placeholder="+1234567890" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#191c1d]">{editingId ? 'New Password (Optional)' : 'Password'}</label>
                  <Input name="password" type="password" value={formData.password} onChange={handleInputChange} required={!editingId} className="h-11" placeholder="••••••••" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#191c1d]">Role</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange}
                    className="flex w-full h-11 items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="engineer">Engineer</option>
                    <option value="tester">Tester</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#191c1d]">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange}
                    className="flex w-full h-11 items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-[#edeeef] flex justify-end gap-3 bg-[#f8f9fa]">
              <Button type="button" variant="outline" onClick={closeModal} className="h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" form="user-form" disabled={mutationLoading} className="h-11 px-6 bg-[#3525cd] hover:bg-[#2b1da8] text-white">
                {mutationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save User'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
