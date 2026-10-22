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
  BadgePercent, 
  Briefcase, 
  Target, 
  UserCheck, 
  Mail, 
  Phone, 
  Check, 
  Filter 
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalesReps() {
  const { projectId: routeProjectId } = useParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Dropdowns (Leaders, Sales Projects & Targets)
  const { data: listsData } = useGet('/api/admin/sales/sales/lists');
  const salesProjectsList = listsData?.sales_projects || listsData?.data?.sales_projects || [];
  const targetsList = listsData?.targets || listsData?.data?.targets || [];
  const leadersList = listsData?.leaders || listsData?.data?.leaders || [];

  // Fetch Sales Representatives
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '10',
    search: debouncedSearch,
  });
  if (projectFilter) queryParams.append('sales_project_id', projectFilter);
  if (leaderFilter) queryParams.append('leader_id', leaderFilter);

  const { data, loading, refresh } = useGet(`/api/admin/sales/sales?${queryParams.toString()}`);
  const { mutate, loading: mutationLoading } = useMutation();

  const salesList = data?.sales || [];
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
    leader_id: '',
    target_id: '',
    sales_project_ids: [],
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRep, setDeletingRep] = useState(null);

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
        leader_id: item.leader_id || '',
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
        leader_id: '',
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
      if (formData.leader_id) payload.append('leader_id', formData.leader_id);
      if (formData.target_id) payload.append('target_id', formData.target_id);
      if (selectedFile) payload.append('image', selectedFile);
      payload.append('sales_project_ids', JSON.stringify(formData.sales_project_ids));
      if (formData.sales_project_ids && formData.sales_project_ids.length > 0) {
        payload.append('sales_project_id', formData.sales_project_ids[0]);
      }

      if (editingId) {
        await mutate({
          method: 'PUT',
          url: `/api/admin/sales/sales/${editingId}`,
          data: payload,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Sales Representative updated successfully');
      } else {
        await mutate({
          method: 'POST',
          url: '/api/admin/sales/sales',
          data: payload,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Sales Representative created successfully');
      }

      closeModal();
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save sales rep');
    }
  };

  const confirmDelete = async () => {
    if (!deletingRep) return;
    try {
      await mutate({
        method: 'DELETE',
        url: `/api/admin/sales/sales/${deletingRep.id}`,
      });
      toast.success('Sales Representative deleted successfully');
      setDeleteModalOpen(false);
      setDeletingRep(null);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete sales rep');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <BadgePercent className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Representatives</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sales reps, their assigned team leaders, and sales project memberships.
          </p>
        </div>

        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Sales Rep
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card border rounded-xl p-4">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Leader Filter */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCheck className="w-4 h-4" />
            <span>Leader:</span>
          </div>
          <select
            value={leaderFilter}
            onChange={(e) => {
              setLeaderFilter(e.target.value);
              setPage(1);
            }}
            className="bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
          >
            <option value="">All Leaders</option>
            {leadersList.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-0 sm:ml-2">
            <Filter className="w-4 h-4" />
            <span>Project:</span>
          </div>
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className="bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
          >
            <option value="">All Projects</option>
            {salesProjectsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / Grid */}
      <div className="border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : salesList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <BadgePercent className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Sales Representatives Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {debouncedSearch || projectFilter || leaderFilter
                ? 'Try adjusting your search criteria or clear the filters.'
                : 'Click the button above to add your first sales representative.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium">Sales Rep</th>
                  <th className="py-3 px-4 font-medium">Contact</th>
                  <th className="py-3 px-4 font-medium">Assigned Leader</th>
                  <th className="py-3 px-4 font-medium">Assigned Projects</th>
                  <th className="py-3 px-4 font-medium">Target</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salesList.map((item) => (
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
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                            {item.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <span className="text-xs text-muted-foreground capitalize">
                            Sales Rep
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

                    {/* Assigned Leader */}
                    <td className="py-3 px-4">
                      {item.leader_name ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md w-fit">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{item.leader_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No Leader</span>
                      )}
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
                            setDeletingRep(item);
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
              Showing {salesList.length} of {pagination.total} sales reps
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
                {editingId ? 'Edit Sales Representative' : 'Add New Sales Representative'}
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
                  <label className="text-xs font-medium block mb-1">Photo</label>
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
                    placeholder="e.g. Omar Sherif"
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
                    placeholder="sales@crm.com"
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

              {/* Assigned Leader & Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Team Leader</label>
                  <select
                    value={formData.leader_id}
                    onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No Leader Assigned</option>
                    {leadersList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Target (Optional)</label>
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
              </div>

              {/* Account Status */}
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
                    'Create Sales Rep'
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
            <h3 className="text-lg font-bold text-destructive">Delete Sales Representative</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deletingRep?.name}</strong>? This action cannot
              be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingRep(null);
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
