import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
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

const StatusMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 0 24px;
  text-align: center;
  font-family: monospace;
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

// Tracks a single satellite relative to the viewer's location.
// `satellite` is one of the entries in src/satellites.js.
const SatellitePage = ({ satellite }) => {
  const { coordinates } = useParams();
  const location = useLocation();
  const noAnimate = location.pathname.endsWith("/no-animate");
  const [userLocation, setUserLocation] = useState(null);
  const [satData, setSatData] = useState(null);
  const [satPosition, setSatPosition] = useState(null); // [lat, lng]
  const [satHeading, setSatHeading] = useState(0);
  const [error, setError] = useState(null);
  const [trackingError, setTrackingError] = useState(null);

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
  }, [coordinates]);

  useEffect(() => {
    let cancelled = false;
    setSatData(null);
    setSatPosition(null);
    setTrackingError(null);

    // Fetch the satellite's current position
    const fetchSatellite = async () => {
      try {
        const response = await fetch(
          `https://space-api.danmade.app/satellite-positions?satid=${satellite.satid}`
        );
        const data = await response.json();
        if (cancelled) return;

        if (data.positions && data.positions.length > 0) {
          const firstPos = data.positions[0];
          setSatData({
            ...satellite,
            satlat: firstPos.satlatitude,
            satlng: firstPos.satlongitude,
            satalt:
              firstPos.sataltitude != null
                ? Math.round(firstPos.sataltitude)
                : "?",
          });
          setSatPosition([firstPos.satlatitude, firstPos.satlongitude]);
        } else {
          // N2YO knows the object but has no orbital elements for it.
          console.warn(`No positions returned for ${satellite.satname}`, data);
          setTrackingError(
            `No tracking data is available for ${satellite.satname} yet.`
          );
        }
      } catch (err) {
        if (cancelled) return;
        console.error(`Error fetching ${satellite.satname} data:`, err);
        setTrackingError(
          `Could not load tracking data for ${satellite.satname}.`
        );
      }
    };

    fetchSatellite();

    return () => {
      cancelled = true;
    };
  }, [satellite]);

  if (trackingError) {
    return <StatusMessage>{trackingError}</StatusMessage>;
  }

  if (error && !userLocation) {
    return <StatusMessage>{error}</StatusMessage>;
  }

  if (!userLocation || !satData) {
    return (
      <StatusMessage>Loading {satellite.satname} Tracking...</StatusMessage>
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

        {/* Satellite Marker */}
        <SatelliteMarker
          key={satellite.satid}
          satellite={satData}
          fetchInterval={2 * 60 * 1000}
          onPositionUpdate={setSatPosition}
          onRotationUpdate={setSatHeading}
          noAnimate={noAnimate}
        />

        {/* Off-screen Indicator */}
        {satPosition && (
          <OffScreenIndicator
            targetLat={satPosition[0]}
            targetLng={satPosition[1]}
            targetHeading={satHeading}
          />
        )}
      </MapContainer>
    </>
  );
};

export default SatellitePage;
