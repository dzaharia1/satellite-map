import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { convertDmsToDecimal } from "./coordinates.js";
import SatelliteMarker from "./components/SatelliteMarker.jsx";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import UpdateCountdown from "./components/UpdateCountdown.jsx";

// E-ink styles
const eInkStyles = `
// .leaflet-tile-pane {
//   filter: grayscale(1) contrast(5);
// }
`;

const apiUrl = import.meta.env.VITE_API_URL;

function App() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Check if the current path ends with "no-animate"
  const noAnimate = pathname.endsWith("/no-animate");
  
  // Extract coordinates from pathname
  let coordinates = null;
  if (pathname !== "/" && pathname !== "/no-animate") {
    if (noAnimate) {
      // Remove "/no-animate" from the end to get coordinates
      coordinates = pathname.replace("/no-animate", "").substring(1);
    } else {
      // The entire pathname (minus leading slash) is coordinates
      coordinates = pathname.substring(1);
    }
  }
  
  // Decode URL-encoded coordinates
  const decodedCoordinates = coordinates ? decodeURIComponent(coordinates) : null;
  
  // Use coordinates from URL if available, otherwise use default
  const dms = decodedCoordinates || `40°38'57.3"N 73°53'42.8"W`;
  
  // uncomment to debug
  // console.log("Pathname:", pathname);
  // console.log("Raw coordinates:", coordinates);
  // console.log("Decoded coordinates:", decodedCoordinates);
  // console.log("No animate:", noAnimate);

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
  const [countdownTimer, setCountdownTimer] = useState("06:01");
  const fetchInterval = 2 * 60 * 1000; // 2 minutes
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  useEffect(() => {
    const fetchSatellites = () => {
      const radius = 15;
      console.log("Fetching new data");
      setSatellites([]);
      setLastFetchTime(Date.now()); // Update the last fetch time
      fetch(`${apiUrl}/satellites-above?dms=${encodeURIComponent(dms)}&radius=${radius}`)
        .then((response) => response.json())
        .then((data) => {
          setSatellites(data.above);
          console.log(`Fetch returned ${data.above.length} sats.\nUsed ${data.info.transactionscount} / 100 available transactions for /above`);
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

    fetchSatellites(); // Initial fetch
    const intervalId = setInterval(fetchSatellites, fetchInterval);

    const updateCountdown = () => {
      // Calculate time left until next fetch
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      const timeUntilNextFetch = fetchInterval - timeSinceLastFetch;
      
      if (timeUntilNextFetch <= 0) {
        setCountdownTimer("00:00");
      } else {
        const minutes = Math.floor(timeUntilNextFetch / 60000);
        const seconds = Math.floor((timeUntilNextFetch % 60000) / 1000);
        setCountdownTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }

    const countdownIntervalId = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(intervalId)
      clearInterval(countdownIntervalId)
    };
  }, [dms, lastFetchTime]);

  return (
    <>
      <style>{eInkStyles}</style>
      <MapContainer
        center={mapCenter}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={!noAnimate}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
          attribution={!noAnimate && '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &amp; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'}
        />
        {satellites &&
          satellites.map((satellite, index) => (
            <SatelliteMarker
              key={satellite.satid}
              satellite={satellite}
              noAnimate={noAnimate}
              fetchInterval={fetchInterval}
            />
          ))}
      </MapContainer>

      {!noAnimate && <UpdateCountdown timeUntil={countdownTimer} />}
    </>
  );
}

export default App;