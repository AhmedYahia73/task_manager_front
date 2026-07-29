import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { Loader2, Search, Calendar, ChevronLeft } from 'lucide-react';
import dayjs from 'dayjs';

const FilteredTasks = () => {
  const { type } = useParams(); // 'pending' or 'delay'
  
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
      default: return { color: 'bg-gray-500', badge: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  return (
    <div className="admin-tasks-page min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-inter text-[#191c1d]">
      {/* Header Section */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-3 text-sm text-[#464555] flex items-center">
            <Link to="/admin/dashboard" className="hover:underline hover:text-[#3525cd] flex items-center">
              <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
            </Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <span className="font-semibold text-[#191c1d]">{pageTitle}</span>
          </nav>
          <h1 className="font-plus-jakarta text-4xl font-bold tracking-tight text-[#3525cd]">{pageTitle}</h1>
          <p className="mt-2 text-[#464555]">View all {pageTitle.toLowerCase()} across all projects.</p>
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
        </div>
      </div>

      {/* Task Table */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-[#edeeef] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f3f4f5] text-xs uppercase tracking-wider text-[#464555]">
              <tr>
                <th scope="col" className="px-6 py-5 font-semibold rounded-tl-2xl">Task Details</th>
                <th scope="col" className="px-6 py-5 font-semibold">Project & Group</th>
                <th scope="col" className="px-6 py-5 font-semibold">Assigned To</th>
                <th scope="col" className="px-6 py-5 font-semibold">Delivery Date</th>
                <th scope="col" className="px-6 py-5 font-semibold rounded-tr-2xl">Status</th>
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
                      className="group bg-white hover:bg-[#f3f4f5] transition-colors"
                    >
                      <td className="relative px-6 py-5">
                        <div className={`absolute left-0 top-0 h-full w-1 ${style.color}`}></div>
                        <div className="flex flex-col">
                          <span className="font-plus-jakarta text-base font-bold text-[#191c1d]">
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
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#191c1d]">{task.project_name || 'N/A'}</span>
                          <span className="text-xs text-[#464555]">{task.project_group || 'N/A'}</span>
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

    </div>
  );
};

export default FilteredTasks;
