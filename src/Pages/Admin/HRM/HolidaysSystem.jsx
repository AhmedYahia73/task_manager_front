import React, { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

export default function HolidaysSystem() {
  const { data, loading, refetch } = useGet('/api/admin/hrm/holidays-system');
  const { mutate, loading: saving } = useMutation();

  const [type, setType] = useState('fixed');
  const [days, setDays] = useState([]);
  const [workNum, setWorkNum] = useState(0);
  const [holidaysNum, setHolidaysNum] = useState(0);

  useEffect(() => {
    if (data?.holidays) {
      setType(data.holidays.type);
      setDays(data.holidays.days || []);
      setWorkNum(data.holidays.workNum || 0);
      setHolidaysNum(data.holidays.holidaysNum || 0);
    }
  }, [data]);

  const handleDayToggle = (day) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const handleSave = async () => {
    const payload = {
      type,
      days: type === 'fixed' ? days : [],
      workNum: type === 'number' ? Number(workNum) : 0,
      holidaysNum: type === 'number' ? Number(holidaysNum) : 0,
    };

    const res = await mutate({
      method: 'PUT',
      url: '/api/admin/hrm/holidays-system',
      data: payload
    });

    if (res?.success) {
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">event_available</span>
            Holidays System
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure the company's weekly holidays schedule
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-6">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[18px]">save</span>}
          Save Changes
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-8">
        
        {/* Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">System Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="fixed"
                checked={type === 'fixed'}
                onChange={() => setType('fixed')}
                className="w-4 h-4 text-primary focus:ring-primary border-border"
              />
              <span className="text-foreground">Fixed Days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="number"
                checked={type === 'number'}
                onChange={() => setType('number')}
                className="w-4 h-4 text-primary focus:ring-primary border-border"
              />
              <span className="text-foreground">Number Based (e.g., 5 work, 2 off)</span>
            </label>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="pt-4 border-t border-border">
          {type === 'fixed' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Select Holiday Days</h3>
                <p className="text-sm text-muted-foreground">Select the fixed days off every week.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      days.includes(day)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Work Days Count</label>
                <Input
                  type="number"
                  min="0"
                  value={workNum}
                  onChange={(e) => setWorkNum(e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Holidays Count</label>
                <Input
                  type="number"
                  min="0"
                  value={holidaysNum}
                  onChange={(e) => setHolidaysNum(e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
