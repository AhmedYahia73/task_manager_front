import React, { useState } from 'react';
import { X, CalendarDays, Clock, Globe, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@/hooks/useMutation';
import { toast } from 'sonner';

export default function UserRequestsModal({ onClose }) {
  const [requestType, setRequestType] = useState('holiday'); // holiday, online, permission, extra_time
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [earlyAttend, setEarlyAttend] = useState(true);
  const [lateLeave, setLateLeave] = useState(false);
  
  const { mutate, loading } = useMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) return toast.error('Please select a date');

    let endpoint = '';
    let payload = { date };

    if (requestType === 'holiday') {
      endpoint = '/api/user/requests/holiday';
    } else if (requestType === 'online') {
      endpoint = '/api/user/requests/online';
    } else if (requestType === 'permission') {
      if (!hours) return toast.error('Please specify hours');
      endpoint = '/api/user/requests/permission';
      payload = { date, hours: Number(hours), reason };
    } else if (requestType === 'extra_time') {
      if (!earlyAttend && !lateLeave) {
        return toast.error('Please select at least Early Attendance or Late Leave');
      }
      endpoint = '/api/user/requests/extra-time';
      payload = {
        date,
        early_attend: Boolean(earlyAttend),
        late_leave: Boolean(lateLeave),
      };
    }

    const res = await mutate({
      method: 'POST',
      url: endpoint,
      data: payload
    });

    if (res?.success) {
      toast.success(res.message || 'Request submitted successfully');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Submit a Request</h2>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          {/* Request Type Selector */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRequestType('holiday')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                requestType === 'holiday' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <CalendarDays className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-semibold">Holiday</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestType('online')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                requestType === 'online' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Globe className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-semibold">Online</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestType('permission')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                requestType === 'permission' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Clock className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-semibold">Permission</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestType('extra_time')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                requestType === 'extra_time' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Timer className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-semibold">Extra Time</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Select Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
                className="h-11" 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {requestType === 'permission' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Hours Needed</label>
                  <Input type="number" step="0.5" min="0.5" value={hours} onChange={e => setHours(e.target.value)} required className="h-11" placeholder="e.g. 2" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Reason (Optional)</label>
                  <Input type="text" value={reason} onChange={e => setReason(e.target.value)} className="h-11" placeholder="Reason for permission" />
                </div>
              </>
            )}

            {requestType === 'extra_time' && (
              <div className="space-y-3 pt-1 bg-muted/40 p-3.5 rounded-xl border border-border/60">
                <p className="text-xs font-semibold text-muted-foreground">Select Extra Time Request Type:</p>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={earlyAttend}
                    onChange={(e) => setEarlyAttend(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Early Attendance (حضور مبكر)</span>
                    <p className="text-[11px] text-muted-foreground">Allow check-in before early_max limit</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lateLeave}
                    onChange={(e) => setLateLeave(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Late Leave (انصراف متأخر)</span>
                    <p className="text-[11px] text-muted-foreground">Allow check-out after late_max limit</p>
                  </div>
                </label>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="h-11 px-6 bg-primary hover:bg-primary-hover text-white">
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
