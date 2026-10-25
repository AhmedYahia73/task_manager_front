import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Timer, Check, X, Phone, User as UserIcon, Trash2, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ExtraTimeRequests() {
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);

  const limit = 10;
  const { data, loading, refresh } = useGet(
    `/api/admin/hrm/extra-time-requests?status=${activeTab}&page=${page}&limit=${limit}`
  );
  const { mutate, loading: actionLoading } = useMutation();

  const handleAction = async (id, status) => {
    try {
      await mutate({
        method: 'PUT',
        url: `/api/admin/hrm/extra-time-requests/${id}/status`,
        data: { status },
      });
      refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this extra time request?')) return;
    try {
      await mutate({
        method: 'DELETE',
        url: `/api/admin/hrm/extra-time-requests/${id}`,
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
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Timer className="w-8 h-8 text-primary" />
            Extra Time Requests (طلبات الوقت الإضافي)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage early attendance and late departure requests for employees
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleTabChange('pending')}
        >
          Pending
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleTabChange('history')}
        >
          History (Approved / Rejected)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : currentData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No {activeTab} extra time requests found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentData.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                    {req.user?.image ? (
                      <img src={req.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{req.user?.name || 'Unknown User'}</h3>
                    {req.user?.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {req.user.phone}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                    req.status === 'approve'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : req.status === 'reject'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              {/* Request Type Tags */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Requested Date:
                  </span>
                  <span className="font-semibold text-foreground">
                    {req.date ? new Date(req.date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {req.early_attend && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-medium">
                      <ArrowDownRight className="w-3 h-3" />
                      Early Attend (حضور مبكر)
                    </span>
                  )}
                  {req.late_leave && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-medium">
                      <ArrowUpRight className="w-3 h-3" />
                      Late Leave (انصراف متأخر)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                {activeTab === 'pending' ? (
                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={actionLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-9"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={actionLoading}
                      className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 h-9"
                    >
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                      Status: <strong className="capitalize text-foreground">{req.status}</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(req.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 h-8 w-8"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
