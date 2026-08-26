import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calculator, Users, DollarSign, ArrowDownToLine, ArrowUpToLine, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Payroll = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, loading } = useGet(`/api/admin/payroll?month=${month}&year=${year}&page=${page}&limit=${limit}`);

  const payrollList = data?.payroll || [];
  const summary = data?.summary || { totalEmployees: 0, totalSalaries: 0, totalDeductions: 0, totalBonuses: 0 };
  const pagination = data?.pagination;

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(i);
    return { value: i + 1, label: d.toLocaleString('en-US', { month: 'long' }) };
  });

  // Handle month/year change - reset to page 1
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen text-foreground">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans'] tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" /> Payroll Management
          </h1>
          <p className="text-muted-foreground mt-1">Calculate net salaries after holidays, deductions, and bonuses.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card p-2 rounded-xl shadow-sm border">
          <select 
            value={month}
            onChange={(e) => handleFilterChange(setMonth, Number(e.target.value))}
            className="h-10 px-4 rounded-lg border-0 bg-muted/50 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select 
            value={year}
            onChange={(e) => handleFilterChange(setYear, Number(e.target.value))}
            className="h-10 px-4 rounded-lg border-0 bg-muted/50 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
          >
            {years.map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-900/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-black">{summary.totalEmployees}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-emerald-400 to-teal-600 text-white border-0 shadow-lg shadow-teal-900/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-teal-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Net Salaries (Company)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-black">${summary.totalSalaries.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-rose-500 to-red-700 text-white border-0 shadow-lg shadow-red-900/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-rose-100 flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4" /> Total Deductions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-black">${summary.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-amber-400 to-orange-500 text-white border-0 shadow-lg shadow-orange-900/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
                <ArrowUpToLine className="w-4 h-4" /> Total Bonuses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-black">${summary.totalBonuses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Employee Salary Details</h2>
          <span className="text-sm text-muted-foreground ml-2">(Based on {payrollList[0]?.daysInMonth || 30} days this month)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Employee</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Base Salary</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Daily Rate</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-rose-600">Deduction Days (Exc. Delay)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-rose-600">Absence Penalty</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-orange-600">Delay Days</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-orange-600">Delay Penalty</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-rose-600">Other Deductions</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-emerald-600">Bonuses</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-sm bg-primary/5 text-primary">Net Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    Calculating payroll (may take a few seconds)...
                  </td>
                </tr>
              ) : payrollList.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-muted-foreground">
                    No payroll data available for this month.
                  </td>
                </tr>
              ) : (
                payrollList.map((item) => (
                  <tr key={item.user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      {item.user.name}
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">{item.user.role}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                      ${item.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      ${item.dailyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600">
                      {item.totalDeductionDays > 0 ? `${item.totalDeductionDays} days` : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600">
                      {item.absencePenalty > 0 ? `$${item.absencePenalty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-orange-600">
                      {(item.delayDeductionDays || 0) > 0 ? `${Number(item.delayDeductionDays).toFixed(2)} days` : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-orange-600">
                      {(item.delayPenalty || 0) > 0 ? `$${item.delayPenalty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600">
                      {item.deductions > 0 ? `$${item.deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      {item.bonuses > 0 ? `$${item.bonuses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-6 py-4 font-black text-lg bg-primary/5 text-primary">
                      ${item.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
