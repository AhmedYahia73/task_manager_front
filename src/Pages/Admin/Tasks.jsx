import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2, Search, Plus, Edit, Trash2, X, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { useRoleNames } from '@/context/RoleNameContext';

import { toast } from 'sonner';

const Tasks = () => {
  const { getRoleName, getRoleNamePlural } = useRoleNames();
  const { projectId, groupId } = useParams();
  
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

  // Fetch Tasks Data with group_id filter
  const { data: tasksData, loading: tasksLoading, refresh } = useGet(`/api/admin/tasks?group_id=${groupId}&page=${page}&limit=10&search=${debouncedSearch}`);
  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || { totalPages: 1, page: 1, total: 0 };

  // Fetch Lists for Dropdowns
  const { data: listsData } = useGet('/api/admin/tasks/lists');
  const engineersList = listsData?.users_list || [];

  // Fetch Project and Group details for documentation links
  const { data: projectRes } = useGet(`/api/admin/project/${projectId}`);
  const project = projectRes?.Project || projectRes?.data?.Project || projectRes?.project || projectRes?.data?.project;

  const { data: groupRes } = useGet(`/api/admin/projectGroup/${groupId}`);
  const group = groupRes?.group || groupRes?.data?.group;

  const { mutate, loading: mutationLoading } = useMutation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    delivery_date: '',
    status: 'pending',
    importanc_status: 'medium',
    tester_note: '',
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

  const openModal = async (task = null) => {
    if (task) {
      setEditingId(task.id);
      setFormData({
        name: task.name,
        description: task.description || '',
        delivery_date: task.delivery_date ? dayjs(task.delivery_date).format('YYYY-MM-DD') : '',
        status: task.status,
        importanc_status: task.importanc_status || 'medium',
        tester_note: task.tester_note || '',
        documentation: '', // Don't preload URL to avoid invalid base64 on submit
        users_ids: task.user_id ? [task.user_id] : []
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', description: '', delivery_date: '', status: 'pending', importanc_status: 'medium', tester_note: '', documentation: '', users_ids: [] 
      });
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
    // If editing, they might only be allowed one user, but createTasks takes array.
    // Let's support array selection for both, though edit only applies to the specific task record.
    setFormData(prev => {
      const isSelected = prev.users_ids.includes(userId);
      if (isSelected) {
        return { ...prev, users_ids: prev.users_ids.filter(id => id !== userId) };
      } else {
        return { ...prev, users_ids: [...prev.users_ids, userId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Construct payload
    const payload = { 
      ...formData, 
      project_id: projectId,
      group_id: groupId
    };

    if (!payload.delivery_date) delete payload.delivery_date;

    // If editing, the backend expects `user_id` not `users_ids` (as per updateTasksSchema).
    if (editingId) {
        payload.user_id = payload.users_ids[0]; // take the first one if multiple selected by accident
        delete payload.users_ids;
        if (!payload.documentation) delete payload.documentation;
    }

    const response = await mutate({
      method: editingId ? 'PUT' : 'POST',
      url: editingId ? `/api/admin/tasks/${editingId}` : '/api/admin/tasks',
      data: payload
    });

    if (response?.success) {
      closeModal();
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/tasks/${id}`
    });

    if (response?.success) {
      refresh();
    }
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'done': return { color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Done' };
      case 'inprogress': return { color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'In Progress' };
      case 'pending': return { color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Pending' };
      case 'edit': return { color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', label: 'Edit' };
      case 'approve': return { color: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', label: 'Approve' };
      default: return { color: 'bg-muted0', badge: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const response = await mutate({
      method: 'PUT',
      url: `/api/admin/tasks/${taskId}`,
      data: { status: newStatus }
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
      toast.error("Could not open this document");
    }
  };

  const handleImportanceChange = async (taskId, newImportance) => {
    const response = await mutate({
      method: 'PUT',
      url: `/api/admin/tasks/${taskId}`,
      data: { importanc_status: newImportance }
    });
    if (response?.success) {
      refresh();
    }
  };

  const getImportanceStyles = (importance) => {
    switch(importance) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Compute stats for bottom cards
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'inprogress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const editCount = tasks.filter(t => t.status === 'edit').length;
  const approveCount = tasks.filter(t => t.status === 'approve').length;

  return (
    <div className="admin-tasks-page min-h-screen bg-background p-4 md:p-8 font-inter text-foreground">
      {/* Header Section */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-3 text-sm text-muted-foreground flex items-center">
            <Link to="/admin/projects" className="hover:underline hover:text-primary">Projects</Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <Link to={`/admin/projects/${projectId}`} className="hover:underline hover:text-primary">Details</Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <span className="font-semibold text-foreground">Tasks</span>
          </nav>
          <h1 className="font-plus-jakarta text-4xl font-bold tracking-tight text-primary">Task Management</h1>
          <p className="mt-2 text-muted-foreground">Manage tasks for the selected group.</p>
          
          {/* Quick Docs Links */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {project?.documentation && (
              <button onClick={(e) => handleViewDoc(e, project.documentation)} className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer border-none font-medium">
                <span className="material-symbols-outlined text-[18px]">folder</span>
                Project Docs
              </button>
            )}
            {group?.documentation && (
              <button onClick={(e) => handleViewDoc(e, group.documentation)} className="inline-flex items-center gap-1.5 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer border-none font-medium">
                <span className="material-symbols-outlined text-[18px]">topic</span>
                Group Docs
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..." 
              className="pl-9 h-11 border-border focus-visible:ring-primary bg-card rounded-xl shadow-sm"
            />
          </div>
          <Button onClick={() => openModal()} className="h-11 flex items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 shadow-md">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task Table */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-6 py-5 font-semibold rounded-tl-2xl">Task Details</th>
                <th scope="col" className="px-6 py-5 font-semibold">Assigned To</th>
                <th scope="col" className="px-6 py-5 font-semibold">Delivery Date</th>
                <th scope="col" className="px-6 py-5 font-semibold">Importance</th>
                <th scope="col" className="px-6 py-5 font-semibold">Status</th>
                <th scope="col" className="px-6 py-5 font-semibold text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {tasksLoading && tasks.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-muted-foreground"><div className="flex flex-col items-center"><span className="material-symbols-outlined text-4xl mb-2 text-gray-300">task</span>No tasks found.</div></td></tr>
              ) : (
                tasks.map((task) => {
                  const style = getStatusStyles(task.status);
                  return (
                    <tr 
                      key={task.id} 
                      className={`group transition-colors ${task.status === 'done' ? 'opacity-70' : ''} ${task.importanc_status === 'urgent' ? 'urgent-row' : 'bg-card hover:bg-muted'}`}
                    >
                      <td className="relative px-6 py-5">
                        <div className={`absolute left-0 top-0 h-full w-1 ${style.color}`}></div>
                        <div className="flex flex-col">
                          <span className={`font-plus-jakarta text-base font-bold text-foreground ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                            {task.name}
                          </span>
                          <span className="mt-1 text-sm text-muted-foreground line-clamp-2 max-w-md">{task.description || <span className="italic">No description</span>}</span>
                          {task.tester_note && (
                            <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-700 border border-amber-100">
                              <span className="material-symbols-outlined text-[14px]">speaker_notes</span>
                              <span className="font-semibold">{getRoleName('tester')}:</span> {task.tester_note}
                            </span>
                          )}
                          {task.documentation && (
                            <button onClick={(e) => handleViewDoc(e, task.documentation)} className="mt-3 inline-flex w-fit items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors cursor-pointer border-none">
                              <span className="material-symbols-outlined text-[14px]">link</span>
                              Documentation
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {task.user_image ? (
                            <img 
                              src={task.user_image} 
                              alt={task.user_name} 
                              className="h-10 w-10 rounded-full object-cover border border-border" 
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                              {task.user_name ? task.user_name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{task.user_name || 'Unassigned'}</span>
                            <span className="text-xs text-muted-foreground">{task.user_phone || getRoleName('engineer')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-foreground font-medium">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {task.delivery_date ? dayjs(task.delivery_date).format('MMM DD, YYYY') : 'Not Set'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={task.importanc_status || 'medium'}
                          onChange={(e) => handleImportanceChange(task.id, e.target.value)}
                          disabled={userRole === 'engineer'}
                          className={`inline-flex appearance-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${userRole === 'engineer' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer focus:ring-2 focus:ring-primary/50'} focus:outline-none border transition-all ${getImportanceStyles(task.importanc_status || 'medium')}`}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                          <option value="low" className="bg-card text-foreground">Low</option>
                          <option value="medium" className="bg-card text-foreground">Medium</option>
                          <option value="high" className="bg-card text-foreground">High</option>
                          <option value="urgent" className="bg-card text-foreground">Urgent</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          disabled={task.status === 'approve' && userRole === 'engineer'}
                          className={`inline-flex appearance-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${task.status === 'approve' && userRole === 'engineer' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} focus:outline-none focus:ring-2 focus:ring-primary/50 ${style.badge}`}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                          {task.status === 'approve' ? (
                            <>
                              <option value="approve" className="bg-card text-foreground">Approve</option>
                              {userRole !== 'engineer' && <option value="edit" className="bg-card text-foreground">Needs Revision</option>}
                            </>
                          ) : (
                            <>
                              <option value="pending" className="bg-card text-foreground">Pending</option>
                              <option value="inprogress" className="bg-card text-foreground">In Progress</option>
                              <option value="done" className="bg-card text-foreground">Done</option>
                              {userRole === 'engineer' && task.status === 'edit' && (
                                <option value="edit" disabled hidden className="bg-card text-foreground">Needs Revision</option>
                              )}
                              {userRole !== 'engineer' && (
                                <>
                                  <option value="edit" className="bg-card text-foreground">Needs Revision</option>
                                  <option value="approve" className="bg-card text-foreground">Approve</option>
                                </>
                              )}
                            </>
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => openModal(task)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:shadow-sm hover:text-primary transition-all border border-transparent hover:border-border">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:shadow-sm hover:text-red-500 transition-all border border-transparent hover:border-border">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-background px-6 py-4 rounded-b-2xl">
            <span className="text-sm text-muted-foreground font-medium">Showing page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="bg-card"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} 
                disabled={page === pagination.totalPages}
                className="bg-card"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats - Only showing counts for current page as a quick summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <span className="material-symbols-outlined">clock_loader_40</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-foreground">{doneCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <span className="material-symbols-outlined">error</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Needs Revision</p>
            <p className="text-2xl font-bold text-foreground">{editCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-foreground">{approveCount}</p>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-background rounded-t-2xl">
              <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-card p-1.5 rounded-md shadow-sm border border-border">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 custom-scrollbar">
              <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                      Task Name <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Implement Login Page" 
                      required 
                      disabled={userRole === 'engineer' && editingId}
                      className="border-border bg-background focus-visible:ring-primary h-11"
                    />
                  </div>

                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="date" 
                      name="delivery_date" 
                      value={formData.delivery_date} 
                      onChange={handleInputChange} 
                      required 
                      disabled={userRole === 'engineer' && editingId}
                      className="border-border bg-background focus-visible:ring-primary h-11"
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2 relative z-10">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                      Description
                    </label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Detailed explanation of the task..."
                      className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm custom-scrollbar text-foreground placeholder:text-muted-foreground"
                      disabled={userRole === 'engineer' && editingId}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Documentation File</label>
                    <div className="border border-input rounded-xl flex items-center bg-card pr-3 overflow-hidden">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,image/*" 
                        onChange={handleFileChange} 
                        ref={fileInputRef}
                        className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      {formData.documentation && !formData.documentation.startsWith('data:') && (
                        <a href={formData.documentation} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline whitespace-nowrap font-medium">View Current</a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Importance</label>
                    <select 
                      name="importanc_status" 
                      value={formData.importanc_status} 
                      onChange={handleInputChange}
                      required
                      disabled={userRole === 'engineer' && editingId}
                      className="flex w-full h-11 items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange}
                      required
                      disabled={formData.status === 'approve' && userRole === 'engineer'}
                      className="flex w-full h-11 items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {formData.status === 'approve' ? (
                        <>
                          <option value="approve">Approve</option>
                          {userRole !== 'engineer' && <option value="edit">Edit (Needs Revision)</option>}
                        </>
                      ) : (
                        <>
                          <option value="pending">Pending</option>
                          <option value="inprogress">In Progress</option>
                          <option value="done">Done</option>
                          {userRole === 'engineer' && formData.status === 'edit' && (
                            <option value="edit" disabled hidden>Edit (Needs Revision)</option>
                          )}
                          {userRole !== 'engineer' && (
                            <>
                              <option value="edit">Edit (Needs Revision)</option>
                              <option value="approve">Approve</option>
                            </>
                          )}
                        </>
                      )}
                    </select>
                  </div>

                  {userRole !== 'engineer' && (
                    <div className="flex flex-col gap-2 md:col-span-2 relative z-20">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                        Assign To
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {engineersList.map(eng => {
                          const isSelected = formData.users_ids.includes(eng.id);
                          return (
                            <div 
                              key={eng.id}
                              onClick={() => toggleUserSelection(eng.id)}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'border-border bg-card hover:border-primary/30'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input bg-background'}`}>
                                {isSelected && <span className="material-symbols-outlined text-[12px] text-primary-foreground font-bold">check</span>}
                              </div>
                              <div className="flex items-center gap-2 overflow-hidden">
                                {eng.image ? (
                                  <img src={eng.image} alt={eng.name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                    {eng.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs font-semibold truncate text-foreground">{eng.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {formData.users_ids.length === 0 && (
                        <p className="text-xs text-red-500 mt-2 flex items-center font-medium">
                          <span className="material-symbols-outlined text-[16px] mr-1">error</span>
                          Please assign at least one {getRoleName('engineer').toLowerCase()}.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{getRoleName('tester')} Note (Optional)</label>
                    <textarea 
                      name="tester_note"
                      value={formData.tester_note}
                      onChange={handleInputChange}
                      className="w-full flex min-h-[80px] rounded-xl border border-input bg-amber-50/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder={`Add any QA or ${getRoleName('tester').toLowerCase()} feedback here...`}
                      rows={2}
                    />
                  </div>

                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border bg-card rounded-b-2xl">
              <Button type="button" variant="outline" onClick={closeModal} className="px-6 h-11 rounded-xl font-semibold text-muted-foreground">
                Cancel
              </Button>
              <Button type="submit" form="task-form" disabled={mutationLoading || formData.users_ids.length === 0} className="bg-primary hover:bg-primary/90 text-white px-8 h-11 rounded-xl font-bold shadow-md">
                {mutationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Update Task' : 'Create Task')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
