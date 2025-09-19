import React, { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';

const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const toRadians = (deg) => deg * Math.PI / 180;
    const toDegrees = (rad) => rad * 180 / Math.PI;

    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);

    const dLon = lon2Rad - lon1Rad;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let brng = toDegrees(Math.atan2(y, x));
    return (brng + 360) % 360;
};

const SatelliteMarker = ({ satellite, onAnimationComplete }) => {
  const [currentPos, setCurrentPos] = useState([satellite.satlat, satellite.satlng]);
  const [rotation, setRotation] = useState(0);
  const markerRadius = 35;

  useEffect(() => {
    let animationInterval;

    const fetchSatellitePositions = async () => {
      try {
        const response = await fetch(`https://space-api.danmade.app/satellite-positions?satid=${satellite.satid}`);
        const data = await response.json();
        const positions = data.positions;

        if (positions && positions.length > 0) {
          let positionIndex = 0;
          animationInterval = setInterval(() => {
            if (positionIndex < positions.length) {
              const { satlatitude: currentLat, satlongitude: currentLng } = positions[positionIndex];
              setCurrentPos([currentLat, currentLng]);

              if (positionIndex + 1 < positions.length) {
                const { satlatitude: nextLat, satlongitude: nextLng } = positions[positionIndex + 1];
                const angle = calculateBearing(currentLat, currentLng, nextLat, nextLng);
                setRotation(angle);
              }
              positionIndex++;
            } else {
              clearInterval(animationInterval);
              if (onAnimationComplete) {
                onAnimationComplete();
              }
            }
          }, 40000 / positions.length);
        }
      } catch (error) {
        console.error('Error fetching satellite positions:', error);
      }
    };

    fetchSatellitePositions();

    return () => {
      clearInterval(animationInterval);
    };
  }, [satellite.satid, onAnimationComplete]);

  const iconMarkup = renderToStaticMarkup(
    <svg width={markerRadius * 2} height={markerRadius * 2} xmlns="http://www.w3.org/2000/svg">
      <circle cx={markerRadius} cy={markerRadius} r={markerRadius} fill="white" stroke="black" strokeWidth="2" />
      <circle cx={markerRadius} cy={markerRadius} r={markerRadius * .55} fill="black" />
      <def>
        <g id="direction-arrow">
            <path d={`M ${markerRadius},${markerRadius - 18} L ${markerRadius - 4},${markerRadius - 8} L ${markerRadius + 4},${markerRadius - 8} Z`} fill="white" />
        </g>
        <path id="text-path" d="M 10,35 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0" transform="scale(.6, .6)" />
      </def>
      <text fontFamily="monospace" fontSize="12" fill="black" fontWeight="700">
        <textPath href="#text-path">
          {satellite.satname}
        </textPath>
      </text>
      <text x={markerRadius} y={markerRadius} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="white" fontWeight="700">{new Date(satellite.launchDate).getFullYear()}</text>
      <use href="#direction-arrow" transform={`rotate(${rotation} ${markerRadius} ${markerRadius})`} />
    </svg>
  );

  const customIcon = new L.DivIcon({
    html: iconMarkup,
    className: "dummy", // needed
    iconSize: [markerRadius * 2, markerRadius * 2]
  });

  return (
    <Marker position={currentPos} icon={customIcon}>
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

export default SatelliteMarker;