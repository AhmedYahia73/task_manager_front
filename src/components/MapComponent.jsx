import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { Input } from "@/components/ui/input";
import MapClickHandler from "./MapClickHandler";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";


// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center.lat && center.lng) {
            map.setView([center.lat, center.lng], map.getZoom());
        }
    }, [center, map]);
    return null;
};

const MapEvents = ({ handleMapClick, isMapClickEnabled }) => {
    const map = useMap(); // Get the map instance

    useEffect(() => {
        if (handleMapClick && isMapClickEnabled) {
            map.on('click', handleMapClick);
            return () => {
                map.off('click', handleMapClick);
            };
        }
    }, [map, handleMapClick, isMapClickEnabled]);

    return null;
};

const MapComponent = ({
    selectedLocation,
    setSelectedLocation,
    locationName,
    setLocationName,
    handleMapClick,
    form,
    onMarkerDragEnd,
    isMapClickEnabled = true,
}) => {
    // Use form.watch to get the current value of the address field
    const watchedAddress = form.watch("address");
    const RecenterMap = ({ coords }) => {
        const map = useMap();
        useEffect(() => {
            if (coords.lat && coords.lng) {
                map.setView([coords.lat, coords.lng], 13);
            }
        }, [coords, map]);
        return null;
    };
    return (
        <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden shadow-lg h-[400px]">
                {selectedLocation.lat && selectedLocation.lng ? (
                    <MapContainer
                        center={selectedLocation}
                        zoom={13}
                        scrollWheelZoom={true}
                        className="w-full h-full"
                        style={{ minHeight: "100%", zIndex: 1 }}
                    >
                        <RecenterMap coords={selectedLocation} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ChangeView center={selectedLocation} />
                        <Marker
                            position={selectedLocation}
                            draggable={true}
                            eventHandlers={{
                                dragend: onMarkerDragEnd,
                            }}
                        />
                        <MapEvents
                            handleMapClick={handleMapClick}
                            isMapClickEnabled={isMapClickEnabled}
                        />
                        {isMapClickEnabled && setSelectedLocation && (
                            <MapClickHandler
                                setSelectedLocation={setSelectedLocation}
                                setLocationName={setLocationName}
                                form={form}
                            />
                        )}
                        <Circle
                            center={selectedLocation}
                            pathOptions={{ fillColor: 'blue', color: 'blue' }}
                            radius={500} // نصف القطر بالمتر
                        />
                    </MapContainer>
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
                        Loading Map...
                    </div>
                )}
            </div>

            {/* Manual Location Input - برة حاوية الخريطة عشان متتقصش */}
            <Input
                // Use watchedAddress from react-hook-form as the value
                value={watchedAddress || locationName}
                // Update the form state and the locationName state on change
                onChange={(e) => {
                    setLocationName(e.target.value);
                    form.setValue("address", e.target.value, { shouldValidate: true });
                }}
                placeholder="Enter your location manually or click on map"
                className="w-full h-10 text-sm rounded-md"
            />
        </div>
    );
};

export default MapComponent;