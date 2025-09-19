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

const apiUrl = import.meta.env.VITE_API_URL;

const SatelliteMarker = ({ satellite }) => {
  const markerRadius = 35;
  const iconMarkup = renderToStaticMarkup(
    <svg width={markerRadius * 2} height={markerRadius * 2} xmlns="http://www.w3.org/2000/svg">
      <circle cx={markerRadius} cy={markerRadius} r={markerRadius} fill="white" stroke="black" strokeWidth="2" />
      <circle cx={markerRadius} cy={markerRadius} r={markerRadius * .55} fill="black" />
      <def>
        <path id="text-path" d="M 10,35 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0" transform="scale(.6, .6)" />
      </def>
      <text fontFamily="monospace" fontSize="12" fill="black" fontWeight="700">
        <textPath href="#text-path">
          {satellite.satname}
        </textPath>
      </text>
      <text x={markerRadius} y={markerRadius} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="white" fontWeight="700">{new Date(satellite.launchDate).getFullYear()}</text>

    </svg>
  );
  
  const customIcon = new L.DivIcon({
    html: iconMarkup,
    className: "dummy", // needed
    iconSize: [markerRadius * 2, markerRadius * 2]
  });
  
  return (
    <Marker position={[satellite.satlat, satellite.satlng]} icon={customIcon}>
      <Popup>
        <b>{satellite.satname}</b>
        <br />
        Launched {new Date(satellite.launchDate).toLocaleDateString()}
        <br />
        Altitude: {satellite.satalt} km
        <br />
        <a href={`https://www.n2yo.com/?s=${satellite.satid}&live=1`}>More info</a>
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
        `${apiUrl}/satellites-above?dms=${encodeURIComponent(dms)}&radius=${radius}`
      )
        .then((response) => response.json())
        .then((data) => {
          setSatellites(data.above);
          console.log(data.info.transactionscount);
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
    const intervalId = setInterval(fetchSatellites, 36000);

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
          url="https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &amp; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        />
        {satellites &&
          satellites.map((satellite) => (
            <SatelliteMarker key={satellite.satid} satellite={satellite} />
          ))
        }
      </MapContainer>
    </>
  );
}

export default App;