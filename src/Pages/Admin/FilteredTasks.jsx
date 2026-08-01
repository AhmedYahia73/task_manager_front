import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2, Search, Calendar, ChevronLeft } from 'lucide-react';
import dayjs from 'dayjs';
import { useRoleNames } from '@/context/RoleNameContext';
import { toast } from 'sonner';

const FilteredTasks = () => {
  const { getRoleName } = useRoleNames();
  const { type } = useParams(); // 'pending' or 'delay'
  
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

  const endpoint = type === 'pending' ? '/api/admin/tasks/pendingTasks' : '/api/admin/tasks/delayTasks';
  const pageTitle = type === 'pending' ? 'Pending Tasks' : 'Delayed Tasks';

  // Fetch Tasks Data
  const { data: tasksData, loading: tasksLoading } = useGet(`${endpoint}?page=${page}&limit=10&search=${debouncedSearch}`);
  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || { totalPages: 1, page: 1, total: 0 };

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

  const { mutate } = useMutation();

  const handleStatusChange = async (taskId, newStatus) => {
    const response = await mutate({
      method: 'PUT',
      url: `/api/admin/tasks/${taskId}`,
      data: { status: newStatus }
    });
    if (response?.success) {
      setPage(prev => prev);
      setSearch(prev => prev + ' '); 
      setTimeout(() => setSearch(prev => prev.trim()), 10);
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
      setPage(prev => prev);
      setSearch(prev => prev + ' '); 
      setTimeout(() => setSearch(prev => prev.trim()), 10);
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

  return (
    <div className="admin-tasks-page min-h-screen bg-background p-4 md:p-8 font-inter text-foreground">
      {/* Header Section */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-3 text-sm text-muted-foreground flex items-center">
            <Link to="/admin/dashboard" className="hover:underline hover:text-primary flex items-center">
              <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
            </Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <span className="font-semibold text-foreground">{pageTitle}</span>
          </nav>
          <h1 className="font-plus-jakarta text-4xl font-bold tracking-tight text-primary">{pageTitle}</h1>
          <p className="mt-2 text-muted-foreground">View all {pageTitle.toLowerCase()} across all projects.</p>
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
        </div>
      </div>

      {/* Task Table */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-6 py-5 font-semibold rounded-tl-2xl">Task Details</th>
                <th scope="col" className="px-6 py-5 font-semibold">Project & Group</th>
                <th scope="col" className="px-6 py-5 font-semibold">Assigned To</th>
                <th scope="col" className="px-6 py-5 font-semibold">Delivery Date</th>
                <th scope="col" className="px-6 py-5 font-semibold">Importance</th>
                <th scope="col" className="px-6 py-5 font-semibold rounded-tr-2xl">Status</th>
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
                      className={`group transition-colors ${task.importanc_status === 'urgent' ? 'urgent-row' : 'bg-card hover:bg-muted'}`}
                    >
                      <td className="relative px-6 py-5">
                        <div className={`absolute left-0 top-0 h-full w-1 ${style.color}`}></div>
                        <div className="flex flex-col">
                          <span className="font-plus-jakarta text-base font-bold text-foreground">
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
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{task.project_name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{task.project_group || 'N/A'}</span>
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
                          className={`inline-flex appearance-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${style.badge}`}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                          <option value="pending" className="bg-card text-foreground">Pending</option>
                          <option value="inprogress" className="bg-card text-foreground">In Progress</option>
                          <option value="done" className="bg-card text-foreground">Done</option>
                          <option value="edit" className="bg-card text-foreground">Needs Revision</option>
                          <option value="approve" className="bg-card text-foreground">Approve</option>
                        </select>
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

    </div>
  );
};

export default FilteredTasks;
