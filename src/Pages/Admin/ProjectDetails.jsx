import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2, Search, Plus, Edit, Trash2, X, Users, PersonStanding, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Fetch List for Modals
  const { data: listsData } = useGet('/api/admin/projectGroup/lists');
  const engineersList = listsData?.users_list || [];

  const { mutate, loading: mutationLoading } = useMutation();

  // Group Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    users_ids: []
  });

  const openModal = async (group = null) => {
    if (group) {
      setEditingId(group.id);
      setFormData({
        name: group.name,
        description: group.description || '',
        users_ids: [] 
      });
      // Fetch users for this group to prepopulate multi-select
      const res = await mutate({ method: 'GET', url: `/api/admin/projectGroup/${group.id}/users`, showToast: false });
      if (res?.success && (res.data?.users || res.data?.data?.users)) {
        const users = res.data?.users || res.data?.data?.users;
        setFormData(prev => ({ ...prev, users_ids: users.map(u => u.id) }));
      }
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', users_ids: [] });
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

  if (projectLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]"><Loader2 className="w-10 h-10 animate-spin text-[#3525cd]" /></div>;
  }

  return (
    <div className="admin-project-details p-6 bg-[#f8f9fa] min-h-screen font-inter text-[#191c1d]">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-[#464555] mb-6">
        <Link to="/admin/projects" className="hover:underline">Projects</Link>
        <span className="material-symbols-outlined mx-2 text-[16px]">chevron_right</span>
        <span className="font-semibold text-[#191c1d]">{project.name || 'Loading...'}</span>
      </div>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d] mb-2">{project.name}</h1>
          <div className="flex items-center text-sm text-[#464555] flex-wrap gap-2">
            <span>Created {dayjs(project.createdAt).format('MMM DD, YYYY')}</span>
            {project.documentation && (
              <>
                <span className="hidden md:inline">•</span>
                <a href={project.documentation} target="_blank" rel="noreferrer" className="text-[#3525cd] hover:underline flex items-center bg-[#3525cd]/10 px-2 py-0.5 rounded-md">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Documentation
                </a>
              </>
            )}
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1 bg-[#006c49]/10 text-[#006c49] px-2 py-0.5 rounded-md font-medium">
              Progress: {project.progress}%
            </span>
          </div>
          {project.description && <p className="mt-3 text-sm text-gray-600 max-w-3xl">{project.description}</p>}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={() => openModal()} className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white w-full md:w-auto flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Main Layout - 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (4 cols) - Groups Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#edeeef] shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
            <div className="p-4 border-b border-[#edeeef]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">Groups</h2>
                <span className="bg-[#f3f4f5] text-[#464555] px-2 py-1 rounded-md text-xs font-semibold">{groupPagination.total} Total</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search groups..." 
                  className="pl-9 h-10 border-gray-200 focus-visible:ring-[#3525cd]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {groupsLoading && groups.length === 0 ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#3525cd]" /></div>
              ) : groups.length === 0 ? (
                <div className="text-center p-8 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  No groups found. Create one to get started.
                </div>
              ) : (
                groups.map(group => {
                  const isActive = selectedGroupId === group.id;
                  return (
                    <div 
                      key={group.id} 
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                        isActive 
                          ? 'border-[#3525cd] bg-[#3525cd]/[0.02] shadow-sm' 
                          : 'border-[#edeeef] bg-white hover:border-[#3525cd]/50 hover:bg-gray-50'
                      }`}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3525cd]"></div>}
                      
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold font-['Plus_Jakarta_Sans'] truncate pr-4 ${isActive ? 'text-[#3525cd]' : 'text-[#191c1d]'}`}>
                          {group.name}
                        </h3>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); openModal(group); }} className="text-gray-400 hover:text-[#3525cd] p-1">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDeleteGroup(group.id, e)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-[#464555] line-clamp-2 mb-3 h-10 text-ellipsis">
                        {group.description || <span className="italic text-gray-400">No description</span>}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        Created {dayjs(group.createdAt).format('MMM DD, YYYY')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Group Pagination inside sidebar */}
            {groupPagination.totalPages > 1 && (
              <div className="p-3 border-t border-[#edeeef] flex justify-between items-center bg-gray-50 rounded-b-xl">
                <Button variant="ghost" size="sm" onClick={() => setGroupPage(p => Math.max(1, p - 1))} disabled={groupPage === 1} className="h-8 px-2">Prev</Button>
                <span className="text-xs font-medium text-gray-600">{groupPage} / {groupPagination.totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setGroupPage(p => Math.min(groupPagination.totalPages, p + 1))} disabled={groupPage === groupPagination.totalPages} className="h-8 px-2">Next</Button>
              </div>
            )}
          </div>
        </div>

        {/* Right (8 cols) - Group Detail View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!activeGroup ? (
            <div className="bg-white rounded-xl border border-gray-200 h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
              <Users className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-lg">Select a group to view its details</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-[#edeeef] shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-[#3525cd] to-[#3525cd]/70 w-full relative">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                </div>
                
                <div className="px-6 pb-6 relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 shrink-0 bg-white rounded-2xl flex items-center justify-center text-[#3525cd] border-4 border-[#f8f9fa] shadow-md z-10 -mt-10">
                        <span className="material-symbols-outlined text-4xl">diversity_3</span>
                      </div>
                      <div className="mt-3">
                        <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">{activeGroup.name}</h2>
                        <p className="text-[#464555] text-sm flex items-center mt-1">
                           Part of <span className="font-semibold ml-1">{project.name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => openModal(activeGroup)} variant="outline" className="border-[#3525cd] text-[#3525cd] hover:bg-[#3525cd]/5">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Group
                      </Button>
                      <Button onClick={() => navigate(`/admin/projects/${id}/groups/${activeGroup.id}/tasks`)} className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white">
                        <span className="material-symbols-outlined text-sm mr-2">task</span>
                        Manage Tasks
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] p-5 rounded-xl border border-[#edeeef] mb-8 text-[#464555] text-sm leading-relaxed">
                    <p className="whitespace-pre-line">{activeGroup.description || 'No description provided for this group.'}</p>
                  </div>

                  {/* Assigned Users Table */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#3525cd]" />
                        Assigned Engineers
                      </h3>
                      <span className="bg-[#e0e0ff] text-[#3525cd] px-3 py-1 rounded-full text-xs font-bold">
                        {assignedUsers.length} Members
                      </span>
                    </div>
                    
                    <div className="overflow-hidden border border-[#edeeef] rounded-xl bg-white shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8f9fa]">
                          <tr className="border-b border-[#edeeef] text-xs font-semibold text-[#464555] uppercase tracking-wider">
                            <th className="px-6 py-4 font-medium">Engineer</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium w-32">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-[#edeeef]">
                          {groupUsersLoading ? (
                            <tr><td colSpan="3" className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#3525cd]" /></td></tr>
                          ) : assignedUsers.length === 0 ? (
                            <tr><td colSpan="3" className="py-8 text-center text-gray-500">No engineers assigned to this group.</td></tr>
                          ) : (
                            assignedUsers.map(user => (
                              <tr key={user.id} className="hover:bg-[#f8f9fa] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#3525cd]/10 text-[#3525cd] flex items-center justify-center font-bold border border-[#3525cd]/20">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-[#191c1d]">{user.name}</div>
                                      <div className="text-xs text-[#464555]">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#f3f4f5] text-[#464555] capitalize border border-gray-200">
                                    {user.role}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#f8f9fa] rounded-t-2xl">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">{editingId ? 'Edit Group' : 'Create New Group'}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-white p-1 rounded-md shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="group-form" onSubmit={handleGroupSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#191c1d] mb-1">Group Name</label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Frontend Team" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#191c1d] mb-1">Description</label>
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
                  <label className="block text-sm font-medium text-[#191c1d] mb-1 flex justify-between">
                    <span>Assign Engineers</span>
                    <span className="text-[#3525cd] bg-[#3525cd]/10 px-2 rounded-full text-xs py-0.5 flex items-center">
                      {formData.users_ids.length} selected
                    </span>
                  </label>
                  <div className="border border-input rounded-md h-60 overflow-y-auto bg-gray-50 p-3 flex flex-col gap-2 custom-scrollbar shadow-inner">
                    {engineersList.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2 text-center h-full flex items-center justify-center">No engineers available.</p>
                    ) : (
                      engineersList.map(engineer => {
                        const isSelected = formData.users_ids.includes(engineer.id);
                        return (
                          <div 
                            key={engineer.id} 
                            onClick={() => toggleUserSelection(engineer.id)}
                            className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all border text-sm ${
                              isSelected 
                                ? 'bg-white border-[#3525cd] shadow-[0_0_0_1px_#3525cd]' 
                                : 'bg-white border-transparent shadow-sm hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center mr-4 transition-colors ${
                              isSelected ? 'bg-[#3525cd] border-[#3525cd]' : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-semibold ${isSelected ? 'text-[#3525cd]' : 'text-[#191c1d]'}`}>{engineer.name}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {formData.users_ids.length === 0 && (
                    <p className="text-xs text-red-500 mt-2 flex items-center">
                      <span className="material-symbols-outlined text-[14px] mr-1">error</span>
                      Please select at least one engineer.
                    </p>
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-white rounded-b-2xl">
              <Button type="button" variant="outline" onClick={closeModal} className="px-6 h-11">
                Cancel
              </Button>
              <Button type="submit" form="group-form" disabled={mutationLoading || formData.users_ids.length === 0} className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white px-6 h-11">
                {mutationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Create Group')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
