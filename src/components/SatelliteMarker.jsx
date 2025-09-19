import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';

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

export default SatelliteMarker;