// src/Pages/Admin/HRM/AttendanceAdminModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, LogOut, Building2, Globe, Check, UserCheck, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { apiClient } from '@/lib/axios';
import { toast } from 'sonner';

const pad = (n) => String(n).padStart(2, '0');

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getCurrentTimeStr = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatTime12h = (dateStrOrObj) => {
  if (!dateStrOrObj) return '';
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function AttendanceAdminModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  defaultUser = null, // { id: string, name: string }
  defaultMode = null, // 'checkin' | 'checkout' | 'both'
}) {
  const { data: usersData } = useGet('/api/admin/user?limit=100');
  const { mutate, loading } = useMutation();

  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');

  // Mode: 'checkin' | 'checkout' | 'both'
  const [mode, setMode] = useState(defaultMode || 'checkin');

  // Live status of selected user
  const [currentStatus, setCurrentStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Check-in Date & Time
  const [checkInDate, setCheckInDate] = useState(getTodayStr());
  const [checkInTime, setCheckInTime] = useState(getCurrentTimeStr());

  // Check-out Date & Time
  const [checkOutDate, setCheckOutDate] = useState(getTodayStr());
  const [checkOutTime, setCheckOutTime] = useState(getCurrentTimeStr());

  // Workplace type: onsite vs online
  const [workType, setWorkType] = useState('onsite'); // 'onsite' | 'online'

  // Initialize or reset when modal opens / props change
  useEffect(() => {
    if (initialData) {
      setUserId(initialData.user?.id || initialData.userId || '');
      setUserName(initialData.user?.name || '');
      setMode('both');

      if (initialData.from) {
        const fromD = new Date(initialData.from);
        if (!isNaN(fromD.getTime())) {
          setCheckInDate(`${fromD.getFullYear()}-${pad(fromD.getMonth() + 1)}-${pad(fromD.getDate())}`);
          setCheckInTime(`${pad(fromD.getHours())}:${pad(fromD.getMinutes())}`);
        }
      }

      if (initialData.to) {
        const toD = new Date(initialData.to);
        if (!isNaN(toD.getTime())) {
          setCheckOutDate(`${toD.getFullYear()}-${pad(toD.getMonth() + 1)}-${pad(toD.getDate())}`);
          setCheckOutTime(`${pad(toD.getHours())}:${pad(toD.getMinutes())}`);
        }
      } else {
        setCheckOutDate(getTodayStr());
        setCheckOutTime(getCurrentTimeStr());
      }

      setWorkType(initialData.onsite ? 'onsite' : 'online');
    } else {
      // New Record
      if (defaultUser?.id) {
        setUserId(defaultUser.id);
        setUserName(defaultUser.name || '');
      } else {
        setUserId('');
        setUserName('');
      }

      setMode(defaultMode || 'checkin');
      setCheckInDate(getTodayStr());
      setCheckInTime(getCurrentTimeStr());
      setCheckOutDate(getTodayStr());
      setCheckOutTime(getCurrentTimeStr());
      setWorkType('onsite');
    }
  }, [initialData, defaultUser, defaultMode, isOpen]);

  // Fetch live attendance status when employee changes
  useEffect(() => {
    if (!isOpen || !userId || initialData) {
      setCurrentStatus(null);
      return;
    }

    let isMounted = true;
    setStatusLoading(true);

    apiClient.get(`/api/admin/hrm/attendance/status/${userId}`)
      .then((res) => {
        if (!isMounted) return;
        const sData = res.data?.data || res.data;
        setCurrentStatus(sData);

        // Auto-switch mode based on real status if defaultMode wasn't explicitly forced
        if (!defaultMode) {
          if (sData?.isCheckedIn) {
            setMode('checkout');
          } else {
            setMode('checkin');
          }
        }
      })
      .catch(() => {
        if (isMounted) setCurrentStatus(null);
      })
      .finally(() => {
        if (isMounted) setStatusLoading(false);
      });

    return () => { isMounted = false; };
  }, [userId, isOpen, initialData, defaultMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return toast.error('Please select an employee (يرجى اختيار الموظف)');

    const endpoint = initialData?.id
      ? `/api/admin/hrm/attendance/${initialData.id}`
      : `/api/admin/hrm/attendance`;

    let payload = {};

    if (mode === 'checkout' && !initialData?.id) {
      // Check-out only: sends only 'to' and action 'checkout'
      if (!checkOutDate || !checkOutTime) {
        return toast.error('Please specify check-out time (يرجى تحديد وقت الانصراف)');
      }
      payload = {
        userId,
        to: `${checkOutDate}T${checkOutTime}`,
        action: 'checkout',
        mode: 'checkout',
      };
    } else if (mode === 'checkin' && !initialData?.id) {
      // Check-in only: sends only 'from' and action 'checkin'
      if (!checkInDate || !checkInTime) {
        return toast.error('Please specify check-in time (يرجى تحديد وقت الحضور)');
      }
      payload = {
        userId,
        from: `${checkInDate}T${checkInTime}`,
        onsite: workType === 'onsite',
        isRequestOnline: workType === 'online',
        action: 'checkin',
        mode: 'checkin',
      };
    } else {
      // Both (Full record or updating existing)
      if (!checkInDate || !checkInTime) {
        return toast.error('Please specify check-in time');
      }
      payload = {
        userId,
        from: `${checkInDate}T${checkInTime}`,
        to: checkOutDate && checkOutTime ? `${checkOutDate}T${checkOutTime}` : null,
        onsite: workType === 'onsite',
        isRequestOnline: workType === 'online',
      };
    }

    const res = await mutate({
      method: initialData?.id ? 'PUT' : 'POST',
      url: endpoint,
      data: payload,
    });

    if (res?.success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  const isPreselected = Boolean(defaultUser?.id || initialData?.user?.id);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl">how_to_reg</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {initialData?.id ? 'Edit Attendance' : 'Record Attendance (تسجيل الحضور والانصراف)'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {initialData?.id 
                  ? 'Update existing attendance record' 
                  : 'Check in or check out employee with auto-sync'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Hidden when editing an existing record) */}
        {!initialData?.id && (
          <div className="px-6 pt-4 pb-1">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/80">
              <button
                type="button"
                onClick={() => setMode('checkin')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'checkin'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>حضور (Check-In)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('checkout')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'checkout'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>انصراف (Check-Out)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('both')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'both'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>كامل (Both)</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* User Selection */}
            {isPreselected ? (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                      Employee
                    </span>
                    <p className="text-sm font-bold text-foreground">{userName}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Selected
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Select Employee (الموظف) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    const sel = usersData?.Users?.find((u) => u.id === e.target.value);
                    if (sel) setUserName(sel.name);
                  }}
                  required
                  className="flex w-full h-11 items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                >
                  <option value="">Choose an employee...</option>
                  {usersData?.Users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Attendance Status Indicator */}
            {userId && !initialData && (
              <div>
                {statusLoading ? (
                  <div className="p-2.5 rounded-xl bg-muted/40 text-xs text-muted-foreground flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    Checking current attendance status...
                  </div>
                ) : currentStatus?.isCheckedIn ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <div>
                        <span className="font-bold block">مسجل حضور حالياً (Checked In)</span>
                        {currentStatus.record?.from && (
                          <span className="text-[11px] opacity-85 block">
                            منذ الساعة: {formatTime12h(currentStatus.record.from)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                      جاهز للانصراف
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-muted-foreground text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                      <span>غير مسجل حضور حالياً (No active check-in)</span>
                    </div>
                    <span className="text-[10px] font-semibold opacity-70">
                      جاهز للحضور
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Check-In Section (Shown for mode 'checkin' or 'both') */}
            {(mode === 'checkin' || mode === 'both') && (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Clock className="w-4 h-4" />
                    Check-in Time (وقت الحضور) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">Date & Time</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Date (التاريخ)
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      required
                      className="w-full h-11 px-3 text-sm rounded-xl border border-input bg-background font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Time (الساعة)
                    </label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      required
                      className="w-full h-11 px-3 text-sm rounded-xl border border-input bg-background font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Quick Presets for Check-In */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => setCheckInTime(getCurrentTimeStr())}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    الآن (Now)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckInTime('09:00')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors cursor-pointer"
                  >
                    09:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckInTime('09:30')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors cursor-pointer"
                  >
                    09:30 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckInTime('10:00')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors cursor-pointer"
                  >
                    10:00 AM
                  </button>
                </div>
              </div>
            )}

            {/* Check-Out Section (Shown for mode 'checkout' or 'both') */}
            {(mode === 'checkout' || mode === 'both') && (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <LogOut className="w-4 h-4" />
                    Check-out Time (وقت الانصراف) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">Date & Time</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Date (التاريخ)
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      required
                      className="w-full h-11 px-3 text-sm rounded-xl border border-input bg-background font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Time (الساعة)
                    </label>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      required
                      className="w-full h-11 px-3 text-sm rounded-xl border border-input bg-background font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Quick Presets for Check-Out */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => setCheckOutTime(getCurrentTimeStr())}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    الآن (Now)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckOutTime('17:00')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors cursor-pointer"
                  >
                    05:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckOutTime('17:30')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors cursor-pointer"
                  >
                    05:30 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckOutTime('18:00')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors cursor-pointer"
                  >
                    06:00 PM
                  </button>
                </div>
              </div>
            )}

            {/* Workplace Context (On-site vs Online) - Shown for Check-in or Both */}
            {(mode === 'checkin' || mode === 'both') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Workplace Type (نوع الحضور)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWorkType('onsite')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      workType === 'onsite'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>في المقر (On-site)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkType('online')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      workType === 'online'
                        ? 'bg-blue-500/15 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>عن بُعد (Online)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 px-6 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`h-11 px-8 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  mode === 'checkout'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : mode === 'checkin'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                {loading
                  ? 'Saving...'
                  : initialData?.id
                  ? 'Update Record'
                  : mode === 'checkout'
                  ? 'تسجيل الانصراف (Check-Out)'
                  : mode === 'checkin'
                  ? 'تسجيل الحضور (Check-In)'
                  : 'حفظ الحضور والانصراف'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
