import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Save, User, UserCog, Shield, Award, Clock, CalendarDays, Timer, Map as MapIcon, Plus, Minus, Fingerprint, Wifi, Network } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
    yearly_holidays: 0,
    rejected_online_deduction: 0,
    rejected_holiday_deduction: 0,
    online_without_permission_deduction: 0,
    holiday_without_permission_deduction: 0,
    delay_per_hour_deduction: 0,
    face_id: true,
    router_ip_status: true,
    router_ip: ''
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsData) {
      setFormData({
        user: settingsData.user || '',
        leader: settingsData.leader || '',
        admin: settingsData.admin || '',
        task_approve_points: settingsData.task_approve_points || 0,
        task_edit_points: settingsData.task_edit_points || 0,
        task_delay_points: settingsData.task_delay_points || 0,
        online_days: settingsData.online_days || [],
        delay_premission_minutes: settingsData.delay_premission_minutes || 0,
        yearly_holidays: settingsData.yearly_holidays || 0,
        rejected_online_deduction: settingsData.rejected_online_deduction || 0,
        rejected_holiday_deduction: settingsData.rejected_holiday_deduction || 0,
        online_without_permission_deduction: settingsData.online_without_permission_deduction || 0,
        holiday_without_permission_deduction: settingsData.holiday_without_permission_deduction || 0,
        delay_per_hour_deduction: settingsData.delay_per_hour_deduction || 0,
        face_id: settingsData.face_id !== undefined ? settingsData.face_id : true,
        router_ip_status: settingsData.router_ip_status !== undefined ? settingsData.router_ip_status : true,
        router_ip: settingsData.router_ip || ''
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleToggleAutoSave = async (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    try {
      const res = await mutate({
        method: 'PUT',
        url: `/api/admin/settings/${settingId}`,
        data: { ...formData, [name]: value }
      });
      if (res?.success) {
        toast.success(`${name.replace(/_/g, ' ')} updated successfully!`);
        refetch();
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to update ${name.replace(/_/g, ' ')}`);
    }
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
      const res = await mutate({
        method: 'PUT',
        url: `/api/admin/settings/${settingId}`,
        data: formData
      });
      if (res?.success) {
        toast.success("Settings updated successfully!");
        refetch();
      }
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

              {/* Yearly Holidays */}
              <div className="space-y-2">
                <label htmlFor="yearly_holidays" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  Yearly Holidays Balance
                </label>
                <Input
                  id="yearly_holidays"
                  name="yearly_holidays"
                  type="number"
                  value={formData.yearly_holidays}
                  onChange={handleChange}
                  placeholder="e.g. 21"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-8">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              Attendance & Leaves Deductions
            </h2>
            <div className="space-y-4">
              {/* Rejected Online Deduction */}
              <div className="space-y-2">
                <label htmlFor="rejected_online_deduction" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  Rejected Online Request Deduction
                </label>
                <Input
                  id="rejected_online_deduction"
                  name="rejected_online_deduction"
                  type="number"
                  step="any"
                  value={formData.rejected_online_deduction}
                  onChange={handleChange}
                  placeholder="e.g. -50"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>

              {/* Rejected Holiday Deduction */}
              <div className="space-y-2">
                <label htmlFor="rejected_holiday_deduction" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  Rejected Holiday Request Deduction
                </label>
                <Input
                  id="rejected_holiday_deduction"
                  name="rejected_holiday_deduction"
                  type="number"
                  step="any"
                  value={formData.rejected_holiday_deduction}
                  onChange={handleChange}
                  placeholder="e.g. -50"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>

              {/* Online Without Permission Deduction */}
              <div className="space-y-2">
                <label htmlFor="online_without_permission_deduction" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  Online Without Permission Deduction
                </label>
                <Input
                  id="online_without_permission_deduction"
                  name="online_without_permission_deduction"
                  type="number"
                  step="any"
                  value={formData.online_without_permission_deduction}
                  onChange={handleChange}
                  placeholder="e.g. -100"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>

              {/* Holiday Without Permission Deduction */}
              <div className="space-y-2">
                <label htmlFor="holiday_without_permission_deduction" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  Holiday Without Permission Deduction
                </label>
                <Input
                  id="holiday_without_permission_deduction"
                  name="holiday_without_permission_deduction"
                  type="number"
                  step="any"
                  value={formData.holiday_without_permission_deduction}
                  onChange={handleChange}
                  placeholder="e.g. -100"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>

              {/* Delay Per Hour Deduction */}
              <div className="space-y-2">
                <label htmlFor="delay_per_hour_deduction" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  Delay Per Hour Deduction
                </label>
                <Input
                  id="delay_per_hour_deduction"
                  name="delay_per_hour_deduction"
                  type="number"
                  step="any"
                  value={formData.delay_per_hour_deduction}
                  onChange={handleChange}
                  placeholder="e.g. -20"
                  className="max-w-md bg-background border-border focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Attendance Methods Section */}
          <div className="pt-6 border-t border-border mt-8">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
              <Network className="w-5 h-5 text-primary" />
              Attendance Methods
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" />
                    Face ID Attendance
                  </label>
                  <p className="text-xs text-muted-foreground">Require face recognition for checking in</p>
                </div>
                <Switch 
                  checked={formData.face_id} 
                  onCheckedChange={(val) => handleToggleAutoSave('face_id', val)} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-primary" />
                    Router IP Validation
                  </label>
                  <p className="text-xs text-muted-foreground">Restrict attendance to a specific router IP</p>
                </div>
                <Switch 
                  checked={formData.router_ip_status} 
                  onCheckedChange={(val) => handleToggleAutoSave('router_ip_status', val)} 
                />
              </div>
              
              {formData.router_ip_status && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="space-y-2 px-4"
                >
                  <label htmlFor="router_ip" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Network className="w-4 h-4 text-muted-foreground" />
                    Router IP Address
                  </label>
                  <Input
                    id="router_ip"
                    name="router_ip"
                    value={formData.router_ip}
                    onChange={handleChange}
                    placeholder="e.g. 192.168.1.1"
                    className="max-w-md bg-background border-border focus-visible:ring-primary"
                  />
                </motion.div>
              )}
            </div>
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