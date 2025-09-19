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
