import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { convertDmsToDecimal } from "./coordinates.js";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// E-ink styles
const eInkStyles = `
// .leaflet-tile-pane {
//   filter: grayscale(1) contrast(5);
// }
`;

// You may need to adjust the icon paths based on your project structure
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

function App() {
  let { location } = useParams();
  const dms = location || `40°38'57.3"N 73°53'42.8"W`;

  const getInitialCenter = () => {
    try {
      const { latitude, longitude } = convertDmsToDecimal(dms);
      return [latitude, longitude];
    } catch (error) {
      console.error("Error converting DMS to decimal:", error);
      return [0, 0]; // Fallback center
    }
  };

  const [satellites, setSatellites] = useState([]);
  const [mapCenter, setMapCenter] = useState(getInitialCenter);

  console.log(mapCenter);

  useEffect(() => {
    const radius = 12;

    const fetchSatellites = () => {
      fetch(
        `https://space-api.adanmade.app/satellites-above?dms=${encodeURIComponent(dms)}&radius=${radius}`
      )
        .then((response) => response.json())
        .then((data) => {
          setSatellites(data.above);
        })
        .catch((error) => console.error("Error fetching satellite data:", error));
    };

    try {
      const { latitude, longitude } = convertDmsToDecimal(dms);
      setMapCenter([latitude, longitude]);
    } catch (error) {
      console.error("Error converting DMS to decimal on update:", error);
      setMapCenter([0, 0]); // Fallback on error
    }

    fetchSatellites();
    const intervalId = setInterval(fetchSatellites, 30000);

    return () => clearInterval(intervalId);
  }, [location]);

  return (
    <>
      <style>{eInkStyles}</style>
      <MapContainer
        center={mapCenter}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {satellites.map((satellite) => (
          <Marker
            key={satellite.satid}
            position={[satellite.satlat, satellite.satlng]}
            icon={defaultIcon}
          >
            <Popup>
              <b>{satellite.satname}</b>
              <br />
              Latitude: {satellite.satlat}
              <br />
              Longitude: {satellite.satlng}
              <br />
              Altitude: {satellite.satalt} km
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}

export default App;