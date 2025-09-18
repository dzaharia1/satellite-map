import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { convertDmsToDecimal } from "./coordinates.js";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
 
// E-ink styles
const eInkStyles = `
// .leaflet-tile-pane {
//   filter: grayscale(1) contrast(5);
// }
`;

const SatelliteMarker = ({ satellite }) => {
  const iconMarkup = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="35" r="35" fill="white" stroke="black" strokeWidth="2" />
      <circle cx="35" cy="35" r="20" fill="black" />
      <def>
        <path id="text-path" d="M 10,35 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0" transform="rotate(180) scale(.7, .7)" />
      </def>
      <text fontFamily="monospace" fontSize="12" fill="black" fontWeight={700}>
        <textPath href="#text-path" startOffset="50%" textAnchor="center">
          {satellite.satname}
        </textPath>
      </text>
    </svg>
  );
  
  const customIcon = new L.DivIcon({
    html: iconMarkup,
    className: "dummy", // needed
    iconSize: [35, 35]
  });
  
  return (
    <Marker position={[satellite.satlat, satellite.satlng]} icon={customIcon}>
      <Popup>
        <b>{satellite.satname}</b>
        <br />
        Launched {satellite.launchDate}
        <br />
        Altitude: {satellite.satalt} km
      </Popup>
    </Marker>
  );
};

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
          url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &amp; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        />
        {satellites.map((satellite) => (
          <SatelliteMarker key={satellite.satid} satellite={satellite} />
        ))}
      </MapContainer>
    </>
  );
}

export default App;