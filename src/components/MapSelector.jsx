import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Circle,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  MapPin,
  CheckCircle2,
  X,
  LocateFixed,
  Loader2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Undo2,
  Expand,
  Shrink,
} from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons if needed
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map events and size invalidator controller
const MapEventsController = ({
  isDrawing,
  onAddPoint,
  onMapReady,
  onCenterZoomChange,
  triggerInvalidate,
}) => {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Invalidate map dimensions whenever size/fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map, triggerInvalidate]);

  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
    moveend() {
      const c = map.getCenter();
      const z = map.getZoom();
      onCenterZoomChange([c.lat, c.lng], z);
    },
  });

  return null;
};

export const MapSelector = ({ locations = [], onChange }) => {
  const defaultCenter = [30.0444, 31.2357]; // Cairo default
  const defaultZoom = 14;

  const parseLocations = useCallback((locs) => {
    let parsed = locs;
    while (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c) =>
          (Array.isArray(c) && c.length >= 2 && c[0] != null && c[1] != null && !isNaN(Number(c[0])) && !isNaN(Number(c[1]))) ||
          (c && typeof c === 'object' && c.lat != null && c.lng != null && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng)))
      )
      .map((c) => {
        if (Array.isArray(c)) return [Number(c[0]), Number(c[1])];
        return [Number(c.lat), Number(c.lng)];
      });
  }, []);

  const validLocations = useMemo(() => parseLocations(locations), [locations, parseLocations]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);

  // Position & sizing states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Remembered center and zoom
  const [mapCenter, setMapCenter] = useState(() => (validLocations.length > 0 ? validLocations[0] : defaultCenter));
  const [mapZoom, setMapZoom] = useState(defaultZoom);

  const handleCenterZoomChange = useCallback((center, zoom) => {
    setMapCenter(center);
    setMapZoom(zoom);
  }, []);

  // Fit bounds when validLocations are first loaded or changed
  useEffect(() => {
    if (mapInstance && validLocations.length >= 3 && !isDrawing) {
      try {
        mapInstance.fitBounds(validLocations, { padding: [35, 35] });
      } catch (e) {
        // ignore
      }
    }
  }, [mapInstance, validLocations, isDrawing]);

  // Handle Escape key to close fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Prevent background scrolling while in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  // Add point while drawing
  const handleAddPoint = (point) => {
    const newPolygon = [...currentPolygon, point];
    setCurrentPolygon(newPolygon);
    if (newPolygon.length >= 3) {
      onChange(newPolygon);
    }
  };

  // Undo last added point
  const handleUndoPoint = () => {
    if (currentPolygon.length === 0) return;
    const nextPolygon = currentPolygon.slice(0, -1);
    setCurrentPolygon(nextPolygon);
    if (nextPolygon.length >= 3) {
      onChange(nextPolygon);
    } else {
      onChange([]);
    }
  };

  const startDrawing = () => {
    setCurrentPolygon([]);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (currentPolygon.length >= 3) {
      onChange(currentPolygon);
      toast.success(`تم حفظ المحيط بنجاح (${currentPolygon.length} نقاط)`);
    }
    setCurrentPolygon([]);
    setIsDrawing(false);
  };

  const cancelDrawing = () => {
    setCurrentPolygon([]);
    setIsDrawing(false);
  };

  const removeLocation = () => {
    onChange([]);
    setCurrentPolygon([]);
    toast.info('تم حذف المحيط المحدد');
  };

  // Geolocation handler (Current Location)
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع الجغرافي (Geolocation not supported)');
      return;
    }

    setIsLocating(true);

    const onLocationSuccess = (position) => {
      setIsLocating(false);
      const { latitude, longitude } = position.coords;
      const coords = [latitude, longitude];
      setCurrentLocation(coords);
      setMapCenter(coords);
      setMapZoom(17);

      if (mapInstance) {
        mapInstance.flyTo(coords, 17, {
          animate: true,
          duration: 1.2,
        });
      }
      toast.success('تم تحديد موقعك الحالي بنجاح (Current location detected)');
    };

    const onLocationError = (error) => {
      // If high accuracy timed out, retry with standard accuracy
      if (error.code === error.TIMEOUT) {
        navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          () => {
            setIsLocating(false);
            toast.error('انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى.');
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
        return;
      }

      setIsLocating(false);
      let msg = 'تعذر تحديد الموقع الجغرافي';
      if (error.code === error.PERMISSION_DENIED) {
        msg = 'تم رفض إذن الوصول للموقع. يرجى تفعيل إذن الموقع من إعدادات المتصفح.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'بيانات الموقع غير متوفرة حالياً على جهازك.';
      }
      toast.error(msg);
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const displayPolygon = isDrawing ? currentPolygon : validLocations;

  // Render Map Container & Overlays
  const renderMap = () => (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        doubleClickZoom={!isDrawing}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventsController
          isDrawing={isDrawing}
          onAddPoint={handleAddPoint}
          onMapReady={setMapInstance}
          onCenterZoomChange={handleCenterZoomChange}
          triggerInvalidate={`${isFullscreen}-${isExpanded}`}
        />

        {/* Current Location Pulse & Marker */}
        {currentLocation && (
          <>
            <Circle
              center={currentLocation}
              radius={35}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.25,
                weight: 2,
              }}
            />
            <CircleMarker
              center={currentLocation}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#2563eb',
                fillOpacity: 1,
                weight: 2.5,
              }}
            >
              <Popup>
                <div className="p-1 text-center font-sans">
                  <div className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                    <LocateFixed className="w-3.5 h-3.5" /> موقعك الحالي
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {currentLocation[0].toFixed(5)}, {currentLocation[1].toFixed(5)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Points visual markers while drawing */}
        {isDrawing &&
          currentPolygon.map((pt, idx) => (
            <CircleMarker
              key={idx}
              center={pt}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#ef4444',
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}

        {/* In-progress dashed Polyline */}
        {isDrawing && currentPolygon.length >= 2 && (
          <Polyline
            positions={currentPolygon}
            pathOptions={{
              color: '#ef4444',
              dashArray: '6, 8',
              weight: 2.5,
            }}
          />
        )}

        {/* Polygon */}
        {displayPolygon.length >= 3 && (
          <Polygon
            positions={displayPolygon}
            pathOptions={{
              color: isDrawing ? '#ef4444' : '#2563eb',
              fillColor: isDrawing ? '#f87171' : '#3b82f6',
              fillOpacity: isDrawing ? 0.25 : 0.2,
              weight: 2.5,
              dashArray: isDrawing ? '6, 8' : undefined,
            }}
          />
        )}
      </MapContainer>

      {/* Floating Map Action Buttons */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5 shadow-lg pointer-events-auto">
        <button
          type="button"
          onClick={() => mapInstance?.zoomIn()}
          title="تكبير الخريطة (Zoom In)"
          className="w-9 h-9 rounded-xl bg-background/95 hover:bg-background text-foreground border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstance?.zoomOut()}
          title="تصغير الخريطة (Zoom Out)"
          className="w-9 h-9 rounded-xl bg-background/95 hover:bg-background text-foreground border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isLocating}
          title="موقعي الحالي (Current Location)"
          className={`w-9 h-9 rounded-xl bg-background/95 hover:bg-background border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
            isLocating ? 'text-primary' : 'text-blue-600 dark:text-blue-400'
          }`}
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
        </button>
        {displayPolygon.length >= 3 && (
          <button
            type="button"
            onClick={() => mapInstance?.fitBounds(displayPolygon, { padding: [35, 35] })}
            title="تركيز على المحيط (Fit Perimeter)"
            className="w-9 h-9 rounded-xl bg-background/95 hover:bg-background text-foreground border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          title={isFullscreen ? 'تصغير الخريطة (Exit Fullscreen)' : 'ملء الشاشة (Fullscreen)'}
          className="w-9 h-9 rounded-xl bg-background/95 hover:bg-background text-foreground border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  // Drawing Controls Toolbar
  const renderDrawingControls = () => (
    <div className="flex items-center gap-2 flex-wrap">
      {!isDrawing ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startDrawing}
            className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
          >
            <MapPin className="w-4 h-4" />
            {validLocations.length > 0 ? 'Redraw Perimeter' : 'Draw Perimeter'}
          </Button>
          {validLocations.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeLocation}
              className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </Button>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={finishDrawing}
            disabled={currentPolygon.length < 3}
            className="flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done ({currentPolygon.length} pts)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndoPoint}
            disabled={currentPolygon.length === 0}
            title="تراجع عن آخر نقطة"
            className="flex items-center gap-1"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={cancelDrawing}
            className="flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {currentPolygon.length < 3
              ? `Click on map to add points (min 3)`
              : `✓ Polygon ready — click Done or keep adding`}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Fullscreen Modal View */}
      {isFullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex flex-col p-3 sm:p-6 animate-in fade-in duration-150">
            <div className="bg-card w-full h-full rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center justify-between shrink-0 flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Zone Perimeter (ملء الشاشة)</h3>
                    <p className="text-xs text-muted-foreground">
                      {isDrawing
                        ? `Drawing in progress: ${currentPolygon.length} point(s) placed`
                        : validLocations.length >= 3
                        ? `Perimeter configured: ${validLocations.length} points`
                        : 'Click Draw Perimeter to outline this zone'}
                    </p>
                  </div>
                </div>

                {/* Controls in Fullscreen */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCurrentLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                    <span>Current Location (موقعي الحالي)</span>
                  </Button>

                  {renderDrawingControls()}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFullscreen(false)}
                    className="flex items-center gap-1.5"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Exit Fullscreen</span>
                  </Button>
                </div>
              </div>

              {/* Map body */}
              <div className="flex-1 w-full relative">{renderMap()}</div>
            </div>
          </div>,
          document.body
        )}

      {/* Normal Inline View */}
      <div className="space-y-3">
        {/* Top Controls Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {renderDrawingControls()}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              <span>Current Location</span>
            </Button>
          </div>

          {/* Sizing & Fullscreen Toggles */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'تصغير ارتفاع الخريطة' : 'تكبير ارتفاع الخريطة'}
              className="h-8 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
              <span>{isExpanded ? 'Smaller' : 'Larger'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              title="ملء الشاشة (تكبير الخريطة)"
              className="h-8 px-2.5 text-xs flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fullscreen</span>
            </Button>
          </div>
        </div>

        {/* Inline Map Container */}
        <div
          className={`border border-border rounded-xl overflow-hidden w-full relative z-0 shadow-sm transition-[height] duration-200 ${
            isExpanded ? 'h-[460px]' : 'h-[300px]'
          }`}
        >
          {renderMap()}
        </div>

        {/* Saved Perimeter Summary Badge */}
        {!isDrawing && validLocations.length >= 3 && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-xs">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Perimeter saved — {validLocations.length} points</span>
            </div>
            {mapInstance && (
              <button
                type="button"
                onClick={() => mapInstance.fitBounds(validLocations, { padding: [35, 35] })}
                className="text-teal-700 dark:text-teal-300 underline font-semibold hover:opacity-80"
              >
                Focus on map
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
