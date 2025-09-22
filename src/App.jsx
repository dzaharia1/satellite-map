import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { convertDmsToDecimal } from "./coordinates.js";
import SatelliteMarker from "./components/SatelliteMarker.jsx";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// E-ink styles
const eInkStyles = `
// .leaflet-tile-pane {
//   filter: grayscale(1) contrast(5);
// }
`;

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  let { location } = useParams();
  const noAnimate = location && location.includes("no-animate");
  if (noAnimate) {
    location = null;
  }
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

  const fetchSatellites = useCallback(() => {
    const radius = 20;
    console.log("Fetching new data")
    fetch(
      `${apiUrl}/satellites-above?dms=${encodeURIComponent(dms)}&radius=${radius}`
    )
      .then((response) => response.json())
      .then((data) => {
        setSatellites(data.above);
        console.log(`Used ${data.info.transactionscount} / 100 available transactions for /above`);
      })
      .catch((error) => console.error("Error fetching satellite data:", error));
  }, [dms]);

  useEffect(() => {
    try {
      const { latitude, longitude } = convertDmsToDecimal(dms);
      setMapCenter([latitude, longitude]);
    } catch (error) {
      console.error("Error converting DMS to decimal on update:", error);
      setMapCenter([0, 0]); // Fallback on error
    }

    fetchSatellites();
  }, [location, fetchSatellites, dms]);

  return (
    <>
      <style>{eInkStyles}</style>
      <MapContainer
        center={mapCenter}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &amp; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        />
        {satellites &&
          satellites.map((satellite, index) => (
            <SatelliteMarker
              key={satellite.satid}
              satellite={satellite}
              onAnimationComplete={index === 0 ? fetchSatellites : null}
              noAnimate={noAnimate}
            />
          ))}
      </MapContainer>
    </>
  );
}

export default App;