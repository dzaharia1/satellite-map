import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import { convertDmsToDecimal } from "./coordinates.js";
import SatelliteMarker from "./components/SatelliteMarker.jsx";
import "leaflet/dist/leaflet.css";
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
  const isIssRoute = pathname.toLowerCase().startsWith("/iss");
  
  // Check if the current path ends with "no-animate"
  const noAnimate = pathname.endsWith("/no-animate");
  
  // Extract coordinates from pathname
  let coordinates = null;
  if (!isIssRoute && pathname !== "/" && pathname !== "/no-animate") {
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
      if (isIssRoute) {
        return [0, 0];
      }
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
  const [issTick, setIssTick] = useState(0);

  // Non-ISS routes: fetch satellites above provided DMS and keep updating
  useEffect(() => {
    if (isIssRoute) return;

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

    return () => {
      clearInterval(intervalId);
    };
  }, [isIssRoute, dms, fetchInterval]);

  // ISS route: show only ISS (satid 25544). Optionally follow and animate.
  useEffect(() => {
    if (!isIssRoute) return;

    let refreshId;

    const fetchIssCurrent = async () => {
      try {
        setSatellites([]);
        setLastFetchTime(Date.now());
        const response = await fetch(`${apiUrl}/satellite-positions?satid=25544`);
        const data = await response.json();
        const first = data?.positions?.[0];
        if (first) {
          const iss = {
            satid: 25544,
            satname: "ISS (ZARYA)",
            satlat: first.satlatitude,
            satlng: first.satlongitude,
            satalt: first.sataltitude ?? first.satalt,
            launchDate: "1998-11-20T00:00:00Z",
          };
          setSatellites([iss]);
          setMapCenter([iss.satlat, iss.satlng]);
        }
      } catch (e) {
        console.error("Error fetching ISS position:", e);
      }
    };

    // Always fetch once to seed initial marker and center
    fetchIssCurrent();

    // When animating, refresh the ISS track on an interval to continue following
    if (!noAnimate) {
      refreshId = setInterval(() => {
        setIssTick((t) => t + 1);
        setLastFetchTime(Date.now());
      }, fetchInterval);
    }

    return () => {
      if (refreshId) clearInterval(refreshId);
    };
  }, [isIssRoute, noAnimate, fetchInterval]);

  // Countdown display: update every second based on lastFetchTime
  useEffect(() => {
    const updateCountdown = () => {
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
    };

    const countdownIntervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(countdownIntervalId);
  }, [lastFetchTime, fetchInterval]);

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
          satellites.map((satellite) => (
            <SatelliteMarker
              key={satellite.satid}
              satellite={satellite}
              noAnimate={noAnimate}
              fetchInterval={fetchInterval}
              follow={isIssRoute && !noAnimate}
              tick={issTick}
            />
          ))}
      </MapContainer>

      {!noAnimate && <UpdateCountdown timeUntil={countdownTimer} />}
    </>
  );
}

export default App;