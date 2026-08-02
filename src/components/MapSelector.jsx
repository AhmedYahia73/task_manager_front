import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Trash2, MapPin, Check, X } from 'lucide-react';
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

  // Default center (Cairo, Egypt) if no locations exist
  const defaultCenter = [30.0444, 31.2357];
  
  // Calculate center of existing polygon if it exists
  const center = locations && locations.length > 0 
    ? locations[0] 
    : defaultCenter;

  const handleAddPoint = (point) => {
    setCurrentPolygon((prev) => [...prev, point]);
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {!isDrawing ? (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setCurrentPolygon([]);
              setIsDrawing(true);
            }}
            className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
          >
            <MapPin className="w-4 h-4" />
            {locations && locations.length > 0 ? 'Draw New Perimeter (Overwrites current)' : 'Add Perimeter'}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="default" 
              onClick={finishDrawing}
              disabled={currentPolygon.length < 3}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Perimeter
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
              {currentPolygon.length < 3 ? `Click map to add points (min 3). Points: ${currentPolygon.length}` : `Points: ${currentPolygon.length}`}
            </span>
          </div>
        )}
      </div>

      <div className="border border-border rounded-lg overflow-hidden h-[400px] w-full relative z-0">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationClicker isDrawing={isDrawing} onAddPoint={handleAddPoint} />
          
          {/* Render existing single polygon if not drawing a new one */}
          {(!isDrawing && locations && locations.length >= 3) && (
            <Polygon positions={locations} color="blue" />
          )}

          {/* Render currently drawing polygon */}
          {currentPolygon.length > 0 && (
            <Polygon positions={currentPolygon} color="red" dashArray="5, 10" />
          )}
        </MapContainer>
      </div>

      {/* Info of saved location */}
      {(!isDrawing && locations && locations.length >= 3) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Saved Perimeter</h3>
          <div className="flex items-center justify-between p-2 border border-border rounded-md bg-muted/30">
            <span className="text-sm">Polygon ({locations.length} points)</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={removeLocation}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
