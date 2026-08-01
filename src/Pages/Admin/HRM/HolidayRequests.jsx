import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Calendar, Check, X, Phone, User as UserIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import RequestAdminModal from './RequestAdminModal';

export default function HolidayRequests() {
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  const limit = 10;
  const { data, loading, refresh } = useGet(`/api/admin/hrm/holiday-requests?status=${activeTab}&page=${page}&limit=${limit}`);
  const { mutate, loading: actionLoading } = useMutation();

  const handleAction = async (id, status) => {
    try {
      await mutate({
        method: 'PUT',
        url: `/api/admin/hrm/holiday-requests/${id}/status`,
        data: { status }
      });
      refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await mutate({
        method: 'DELETE',
        url: `/api/admin/hrm/holiday-requests/${id}`
      });
      refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const currentData = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Calendar className="w-8 h-8 text-primary" />
          Holiday Requests
        </h1>
        {isAdmin && (
          <Button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Request
          </Button>
        )}
      </div>

      <div className="flex border-b border-border">
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : currentData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No {activeTab} requests found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentData.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                {req.user.image ? (
                  <img src={req.user.image} alt={req.user.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">{req.user.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Phone className="w-3 h-3" /> {req.user.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-medium text-foreground">{new Date(req.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'approve' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border mt-2 pt-2 justify-end">
                  <button onClick={() => { setEditData(req); setModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(req.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
              </div>

              {activeTab === 'pending' && isAdmin && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={actionLoading}
                    onClick={() => handleAction(req.id, 'approve')}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={actionLoading}
                    onClick={() => handleAction(req.id, 'reject')}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

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
        type="holiday"
      />
    </div>
  );
}
