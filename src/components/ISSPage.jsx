import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { useLocation, useParams } from "react-router-dom";
import SatelliteMarker from "./SatelliteMarker";
import OffScreenIndicator from "./OffScreenIndicator";
import { convertDmsToDecimal } from "../coordinates";
import "leaflet/dist/leaflet.css";

// E-ink styles
const eInkStyles = `
// .leaflet-tile-pane {
//   filter: grayscale(1) contrast(5);
// }
`;

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
};

const ISSPage = () => {
  const { coordinates } = useParams();
  const location = useLocation();
  const noAnimate = location.pathname.endsWith("/no-animate");
  const [userLocation, setUserLocation] = useState(null);
  const [issData, setIssData] = useState(null);
  const [issPosition, setIssPosition] = useState(null); // [lat, lng]
  const [issHeading, setIssHeading] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle coordinates if provided
    if (coordinates) {
      try {
        const decoded = decodeURIComponent(coordinates);
        // Try DMS first
        try {
          const { latitude, longitude } = convertDmsToDecimal(decoded);
          setUserLocation([latitude, longitude]);
        } catch (dmsError) {
          // Try simple lat,lng
          const parts = decoded.split(",");
          if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              setUserLocation([lat, lng]);
            } else {
              throw dmsError;
            }
          } else {
            throw dmsError;
          }
        }
      } catch (err) {
        console.error("Error parsing coordinates:", err);
        setError("Invalid coordinates provided.");
        setUserLocation([0, 0]);
      }
    } else {
      // Get User Location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (err) => {
          console.error("Error getting location:", err);
          setError(
            "Could not get your location. Please enable location services."
          );
          // Fallback to default (Null Island) so map renders, but show error
          setUserLocation([0, 0]);
        }
      );
    }

    // Fetch initial ISS data
    const fetchISS = async () => {
      try {
        const response = await fetch(
          `https://space-api.danmade.app/satellite-positions?satid=25544`
        );
        const data = await response.json();
        if (data.positions && data.positions.length > 0) {
          const firstPos = data.positions[0];
          const satellite = {
            satid: 25544,
            satname: "ISS",
            satlat: firstPos.satlatitude,
            satlng: firstPos.satlongitude,
            satalt: 408, // Approximate altitude in km
            launchDate: "1998-11-20",
          };
          setIssData(satellite);
          setIssPosition([firstPos.satlatitude, firstPos.satlongitude]);
        }
      } catch (err) {
        console.error("Error fetching ISS data:", err);
      }
    };

    fetchISS();
  }, [coordinates]);

  if (error && !userLocation) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "monospace",
        }}
      >
        {error}
      </div>
    );
  }

  if (!userLocation || !issData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "monospace",
        }}
      >
        Loading ISS Tracking...
      </div>
    );
  }

  return (
    <>
      <style>{eInkStyles}</style>
      <MapContainer
        center={userLocation}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={!noAnimate}
      >
        <MapUpdater center={userLocation} />
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
          attribution={
            !noAnimate &&
            '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &amp; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          }
        />

        {/* User Location Marker */}
        {/* <CircleMarker
          center={userLocation}
          radius={8}
          pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.6 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker> */}

        {/* ISS Marker */}
        <SatelliteMarker
          satellite={issData}
          fetchInterval={2 * 60 * 1000}
          onPositionUpdate={setIssPosition}
          onRotationUpdate={setIssHeading}
          noAnimate={noAnimate}
        />

        {/* Off-screen Indicator */}
        {issPosition && (
          <OffScreenIndicator
            targetLat={issPosition[0]}
            targetLng={issPosition[1]}
            targetHeading={issHeading}
          />
        )}
      </MapContainer>
    </>
  );
};

export default ISSPage;
