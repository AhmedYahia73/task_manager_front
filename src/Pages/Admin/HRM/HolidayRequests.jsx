import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Calendar, Check, X, Phone, User as UserIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import RequestAdminModal from './RequestAdminModal';

export default function HolidayRequests() {
  const [activeTab, setActiveTab] = useState('pending');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const { data, loading, refetch } = useGet('/api/admin/hrm/holiday-requests');
  const { mutate, loading: actionLoading } = useMutation();

  const handleAction = async (id, status) => {
    try {
      await mutate({
        method: 'PUT',
        url: `/api/admin/hrm/holiday-requests/${id}/status`,
        data: { status }
      });
      refetch();
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
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const pendingRequests = data?.pending || [];
  const historyRequests = data?.history || [];

  const currentData = activeTab === 'pending' ? pendingRequests : historyRequests;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary" />
          Holiday Requests
        </h1>
        <Button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Request
        </Button>
      </div>

      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('history')}
        >
          History ({historyRequests.length})
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

              {activeTab === 'pending' && (
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

      <RequestAdminModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); refetch(); }}
        initialData={editData}
        type="holiday"
      />
    </div>
  );
}
