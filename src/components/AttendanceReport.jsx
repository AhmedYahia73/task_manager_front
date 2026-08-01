import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { Loader2, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AttendanceReport({ userId }) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);

  const endpoint = userId ? `/api/admin/users/${userId}/attendance-report` : `/api/user/attendance/report`;
  const { data, loading } = useGet(`${endpoint}?from=${from}&to=${to}`);

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

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-blue-800">Total Delay (Hrs)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-blue-900">{data?.summary?.totalDelay?.toFixed(2) || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-green-800">Onsite Days</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-green-900">{data?.summary?.onsiteDays || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-purple-800">Online Days (Req)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-purple-900">{data?.summary?.onlineWithRequest || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-orange-800">Unexcused Absences</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-orange-900">{data?.summary?.unexcusedAbsence || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-pink-50 border-pink-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-pink-800">Permission Hrs Taken</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-pink-900">{data?.summary?.totalPermissionHours || 0}</p>
              </CardContent>
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
                  {data?.report?.map((row, idx) => (
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
                  {(!data?.report || data.report.length === 0) && (
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
        </>
      )}
    </div>
  );
}
