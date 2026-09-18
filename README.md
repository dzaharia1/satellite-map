# satellite-map

This application displays satellites currently passing over a specific geographic location on a map. The location is provided via Degrees, Minutes, Seconds (DMS) coordinates in the URL.

## Usage

The map's center is determined by the DMS coordinates provided in the URL path. If no coordinates are provided, it defaults to New York City.

### URL Structure

```
https://satellite-map.danmade.app/<DMS_COORDINATES>
```

The `<DMS_COORDINATES>` parameter should be a URL-encoded string representing the latitude and longitude in DMS format, separated by a space.

**Format:** `LATITUDE LONGITUDE`

**Example DMS:** `40°38'57.3"N 73°53'42.8"W`

**Example URL-encoded DMS:** `40%C2%B038'57.3%22N%2073%C2%B053'42.8%22W`

**Full Example URL:**
https://satellite-map.adanmade.app/40%C2%B038'57.3%22N%2073%C2%B053'42.8%22W

## Single-satellite tracking pages

These pages show one satellite's live position relative to you, with an
indicator on the edge of the map pointing toward it (and showing its distance
and heading) whenever it is off screen.

| Path      | Satellite                   |
| --------- | --------------------------- |
| `/iss`    | International Space Station |
| `/hubble` | Hubble Space Telescope      |

The map centers on your browser's geolocation. Each path also accepts:

- `/<sat>/no-animate` — static rendering without map controls (for e-ink displays)
- `/<sat>/<coordinates>` — center on the given DMS or `lat,lng` coordinates instead of geolocation, e.g. `/hubble/40.65,-73.89`

Satellites are defined in `src/satellites.js`; add an entry there to get a new page.
