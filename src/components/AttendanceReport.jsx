import React, { useState, useEffect, useRef } from 'react';
import { useGet } from '@/hooks/useGet';
import { Loader2, Calendar, Clock, CheckCircle, AlertTriangle, Gift, FileMinus, Palmtree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function AttendanceReport({ userId }) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [page, setPage] = useState(1);
  const [allReports, setAllReports] = useState([]);
  const loaderRef = useRef(null);

  const endpoint = userId ? `/api/admin/user/${userId}/attendance-report` : `/api/user/attendance/report`;
  const { data, loading } = useGet(`${endpoint}?from=${from}&to=${to}&page=${page}&limit=15`);

  useEffect(() => {
    setAllReports([]);
    setPage(1);
  }, [from, to, userId]);

  useEffect(() => {
    if (data?.report) {
      if (page === 1) {
        setAllReports(data.report);
      } else {
        setAllReports(prev => {
          const newDates = new Set(data.report.map(r => r.date));
          const filteredPrev = prev.filter(r => !newDates.has(r.date));
          return [...filteredPrev, ...data.report];
        });
      }
    }
  }, [data?.report, page]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && data?.pagination && page < data.pagination.totalPages) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.1 });
    
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, data?.pagination, page]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center bg-card p-4 rounded-xl shadow-sm border border-border">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded p-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded p-2 text-sm" />
        </div>
      </div>

      {/* Premium Highlight Cards */}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Yearly Holidays Card */}
          {data.yearlyHolidaysSummary?.isActive && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-6 text-white shadow-xl shadow-blue-900/20"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans']">الإجازات السنوية</h3>
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Palmtree className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-3 gap-4 text-center divide-x divide-white/20">
                <div>
                  <p className="text-sm text-blue-100 mb-1">المتبقي</p>
                  <p className="text-2xl font-black">{data.yearlyHolidaysSummary.remaining}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-100 mb-1">المستهلك</p>
                  <p className="text-2xl font-black">{data.yearlyHolidaysSummary.used}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-100 mb-1">الرصيد الكلي</p>
                  <p className="text-2xl font-black">{data.yearlyHolidaysSummary.totalAllowed}</p>
                </div>
              </div>
              {data.yearlyHolidaysSummary.exceeded > 0 && (
                <div className="relative z-10 mt-4 bg-red-500/20 text-red-100 text-sm py-2 px-3 rounded-lg border border-red-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  تجاوزت رصيد الإجازات بمقدار {data.yearlyHolidaysSummary.exceeded} أيام (محسوبة كغياب)
                </div>
              )}
            </motion.div>
          )}

          {/* Bonuses Card */}
          {data.financials?.bonuses && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-6 text-white shadow-xl shadow-teal-900/20"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans']">المكافآت</h3>
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Gift className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-4 divide-x divide-white/20 text-center">
                <div>
                  <p className="text-sm text-emerald-100 mb-1">مبلغ ثابت</p>
                  <p className="text-2xl font-black">
                    ${data.financials.bonuses.filter(b => b.type === 'amount').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100 mb-1">أجر أيام</p>
                  <p className="text-2xl font-black">
                    {data.financials.bonuses.filter(b => b.type === 'days').reduce((acc, curr) => acc + Number(curr.amount), 0)} يوم
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Deductions Card */}
          {data.financials?.deductions && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 p-6 text-white shadow-xl shadow-red-900/20"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans']">الخصومات</h3>
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <FileMinus className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-4 divide-x divide-white/20 text-center">
                <div>
                  <p className="text-sm text-rose-100 mb-1">مبلغ ثابت</p>
                  <p className="text-2xl font-black">
                    ${data.financials.deductions.filter(d => d.type === 'amount').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-rose-100 mb-1">خصم أيام</p>
                  <p className="text-2xl font-black">
                    {data.financials.deductions.filter(d => d.type === 'days').reduce((acc, curr) => acc + Number(curr.amount), 0)} يوم
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {loading && page === 1 ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-blue-800">Total Delay (Hrs)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-blue-900">{data?.summary?.totalDelay?.toFixed(2) || 0}</p></CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-emerald-800">Onsite Days</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-emerald-900">{data?.summary?.onsiteDays || 0}</p></CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-purple-800">Online (w/ Permission)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-purple-900">{data?.summary?.onlineWithRequest || 0}</p></CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-300">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-amber-800">Online (No Permission)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-amber-900">{data?.summary?.onlineWithoutRequest || 0}</p></CardContent>
            </Card>
            <Card className="bg-rose-50 border-rose-300">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-rose-800">Online (Rejected)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-rose-900">{data?.summary?.onlineRejected || 0}</p></CardContent>
            </Card>
            <Card className="bg-green-50 border-green-300">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-green-800">Holiday (Approved)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-green-900">{data?.summary?.holidayApproved || 0}</p></CardContent>
            </Card>
            <Card className="bg-red-50 border-red-300">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-red-800">Holiday (Rejected)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-red-900">{data?.summary?.holidayRejected || 0}</p></CardContent>
            </Card>
            <Card className="bg-slate-100 border-slate-300">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-slate-700">Standard Holidays</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-slate-800">{data?.summary?.holidayStandard || 0}</p></CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-400">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-orange-900">Unexcused Absences</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-orange-900">{data?.summary?.unexcusedAbsence || 0}</p></CardContent>
            </Card>
            <Card className="bg-pink-50 border-pink-200">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-pink-800">Permission Hrs Taken</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-pink-900">{data?.summary?.totalPermissionHours || 0}</p></CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Delay (Hrs)</th>
                    <th className="px-4 py-3">Perm. (Hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allReports.map((row, idx) => (
                    <tr key={idx} className={`${row.color || 'bg-background hover:bg-muted/30'}`}>
                      <td className="px-4 py-3 font-medium">{row.date}</td>
                      <td className="px-4 py-3">{row.day}</td>
                      <td className="px-4 py-3 font-semibold">{row.status}</td>
                      <td className="px-4 py-3">
                        {row.attendance ? new Date(row.attendance.from).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {row.attendance?.to ? new Date(row.attendance.to).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {row.attendance?.hours ? row.attendance.hours.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {row.attendance?.delay ? row.attendance.delay.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {row.attendance?.permissionHours || '-'}
                      </td>
                    </tr>
                  ))}
                  {allReports.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-muted-foreground">
                        No data available for this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div ref={loaderRef} className="py-4 flex justify-center">
            {loading && page > 1 && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
            {!loading && data?.pagination && page === data.pagination.totalPages && (
              <span className="text-sm text-muted-foreground">No more records</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
