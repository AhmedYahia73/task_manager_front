import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, Edit, Trash2, X, Link as LinkIcon, Image as ImageIcon, Users } from 'lucide-react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { useRoleNames } from '@/context/RoleNameContext';

const Projects = () => {
  const { getRoleName, getRoleNamePlural } = useRoleNames();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role?.toLowerCase?.() || '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Projects Data
  const { data: projectsData, loading, refresh } = useGet(`/api/admin/project?page=${page}&limit=9&search=${debouncedSearch}`);
  const projects = projectsData?.Projects || [];
  const pagination = projectsData?.pagination || { totalPages: 1, page: 1, total: 0 };

  // Fetch Lists for Dropdowns
  const { data: listsData } = useGet('/api/admin/project/lists');
  const testersList = listsData?.testers || [];
  const engineersList = listsData?.users_list || [];

  const { mutate, loading: mutationLoading } = useMutation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentation: '', // Will hold base64 string
    tester_id: '',
    users_ids: []
  });
  const fileInputRef = useRef(null);

  const openModal = (project = null) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        name: project.name,
        description: project.description || '',
        documentation: '', // Don't preload base64 of existing file, only update if new file selected
        tester_id: project.tester_id || '',
        users_ids: [] // We don't get users_ids in the main project list, might need to fetch them if editing, but the backend requires it on PUT.
        // Wait, updateProjectSchema in backend says users_ids is optional. So if it's empty, it might be ignored or might delete all. We should fetch them to prepopulate, but for now we will leave it empty and only update if changed, OR we fetch project users.
      });
      // Fetch users for this project to pre-fill multi-select
      fetchProjectUsers(project.id);
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', documentation: '', tester_id: '', users_ids: [] });
    }
    setIsModalOpen(true);
  };

  const fetchProjectUsers = async (id) => {
    const res = await mutate({ method: 'GET', url: `/api/admin/project/${id}/users`, showToast: false });
    if (res?.success && (res.data?.users || res.data?.data?.users)) {
      const users = res.data?.users || res.data?.data?.users;
      setFormData(prev => ({ ...prev, users_ids: users.map(u => u.id) }));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    if (!payload.documentation) {
      delete payload.documentation;
    }

    const response = await mutate({
      method: editingId ? 'PUT' : 'POST',
      url: editingId ? `/api/admin/project/${editingId}` : '/api/admin/project',
      data: payload
    });

    if (response?.success) {
      closeModal();
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/project/${id}`
    });

    if (response?.success) {
      refresh();
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
    }
  };

  const colors = [
    { border: 'border-l-var(--primary)', bg: 'bg-primary' },
    { border: 'border-l-[#006c49]', bg: 'bg-[#006c49]' },
    { border: 'border-l-[#684000]', bg: 'bg-[#684000]' },
    { border: 'border-l-[#ba1a1a]', bg: 'bg-[#ba1a1a]' },
    { border: 'border-l-[#0061a4]', bg: 'bg-[#0061a4]' }
  ];

  return (
    <div className="admin-projects p-4 md:p-8 min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Plus_Jakarta_Sans'] text-primary mb-2">Projects</h1>
          <p className="text-muted-foreground font-['Inter']">Manage your enterprise workflow and testing cycles.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-card px-3 py-2 rounded-lg shadow-sm border border-border flex items-center gap-2 flex-1 md:w-64">
            <Search className="text-muted-foreground w-4 h-4" />
            <Input 
              type="text" 
              placeholder="Search projects..." 
              className="border-none shadow-none focus-visible:ring-0 h-auto p-0 text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {userRole !== 'engineer' && (
            <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Add Project
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {loading && projects.length === 0 ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">folder_off</span>
            <p>No projects found.</p>
          </div>
        ) : (
          projects.map((project, idx) => {
            const colorTheme = colors[idx % colors.length];
            return (
              <div key={project.id} className={`bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col relative border-l-4 ${colorTheme.border}`}>
                <div className="absolute top-4 right-4 flex gap-2">
                  {userRole !== 'engineer' && (
                    <div className="flex gap-2">
                      <button onClick={() => openModal(project)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-border">
                        <Edit className="w-4 h-4" />
                      </button>
                      {userRole !== 'tester' && (
                        <button onClick={() => handleDelete(project.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-border">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] mb-2 pr-16 truncate" title={project.name}>{project.name}</h3>
                <p className="text-muted-foreground font-['Inter'] text-sm mb-6 line-clamp-2 h-10">{project.description || 'No description provided.'}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>Approved: {project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div className={`${colorTheme.bg} h-2 rounded-full transition-all duration-500`} style={{ width: `${project.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm font-medium mb-2 text-red-600">
                    <span>Done: {project.done_progress || 0}%</span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${project.done_progress || 0}%` }}></div>
                  </div>
                </div>

                {project.documentation && (
                  <button onClick={(e) => handleViewDoc(e, project.documentation)} className="text-sm text-primary flex items-center gap-1 mb-6 hover:underline w-fit bg-transparent border-none cursor-pointer p-0">
                    <LinkIcon className="w-4 h-4" />
                    Documentation
                  </button>
                )}
                {!project.documentation && (
                  <div className="text-sm text-gray-400 flex items-center gap-1 mb-6 w-fit">
                    <LinkIcon className="w-4 h-4" />
                    No Documentation
                  </div>
                )}

                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium w-24">Lead {getRoleName('tester')}:</span>
                    {project.tester_name ? (
                      <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md">
                        {project.tester_image ? (
                          <img 
                            src={project.tester_image.startsWith('http') ? project.tester_image : `${import.meta.env.VITE_API_BASE_URL}${project.tester_image.startsWith('/') ? '' : '/'}${project.tester_image}`} 
                            alt={project.tester_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                            {project.tester_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-foreground">{project.tester_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium w-24">{getRoleNamePlural('engineer')}:</span>
                    {project.users && project.users.length > 0 ? (
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {project.users.slice(0, 5).map((user, i) => (
                          <div key={user.id || i} className="inline-block rounded-full ring-2 ring-card bg-muted text-primary w-7 h-7 flex items-center justify-center text-[10px] font-bold border border-border shrink-0 z-10">
                            {user.image ? (
                              <img 
                                src={user.image.startsWith('http') ? user.image : `${import.meta.env.VITE_API_BASE_URL}${user.image.startsWith('/') ? '' : '/'}${user.image}`} 
                                alt={user.name} 
                                title={user.name}
                                className="w-full h-full object-cover rounded-full" 
                              />
                            ) : (
                              <span title={user.name}>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
                            )}
                          </div>
                        ))}
                        {project.users.length > 5 && (
                          <div className="inline-block rounded-full ring-2 ring-card bg-background text-muted-foreground w-7 h-7 flex items-center justify-center text-[10px] font-bold border border-border z-0">
                            +{project.users.length - 5}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No {getRoleNamePlural('engineer').toLowerCase()} assigned</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3">
                  <Button 
                    onClick={() => {
                      setSelectedProjectForMembers(project);
                      setMembersModalOpen(true);
                    }} 
                    variant="outline" 
                    className="flex-1 border-muted text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Members
                  </Button>
                  <Button onClick={() => navigate(`/admin/projects/${project.id}`)} variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/5">
                    View Details
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button 
            variant="outline" 
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
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="text-muted-foreground"
          >
            Next
          </Button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-card rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-background rounded-t-2xl">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{editingId ? 'Edit Project' : 'Create New Project'}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-card p-1 rounded-md shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Project Name</label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Quantum Pay Gateway" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter project description"
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
                  </div>
                  {editingId && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current documentation file.</p>}
                </div>
                
                {userRole !== 'tester' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Assign {getRoleName('tester')}</label>
                    <select 
                      name="tester_id" 
                      value={formData.tester_id} 
                      onChange={handleInputChange}
                      required
                      className="flex w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a {getRoleName('tester')}</option>
                      {testersList.map(tester => (
                        <option key={tester.id} value={tester.id}>{tester.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1 flex justify-between">
                    <span>Assign {getRoleNamePlural('engineer')}</span>
                    <span className="text-primary">{formData.users_ids.length} selected</span>
                  </label>
                  <div className="border border-input rounded-md max-h-40 overflow-y-auto bg-card p-2 flex flex-col gap-1">
                    {engineersList.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center">No {getRoleNamePlural('engineer').toLowerCase()} available.</p>
                    ) : (
                      engineersList.map(engineer => (
                        <div 
                          key={engineer.id} 
                          onClick={() => toggleUserSelection(engineer.id)}
                          className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors text-sm ${
                            formData.users_ids.includes(engineer.id) 
                              ? 'bg-primary/10 text-primary font-medium' 
                              : 'hover:bg-gray-100 text-muted-foreground'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${
                            formData.users_ids.includes(engineer.id) ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {formData.users_ids.includes(engineer.id) && <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>}
                          </div>
                          {engineer.name}
                        </div>
                      ))
                    )}
                  </div>
                  {formData.users_ids.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please select at least one {getRoleName('engineer').toLowerCase()}.</p>
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border bg-card rounded-b-2xl">
              <Button type="button" variant="outline" onClick={closeModal} className="px-6">
                Cancel
              </Button>
              <Button type="submit" form="project-form" disabled={mutationLoading || formData.users_ids.length === 0} className="bg-primary hover:bg-primary/90 text-white px-6">
                {mutationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Update Project' : 'Create Project')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {membersModalOpen && selectedProjectForMembers && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setMembersModalOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-background rounded-t-2xl">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Project Members
              </h2>
              <button type="button" onClick={() => setMembersModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-card p-1 rounded-md shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead {getRoleName('tester')}</h3>
                {selectedProjectForMembers.tester_name ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {selectedProjectForMembers.tester_image ? (
                      <img 
                        src={selectedProjectForMembers.tester_image.startsWith('http') ? selectedProjectForMembers.tester_image : `${import.meta.env.VITE_API_BASE_URL}${selectedProjectForMembers.tester_image.startsWith('/') ? '' : '/'}${selectedProjectForMembers.tester_image}`} 
                        alt={selectedProjectForMembers.tester_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold border-2 border-background shadow-sm">
                        {selectedProjectForMembers.tester_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground text-sm">{selectedProjectForMembers.tester_name}</p>
                      <p className="text-xs text-muted-foreground">{getRoleName('tester')}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No {getRoleName('tester').toLowerCase()} assigned.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{getRoleNamePlural('engineer')} ({selectedProjectForMembers.users?.length || 0})</h3>
                {selectedProjectForMembers.users && selectedProjectForMembers.users.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedProjectForMembers.users.map((user, i) => (
                      <div key={user.id || i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
                        {user.image ? (
                          <img 
                            src={user.image.startsWith('http') ? user.image : `${import.meta.env.VITE_API_BASE_URL}${user.image.startsWith('/') ? '' : '/'}${user.image}`} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted text-primary flex items-center justify-center text-sm font-bold border-2 border-background shadow-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{getRoleName('engineer')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No {getRoleNamePlural('engineer').toLowerCase()} assigned.</p>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-card rounded-b-2xl flex justify-end">
              <Button onClick={() => setMembersModalOpen(false)} variant="outline" className="px-6">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
