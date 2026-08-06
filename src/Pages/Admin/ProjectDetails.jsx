import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2, Search, Plus, Edit, Trash2, X, Users, PersonStanding, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useRoleNames } from '@/context/RoleNameContext';

const ProjectDetails = () => {
  const { getRoleName, getRoleNamePlural } = useRoleNames();
  const { id } = useParams();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = userData?.role || 'admin';
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupPage, setGroupPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
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
  const engineersList = projectUsers.filter(u => u.role !== 'admin' && u.role !== 'tester' && u.role !== 'superadmin'); // Exclude admins and testers from group assignment

  const { mutate, loading: mutationLoading } = useMutation();

  // Group Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentation: '',
    users_ids: []
  });
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, documentation: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, documentation: '' });
    }
  };

  const openModal = async (group = null) => {
    if (group) {
      setEditingId(group.id);
      setFormData({
        name: group.name,
        description: group.description || '',
        documentation: '', // Don't preload URL to avoid invalid base64 on submit
        users_ids: [] 
      });
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
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, project_id: id };

    if (!payload.documentation) {
      delete payload.documentation;
    }

    const response = await mutate({
      method: editingId ? 'PUT' : 'POST',
      url: editingId ? `/api/admin/projectGroup/${editingId}` : '/api/admin/projectGroup',
      data: payload
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
    <div className="admin-project-details p-6 bg-background min-h-screen font-inter text-foreground">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Link to="/admin/projects" className="hover:underline">Projects</Link>
        <span className="material-symbols-outlined mx-2 text-[16px]">chevron_right</span>
        <span className="font-semibold text-foreground">{project.name || 'Loading...'}</span>
      </div>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Plus_Jakarta_Sans'] text-foreground mb-2">{project.name}</h1>
          <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-2">
            <span>Created {dayjs(project.createdAt).format('MMM DD, YYYY')}</span>
            {project.documentation && (
              <>
                <span className="hidden md:inline">•</span>
                <button onClick={(e) => handleViewDoc(e, project.documentation)} className="text-primary hover:underline flex items-center bg-primary/10 px-2 py-0.5 rounded-md border-none cursor-pointer">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Documentation
                </button>
              </>
            )}
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1 bg-[#006c49]/10 text-[#006c49] px-2 py-0.5 rounded-md font-medium">
              Approved: {project.progress}%
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-medium">
              Done: {project.done_progress || 0}%
            </span>
          </div>
          {project.description && <p className="mt-3 text-sm text-muted-foreground max-w-3xl">{project.description}</p>}
        </div>
        {userRole !== 'engineer' && (
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={() => setIsTeamModalOpen(true)} variant="outline" className="border-border hover:bg-muted text-foreground w-full md:w-auto flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Project Team
            </Button>
            <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 text-white w-full md:w-auto flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </div>
        )}
      </div>

      {/* Main Layout - 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
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
                        
                        {userRole !== 'engineer' && (
                          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <button onClick={(e) => { e.stopPropagation(); openModal(group); }} className="text-gray-400 hover:text-primary p-1">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {userRole !== 'tester' && (
                              <button onClick={(e) => handleDeleteGroup(group.id, e)} className="text-gray-400 hover:text-red-500 p-1">
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
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 shrink-0 bg-card rounded-2xl flex items-center justify-center text-primary border-4 border-[#f8f9fa] shadow-md z-10 -mt-10">
                        <span className="material-symbols-outlined text-4xl">diversity_3</span>
                      </div>
                      <div className="mt-3">
                        <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{activeGroup.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
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
                    <div className="flex gap-2 mt-3">
                      {userRole !== 'engineer' && (
                        <Button onClick={() => openModal(activeGroup)} variant="outline" className="border-primary text-primary hover:bg-primary/5">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Group
                        </Button>
                      )}
                      <Button onClick={() => navigate(`/admin/projects/${id}/groups/${activeGroup.id}/tasks`)} className="bg-primary hover:bg-primary/90 text-white">
                        <span className="material-symbols-outlined text-sm mr-2">task</span>
                        Manage Tasks
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
                      <span className="bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-bold">
                        {assignedUsers.length} Members
                      </span>
                    </div>
                    
                    <div className="overflow-hidden border border-border rounded-xl bg-card shadow-sm">
                      <table className="w-full text-left border-collapse">
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
                                    <div className="w-8 h-8 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-sm border border-border">
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
                                    <div>
                                      <div className="font-semibold text-foreground">{user.name}</div>
                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground capitalize border border-border">
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
                    {formData.documentation && !formData.documentation.startsWith('data:') && (
                      <a href={formData.documentation} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline whitespace-nowrap">View Current</a>
                    )}
                  </div>
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
                            <div className="flex flex-col">
                              <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{engineer.name}</span>
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
    </div>
  );
};

export default ProjectDetails;
