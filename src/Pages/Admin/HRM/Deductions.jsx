import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, X, FileMinus } from 'lucide-react';
import { toast } from 'sonner';

const Deductions = () => {
  const { data: deductionsData, loading: deductionsLoading, refresh: refreshDeductions } = useGet(`/api/admin/deductions`);
  const { data: usersData, loading: usersLoading } = useGet(`/api/admin/user/selection-list`);
  const { mutate, loading: mutationLoading } = useMutation();

  const deductionsList = deductionsData?.deductions || [];
  const usersList = usersData?.Users || [];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'amount', // amount or days
    amount: '',
    month: new Date().getMonth() + 1,
    year: currentYear
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ 
      userId: '', 
      type: 'amount', 
      amount: '', 
      month: new Date().getMonth() + 1, 
      year: currentYear 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      userId: item.userId,
      type: item.type,
      amount: item.amount,
      month: item.month,
      year: item.year
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId) return toast.error('Please select an employee');
    if (!formData.amount) return toast.error('Amount/Days is required');

    if (editingId) {
      const res = await mutate({ url: `/api/admin/deductions/${editingId}`, method: 'PUT', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Deduction updated successfully');
        refreshDeductions();
        closeModal();
      }
    } else {
      const res = await mutate({ url: `/api/admin/deductions`, method: 'POST', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Deduction created successfully');
        refreshDeductions();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deduction?')) return;
    const res = await mutate({ url: `/api/admin/deductions/${id}`, method: 'DELETE' });
    if (res?.success) {
      toast.success(res.message || 'Deduction deleted successfully');
      refreshDeductions();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-foreground tracking-tight">الخصومات (Deductions)</h1>
          <p className="text-muted-foreground mt-1">إدارة خصومات الموظفين.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 font-semibold">
          <Plus className="w-4 h-4" /> إضافة خصم
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">الموظف</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">النوع</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">القيمة / الأيام</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">الشهر/السنة</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-right">
              {deductionsLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    جاري تحميل الخصومات...
                  </td>
                </tr>
              ) : deductionsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    لا توجد خصومات مسجلة.
                  </td>
                </tr>
              ) : (
                deductionsList.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      {item.userName}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {item.type === 'amount' ? 'مبلغ ثابت' : 'خصم أيام'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600 dark:text-rose-400">
                      {item.type === 'amount' ? `$${Number(item.amount).toLocaleString()}` : `${item.amount} يوم`}
                    </td>
                    <td className="px-6 py-4">
                      {item.month} / {item.year}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} className="text-muted-foreground hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <FileMinus className="w-5 h-5 text-primary" />
                {editingId ? 'تعديل الخصم' : 'إضافة خصم'}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">الموظف *</label>
                  <select 
                    required
                    value={formData.userId}
                    onChange={e => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  >
                    <option value="" disabled>اختر الموظف</option>
                    {usersList.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">نوع الخصم *</label>
                  <select 
                    required
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="amount">مبلغ ثابت</option>
                    <option value="days">خصم أيام</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    {formData.type === 'amount' ? 'قيمة الخصم *' : 'عدد الأيام المخصومة *'}
                  </label>
                  <Input 
                    required 
                    type="number"
                    min="1"
                    step={formData.type === 'amount' ? '0.01' : '1'}
                    value={formData.amount} 
                    onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))} 
                    placeholder={formData.type === 'amount' ? 'مثال: 1000' : 'مثال: 2'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">الشهر *</label>
                    <select 
                      required
                      value={formData.month}
                      onChange={e => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {months.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">السنة *</label>
                    <select 
                      required
                      value={formData.year}
                      onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              <div className="pt-4 flex justify-end gap-3 border-t" dir="ltr">
                <Button type="button" variant="outline" onClick={closeModal}>إلغاء</Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'حفظ التعديلات' : 'إضافة'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deductions;
