export interface GeoDistrictFeature {
  type: "Feature";
  id: string;
  properties: {
    neighbourhood_id: string;
    neighbourhood_name: string;
    area_sqkm: number;
    is_illustrative: boolean;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
  };
}

export interface CityGeoCollection {
  type: "FeatureCollection";
  city_name: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  is_illustrative: boolean;
  disclaimer: string;
  features: GeoDistrictFeature[];
}

// Metro Verde: Anchored near Sabarmati urban river valley (Ahmedabad region context, 23.03° N, 72.58° E)
export const METRO_VERDE_GEO: CityGeoCollection = {
  type: "FeatureCollection",
  city_name: "Metro Verde Municipal Region",
  center: [23.028, 72.58],
  zoom: 12,
  is_illustrative: true,
  disclaimer: "Illustrative spatial geometry synthesized to reflect district population density, riverfront proximity, and social vulnerability.",
  features: [
    {
      type: "Feature",
      id: "NB-01",
      properties: {
        neighbourhood_id: "NB-01",
        neighbourhood_name: "Downtown Core",
        area_sqkm: 4.2,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.568, 23.038],
            [72.592, 23.038],
            [72.595, 23.022],
            [72.571, 23.021],
            [72.568, 23.038],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "NB-02",
      properties: {
        neighbourhood_id: "NB-02",
        neighbourhood_name: "Industrial Harbor",
        area_sqkm: 6.8,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.592, 23.038],
            [72.625, 23.042],
            [72.631, 23.018],
            [72.595, 23.022],
            [72.592, 23.038],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "NB-03",
      properties: {
        neighbourhood_id: "NB-03",
        neighbourhood_name: "Westside Highlands",
        area_sqkm: 5.5,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.535, 23.045],
            [72.568, 23.038],
            [72.571, 23.021],
            [72.538, 23.02],
            [72.535, 23.045],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "NB-04",
      properties: {
        neighbourhood_id: "NB-04",
        neighbourhood_name: "East Riverside",
        area_sqkm: 5.1,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.571, 23.021],
            [72.595, 23.022],
            [72.602, 22.998],
            [72.575, 22.995],
            [72.571, 23.021],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "NB-05",
      properties: {
        neighbourhood_id: "NB-05",
        neighbourhood_name: "North Suburbs",
        area_sqkm: 8.4,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.555, 23.075],
            [72.615, 23.078],
            [72.625, 23.042],
            [72.568, 23.038],
            [72.555, 23.075],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "NB-06",
      properties: {
        neighbourhood_id: "NB-06",
        neighbourhood_name: "Historic South End",
        area_sqkm: 3.9,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.575, 22.995],
            [72.602, 22.998],
            [72.605, 22.978],
            [72.578, 22.975],
            [72.575, 22.995],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "NB-07",
      properties: {
        neighbourhood_id: "NB-07",
        neighbourhood_name: "Sunset Valley",
        area_sqkm: 4.8,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.538, 23.02],
            [72.571, 23.021],
            [72.575, 22.995],
            [72.541, 22.992],
            [72.538, 23.02],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "NB-08",
      properties: {
        neighbourhood_id: "NB-08",
        neighbourhood_name: "Pinecrest Heights",
        area_sqkm: 4.0,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.525, 23.068],
            [72.555, 23.075],
            [72.568, 23.038],
            [72.535, 23.045],
            [72.525, 23.068],
          ],
        ],
      },
    },
  ],
};

// Coastal Basin: Anchored in a coastal estuary context (Chennai / Bay of Bengal basin, 13.08° N, 80.27° E)
export const COASTAL_BASIN_GEO: CityGeoCollection = {
  type: "FeatureCollection",
  city_name: "Coastal Basin Metropolitan Zone",
  center: [13.082, 80.275],
  zoom: 12,
  is_illustrative: true,
  disclaimer: "Illustrative spatial geometry synthesized to reflect shoreline storm surge, marshlands, and port corridors.",
  features: [
    {
      type: "Feature",
      id: "CB-01",
      properties: {
        neighbourhood_id: "CB-01",
        neighbourhood_name: "Marina Bayfront",
        area_sqkm: 3.5,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.272, 13.095],
            [80.298, 13.095],
            [80.295, 13.068],
            [80.275, 13.07],
            [80.272, 13.095],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "CB-02",
      properties: {
        neighbourhood_id: "CB-02",
        neighbourhood_name: "Fisherman Flatlands",
        area_sqkm: 4.8,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.275, 13.07],
            [80.295, 13.068],
            [80.292, 13.038],
            [80.268, 13.04],
            [80.275, 13.07],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "CB-03",
      properties: {
        neighbourhood_id: "CB-03",
        neighbourhood_name: "Commercial Port",
        area_sqkm: 7.2,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.298, 13.125],
            [80.325, 13.12],
            [80.318, 13.085],
            [80.295, 13.09],
            [80.298, 13.125],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "CB-04",
      properties: {
        neighbourhood_id: "CB-04",
        neighbourhood_name: "Upland Terrace",
        area_sqkm: 6.1,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.235, 13.1],
            [80.272, 13.095],
            [80.275, 13.07],
            [80.24, 13.072],
            [80.235, 13.1],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "CB-05",
      properties: {
        neighbourhood_id: "CB-05",
        neighbourhood_name: "Canal District",
        area_sqkm: 3.8,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.24, 13.072],
            [80.275, 13.07],
            [80.268, 13.04],
            [80.238, 13.042],
            [80.24, 13.072],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "CB-06",
      properties: {
        neighbourhood_id: "CB-06",
        neighbourhood_name: "Greenridge Ridge",
        area_sqkm: 5.0,
        is_illustrative: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.215, 13.11],
            [80.235, 13.1],
            [80.24, 13.072],
            [80.218, 13.078],
            [80.215, 13.11],
          ],
        ],
      },
    },
  ],
};

export const getCityGeoData = (datasetId: string): CityGeoCollection => {
  if (datasetId.toLowerCase().includes("coastal")) {
    return COASTAL_BASIN_GEO;
  }
  return METRO_VERDE_GEO;
};

export const validateCustomGeoJSON = (
  rawText: string
): { valid: boolean; featureCount: number; data?: any; error?: string } => {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed.type !== "FeatureCollection" && parsed.type !== "Feature") {
      return {
        valid: false,
        featureCount: 0,
        error: "GeoJSON root must be 'FeatureCollection' or 'Feature'.",
      };
    }
    const features =
      parsed.type === "FeatureCollection"
        ? parsed.features || []
        : [parsed];

    if (features.length === 0) {
      return {
        valid: false,
        featureCount: 0,
        error: "GeoJSON contains zero features.",
      };
    }

    return {
      valid: true,
      featureCount: features.length,
      data: parsed.type === "FeatureCollection" ? parsed : { type: "FeatureCollection", features },
    };
  } catch (err: any) {
    return {
      valid: false,
      featureCount: 0,
      error: `Invalid JSON syntax: ${err.message}`,
    };
  }
};
