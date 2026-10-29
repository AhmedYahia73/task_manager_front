import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2, Search, Plus, Edit, Trash2, X, Users, PersonStanding, Link as LinkIcon, FolderKanban, Layers, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useRoleNames } from '@/context/RoleNameContext';
import NotesBoard from '@/components/NotesBoard';
import { isAdminRole } from '@/utils/auth';
import { ProjectRoleBadge } from '@/components/ProjectRoleBadge';

const ProjectDetails = () => {
  const { getRoleName, getRoleNamePlural } = useRoleNames();
  const { id } = useParams();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = userData?.role || 'admin';
  const isAdmin = isAdminRole(userRole);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupPage, setGroupPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mobileTab, setMobileTab] = useState('detail'); // 'detail' | 'groups'
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(groupSearch);
      setGroupPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [groupSearch]);

  // Fetch Project Details
  const { data: projectData, loading: projectLoading } = useGet(`/api/admin/project/${id}`);
  const project = projectData?.Project || {};
  const projectUserRole = project?.user_role || (isAdmin ? 'admin' : 'engineer');
  const isLeaderOrAdmin = projectUserRole === 'leader' || isAdmin;

  // Fetch Groups
  const { data: groupsData, loading: groupsLoading, refresh: refreshGroups } = useGet(`/api/admin/projectGroup?project_id=${id}&page=${groupPage}&limit=10&search=${debouncedSearch}`);
  const groups = groupsData?.groups || [];
  const groupPagination = groupsData?.pagination || { totalPages: 1, page: 1, total: 0 };

  // Select first group automatically if none selected and groups are loaded
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    } else if (groups.length === 0) {
      setSelectedGroupId(null);
    }
  }, [groups, selectedGroupId]);

  const activeGroup = groups.find(g => g.id === selectedGroupId) || null;

  // Fetch Group Users when a group is selected
  const { data: groupUsersData, loading: groupUsersLoading, refresh: refreshGroupUsers } = useGet(
    selectedGroupId ? `/api/admin/projectGroup/${selectedGroupId}/users` : null,
    true, // autoFetch
    selectedGroupId // Add dependency on ID so it refetches when ID changes - actually useGet handles URL changes automatically
  );
  
  const assignedUsers = groupUsersData?.users || [];

  // Fetch Project Users
  const { data: projectUsersData, loading: projectUsersLoading } = useGet(`/api/admin/project/${id}/users`);
  const projectUsers = projectUsersData?.users || [];
  const engineersList = projectUsers.filter(u => u.role !== 'admin' && u.role !== 'superadmin' && u.role !== 'super_admin');

  const { mutate, loading: mutationLoading } = useMutation();

  // Group Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isNotesBoardOpen, setIsNotesBoardOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentation: '',
    users_ids: []
  });
  const [selectedDocFile, setSelectedDocFile] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedDocFile(file || null);
  };

  const openModal = async (group = null) => {
    if (group) {
      setEditingId(group.id);
      setFormData({
        name: group.name,
        description: group.description || '',
        documentation: group.documentation || '',
        users_ids: [] 
      });
      setSelectedDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Fetch users for this group to prepopulate multi-select
      const res = await mutate({ method: 'GET', url: `/api/admin/projectGroup/${group.id}/users`, showToast: false });
      if (res?.success && (res.data?.users || res.data?.data?.users)) {
        const users = res.data?.users || res.data?.data?.users;
        setFormData(prev => ({ ...prev, users_ids: users.map(u => u.id) }));
      }
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', documentation: '', users_ids: [] });
      setSelectedDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleUserSelection = (userId) => {
    setFormData(prev => {
      const isSelected = prev.users_ids.includes(userId);
      if (isSelected) {
        return { ...prev, users_ids: prev.users_ids.filter(id => id !== userId) };
      } else {
        return { ...prev, users_ids: [...prev.users_ids, userId] };
      }
    });
  };

  const handleDeleteDoc = async () => {
    if (!window.confirm("Are you sure you want to delete this documentation? It will be deleted permanently from the server and database.")) return;
    if (editingId) {
      const res = await mutate({
        method: 'DELETE',
        url: `/api/admin/projectGroup/${editingId}/documentation`
      });
      if (res?.success) {
        setFormData(prev => ({ ...prev, documentation: '' }));
        setSelectedDocFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        refreshGroups();
      }
    } else {
      setFormData(prev => ({ ...prev, documentation: '' }));
      setSelectedDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('project_id', id);
    if (formData.description) data.append('description', formData.description);

    formData.users_ids.forEach((userId) => {
      data.append('users_ids', userId);
    });

    if (selectedDocFile) {
      data.append('documentation', selectedDocFile);
    } else if (editingId && !formData.documentation) {
      data.append('delete_documentation', 'true');
      data.append('documentation', '');
    }

    const response = await mutate({
      method: editingId ? 'PUT' : 'POST',
      url: editingId ? `/api/admin/projectGroup/${editingId}` : '/api/admin/projectGroup',
      data
    });

    if (response?.success) {
      closeModal();
      refreshGroups();
      if(editingId === selectedGroupId) refreshGroupUsers();
    }
  };

  const handleDeleteGroup = async (groupId, e) => {
    e.stopPropagation(); // prevent selecting the group if deleting
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/projectGroup/${groupId}`
    });

    if (response?.success) {
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
      refreshGroups();
    }
  };

  const handleViewDoc = (e, docString) => {
    e.preventDefault();
    e.stopPropagation();
    if (!docString) return;
    
    try {
      if (docString.startsWith('data:')) {
        const arr = docString.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        let ext = 'file';
        if(mime.includes('word')) ext = 'docx';
        else if(mime.includes('excel') || mime.includes('spreadsheet')) ext = 'xlsx';
        else if(mime.includes('zip')) ext = 'zip';
        else if(mime.includes('pdf')) ext = 'pdf';
        else if(mime.includes('image/jpeg')) ext = 'jpg';
        else if(mime.includes('image/png')) ext = 'png';
        else if(mime.includes('image')) ext = 'img';
        
        link.download = `document_${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        // Try to fetch the URL to force download
        fetch(docString)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = docString.split('/').pop() || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          })
          .catch(() => {
            // Fallback if fetch fails (e.g., CORS)
            window.open(docString, '_blank');
          });
      }
    } catch(err) {
      console.error("Error viewing document:", err);
      toast.error("Could not open this document");
    }
  };

  if (projectLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="admin-project-details p-4 sm:p-6 bg-background min-h-screen font-inter text-foreground">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
        <Link to="/admin/projects" className="hover:underline">Projects</Link>
        <span className="material-symbols-outlined mx-1.5 sm:mx-2 text-[14px] sm:text-[16px]">chevron_right</span>
        <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">{project.name || 'Loading...'}</span>
      </div>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{project.name}</h1>
            <ProjectRoleBadge role={projectUserRole} />
          </div>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground flex-wrap gap-2">
            <span>Created {dayjs(project.createdAt).format('MMM DD, YYYY')}</span>
            {project.documentation && (
              <>
                <span className="hidden sm:inline">•</span>
                <button onClick={(e) => handleViewDoc(e, project.documentation)} className="text-primary hover:underline flex items-center bg-primary/10 px-2 py-0.5 rounded-md border-none cursor-pointer">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Documentation
                </button>
              </>
            )}
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1 bg-[#006c49]/10 text-[#006c49] px-2 py-0.5 rounded-md font-semibold text-xs">
              Approved: {project.progress}%
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md font-semibold text-xs">
              Done: {project.done_progress || 0}%
            </span>
          </div>
          {project.description && <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">{project.description}</p>}
        </div>
        {isLeaderOrAdmin && (
          <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
            <Button onClick={() => setIsTeamModalOpen(true)} variant="outline" className="border-border hover:bg-muted text-foreground flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs sm:text-sm h-10">
              <Users className="w-4 h-4" />
              <span>Project Team</span>
            </Button>
            <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 text-white flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs sm:text-sm h-10">
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📱 Modern Mobile / Responsive Experience (< lg screens)                   */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-4 mb-8">
        {/* Mobile Navigation Tabs: Group Details vs All Groups */}
        <div className="flex bg-muted/80 p-1 rounded-2xl border border-border shadow-xs">
          <button
            type="button"
            onClick={() => setMobileTab('detail')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'detail'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">Group Details {activeGroup ? `(${activeGroup.name})` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('groups')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'groups'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-primary" />
            <span>All Groups ({groupPagination.total})</span>
          </button>
        </div>

        {/* Quick Horizontal Switcher Reel (Scrollable Chips) */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {isLeaderOrAdmin && (
              <button
                type="button"
                onClick={() => openModal()}
                className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-primary/50 text-primary bg-primary/5 text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}
            {groups.map((group) => {
              const isSelected = selectedGroupId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setMobileTab('detail');
                  }}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                  <span className="truncate max-w-[130px]">{group.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {group.progress || 0}%
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 1: 📋 Mobile Group Details View */}
        {mobileTab === 'detail' && (
          !activeGroup ? (
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1">No Group Selected</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Select a group from the list or create a new group to see its tasks and members.
              </p>
              <Button onClick={() => setMobileTab('groups')} variant="outline" className="text-xs">
                Browse Groups ({groupPagination.total})
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Group Hero Card */}
              <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-primary to-primary/75 relative">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                </div>

                <div className="px-4 pb-4 relative">
                  <div className="flex items-start gap-3 -mt-9 mb-3">
                    <div className="w-16 h-16 shrink-0 bg-card rounded-2xl flex items-center justify-center text-primary border-4 border-background shadow-md z-10">
                      <span className="material-symbols-outlined text-3xl">diversity_3</span>
                    </div>
                    <div className="pt-9 min-w-0 flex-1">
                      <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground truncate">
                        {activeGroup.name}
                      </h2>
                      <p className="text-xs text-muted-foreground truncate">
                        Part of <span className="font-semibold">{project.name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress Meters */}
                  <div className="grid grid-cols-2 gap-2 mb-4 bg-muted/40 p-2.5 rounded-xl border border-border/50">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                        <span>Approved</span>
                        <span>{activeGroup.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#006c49] h-full rounded-full transition-all duration-300" style={{ width: `${activeGroup.progress || 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-red-600 dark:text-red-400 mb-1">
                        <span>Done</span>
                        <span>{activeGroup.done_progress || 0}%</span>
                      </div>
                      <div className="w-full bg-red-100 dark:bg-red-950/40 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${activeGroup.done_progress || 0}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Description */}
                  {activeGroup.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 bg-background p-3 rounded-xl border border-border">
                      {activeGroup.description}
                    </p>
                  )}

                  {/* Documentation */}
                  {activeGroup.documentation && (
                    <div className="mb-4">
                      <button 
                        type="button"
                        onClick={(e) => handleViewDoc(e, activeGroup.documentation)} 
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 py-2 rounded-xl transition-colors cursor-pointer border-none font-semibold"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>View Documentation</span>
                      </button>
                    </div>
                  )}

                  {/* Action Hub - Thumb Friendly Mobile Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/60">
                    <Button 
                      type="button"
                      onClick={() => navigate(`/admin/projects/${id}/groups/${activeGroup.id}/tasks`)} 
                      className="bg-primary hover:bg-primary/90 text-white font-bold h-11 rounded-xl shadow-xs flex-1 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">task</span>
                      <span>Manage Tasks</span>
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setIsNotesBoardOpen(true)} 
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted font-semibold h-11 rounded-xl flex-1 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">speaker_notes</span>
                      <span>Notes Board</span>
                    </Button>
                    {isLeaderOrAdmin && (
                      <Button 
                        type="button"
                        onClick={() => openModal(activeGroup)} 
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground h-11 rounded-xl px-3 flex items-center justify-center gap-1 border border-border sm:border-transparent cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="sm:hidden text-xs">Edit Group</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Members Section (Mobile Cards Layout - No Horizontal Scroll!) */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Assigned {getRoleNamePlural('engineer')}</span>
                  </h3>
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    {assignedUsers.length} Members
                  </span>
                </div>

                {groupUsersLoading ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                ) : assignedUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    No {getRoleNamePlural('engineer').toLowerCase()} assigned to this group.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {assignedUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border/80">
                        <div className="w-9 h-9 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-xs border border-border shrink-0 overflow-hidden">
                          {user.image ? (
                            <img 
                              src={user.image.startsWith('http') ? user.image : `${import.meta.env.VITE_API_BASE_URL}${user.image.startsWith('/') ? '' : '/'}${user.image}`} 
                              alt={user.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            user.name ? user.name.charAt(0).toUpperCase() : '?'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-foreground truncate">{user.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground capitalize">
                            {getRoleName(user.role)}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-[#006c49] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]" />
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* TAB 2: 📁 Mobile All Groups View */}
        {mobileTab === 'groups' && (
          <div className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input 
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search groups..." 
                className="pl-9 h-11 rounded-xl border-border bg-card focus-visible:ring-primary text-sm"
              />
              {groupSearch && (
                <button
                  type="button"
                  onClick={() => setGroupSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Groups Feed */}
            {groupsLoading && groups.length === 0 ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : groups.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl bg-card">
                No groups found. Create one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => {
                  const isActive = selectedGroupId === group.id;
                  return (
                    <div
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setMobileTab('detail');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-card shadow-xs ${
                        isActive
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-bold font-['Plus_Jakarta_Sans'] text-foreground text-sm truncate">
                            {group.name}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shrink-0">
                              Active
                            </span>
                          )}
                        </div>

                        {isLeaderOrAdmin && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openModal(group)}
                              title="Edit Group"
                              className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteGroup(group.id, e)}
                                title="Delete Group"
                                className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {group.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {group.description}
                        </p>
                      )}

                      {/* Progress Meters */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                          <span>Approved: {group.progress || 0}%</span>
                          <span className="text-red-600">Done: {group.done_progress || 0}%</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#006c49] h-full" style={{ width: `${group.progress || 0}%` }} />
                          </div>
                          <div className="flex-1 bg-red-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: `${group.done_progress || 0}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        <span>Created {dayjs(group.createdAt).format('MMM D, YYYY')}</span>
                        <span className="text-primary font-bold flex items-center gap-0.5">
                          Open Details <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {groupPagination.totalPages > 1 && (
              <div className="p-3 border border-border rounded-xl flex justify-between items-center bg-card">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setGroupPage((p) => Math.max(1, p - 1))} 
                  disabled={groupPage === 1}
                  className="h-8 px-3 text-xs cursor-pointer"
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-muted-foreground">
                  Page {groupPage} of {groupPagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setGroupPage((p) => Math.min(groupPagination.totalPages, p + 1))} 
                  disabled={groupPage === groupPagination.totalPages}
                  className="h-8 px-3 text-xs cursor-pointer"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🖥️ Desktop Layout (12-column grid, lg: and up) - 100% Preserved           */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (4 cols) - Groups Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6">
          <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col max-h-[calc(100vh-200px)] min-h-[500px]">
            <div className="p-4 border-b border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">Groups</h2>
                <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-semibold">{groupPagination.total} Total</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search groups..." 
                  className="pl-9 h-10 border-border focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {groupsLoading && groups.length === 0 ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : groups.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                  No groups found. Create one to get started.
                </div>
              ) : (
                groups.map(group => {
                  const isActive = selectedGroupId === group.id;
                  return (
                    <div 
                      key={group.id} 
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden shrink-0 ${
                        isActive 
                          ? 'border-primary bg-primary/[0.02] shadow-sm' 
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                      }`}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                      
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold font-['Plus_Jakarta_Sans'] truncate pr-4 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {group.name}
                        </h3>
                        
                        {isLeaderOrAdmin && (
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openModal(group); }} title="Edit Group" className="text-muted-foreground hover:text-primary hover:bg-muted p-1 rounded transition-colors">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button onClick={(e) => handleDeleteGroup(group.id, e)} title="Delete Group" className="text-muted-foreground hover:text-red-500 hover:bg-muted p-1 rounded transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {group.documentation && (
                        <button onClick={(e) => handleViewDoc(e, group.documentation)} className="inline-flex items-center text-xs text-primary bg-primary/10 px-2 py-1 rounded mb-2 hover:bg-primary/20 transition-colors cursor-pointer border-none">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Documentation
                        </button>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10 text-ellipsis">
                        {group.description || <span className="italic text-gray-400">No description</span>}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <div className="flex items-center text-muted-foreground">
                          <Users className="w-3.5 h-3.5 mr-1.5" />
                          Created {dayjs(group.createdAt).format('MMM DD, YYYY')}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden" title={`Approved: ${group.progress || 0}%`}>
                          <div className="bg-[#006c49] h-full" style={{ width: `${group.progress || 0}%` }}></div>
                        </div>
                        <div className="flex-1 bg-red-100 rounded-full h-1.5 overflow-hidden" title={`Done: ${group.done_progress || 0}%`}>
                          <div className="bg-red-500 h-full" style={{ width: `${group.done_progress || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Group Pagination inside sidebar */}
            {groupPagination.totalPages > 1 && (
              <div className="p-3 border-t border-border flex justify-between items-center bg-muted rounded-b-xl">
                <Button variant="ghost" size="sm" onClick={() => setGroupPage(p => Math.max(1, p - 1))} disabled={groupPage === 1} className="h-8 px-2">Prev</Button>
                <span className="text-xs font-medium text-muted-foreground">{groupPage} / {groupPagination.totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setGroupPage(p => Math.min(groupPagination.totalPages, p + 1))} disabled={groupPage === groupPagination.totalPages} className="h-8 px-2">Next</Button>
              </div>
            )}
          </div>
        </div>

        {/* Right (8 cols) - Group Detail View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!activeGroup ? (
            <div className="bg-card rounded-xl border border-border h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
              <Users className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-lg">Select a group to view its details</p>
            </div>
          ) : (
            <>
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-var(--primary) to-var(--primary)/70 w-full relative">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                </div>
                
                <div className="px-6 pb-6 relative">
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 shrink-0 bg-card rounded-2xl flex items-center justify-center text-primary border-4 border-[#f8f9fa] shadow-md z-10 -mt-10">
                        <span className="material-symbols-outlined text-4xl">diversity_3</span>
                      </div>
                      <div className="mt-3">
                        <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{activeGroup.name}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <p className="text-muted-foreground text-sm flex items-center">
                             Part of <span className="font-semibold ml-1">{project.name}</span>
                          </p>
                          {activeGroup.documentation && (
                            <button onClick={(e) => handleViewDoc(e, activeGroup.documentation)} className="text-primary text-xs hover:underline flex items-center bg-primary/10 px-2 py-0.5 rounded-md cursor-pointer border-none">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Documentation
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 xl:mt-0 w-full xl:w-auto">
                      {isLeaderOrAdmin && (
                        <Button onClick={() => openModal(activeGroup)} variant="outline" className="border-primary text-primary hover:bg-primary/5 flex-1 xl:flex-none">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Group
                        </Button>
                      )}
                      <Button onClick={() => navigate(`/admin/projects/${id}/groups/${activeGroup.id}/tasks`)} className="bg-primary hover:bg-primary/90 text-white flex-1 xl:flex-none">
                        <span className="material-symbols-outlined text-sm mr-2">task</span>
                        Manage Tasks
                      </Button>
                      <Button onClick={() => setIsNotesBoardOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 border border-border flex-1 xl:flex-none">
                        <span className="material-symbols-outlined text-sm mr-2">speaker_notes</span>
                        Notes Board
                      </Button>
                    </div>
                  </div>

                  <div className="bg-background p-5 rounded-xl border border-border mb-8 text-muted-foreground text-sm leading-relaxed">
                    <p className="whitespace-pre-line">{activeGroup.description || 'No description provided for this group.'}</p>
                  </div>

                  {/* Assigned Users Table */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Assigned {getRoleNamePlural('engineer')}
                      </h3>
                      <span className="bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        {assignedUsers.length} Members
                      </span>
                    </div>
                    
                    <div className="overflow-hidden border border-border rounded-xl bg-card shadow-sm">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead className="bg-background">
                            <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              <th className="px-6 py-4 font-medium">{getRoleName('engineer')}</th>
                              <th className="px-6 py-4 font-medium">Role</th>
                              <th className="px-6 py-4 font-medium w-32">Status</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-[#edeeef]">
                            {groupUsersLoading ? (
                              <tr><td colSpan="3" className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                            ) : assignedUsers.length === 0 ? (
                              <tr><td colSpan="3" className="py-8 text-center text-muted-foreground">No {getRoleNamePlural('engineer').toLowerCase()} assigned to this group.</td></tr>
                            ) : (
                              assignedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-background transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-sm border border-border shrink-0">
                                        {user.image ? (
                                          <img 
                                            src={user.image.startsWith('http') ? user.image : `${import.meta.env.VITE_API_BASE_URL}${user.image.startsWith('/') ? '' : '/'}${user.image}`} 
                                            alt={user.name} 
                                            className="w-8 h-8 rounded-full object-cover" 
                                          />
                                        ) : (
                                          user.name.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-semibold text-foreground truncate">{user.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground capitalize border border-border whitespace-nowrap">
                                      {getRoleName(user.role)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    {/* Just a mockup status since user table doesn't have availability */}
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-[#006c49]"></div>
                                      <span className="text-xs font-medium text-[#006c49]">Active</span>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Group Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-background rounded-t-2xl">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{editingId ? 'Edit Group' : 'Create New Group'}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-card p-1 rounded-md shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="group-form" onSubmit={handleGroupSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Group Name</label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Frontend Team" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe the group's purpose..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Documentation File</label>
                  <div className="border border-input rounded-md flex items-center bg-card pr-2 overflow-hidden">
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,image/*" 
                      onChange={handleFileChange} 
                      ref={fileInputRef}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {selectedDocFile && (
                      <span className="text-xs text-primary font-medium whitespace-nowrap px-2">{selectedDocFile.name}</span>
                    )}
                  </div>
                  {formData.documentation && !selectedDocFile && (
                    <div className="mt-2 flex items-center justify-between p-2 rounded-md bg-muted/60 border border-border">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-primary text-base">description</span>
                        <span className="text-xs font-medium text-foreground truncate max-w-[180px]">Current Documentation</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button" 
                          onClick={(e) => handleViewDoc(e, formData.documentation)}
                          className="text-xs text-primary hover:underline px-2 py-0.5 rounded bg-primary/10 border-none cursor-pointer font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteDoc}
                          className="text-xs text-destructive hover:bg-destructive/10 px-1.5 py-0.5 rounded border-none cursor-pointer flex items-center gap-1 font-medium transition-colors"
                          title="Delete documentation from server and database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {editingId && !formData.documentation && !selectedDocFile && (
                    <p className="text-xs text-muted-foreground mt-1">No documentation file currently uploaded.</p>
                  )}
                  {editingId && formData.documentation && (
                    <p className="text-xs text-muted-foreground mt-1">Select a new file to replace, or click Delete to remove it.</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1 flex justify-between">
                    <span>Assign {getRoleNamePlural('engineer')}</span>
                    <span className="text-primary bg-primary/10 px-2 rounded-full text-xs py-0.5 flex items-center">
                      {formData.users_ids.length} selected
                    </span>
                  </label>
                  <div className="border border-input rounded-md h-60 overflow-y-auto bg-muted p-3 flex flex-col gap-2 custom-scrollbar shadow-inner">
                    {engineersList.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center h-full flex items-center justify-center">No {getRoleNamePlural('engineer').toLowerCase()} available.</p>
                    ) : (
                      engineersList.map(engineer => {
                        const isSelected = formData.users_ids.includes(engineer.id);
                        return (
                          <div 
                            key={engineer.id} 
                            onClick={() => toggleUserSelection(engineer.id)}
                            className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all border text-sm ${
                              isSelected 
                                ? 'bg-card border-primary shadow-[0_0_0_1px_var(--color-primary)]' 
                                : 'bg-card border-transparent shadow-sm hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center mr-4 transition-colors ${
                              isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-card'
                            }`}>
                              {isSelected && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
                            </div>
                            <div className="flex items-center justify-between flex-1">
                              <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{engineer.name}</span>
                              {engineer.role && (
                                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                                  {getRoleName(engineer.role)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {formData.users_ids.length === 0 && (
                    <p className="text-xs text-red-500 mt-2 flex items-center">
                      <span className="material-symbols-outlined text-[14px] mr-1">error</span>
                      Please select at least one {getRoleName('engineer').toLowerCase()}.
                    </p>
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border bg-card rounded-b-2xl">
              <Button type="button" variant="outline" onClick={closeModal} className="px-6 h-11">
                Cancel
              </Button>
              <Button type="submit" form="group-form" disabled={mutationLoading || formData.users_ids.length === 0} className="bg-primary hover:bg-primary/90 text-white px-6 h-11">
                {mutationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Create Group')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsTeamModalOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-background rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">Project Team</h2>
                <p className="text-sm text-muted-foreground mt-1">Users assigned to this project</p>
              </div>
              <button type="button" onClick={() => setIsTeamModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-card p-1 rounded-md shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar">
              {projectUsersLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : projectUsers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                  No users assigned to this project.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projectUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-sm border border-border shrink-0 overflow-hidden">
                        {user.image ? (
                          <img 
                            src={user.image.startsWith('http') ? user.image : `${import.meta.env.VITE_API_BASE_URL}${user.image.startsWith('/') ? '' : '/'}${user.image}`} 
                            alt={user.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-foreground truncate">{user.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[10px] font-semibold bg-primary-light text-primary w-fit capitalize">
                          {getRoleName(user.role)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border bg-card rounded-b-2xl flex justify-end">
              <Button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-6 h-11 bg-primary hover:bg-primary/90 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notes Board Modal */}
      {activeGroup && (
        <NotesBoard
          isOpen={isNotesBoardOpen}
          onClose={() => setIsNotesBoardOpen(false)}
          groupId={activeGroup.id}
          groupName={activeGroup.name}
          isLeader={isLeaderOrAdmin}
          projectRole={projectUserRole}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
