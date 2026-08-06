import React, { useState, useEffect, useRef } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, LogIn, LogOut, Camera, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import * as faceapi from 'face-api.js';

export const UserAttendance = () => {
  const { data, loading, refresh } = useGet('/api/user/attendance/status');
  const { mutate } = useMutation();
  const [checking, setChecking] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  // Camera state
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'check-in' or 'check-out'

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/face-api');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face-api');
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load models:", err);
        toast.error("Failed to load Face ID models.");
      }
    };
    if (data?.settings?.face_id) {
      loadModels();
    }
  }, [data?.settings?.face_id]);

  const startCamera = async (type) => {
    setPendingAction(type);
    setShowCamera(true);
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraLoading(false);
    } catch (err) {
      toast.error('Unable to access camera.');
      setShowCamera(false);
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleFaceCapture = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setChecking(true);
    toast.info('Scanning face...');
    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No face detected. Please try again.');
        setChecking(false);
        return;
      }

      stopCamera();
      const payload = Array.from(detection.descriptor);
      await executeAction(pendingAction, 'face', payload);
    } catch (err) {
      console.error(err);
      toast.error('Face scanning failed.');
      setChecking(false);
    }
  };

  const handleRouterAction = (type) => {
    executeAction(type, 'router', null);
  };

  const executeAction = async (type, method, payload) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setChecking(false);
      return;
    }

    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const endpoint = type === 'check-in' ? '/api/user/attendance/check-in' : '/api/user/attendance/check-out';
        const httpMethod = type === 'check-in' ? 'POST' : 'PUT';

        const res = await mutate({
          method: httpMethod,
          url: endpoint,
          data: { lat, lng, method, payload }
        });

        if (res?.success) {
          toast.success(res.message || `Successfully ${type === 'check-in' ? 'checked in' : 'checked out'}!`);
          refresh();
        } else {
            if (res?.message) toast.error(res.message);
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
  const settings = data?.settings || {};
  const requiresMethod = settings.face_id || settings.router_ip_status;

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 col-span-1 md:col-span-2 lg:col-span-3">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <MapPin className="text-primary w-5 h-5" />
            Attendance
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isCheckedIn ? 'You are currently checked in' : 'You are currently checked out'}
          </p>
        </div>
      </div>

      {showCamera ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-black aspect-video flex justify-center items-center">
            {cameraLoading && <Loader2 className="absolute animate-spin text-white w-8 h-8" />}
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
          </div>
          <div className="flex gap-2">
            <Button onClick={stopCamera} variant="outline" disabled={checking}>Cancel</Button>
            <Button onClick={handleFaceCapture} disabled={checking || !modelsLoaded || cameraLoading}>
              {checking ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
              Capture & {pendingAction === 'check-in' ? 'Check In' : 'Check Out'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 mt-6">
          {!isCheckedIn ? (
            <>
              {requiresMethod ? (
                <>
                  {settings.face_id && (
                    <Button 
                      onClick={() => startCamera('check-in')}
                      disabled={checking || (settings.face_id && !modelsLoaded)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl flex items-center gap-2"
                    >
                      {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      Face ID Check In
                    </Button>
                  )}
                  {settings.router_ip_status && (
                    <Button 
                      onClick={() => handleRouterAction('check-in')}
                      disabled={checking}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/5 font-semibold px-6 rounded-xl flex items-center gap-2"
                    >
                      {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                      Router Check In
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  onClick={() => executeAction('check-in')}
                  disabled={checking}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl flex items-center gap-2"
                >
                  {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  Check In
                </Button>
              )}
            </>
          ) : (
            <>
              {requiresMethod ? (
                <>
                  {settings.face_id && (
                    <Button 
                      onClick={() => startCamera('check-out')}
                      disabled={checking || (settings.face_id && !modelsLoaded)}
                      variant="destructive"
                      className="font-semibold px-6 rounded-xl flex items-center gap-2 shadow-sm"
                    >
                      {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      Face ID Check Out
                    </Button>
                  )}
                  {settings.router_ip_status && (
                    <Button 
                      onClick={() => handleRouterAction('check-out')}
                      disabled={checking}
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10 font-semibold px-6 rounded-xl flex items-center gap-2"
                    >
                      {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                      Router Check Out
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  onClick={() => executeAction('check-out')}
                  disabled={checking}
                  variant="destructive"
                  className="font-semibold px-6 rounded-xl flex items-center gap-2 shadow-sm"
                >
                  {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  Check Out
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
