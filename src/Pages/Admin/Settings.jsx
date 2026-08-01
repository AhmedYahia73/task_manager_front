import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Save, User, UserCog, Shield, Award, Clock, CalendarDays, Timer, Map as MapIcon, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapSelector } from '@/components/MapSelector';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { toast } from 'sonner';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const Settings = () => {
  const { data, loading: getLoading, refetch } = useGet('/api/admin/settings');
  
  // The response data contains a "Names" object based on your API response
  const settingsData = data?.Names || (Array.isArray(data) ? data[0] : data);
  const settingId = settingsData?.id || 1; 
  const { mutate, loading: updateLoading } = useMutation();

  const [formData, setFormData] = useState({
    user: '',
    leader: '',
    admin: '',
    task_approve_points: 0,
    task_edit_points: 0,
    task_delay_points: 0,
    online_days: [],
    delay_premission_minutes: 0,
    shifts: [{ from: '09:00', to: '17:00', hours: 8 }],
    locations: []
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsData) {
      let parsedShifts = [];
      
      // 1. تحويل النص القادم من الـ API إلى مصفوفة فعلية
      if (settingsData.shifts) {
        try {
          parsedShifts = typeof settingsData.shifts === 'string' 
            ? JSON.parse(settingsData.shifts) 
            : settingsData.shifts;
        } catch (error) {
          console.error("Error parsing shifts:", error);
        }
      }

      // 2. معالجة المصفوفة لحساب الساعات وضبط صيغة الوقت (إزالة الثواني)
      const formattedShifts = Array.isArray(parsedShifts) && parsedShifts.length > 0
        ? parsedShifts.map(s => {
            // أخذ أول 5 حروف فقط ليكون بصيغة "HH:mm" لتجنب مشاكل حقل الوقت
            const fromTime = s.from ? s.from.substring(0, 5) : '09:00';
            const toTime = s.to ? s.to.substring(0, 5) : '17:00';

            let calculatedHours = s.hours;

            if (calculatedHours === undefined) {
              const [fromH, fromM] = fromTime.split(':').map(Number);
              const [toH, toM] = toTime.split(':').map(Number);
              let fromTotal = fromH + (fromM / 60);
              let toTotal = toH + (toM / 60);
              if (toTotal < fromTotal) toTotal += 24;
              calculatedHours = parseFloat((toTotal - fromTotal).toFixed(2));
            }

            return { ...s, from: fromTime, to: toTime, hours: calculatedHours };
          })
        : [{ from: '09:00', to: '17:00', hours: 8 }];

      setFormData({
        user: settingsData.user || '',
        leader: settingsData.leader || '',
        admin: settingsData.admin || '',
        task_approve_points: settingsData.task_approve_points || 0,
        task_edit_points: settingsData.task_edit_points || 0,
        task_delay_points: settingsData.task_delay_points || 0,
        online_days: settingsData.online_days || [], // fallback empty array if null
        delay_premission_minutes: settingsData.delay_premission_minutes || 0,
        shifts: formattedShifts,
        locations: settingsData.locations || []
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const currentDays = prev.online_days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      return { ...prev, online_days: newDays };
    });
  };

  const addShift = () => {
    setFormData(prev => ({
      ...prev,
      shifts: [...prev.shifts, { from: '09:00', to: '17:00', hours: 8 }]
    }));
  };

  const removeShift = (index) => {
    setFormData(prev => ({
      ...prev,
      shifts: prev.shifts.filter((_, i) => i !== index)
    }));
  };

  const handleShiftChange = (index, field, value) => {
    setFormData(prev => {
      const newShifts = [...prev.shifts];
      newShifts[index][field] = value;
      
      const { from, to } = newShifts[index];
      if (from && to) {
        const [fromH, fromM] = from.split(':').map(Number);
        const [toH, toM] = to.split(':').map(Number);
        let fromTotal = fromH + (fromM / 60);
        let toTotal = toH + (toM / 60);
        if (toTotal < fromTotal) toTotal += 24;
        newShifts[index].hours = parseFloat((toTotal - fromTotal).toFixed(2));
      }
      
      return { ...prev, shifts: newShifts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // إذا كان الباك إند يتطلب إرسال الـ shifts كنص وليس كمصفوفة كما وردت، 
    // يمكنك عمل payload هنا قبل الإرسال كالتالي:
    /*
    const payload = {
      ...formData,
      shifts: JSON.stringify(formData.shifts)
    };
    */
    
    try {
      await mutate({
        method: 'PUT',
        url: `/api/admin/settings/${settingId}`,
        data: formData // بدّلها بـ payload لو الباك إند بيطلبها string
      });
      toast.success("Settings updated successfully!");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update settings");
    }
  };

  if (getLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="w-8 h-8 text-primary" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure role names and system preferences</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Role Custom Names
          </h2>
          <p className="text-sm text-muted-foreground">
            Leave the field empty to use the default name.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            
            {/* User Custom Name */}
            <div className="space-y-2">
              <label htmlFor="user" className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                User Role Name
              </label>
              <Input
                id="user"
                name="user"
                value={formData.user}
                onChange={handleChange}
                placeholder="e.g. Employee, Staff, etc."
                className="max-w-md bg-background border-border focus-visible:ring-primary"
              />
            </div>

            {/* Leader Custom Name */}
            <div className="space-y-2">
              <label htmlFor="leader" className="text-sm font-medium text-foreground flex items-center gap-2">
                <UserCog className="w-4 h-4 text-muted-foreground" />
                Leader Role Name
              </label>
              <Input
                id="leader"
                name="leader"
                value={formData.leader}
                onChange={handleChange}
                placeholder="e.g. Manager, Supervisor, etc."
                className="max-w-md bg-background border-border focus-visible:ring-primary"
              />
            </div>

            {/* Admin Custom Name */}
            <div className="space-y-2">
              <label htmlFor="admin" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                Admin Role Name
              </label>
              <Input
                id="admin"
                name="admin"
                value={formData.admin}
                onChange={handleChange}
                placeholder="e.g. Director, Administrator, etc."
                className="max-w-md bg-background border-border focus-visible:ring-primary"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-border mt-8">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              Points Settings
            </h2>
            <div className="space-y-4">
              {/* Task Approve Points */}
              <div className="space-y-2">
                <label htmlFor="task_approve_points" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  Task Approve Points
                </label>
                <Input
                  id="task_approve_points"
                  name="task_approve_points"
                  type="number"
                  value={formData.task_approve_points}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>

              {/* Task Edit Points */}
              <div className="space-y-2">
                <label htmlFor="task_edit_points" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  Task Edit Points
                </label>
                <Input
                  id="task_edit_points"
                  name="task_edit_points"
                  type="number"
                  value={formData.task_edit_points}
                  onChange={handleChange}
                  placeholder="e.g. -5"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>

              {/* Task Delay Points */}
              <div className="space-y-2">
                <label htmlFor="task_delay_points" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  Task Delay Points
                </label>
                <Input
                  id="task_delay_points"
                  name="task_delay_points"
                  type="number"
                  value={formData.task_delay_points}
                  onChange={handleChange}
                  placeholder="e.g. -10"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-8">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              Attendance & Shifts
            </h2>
            <div className="space-y-6">
              
              {/* Online Days */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  Online Days (Allowed to work remotely)
                </label>
                <div className="flex flex-wrap gap-2 max-w-2xl">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        formData.online_days?.includes(day)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delay Permission Minutes */}
              <div className="space-y-2">
                <label htmlFor="delay_premission_minutes" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  Delay Permission (Minutes)
                </label>
                <Input
                  id="delay_premission_minutes"
                  name="delay_premission_minutes"
                  type="number"
                  value={formData.delay_premission_minutes}
                  onChange={handleChange}
                  placeholder="e.g. 15"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>

              {/* Shifts */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Work Shifts
                </label>
                <div className="space-y-3 max-w-2xl">
                  {formData.shifts?.map((shift, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-10">From</span>
                        <Input
                          type="time"
                          value={shift.from}
                          onChange={(e) => handleShiftChange(idx, 'from', e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-6">To</span>
                        <Input
                          type="time"
                          value={shift.to}
                          onChange={(e) => handleShiftChange(idx, 'to', e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="flex items-center justify-end w-16">
                        <span className="text-sm font-semibold text-primary">{shift.hours} hrs</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShift(idx)}
                        disabled={formData.shifts.length === 1}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addShift}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Another Shift
                  </Button>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-border mt-8">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <MapIcon className="w-5 h-5 text-primary" />
              Allowed Locations (Geofencing)
            </h2>
            <MapSelector
              locations={formData.locations || []}
              onChange={(newLocations) => setFormData(prev => ({ ...prev, locations: newLocations }))}
            />
          </div>

          <div className="pt-4 flex items-center gap-4 border-t border-border mt-8">
            <Button 
              type="submit" 
              disabled={updateLoading}
              className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[120px] h-11 shadow-md flex gap-2"
            >
              <Save className="w-4 h-4" />
              {updateLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};