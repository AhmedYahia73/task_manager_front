import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RequestAdminModal from './RequestAdminModal';

export default function Permissions() {
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, loading, refresh } = useGet(`/api/admin/hrm/permissions?status=${activeTab}&page=${page}&limit=${limit}`);
  const { mutate } = useMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  const handleStatusUpdate = async (id, status) => {
    const res = await mutate({
      method: 'PUT',
      url: `/api/admin/hrm/permissions/${id}/status`,
      data: { status }
    });
    if (res?.success) {
      toast.success('Status updated successfully');
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      const res = await mutate({
        method: 'DELETE',
        url: `/api/admin/hrm/permissions/${id}`
      });
      if (res?.success) {
        toast.success('Deleted successfully');
        refresh();
      }
    }
  };

  const requests = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Permissions</h1>
        {isAdmin && (
          <Button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Request
          </Button>
        )}
      </div>
      
      <div className="flex border-b border-border mb-6">
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => handleTabChange('pending')}
        >
          Pending
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => handleTabChange('history')}
        >
          History
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map(req => (
          <div key={req.id} className="border p-4 rounded-lg bg-white shadow-sm flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              {req.user?.image ? (
                <img src={req.user.image} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                  {req.user?.name?.[0]}
                </div>
              )}
              <div>
                <p className="font-semibold">{req.user?.name}</p>
                <p className="text-sm text-gray-500">{req.user?.phone}</p>
              </div>
            </div>
            
            <div className="text-sm">
              <p><strong>Date:</strong> {new Date(req.date).toLocaleDateString()}</p>
              <p><strong>Hours:</strong> {req.hours}</p>
              <p><strong>Reason:</strong> {req.reason || 'N/A'}</p>
              <p><strong>Status:</strong> {req.status}</p>
            </div>

            <div className="flex gap-2 justify-end mt-auto pt-4 border-t">
              {req.status === 'pending' && isAdmin && (
                <>
                  <Button variant="outline" className="text-green-600 h-8 text-xs px-2" onClick={() => handleStatusUpdate(req.id, 'approve')}>Approve</Button>
                  <Button variant="outline" className="text-red-600 h-8 text-xs px-2" onClick={() => handleStatusUpdate(req.id, 'reject')}>Reject</Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditData(req); setModalOpen(true); }}>
                <Edit className="w-4 h-4 text-blue-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(req.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="text-gray-500">No requests found.</p>}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button 
            variant="outline" 
            disabled={page === 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm font-medium">Page {page} of {pagination.totalPages}</span>
          <Button 
            variant="outline" 
            disabled={page === pagination.totalPages} 
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      <RequestAdminModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); refresh(); }}
        initialData={editData}
        type="permission"
      />
    </div>
  );
}
