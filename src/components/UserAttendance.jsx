import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const UserAttendance = () => {
  const { data, loading, refetch } = useGet('/api/user/attendance/status');
  const { mutate } = useMutation();
  const [checking, setChecking] = useState(false);

  const handleAction = async (type) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const endpoint = type === 'check-in' ? '/api/user/attendance/check-in' : '/api/user/attendance/check-out';
        const method = type === 'check-in' ? 'POST' : 'PUT';

        const res = await mutate({
          method,
          url: endpoint,
          data: { lat, lng }
        });

        if (res?.success) {
          toast.success(res.message || `Successfully ${type === 'check-in' ? 'checked in' : 'checked out'}!`);
          refetch();
        }
        setChecking(false);
      },
      (error) => {
        toast.error('Unable to retrieve your location');
        setChecking(false);
      }
    );
  };

  if (loading) {
    return <div className="p-4 border rounded-xl flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const isCheckedIn = data?.isCheckedIn;

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 col-span-1 md:col-span-2 lg:col-span-3">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <MapPin className="text-primary w-5 h-5" />
            Attendance
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Record your daily attendance</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-6 bg-muted/20 rounded-xl border border-dashed border-border">
        {isCheckedIn ? (
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold text-amber-600">You are currently checked in.</p>
            <Button 
              size="lg" 
              onClick={() => handleAction('check-out')} 
              disabled={checking}
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center gap-2"
            >
              {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <LogOut className="w-4 h-4" />}
              Check Out
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold text-primary">You have not checked in yet today.</p>
            <Button 
              size="lg" 
              onClick={() => handleAction('check-in')} 
              disabled={checking}
              className="shadow-md flex items-center gap-2"
            >
              {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              Check In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
