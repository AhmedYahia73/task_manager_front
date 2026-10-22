import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Users, 
  Briefcase, 
  Target, 
  Mail, 
  Phone, 
  Check, 
  Filter 
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalesLeaders() {
  const { projectId: routeProjectId } = useParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState(routeProjectId || '');

  // Keep project filter in sync with route parameter
  useEffect(() => {
    if (routeProjectId) {
      setProjectFilter(routeProjectId);
    }
  }, [routeProjectId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const effectiveProjectId = routeProjectId || projectFilter;

  // Fetch Dropdowns (Sales Projects & Targets - scoped to project if available)
  const listsUrl = effectiveProjectId
    ? `/api/admin/sales/leader/lists?sales_project_id=${effectiveProjectId}`
    : '/api/admin/sales/leader/lists';
  const { data: listsData } = useGet(listsUrl);
  const salesProjectsList = listsData?.sales_projects || [];
  const targetsList = listsData?.targets || [];

  // Fetch Sales Leaders
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '10',
    search: debouncedSearch,
  });
  if (effectiveProjectId) queryParams.append('sales_project_id', effectiveProjectId);

  const { data, loading, refresh } = useGet(`/api/admin/sales/leader?${queryParams.toString()}`);
  const { mutate, loading: mutationLoading } = useMutation();

  const rawLeadersList = data?.leaders || [];
  // Ensure that if scoped to a project route, only leaders of this project are shown
  const leadersList = routeProjectId
    ? rawLeadersList.filter((leader) => {
        const pids = (leader.sales_projects || [])
          .map((p) => String(p.id))
          .concat(Array.isArray(leader.sales_project_ids) ? leader.sales_project_ids.map(String) : [])
          .concat(leader.sales_project_id ? [String(leader.sales_project_id)] : []);
        return pids.includes(String(routeProjectId));
      })
    : rawLeadersList;
  const pagination = data?.pagination || { totalPages: 1, page: 1, total: 0 };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    target_id: '',
    sales_project_ids: [],
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingLeader, setDeletingLeader] = useState(null);

  const openModal = (item = null) => {
    if (item) {
      let initialProjectIds = [];
      if (Array.isArray(item.sales_project_ids)) {
        initialProjectIds = item.sales_project_ids;
      } else if (typeof item.sales_project_ids === 'string' && item.sales_project_ids.trim()) {
        try {
          const parsed = JSON.parse(item.sales_project_ids);
          if (Array.isArray(parsed)) initialProjectIds = parsed;
        } catch {}
      }
      if (initialProjectIds.length === 0 && Array.isArray(item.sales_projects)) {
        initialProjectIds = item.sales_projects.map((p) => p.id || p._id).filter(Boolean);
      }
      if (initialProjectIds.length === 0 && item.sales_project_id) {
        initialProjectIds = [item.sales_project_id];
      }

      setEditingId(item.id);
      setFormData({
        name: item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        password: '',
        status: item.status || 'active',
        target_id: item.target_id || '',
        sales_project_ids: initialProjectIds,
      });
      setImagePreview(item.image || null);
      setSelectedFile(null);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
        target_id: '',
        sales_project_ids: routeProjectId ? [routeProjectId] : [],
      });
      setImagePreview(null);
      setSelectedFile(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleProjectSelection = (projectId) => {
    setFormData((prev) => {
      const currentIds = Array.isArray(prev.sales_project_ids) ? prev.sales_project_ids : [];
      const exists = currentIds.includes(projectId);
      return {
        ...prev,
        sales_project_ids: exists
          ? currentIds.filter((id) => id !== projectId)
          : [...currentIds, projectId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');
    if (!formData.email.trim()) return toast.error('Email is required');
    if (!formData.phone.trim()) return toast.error('Phone is required');
    if (!editingId && (!formData.password || formData.password.length < 6)) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim());
      payload.append('phone', formData.phone.trim());
      payload.append('status', formData.status);
      if (formData.password) payload.append('password', formData.password);
      if (formData.target_id) payload.append('target_id', formData.target_id);
      if (selectedFile) payload.append('image', selectedFile);
      payload.append('sales_project_ids', JSON.stringify(formData.sales_project_ids));
      if (formData.sales_project_ids && formData.sales_project_ids.length > 0) {
        payload.append('sales_project_id', formData.sales_project_ids[0]);
      }

      if (editingId) {
        await mutate({
          method: 'PUT',
          url: `/api/admin/sales/leader/${editingId}`,
          data: payload,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Sales Leader updated successfully');
      } else {
        await mutate({
          method: 'POST',
          url: '/api/admin/sales/leader',
          data: payload,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Sales Leader created successfully');
      }

      closeModal();
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save leader');
    }
  };

  const confirmDelete = async () => {
    if (!deletingLeader) return;
    try {
      await mutate({
        method: 'DELETE',
        url: `/api/admin/sales/leader/${deletingLeader.id}`,
      });
      toast.success('Sales Leader deleted successfully');
      setDeleteModalOpen(false);
      setDeletingLeader(null);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete leader');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Sales Team Leaders</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage team leaders overseeing sales representatives across sales projects.
          </p>
        </div>

        <Button onClick={() => openModal()} className="flex items-center gap-2 rounded-xl h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto shrink-0 justify-center shadow-xs">
          <Plus className="w-4 h-4" /> Add Sales Leader
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9.5 text-xs sm:text-sm rounded-xl w-full"
          />
        </div>

        {!routeProjectId && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Project:
            </span>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(1);
              }}
              className="bg-background border rounded-xl px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-56"
            >
              <option value="">All Projects</option>
              {salesProjectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table / Grid */}
      <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : leadersList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Sales Leaders Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {debouncedSearch || projectFilter
                ? 'Try adjusting your search criteria or clear the filters.'
                : 'Click the button above to add your first sales leader.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Leader</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Contact</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Assigned Projects</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Target</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leadersList.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                            {item.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <span className="text-xs text-muted-foreground capitalize">
                            Leader
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{item.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{item.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Projects */}
                    <td className="py-3 px-4">
                      {item.sales_projects && item.sales_projects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {item.sales_projects.map((proj) => (
                            <span
                              key={proj.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border"
                            >
                              {proj.logo && (
                                <img
                                  src={proj.logo}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full object-cover"
                                />
                              )}
                              <span>{proj.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      )}
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4">
                      {item.target_name ? (
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md w-fit">
                          <Target className="w-3.5 h-3.5" />
                          <span>{item.target_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-zinc-500/10 text-zinc-500'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openModal(item)}
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingLeader(item);
                            setDeleteModalOpen(true);
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
            <div>
              Showing {leadersList.length} of {pagination.total} leaders
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h2 className="text-lg font-bold">
                {editingId ? 'Edit Sales Leader' : 'Add New Sales Leader'}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/40 shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-muted-foreground text-2xl">
                      add_a_photo
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Leader Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                  />
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Mostafa Helal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Phone Number *</label>
                  <Input
                    required
                    placeholder="+20 100 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="leader@crm.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">
                    {editingId ? 'New Password (Optional)' : 'Password *'}
                  </label>
                  <Input
                    type="password"
                    placeholder={editingId ? 'Leave blank to keep current' : 'Min 6 characters'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              {/* Target & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Assigned Target (Optional)</label>
                  <select
                    value={formData.target_id}
                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No Target</option>
                    {targetsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Multiple Sales Projects Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold block">
                    Assigned Sales Projects (Multiple Selection)
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {formData.sales_project_ids.length} selected
                  </span>
                </div>

                <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/20">
                  {salesProjectsList.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No sales projects found. Please create sales projects first.
                    </p>
                  ) : (
                    salesProjectsList.map((project) => {
                      const isSelected = formData.sales_project_ids.includes(project.id);
                      return (
                        <div
                          key={project.id}
                          onClick={() => toggleProjectSelection(project.id)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-sm cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border bg-card hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {project.logo ? (
                              <img
                                src={project.logo}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <Briefcase className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span>{project.name}</span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : editingId ? (
                    'Save Changes'
                  ) : (
                    'Create Sales Leader'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-destructive">Delete Sales Leader</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deletingLeader?.name}</strong>? This action cannot
              be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingLeader(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={mutationLoading}>
                {mutationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
