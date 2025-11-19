import React, { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { calculateBearing, calculateDistance } from "../coordinates";

const getBearingLabel = (bearing) => {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return `${Math.round(bearing)}° ${directions[index]}`;
};

const OffScreenIndicator = ({ targetLat, targetLng }) => {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [angle, setAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const mapBounds = map.getBounds();
      const targetLatLng = { lat: targetLat, lng: targetLng };

      if (mapBounds.contains(targetLatLng)) {
        setIsVisible(false);
        return;
      }

      setIsVisible(true);

      const center = map.getCenter();
      const bearing = calculateBearing(
        center.lat,
        center.lng,
        targetLat,
        targetLng
      );
      setAngle(bearing);

      const dist = calculateDistance(
        center.lat,
        center.lng,
        targetLat,
        targetLng
      );
      setDistance(dist);

      // Calculate position on screen edge
      const size = map.getSize();
      const w = size.x;
      const h = size.y;
      const cx = w / 2;
      const cy = h / 2;

      // Convert bearing to radians, adjusting for screen coordinate system (0 is up, clockwise)
      // Math functions usually take 0 as right (East), counter-clockwise.
      // Bearing 0 (North) -> -90 degrees in standard math or just swap sin/cos logic.
      // Let's stick to bearing: 0 is Up.
      const rad = (bearing - 90) * (Math.PI / 180); // Convert to standard math angle (0 is Right)

      // We want to find intersection of ray from (cx, cy) with angle 'bearing' against the box (0,0,w,h)
      // Ray: x = cx + t * sin(bearing), y = cy - t * cos(bearing)  (Note: y is inverted because screen Y is down)

      const sin = Math.sin((bearing * Math.PI) / 180);
      const cos = Math.cos((bearing * Math.PI) / 180);

      // t for vertical edges
      // x = 0 => t = -cx / sin
      // x = w => t = (w - cx) / sin

      // t for horizontal edges
      // y = 0 => t = cy / cos  (since y = cy - t*cos => 0 = cy - t*cos => t = cy/cos)
      // y = h => t = (cy - h) / cos

      let t = Infinity;

      // Check intersection with Right edge (x=w)
      if (sin > 0) {
        const tCandidate = (w - cx) / sin;
        if (tCandidate < t) t = tCandidate;
      }
      // Check intersection with Left edge (x=0)
      if (sin < 0) {
        const tCandidate = -cx / sin;
        if (tCandidate < t) t = tCandidate;
      }
      // Check intersection with Top edge (y=0)
      if (cos > 0) {
        const tCandidate = cy / cos;
        if (tCandidate < t) t = tCandidate;
      }
      // Check intersection with Bottom edge (y=h)
      if (cos < 0) {
        const tCandidate = (cy - h) / cos;
        if (tCandidate < t) t = tCandidate;
      }

      // Apply padding
      const padding = 40;
      const x = cx + t * sin;
      const y = cy - t * cos;

      // Clamp to be safe and apply padding
      const clampedX = Math.max(padding, Math.min(w - padding, x));
      const clampedY = Math.max(padding, Math.min(h - padding, y));

      setPosition({ x: clampedX, y: clampedY });
    };

    map.on("move", updatePosition);
    map.on("zoom", updatePosition);
    updatePosition();

    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [map, targetLat, targetLng]);

  if (!isVisible || !position) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%)`,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer white circle with black stroke */}
        <circle
          cx="36"
          cy="36"
          r="35"
          fill="white"
          stroke="black"
          strokeWidth="2"
        />
        {/* Inner black circle */}
        <circle cx="36" cy="36" r="19.25" fill="black" />
        {/* Text path for distance around the circle */}
        <defs>
          <path
            id="text-path-indicator-top"
            d="M 13,35 a 22.5,22.5 0 1,1 45,0 a 22.5,22.5 0 1,1 -45,0"
          />
          <path
            id="text-path-indicator-bottom"
            d="M 8.5,38.5 a 26,26 0 0,0 57.5,0"
          />
        </defs>
        <text
          fontFamily="monospace"
          fontSize="12"
          fill="black"
          fontWeight="700"
        >
          <textPath href="#text-path-indicator-top">
            {Math.round(distance).toLocaleString()} KM
          </textPath>
        </text>
        <text
          fontFamily="monospace"
          fontSize="12"
          fill="black"
          fontWeight="700"
        >
          <textPath
            href="#text-path-indicator-bottom"
            startOffset="50%"
            textAnchor="middle"
          >
            {getBearingLabel(angle)}
          </textPath>
        </text>
        {/* White arrow pointing up (rotated to point toward ISS) */}
        <path
          d="M 36,18 L 32,28 L 40,28 Z"
          fill="white"
          transform={`rotate(${angle} 36 36)`}
        />
      </svg>
    </div>
  );
};

export default OffScreenIndicator;
