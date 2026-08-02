import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Trash2, MapPin, CheckCircle2, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const LocationClicker = ({ isDrawing, onAddPoint }) => {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

export const MapSelector = ({ locations = [], onChange }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState([]);

  const defaultCenter = [30.0444, 31.2357];

  const parseLocations = (locs) => {
    let parsed = locs;
    while (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { break; }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(c =>
      (Array.isArray(c) && c.length >= 2 && c[0] != null && c[1] != null) ||
      (c && typeof c === 'object' && c.lat != null && c.lng != null)
    );
  };

  const validLocations = parseLocations(locations);
  const center = validLocations.length > 0 ? validLocations[0] : defaultCenter;

  const handleAddPoint = (point) => {
    const newPolygon = [...currentPolygon, point];
    setCurrentPolygon(newPolygon);
    // Auto-save to parent on every click so parent always has latest
    if (newPolygon.length >= 3) {
      onChange(newPolygon);
    }
  };

  const startDrawing = () => {
    setCurrentPolygon([]);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (currentPolygon.length >= 3) {
      onChange(currentPolygon);
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
  };

  const displayPolygon = isDrawing ? currentPolygon : validLocations;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {!isDrawing ? (
          <>
            <Button
              type="button"
              variant="outline"
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
              onClick={finishDrawing}
              disabled={currentPolygon.length < 3}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Done ({currentPolygon.length} pts)
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={cancelDrawing}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPolygon.length < 3
                ? `Click on map to add points (min 3)`
                : `✓ Polygon ready — click Done or keep adding`}
            </span>
          </div>
        )}
      </div>

      <div className="border border-border rounded-lg overflow-hidden h-[400px] w-full relative z-0">
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationClicker isDrawing={isDrawing} onAddPoint={handleAddPoint} />

          {displayPolygon.length >= 3 && (
            <Polygon
              positions={displayPolygon}
              color={isDrawing ? 'red' : 'blue'}
              dashArray={isDrawing ? '5, 10' : undefined}
            />
          )}
        </MapContainer>
      </div>

      {!isDrawing && validLocations.length >= 3 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="text-sm text-teal-700 dark:text-teal-300">
            Perimeter saved — {validLocations.length} points
          </span>
        </div>
      )}
    </div>
  );
};
