/**
 * Converts a DMS coordinate string (latitude and longitude) to decimal degrees.
 * @param {string} dmsString - A string containing both latitude and longitude in DMS format, e.g., `40°41'34.4"N 73°58'54.2"W`.
 * @returns {{latitude: number, longitude: number}} An object with decimal latitude and longitude.
 */
export const convertDmsToDecimal = (dmsString) => {
    const dmsToDecimal = (dmsPart) => {
        const parts = dmsPart.match(/(\d+)\D+(\d+)\D+(\d+(\.\d+)?)\D*([NSEW])/);
        if (!parts) {
            throw new Error(`Invalid DMS component format: ${dmsPart}`);
        }
        const degrees = parseFloat(parts[1]);
        const minutes = parseFloat(parts[2]);
        const seconds = parseFloat(parts[3]);
        const direction = parts[5];
        let decimal = degrees + minutes / 60 + seconds / 3600;
        if (direction === "S" || direction === "W") {
            decimal = -decimal;
        }
        return decimal;
    };
    const dmsParts = dmsString.trim().split(/\s+/);
    if (dmsParts.length !== 2) {
        throw new Error(`Invalid DMS string format: ${dmsString}`);
    }
    return {
        latitude: dmsToDecimal(dmsParts[0]),
        longitude: dmsToDecimal(dmsParts[1]),
    };
};

export const calculateBearing = (lat1, lon1, lat2, lon2) => {
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

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

