// Satellites that get a dedicated tracking page. Each key is the URL path
// segment (e.g. /hubble), and the satid is the NORAD catalog number N2YO uses.
export const trackedSatellites = {
  iss: {
    satid: 25544,
    satname: "ISS",
    launchDate: "1998-11-20",
  },
  hubble: {
    satid: 20580,
    satname: "HUBBLE",
    launchDate: "1990-04-24",
  },
  tiangong: {
    // Tianhe core module of China's Tiangong space station.
    satid: 48274,
    satname: "TIANGONG",
    launchDate: "2021-04-29",
  },
};
