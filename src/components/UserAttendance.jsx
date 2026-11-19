import React, { useState, useEffect, useRef } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, LogIn, LogOut, Camera, Wifi, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import * as faceapi from 'face-api.js';

export const UserAttendance = () => {
  const { data, loading, refresh } = useGet('/api/user/attendance/status');
  const { mutate } = useMutation();
  const [checking, setChecking] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState('onsite'); // 'onsite' | 'online'
  
  // Camera state
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'check-in' or 'check-out'

  useEffect(() => {
    if (data?.record) {
      if (data.record.onsite === false) {
        setCheckoutMode('online');
      } else {
        setCheckoutMode('onsite');
      }
    }
  }, [data?.record]);

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
      const video = videoRef.current;
      
      // Create a canvas and flip the image horizontally to match stored photo orientation
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Detect face from the flipped canvas
      const detection = await faceapi.detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No face detected. Please try again.');
        setChecking(false);
        return;
      }

      stopCamera();
      const payload = Array.from(detection.descriptor);
      console.log('[Face ID] Captured descriptor (first 5):', payload.slice(0, 5));
      await executeAction(pendingAction, payload);
    } catch (err) {
      console.error(err);
      toast.error('Face scanning failed.');
      setChecking(false);
    }
  };

  const executeAction = async (type, payload) => {
    const isCheckout = type === 'check-out';
    const isOnlineCheckout = isCheckout && checkoutMode === 'online';

    const sendRequest = async (coords = null) => {
      const endpoint = isCheckout ? '/api/user/attendance/check-out' : '/api/user/attendance/check-in';
      const httpMethod = isCheckout ? 'PUT' : 'POST';

      const bodyData = {
        payload,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        ...(isCheckout ? {
          checkoutMode,
          departureOnsite: checkoutMode === 'onsite',
          isOnline: checkoutMode === 'online',
        } : {})
      };

      const res = await mutate({
        method: httpMethod,
        url: endpoint,
        data: bodyData
      });

      if (res?.success) {
        toast.success(res.message || `Successfully ${isCheckout ? 'checked out' : 'checked in'}!`);
        refresh();
      } else {
        if (res?.message) toast.error(res.message);
      }
      setChecking(false);
    };

    if (!navigator.geolocation) {
      if (isOnlineCheckout) {
        setChecking(true);
        await sendRequest(null);
        return;
      }
      toast.error('Geolocation is not supported by your browser');
      setChecking(false);
      return;
    }

    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await sendRequest({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      async (error) => {
        if (isOnlineCheckout) {
          // In online checkout, GPS failure does not block the checkout process
          await sendRequest(null);
          return;
        }
        toast.error('Unable to retrieve your location. Location is required for onsite check-out.');
        setChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) {
    return <div className="p-4 border rounded-xl flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const isCheckedIn = data?.isCheckedIn;
  const settings = data?.settings || {};
  const requiresMethod = true; // Always requires Face ID now

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

      {/* Checkout Mode Selector when Checked In */}
      {isCheckedIn && !showCamera && (
        <div className="mb-5 p-4 rounded-xl bg-muted/40 border border-border/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>طريقة تسجيل الانصراف</span>
              <span className="text-xs text-muted-foreground font-normal">(Check-out Mode)</span>
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1.5 ${
              checkoutMode === 'onsite'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              {checkoutMode === 'onsite' ? <Building2 className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {checkoutMode === 'onsite' ? 'في مقر العمل' : 'العمل عن بُعد / أونلاين'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setCheckoutMode('onsite')}
              disabled={checking}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border cursor-pointer ${
                checkoutMode === 'onsite'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>في المقر (Onsite)</span>
            </button>

            <button
              type="button"
              onClick={() => setCheckoutMode('online')}
              disabled={checking}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border cursor-pointer ${
                checkoutMode === 'online'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>أونلاين (Online)</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1.5">
            {checkoutMode === 'onsite' ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>يتطلب التواجد الفعلي داخل النطاق الجغرافي وشبكة المقر.</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>تسجيل الانصراف عن بُعد (Online) من خارج المقر.</span>
              </>
            )}
          </p>
        </div>
      )}

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
              Capture & {pendingAction === 'check-in' ? 'Check In' : `Check Out (${checkoutMode === 'online' ? 'أونلاين' : 'في المقر'})`}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 mt-6">
          {!isCheckedIn ? (
            <>
              {requiresMethod ? (
                <>
                  {true && (
                    <Button 
                      onClick={() => startCamera('check-in')}
                      disabled={checking || !modelsLoaded}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl flex items-center gap-2"
                    >
                      {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      Face ID Check In
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
                  {true && (
                    <Button 
                      onClick={() => startCamera('check-out')}
                      disabled={checking || !modelsLoaded}
                      variant={checkoutMode === 'online' ? 'default' : 'destructive'}
                      className={`font-semibold px-6 rounded-xl flex items-center gap-2 shadow-sm ${
                        checkoutMode === 'online' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                      }`}
                    >
                      {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      Face ID Check Out ({checkoutMode === 'online' ? 'أونلاين' : 'في المقر'})
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  onClick={() => executeAction('check-out')}
                  disabled={checking}
                  variant={checkoutMode === 'online' ? 'default' : 'destructive'}
                  className={`font-semibold px-6 rounded-xl flex items-center gap-2 shadow-sm ${
                    checkoutMode === 'online' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                >
                  {checking ? <Loader2 className="animate-spin w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  Check Out ({checkoutMode === 'online' ? 'أونلاين' : 'في المقر'})
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
