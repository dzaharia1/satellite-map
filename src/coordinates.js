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
