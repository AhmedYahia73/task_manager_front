import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, X, Clock, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const DEFAULT_DAYS = {
  sunday: { active: false, from: '09:00', to: '17:00' },
  monday: { active: true, from: '09:00', to: '17:00' },
  tuesday: { active: true, from: '09:00', to: '17:00' },
  wednesday: { active: true, from: '09:00', to: '17:00' },
  thursday: { active: true, from: '09:00', to: '17:00' },
  friday: { active: false, from: '09:00', to: '17:00' },
  saturday: { active: false, from: '09:00', to: '17:00' }
};

const DAY_NAMES = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الإثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
  { key: 'saturday', label: 'السبت' },
];

const Shifts = () => {
  const { data, loading, refresh } = useGet(`/api/admin/shifts`);
  const { data: zonesData } = useGet(`/api/admin/zones/lists`);
  const { mutate, loading: mutationLoading } = useMutation();

  const shiftsList = data?.Shifts || [];
  const zonesList = zonesData?.Zones || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    zone_id: '',
    days: JSON.parse(JSON.stringify(DEFAULT_DAYS))
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', zone_id: '', days: JSON.parse(JSON.stringify(DEFAULT_DAYS)) });
    setIsModalOpen(true);
  };

  const openEditModal = (shift) => {
    setEditingId(shift.id);
    let parsedDays = JSON.parse(JSON.stringify(DEFAULT_DAYS));
    if (shift.days) {
      const dbDays = typeof shift.days === 'string' ? JSON.parse(shift.days) : shift.days;
      parsedDays = { ...parsedDays, ...dbDays };
    }
    
    setFormData({
      name: shift.name,
      zone_id: shift.zone_id,
      days: parsedDays
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDayChange = (dayKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: {
          ...prev.days[dayKey],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required');
    if (!formData.zone_id) return toast.error('Zone is required');

    if (editingId) {
      const res = await mutate({ url: `/api/admin/shifts/${editingId}`, method: 'PUT', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Shift updated successfully');
        refresh();
        closeModal();
      }
    } else {
      const res = await mutate({ url: `/api/admin/shifts`, method: 'POST', data: formData });
      if (res?.success) {
        toast.success(res.message || 'Shift created successfully');
        refresh();
        closeModal();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    const res = await mutate({ url: `/api/admin/shifts/${id}`, method: 'DELETE' });
    if (res?.success) {
      toast.success(res.message || 'Shift deleted successfully');
      refresh();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-background to-muted/20 min-h-screen text-foreground" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans'] tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" /> نظام الورديات
          </h1>
          <p className="text-muted-foreground mt-1">إدارة الورديات وتحديد أوقات الدوام لكل يوم بشكل مستقل.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 font-semibold shadow-md">
          <Plus className="w-4 h-4" /> إضافة وردية
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">اسم الوردية</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">المنطقة (Zone)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">الجدول</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    جاري تحميل الورديات...
                  </td>
                </tr>
              ) : shiftsList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    لا توجد ورديات حتى الآن. قم بإنشاء وردية جديدة.
                  </td>
                </tr>
              ) : (
                shiftsList.map((shift) => (
                  <tr key={shift.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">{shift.name}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{shift.zone_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const days = typeof shift.days === 'string' ? JSON.parse(shift.days) : shift.days;
                          if (!days) return <span className="text-muted-foreground text-xs">غير محدد</span>;
                          return DAY_NAMES.filter(d => days[d.key]?.active).map(d => (
                            <span key={d.key} className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md border border-primary/20">
                              {d.label} ({days[d.key].from} - {days[d.key].to})
                            </span>
                          ));
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(shift)} className="text-slate-500 hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)} className="text-slate-500 hover:text-destructive">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col my-8 max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b bg-muted/30 sticky top-0 z-10">
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" /> 
                {editingId ? 'تعديل الوردية' : 'إضافة وردية جديدة'}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم الوردية *</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="مثال: الوردية الصباحية"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المنطقة الجغرافية (Zone) *</label>
                  <select 
                    required 
                    value={formData.zone_id} 
                    onChange={e => setFormData({ ...formData, zone_id: e.target.value })} 
                    className="flex w-full h-11 items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  >
                    <option value="" disabled>اختر المنطقة</option>
                    {zonesList.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2">أيام العمل وساعات الدوام</h3>
                <div className="space-y-3">
                  {DAY_NAMES.map((day) => {
                    const dayData = formData.days[day.key];
                    return (
                      <div key={day.key} className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border transition-all ${dayData.active ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-muted/30 border-dashed opacity-70'}`}>
                        <div className="flex items-center gap-3 w-full sm:w-1/3">
                          <Switch 
                            checked={dayData.active}
                            onCheckedChange={(checked) => handleDayChange(day.key, 'active', checked)}
                          />
                          <span className={`font-bold ${dayData.active ? 'text-primary' : 'text-muted-foreground'}`}>{day.label}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-2/3">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground w-10">من:</span>
                            <Input 
                              type="time" 
                              required={dayData.active}
                              disabled={!dayData.active}
                              value={dayData.from}
                              onChange={(e) => handleDayChange(day.key, 'from', e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground w-10">إلى:</span>
                            <Input 
                              type="time" 
                              required={dayData.active}
                              disabled={!dayData.active}
                              value={dayData.to}
                              onChange={(e) => handleDayChange(day.key, 'to', e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-card py-4 border-t mt-0">
                <Button type="button" variant="outline" onClick={closeModal} className="px-6">إلغاء</Button>
                <Button type="submit" disabled={mutationLoading} className="px-8 shadow-md">
                  {mutationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'حفظ التعديلات' : 'إنشاء الوردية'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
