import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Activity, ListTodo } from 'lucide-react';
import { useRoleNames } from '@/context/RoleNameContext';

const EmployeeLive = () => {
  const { getRoleNamePlural } = useRoleNames();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, refresh } = useGet(`/api/admin/user/employee-live?page=${page}&limit=10&search=${debouncedSearch}`);
  
  const usersList = data?.users || [];
  const pagination = data?.pagination || { totalPages: 1, page: 1 };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-background min-h-screen relative text-foreground">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Employee Live
          </h1>
          <p className="text-muted-foreground mt-1">Real-time status of {getRoleNamePlural('engineer').toLowerCase()} and {getRoleNamePlural('tester').toLowerCase()}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex items-center gap-3">
        <Search className="text-muted-foreground w-5 h-5" />
        <Input 
          type="text" 
          placeholder="Search by name, email or phone..." 
          className="border-none shadow-none focus-visible:ring-0 text-[15px] w-full p-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">EMPLOYEE</th>
                <th className="px-6 py-4">DEPARTMENT</th>
                <th className="px-6 py-4">LIVE STATUS</th>
                <th className="px-6 py-4">PROGRESS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loading && usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                usersList.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {userItem.image ? (
                        <img 
                          src={userItem.image} 
                          alt={userItem.name} 
                          className="w-10 h-10 rounded-full object-cover border border-border" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-lg border border-border">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{userItem.name}</p>
                        <p className="text-muted-foreground text-xs">{userItem.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        userItem.department_id
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {userItem.department_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-white/20 ${userItem.colorClass}`}>
                        {userItem.liveStatus}
                      </span>
                      {userItem.checkIn && (
                        <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                          In: {new Date(userItem.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {userItem.checkOut && ` - Out: ${new Date(userItem.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 w-32">
                        <div className="flex flex-col gap-1" title={`Approved: ${userItem.progress || 0}%`}>
                          <div className="flex justify-between text-[10px] font-medium text-[#006c49]">
                            <span>Approve</span>
                            <span>{userItem.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#006c49] h-full" style={{ width: `${userItem.progress || 0}%` }}></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1" title={`Done: ${userItem.done_progress || 0}%`}>
                          <div className="flex justify-between text-[10px] font-medium text-red-600">
                            <span>Done</span>
                            <span>{userItem.done_progress || 0}%</span>
                          </div>
                          <div className="w-full bg-red-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: `${userItem.done_progress || 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => navigate(`/admin/tasks/all?user_id=${userItem.id}&status=inprogress&from=employee-live`)}
                          variant="outline" 
                          size="sm"
                          className="h-8 text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                        >
                          <ListTodo className="w-3 h-3 mr-1" /> Inprogress Tasks ({userItem.inprogress_count || 0})
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center bg-background">
            <Button 
              variant="outline" 
              size="sm" 
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
              size="sm" 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="text-muted-foreground"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeLive;
