import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { setActiveSalesProject } from '@/utils/salesProject';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  X,
  Image as ImageIcon,
  UploadCloud,
  Calendar,
  AlertCircle,
  Building2,
  Sparkles,
  Link as LinkIcon,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Palette,
  Layout,
  Check,
  Users
} from 'lucide-react';
import { isAdminRole } from '@/utils/auth';
import { apiClient } from '@/lib/axios';

const SalesProjects = () => {
  // Check User Roles
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user?.role;
  const isAdmin = isAdminRole(role);
  const isAllowed = isAdmin || role === 'leader' || role === 'sales';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Sales Projects
  const { data, loading, refresh } = useGet(
    isAllowed
      ? `/api/admin/sales/projects?page=${page}&limit=12&search=${encodeURIComponent(debouncedSearch)}`
      : null
  );
  const salesProjects = data?.salesProjects || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 };

  // Fetch available users for assignment (Admin only)
  const { data: availableUsersData } = useGet(
    isAdmin ? '/api/admin/sales/projects/available-users' : null
  );
  const availableUsers = availableUsersData?.users || [];

  const navigate = useNavigate();
  const [openingProjectId, setOpeningProjectId] = useState(null);

  const handleOpenProjectDashboard = (project) => {
    setActiveSalesProject(project);
    toast.success(`Opening dashboard for ${project.name}`);
    navigate(`/admin/sales-projects/${project.id}`);
  };

  const { mutate, loading: mutationLoading } = useMutation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', logo: '', design: 'design 1' });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [logoMode, setLogoMode] = useState('file'); // 'file' or 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Open modal for Create
  const openAddModal = () => {
    setEditingProject(null);
    setFormData({ name: '', logo: '', design: 'design 1' });
    setSelectedUserIds([]);
    setSelectedFile(null);
    setPreviewUrl('');
    setLogoMode('file');
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      logo: project.logo,
      design: project.design || 'design 1',
    });
    setSelectedUserIds(project.user_ids || []);
    setSelectedFile(null);
    setPreviewUrl(project.logo);
    setLogoMode(project.logo?.startsWith('http') || project.logo?.startsWith('/uploads') ? 'file' : 'url');
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setSelectedUserIds([]);
    setSelectedFile(null);
    setPreviewUrl('');
    setFormErrors({});
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (formErrors.logo) setFormErrors((prev) => ({ ...prev, logo: null }));
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please drop a valid image file');
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (formErrors.logo) setFormErrors((prev) => ({ ...prev, logo: null }));
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Project name is required';
    } else if (formData.name.trim().length > 200) {
      errors.name = 'Project name cannot exceed 200 characters';
    }

    if (!editingProject) {
      // Create mode: logo is strictly REQUIRED
      if (logoMode === 'file' && !selectedFile) {
        errors.logo = 'Project logo image is required';
      } else if (logoMode === 'url' && !formData.logo.trim()) {
        errors.logo = 'Project logo URL is required';
      }
    } else {
      // Edit mode: must have existing logo or new file/url
      if (logoMode === 'file' && !selectedFile && !previewUrl) {
        errors.logo = 'Project logo is required';
      } else if (logoMode === 'url' && !formData.logo.trim()) {
        errors.logo = 'Project logo is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const url = editingProject
      ? `/api/admin/sales/projects/${editingProject.id}`
      : '/api/admin/sales/projects';
    const method = editingProject ? 'PUT' : 'POST';

    let payload;
    if (selectedFile) {
      payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('design', formData.design || 'design 1');
      payload.append('logo', selectedFile);
      payload.append('user_ids', JSON.stringify(selectedUserIds));
    } else {
      payload = {
        name: formData.name.trim(),
        design: formData.design || 'design 1',
        ...(formData.logo ? { logo: formData.logo.trim() } : {}),
        user_ids: selectedUserIds,
      };
    }

    const res = await mutate({ url, method, data: payload });
    if (res?.success) {
      toast.success(
        editingProject
          ? 'Sales project updated successfully'
          : 'Sales project created successfully'
      );
      closeModal();
      refresh();
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!projectToDelete) return;
    const res = await mutate({
      url: `/api/admin/sales/projects/${projectToDelete.id}`,
      method: 'DELETE',
    });
    if (res?.success) {
      toast.success('Sales project deleted successfully');
      setDeleteModalOpen(false);
      setProjectToDelete(null);
      refresh();
    }
  };

  // If user is not allowed, show access denied
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          You don't have permission to access Sales Projects. Please contact your administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent text-primary flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <span>Sales Projects</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                  {pagination.total} {pagination.total === 1 ? 'Project' : 'Projects'}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAdmin
                  ? 'Manage sales projects, assign leaders & sales reps, and enter dashboards.'
                  : 'Your assigned sales projects. Click any project to open its dashboard.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Bar: Search + Add Project */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-card border-border/80 focus:border-primary shadow-sm h-10 rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Add Button (Admin only) */}
          {isAdmin && (
            <Button
              onClick={openAddModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 rounded-xl h-10 px-4 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sales Project</span>
            </Button>
          )}
        </div>
      </div>

      {/* Projects Grid / Content */}
      {loading && salesProjects.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-sm animate-pulse">Loading sales projects...</p>
        </div>
      ) : salesProjects.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-card/50 rounded-3xl border border-dashed border-border/80 p-8 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
            <Building2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No sales projects found</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            {debouncedSearch
              ? `No projects matching "${debouncedSearch}". Try a different keyword.`
              : isAdmin
              ? 'Get started by creating your first sales project to showcase products and manage visits.'
              : 'You have not been assigned to any sales projects yet. Please contact your manager.'}
          </p>
          {isAdmin && !debouncedSearch && (
            <Button
              onClick={openAddModal}
              className="mt-6 rounded-xl font-semibold gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {salesProjects.map((project) => {
              const isDesign2 = project.design === 'design 2';
              const membersCount = project.members_count || project.user_ids?.length || 0;

              return (
                <div
                  key={project.id}
                  onClick={() => handleOpenProjectDashboard(project)}
                  className={`group relative bg-card rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col cursor-pointer ${
                    isDesign2
                      ? 'border-indigo-500/30 hover:border-indigo-500 shadow-indigo-500/5'
                      : 'border-border/80 hover:border-primary/60 shadow-sm'
                  }`}
                >
                  {/* Card Header / Logo Preview */}
                  <div className="relative aspect-[16/10] w-full bg-gradient-to-b from-muted/50 to-muted/20 border-b border-border/50 flex items-center justify-center p-6 overflow-hidden">
                    {/* Subtle top decoration badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-card/90 backdrop-blur-md border border-border/70 text-muted-foreground shadow-sm">
                        Sales Project
                      </span>
                    </div>

                    {/* Logo Image */}
                    <img
                      src={project.logo}
                      alt={project.name}
                      className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent && !parent.querySelector('.fallback-logo')) {
                          const fallback = document.createElement('div');
                          fallback.className = `fallback-logo w-16 h-16 rounded-2xl font-bold text-xl flex items-center justify-center shadow-inner ${
                            isDesign2
                              ? 'bg-indigo-500/10 text-indigo-500'
                              : 'bg-primary/10 text-primary'
                          }`;
                          fallback.innerText = project.name.charAt(0).toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />

                    {/* Floating Action Buttons (Admin only) */}
                    {isAdmin && (
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(project);
                          }}
                          title="Edit Project"
                          className="w-8 h-8 rounded-lg bg-card/90 backdrop-blur-md text-foreground hover:text-primary hover:bg-card border border-border shadow-sm flex items-center justify-center transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Project"
                          className="w-8 h-8 rounded-lg bg-card/90 backdrop-blur-md text-destructive hover:bg-destructive hover:text-white border border-border shadow-sm flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Status, Design & Members Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              isDesign2
                                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                                : 'text-primary bg-primary/10 border-primary/20'
                            }`}
                          >
                            <Palette className="w-3 h-3" />
                            <span>{isDesign2 ? 'Design 2' : 'Design 1'}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                            <Users className="w-3 h-3" />
                            <span>{membersCount} {membersCount === 1 ? 'عضو' : 'أعضاء'}</span>
                          </span>
                        </div>

                        {project.createdAt && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <h3
                        className={`text-lg font-bold transition-colors tracking-tight line-clamp-2 ${
                          isDesign2
                            ? 'text-foreground group-hover:text-indigo-500'
                            : 'text-foreground group-hover:text-primary'
                        }`}
                        title={project.name}
                      >
                        {project.name}
                      </h3>
                    </div>

                    {/* Card Bottom Actions */}
                    <div
                      className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenProjectDashboard(project)}
                        disabled={openingProjectId === project.id}
                        className="flex-1 rounded-xl text-xs font-semibold h-8 gap-1.5 shadow-sm"
                      >
                        {openingProjectId === project.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        Open Dashboard
                      </Button>

                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(project)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProjectToDelete(project);
                              setDeleteModalOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-semibold text-foreground">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-foreground">
                  {pagination.total}
                </span>{' '}
                projects
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="rounded-xl h-9 px-3 gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-card border border-border">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  className="rounded-xl h-9 px-3 gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 🚀 ADD / EDIT MODAL (Admin only)                                */}
      {/* ============================================================== */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-card w-full max-w-lg rounded-3xl border border-border/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {editingProject ? <Edit className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editingProject ? 'Edit Sales Project' : 'New Sales Project'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingProject
                      ? 'Update the project name, logo, template, and assigned team members.'
                      : 'Create a new project and assign leaders and sales reps.'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Project Name Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="project-name" className="text-sm font-semibold text-foreground">
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">Required</span>
                </div>
                <Input
                  id="project-name"
                  type="text"
                  placeholder="e.g. Skyline Towers, Green Valley Oasis"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                  }}
                  className={`h-11 rounded-xl bg-background ${
                    formErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Design Template Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-primary" />
                    <span>Design Template</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">Select style</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Option: design 1 */}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, design: 'design 1' }))}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      formData.design === 'design 1'
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40'
                        : 'border-border/80 bg-background hover:border-primary/40'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        formData.design === 'design 1'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Layout className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">design 1</span>
                        {formData.design === 'design 1' && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        Default Style
                      </p>
                    </div>
                  </button>

                  {/* Option: design 2 */}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, design: 'design 2' }))}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      formData.design === 'design 2'
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/40'
                        : 'border-border/80 bg-background hover:border-indigo-500/40'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        formData.design === 'design 2'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">design 2</span>
                        {formData.design === 'design 2' && (
                          <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        Modern Accent
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Assigned Team Members (Leaders & Sales) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <span>فريق العمل (Team Members)</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedUserIds.length} محدد
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-border/70 rounded-2xl p-2.5 space-y-1.5 bg-muted/10">
                  {availableUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      لا يوجد قادة أو مندوبي مبيعات مسجلين حالياً
                    </p>
                  ) : (
                    availableUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUserIds((prev) =>
                              isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-all ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/30 text-foreground font-medium'
                              : 'hover:bg-muted/40 border border-transparent text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-foreground truncate">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {u.email || u.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                u.role === 'leader'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {u.role}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border bg-card'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Logo Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>Project Logo</span>
                    <span className="text-destructive font-bold">*</span>
                  </Label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    Required
                  </span>
                </div>

                {/* Switch upload mode: File vs URL */}
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setLogoMode('file');
                      setFormErrors((prev) => ({ ...prev, logo: null }));
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      logoMode === 'file'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoMode('url');
                      setFormErrors((prev) => ({ ...prev, logo: null }));
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      logoMode === 'url'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {/* Mode: File Upload Drag & Drop */}
                {logoMode === 'file' ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bg-muted/10 hover:bg-muted/20 ${
                      formErrors.logo
                        ? 'border-destructive bg-destructive/5'
                        : previewUrl
                        ? 'border-primary/50'
                        : 'border-border/80 hover:border-primary/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="relative group w-full flex flex-col items-center">
                        <div className="w-32 h-32 rounded-2xl bg-card border border-border/70 p-3 flex items-center justify-center shadow-md overflow-hidden mb-3">
                          <img
                            src={previewUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <p className="text-xs font-semibold text-foreground">
                          {selectedFile ? selectedFile.name : 'Current Logo'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Click or drag a new image to replace
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, SVG, WebP (up to 50MB)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  /* Mode: Image URL */
                  <div className="space-y-3">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={formData.logo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({ ...prev, logo: val }));
                          setPreviewUrl(val);
                          if (formErrors.logo) setFormErrors((prev) => ({ ...prev, logo: null }));
                        }}
                        className={`pl-9 h-11 rounded-xl bg-background ${
                          formErrors.logo ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                      />
                    </div>
                    {previewUrl && (
                      <div className="p-3 bg-muted/20 border border-border rounded-xl flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-card border border-border/80 flex items-center justify-center p-1 overflow-hidden">
                          <img
                            src={previewUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          Previewing URL logo
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {formErrors.logo && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{formErrors.logo}</span>
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={mutationLoading}
                  className="rounded-xl h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mutationLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-10 px-5 flex items-center gap-2"
                >
                  {mutationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProject ? 'Update Project' : 'Create Project'}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ⚠️ DELETE CONFIRMATION MODAL                                    */}
      {/* ============================================================== */}
      {deleteModalOpen && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-card w-full max-w-md rounded-3xl border border-border/80 shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Delete Sales Project</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">"{projectToDelete.name}"</span>?
              This action cannot be undone and its logo file will be removed.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProjectToDelete(null);
                }}
                disabled={mutationLoading}
                className="rounded-xl flex-1 h-10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={mutationLoading}
                className="rounded-xl flex-1 h-10 font-semibold"
              >
                {mutationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesProjects;
