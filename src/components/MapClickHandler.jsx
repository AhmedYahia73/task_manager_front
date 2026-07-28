//helper component to handle map clicks and geocoding
import { useMapEvents } from "react-leaflet";
import { tryGeocode } from "./tryGeocode";

const MapClickHandler = ({ setSelectedLocation, setLocationName, form }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setSelectedLocation({ lat, lng });

            // نستخدم الـ helper الموحّد بدل تكرار كود الـ fetch هنا
            tryGeocode(lat, lng, setLocationName, form);
        },
    });
    return null;
};

export default MapClickHandler;