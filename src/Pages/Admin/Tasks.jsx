import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2, Search, Plus, Edit, Trash2, X, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

const Tasks = () => {
  const { projectId, groupId } = useParams();
  
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

  const { mutate, loading: mutationLoading } = useMutation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    delivery_date: '',
    status: 'pending',
    tester_note: '',
    users_ids: []
  });

  const openModal = async (task = null) => {
    if (task) {
      setEditingId(task.id);
      setFormData({
        name: task.name,
        description: task.description || '',
        delivery_date: task.delivery_date ? dayjs(task.delivery_date).format('YYYY-MM-DD') : '',
        status: task.status,
        tester_note: task.tester_note || '',
        users_ids: task.user_id ? [task.user_id] : []
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', description: '', delivery_date: '', status: 'pending', tester_note: '', users_ids: [] 
      });
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
      default: return { color: 'bg-gray-500', badge: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  // Compute stats for bottom cards
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'inprogress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const editCount = tasks.filter(t => t.status === 'edit').length;

  return (
    <div className="admin-tasks-page min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-inter text-[#191c1d]">
      {/* Header Section */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-3 text-sm text-[#464555] flex items-center">
            <Link to="/admin/projects" className="hover:underline hover:text-[#3525cd]">Projects</Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <Link to={`/admin/projects/${projectId}`} className="hover:underline hover:text-[#3525cd]">Details</Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <span className="font-semibold text-[#191c1d]">Tasks</span>
          </nav>
          <h1 className="font-plus-jakarta text-4xl font-bold tracking-tight text-[#3525cd]">Task Management</h1>
          <p className="mt-2 text-[#464555]">Manage tasks for the selected group.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..." 
              className="pl-9 h-11 border-gray-200 focus-visible:ring-[#3525cd] bg-white rounded-xl shadow-sm"
            />
          </div>
          <Button onClick={() => openModal()} className="h-11 flex items-center gap-2 rounded-xl bg-[#3525cd] px-5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 shadow-md">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task Table */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-[#edeeef] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f3f4f5] text-xs uppercase tracking-wider text-[#464555]">
              <tr>
                <th scope="col" className="px-6 py-5 font-semibold rounded-tl-2xl">Task Details</th>
                <th scope="col" className="px-6 py-5 font-semibold">Assigned To</th>
                <th scope="col" className="px-6 py-5 font-semibold">Delivery Date</th>
                <th scope="col" className="px-6 py-5 font-semibold">Status</th>
                <th scope="col" className="px-6 py-5 font-semibold text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {tasksLoading && tasks.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3525cd]" /></td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-gray-500"><div className="flex flex-col items-center"><span className="material-symbols-outlined text-4xl mb-2 text-gray-300">task</span>No tasks found.</div></td></tr>
              ) : (
                tasks.map((task) => {
                  const style = getStatusStyles(task.status);
                  return (
                    <tr 
                      key={task.id} 
                      className={`group bg-white hover:bg-[#f3f4f5] transition-colors ${task.status === 'done' ? 'opacity-70' : ''}`}
                    >
                      <td className="relative px-6 py-5">
                        <div className={`absolute left-0 top-0 h-full w-1 ${style.color}`}></div>
                        <div className="flex flex-col">
                          <span className={`font-plus-jakarta text-base font-bold text-[#191c1d] ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                            {task.name}
                          </span>
                          <span className="mt-1 text-sm text-[#464555] line-clamp-2 max-w-md">{task.description || <span className="italic">No description</span>}</span>
                          {task.tester_note && (
                            <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-700 border border-amber-100">
                              <span className="material-symbols-outlined text-[14px]">speaker_notes</span>
                              {task.tester_note}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3525cd]/10 text-[#3525cd] font-bold border border-[#3525cd]/20">
                            {task.user_name ? task.user_name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#191c1d]">{task.user_name || 'Unassigned'}</span>
                            <span className="text-xs text-[#464555]">{task.user_phone || 'Engineer'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-[#191c1d] font-medium">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {task.delivery_date ? dayjs(task.delivery_date).format('MMM DD, YYYY') : 'Not Set'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${style.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${style.color}`}></span>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => openModal(task)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#464555] hover:bg-white hover:shadow-sm hover:text-[#3525cd] transition-all border border-transparent hover:border-gray-200">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#464555] hover:bg-white hover:shadow-sm hover:text-red-500 transition-all border border-transparent hover:border-gray-200">
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
          <div className="flex items-center justify-between border-t border-[#edeeef] bg-[#f8f9fa] px-6 py-4 rounded-b-2xl">
            <span className="text-sm text-[#464555] font-medium">Showing page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="bg-white"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} 
                disabled={page === pagination.totalPages}
                className="bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats - Only showing counts for current page as a quick summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">Pending</p>
            <p className="text-2xl font-bold text-[#191c1d]">{pendingCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <span className="material-symbols-outlined">clock_loader_40</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">In Progress</p>
            <p className="text-2xl font-bold text-[#191c1d]">{inProgressCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">Completed</p>
            <p className="text-2xl font-bold text-[#191c1d]">{doneCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl border border-[#edeeef] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <span className="material-symbols-outlined">error</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#464555]">Needs Revision</p>
            <p className="text-2xl font-bold text-[#191c1d]">{editCount}</p>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#f8f9fa] rounded-t-2xl">
              <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#191c1d]">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-white p-1.5 rounded-md shadow-sm border border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 custom-scrollbar">
              <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#191c1d] mb-1.5">Task Name</label>
                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Implement OAuth2 Login" className="h-11" required />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#191c1d] mb-1.5">Description</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Detailed explanation of the task..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#191c1d] mb-1.5">Delivery Date</label>
                    <Input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleInputChange} className="h-11" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#191c1d] mb-1.5">Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange}
                      required
                      className="flex w-full h-11 items-center justify-between rounded-xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="inprogress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="edit">Edit (Needs Revision)</option>
                      <option value="approve">Approve</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#191c1d] mb-1.5 flex justify-between items-center">
                      <span>Assign {editingId ? 'Engineer' : 'Engineers'}</span>
                      <span className="text-[#3525cd] bg-[#3525cd]/10 px-2.5 rounded-full text-xs py-1 font-bold">
                        {formData.users_ids.length} selected
                      </span>
                    </label>
                    {editingId && <p className="text-xs text-gray-500 mb-2">Since you are editing a specific user's task, select only one engineer.</p>}
                    <div className="border border-input rounded-xl h-48 overflow-y-auto bg-gray-50 p-3 flex flex-col gap-2 custom-scrollbar shadow-inner">
                      {engineersList.length === 0 ? (
                        <p className="text-sm text-gray-500 p-2 text-center h-full flex items-center justify-center">No engineers available.</p>
                      ) : (
                        engineersList.map(engineer => {
                          const isSelected = formData.users_ids.includes(engineer.id);
                          return (
                            <div 
                              key={engineer.id} 
                              onClick={() => {
                                // Enforce single selection on edit
                                if (editingId && !isSelected) {
                                  setFormData({ ...formData, users_ids: [engineer.id] });
                                } else {
                                  toggleUserSelection(engineer.id);
                                }
                              }}
                              className={`flex items-center px-4 py-2.5 rounded-lg cursor-pointer transition-all border text-sm ${
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
                              <span className={`font-semibold ${isSelected ? 'text-[#3525cd]' : 'text-[#191c1d]'}`}>{engineer.name}</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                    {formData.users_ids.length === 0 && (
                      <p className="text-xs text-red-500 mt-2 flex items-center font-medium">
                        <span className="material-symbols-outlined text-[16px] mr-1">error</span>
                        Please assign at least one engineer.
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#191c1d] mb-1.5">Tester Note (Optional)</label>
                    <textarea 
                      name="tester_note"
                      value={formData.tester_note}
                      onChange={handleInputChange}
                      className="w-full flex min-h-[80px] rounded-xl border border-input bg-amber-50/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Add any QA or tester feedback here..."
                      rows={2}
                    />
                  </div>

                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-white rounded-b-2xl">
              <Button type="button" variant="outline" onClick={closeModal} className="px-6 h-11 rounded-xl font-semibold text-[#464555]">
                Cancel
              </Button>
              <Button type="submit" form="task-form" disabled={mutationLoading || formData.users_ids.length === 0} className="bg-[#3525cd] hover:bg-[#3525cd]/90 text-white px-8 h-11 rounded-xl font-bold shadow-md">
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
