// ECO-ECHO Infrastructure Planning & GIS Dataset
// Contains detailed road networks, stormwater drainage assets, building footprints,
// and Rational Method hydrological calculations for Metro Verde and Coastal Basin.

export interface RoadSegmentProperties {
  id: string;
  name: string;
  classification: "arterial" | "secondary" | "local" | "emergency";
  neighbourhood_id: string;
  neighbourhood_name: string;
  length_m: number;
  width_m: number;
  lanes: number;
  surface_type: "asphalt" | "concrete" | "permeable_asphalt" | "pavers";
  elevation_m: number;
  slope_pct: number;
  is_low_lying: boolean;
  is_flood_prone: boolean;
  is_emergency_route: boolean;
  near_critical_facility: boolean;
  critical_facility_name?: string;
  flood_risk_level: "critical" | "high" | "moderate" | "low";
  runoff_coefficient_c: number;
  nearby_drainage_assets: string[];
  nearby_buildings: string[];
  proposed_improvement: string;
  proposed_intervention_id: string;
  estimated_cost_usd: number;
  annual_maintenance_usd: number;
  implementation_priority: "critical" | "high" | "medium" | "low";
  assumptions: string;
}

export interface RoadFeature {
  type: "Feature";
  id: string;
  properties: RoadSegmentProperties;
  geometry: {
    type: "LineString";
    coordinates: number[][]; // [ [lng, lat], ... ]
  };
}

export interface RoadIntersectionProperties {
  id: string;
  name: string;
  neighbourhood_id: string;
  elevation_m: number;
  drainage_inlet_present: boolean;
  flood_history: string;
  connected_roads: string[];
}

export interface RoadIntersectionFeature {
  type: "Feature";
  id: string;
  properties: RoadIntersectionProperties;
  geometry: {
    type: "Point";
    coordinates: number[]; // [lng, lat]
  };
}

export interface DrainageAssetProperties {
  id: string;
  name: string;
  type:
    | "storm_drain"
    | "drainage_channel"
    | "culvert"
    | "catch_basin"
    | "retention_pond"
    | "detention_basin"
    | "rainwater_harvesting"
    | "outfall";
  neighbourhood_id: string;
  dimensions_label: string; // e.g. "1400mm Circular RCP", "3.5m x 1.8m Box", "15,000 m³ Basin"
  design_capacity_m3_s: number;
  length_m?: number;
  slope_pct?: number;
  flow_direction?: string;
  outfall_target?: string;
  current_blockage_pct: number;
  blockage_notes?: string;
  status: "optimal" | "partially_silted" | "critically_blocked" | "surcharging";
  catchment_area_ha: number;
  upstream_impervious_pct: number;
  recommended_action: string;
  intervention_id?: string;
  estimated_upgrade_cost_usd: number;
  annual_maintenance_usd: number;
}

export interface DrainageFeature {
  type: "Feature";
  id: string;
  properties: DrainageAssetProperties;
  geometry: {
    type: "LineString" | "Point" | "Polygon";
    coordinates: any;
  };
}

export interface BuildingRetrofitOption {
  id: string;
  label: string;
  description: string;
  capex_usd: number;
  annual_opex_usd: number;
  annual_runoff_retention_m3: number;
  heat_mitigation_c: number;
  water_harvest_yield_m3: number;
  structural_requirements: string;
  code_compliance_note: string;
}

export interface BuildingProperties {
  id: string;
  name: string;
  neighbourhood_id: string;
  neighbourhood_name: string;
  use_classification:
    | "commercial"
    | "residential"
    | "municipal"
    | "industrial"
    | "critical_facility";
  footprint_area_m2: number;
  roof_area_m2: number;
  roof_type: "flat_concrete" | "low_pitch_deck" | "pitched_tile" | "corrugated_sheet";
  green_roof_suitability: "high" | "moderate" | "unsuitable";
  green_roof_suitability_reason: string;
  rainwater_harvesting_suitability: "high" | "moderate" | "low";
  rainwater_suitability_reason: string;
  nearby_road_access: string;
  nearby_drainage_assets: string[];
  local_heat_exposure: "critical" | "high" | "moderate" | "low";
  local_flood_exposure: "critical" | "high" | "moderate" | "low";
  green_space_distance_m: number;
  potential_retrofits: BuildingRetrofitOption[];
}

export interface BuildingFeature {
  type: "Feature";
  id: string;
  properties: BuildingProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
  };
}

export interface CityInfrastructureData {
  city_name: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  is_illustrative: boolean;
  disclaimer: string;
  roads: {
    type: "FeatureCollection";
    features: RoadFeature[];
  };
  intersections: {
    type: "FeatureCollection";
    features: RoadIntersectionFeature[];
  };
  drainage: {
    type: "FeatureCollection";
    features: DrainageFeature[];
  };
  buildings: {
    type: "FeatureCollection";
    features: BuildingFeature[];
  };
}

// ----------------------------------------------------------------------
// RATIONAL METHOD HYDROLOGICAL CALCULATION ENGINE
// Formula: Q = (C * I * A) / 360
// Where:
//   Q = Peak Runoff Rate (m³/s)
//   C = Composite Runoff Coefficient (0.10 - 0.95 dimensionless)
//   I = Rainfall Intensity (mm/hr)
//   A = Catchment Area (hectares, 1 ha = 10,000 m²)
// ----------------------------------------------------------------------
export interface RationalMethodInputs {
  catchment_area_ha: number;
  rainfall_intensity_mm_hr: number;
  storm_duration_hours: number;
  impervious_pct: number;
  green_cover_pct: number;
  permeable_paver_pct?: number;
  drain_nominal_capacity_m3_s: number;
  drain_blockage_pct: number;
}

export interface RationalMethodResults {
  composite_c: number;
  peak_runoff_rate_m3_s: number;
  total_runoff_volume_m3: number;
  effective_drain_capacity_m3_s: number;
  capacity_margin_m3_s: number;
  surcharge_ratio: number;
  is_surcharged: boolean;
  estimated_flood_depth_cm: number;
  risk_category: "Low" | "Moderate" | "Severe" | "Catastrophic";
  assumptions_summary: string[];
  scientific_disclaimer: string;
}

export function calculateRationalMethod(inputs: RationalMethodInputs): RationalMethodResults {
  const {
    catchment_area_ha,
    rainfall_intensity_mm_hr,
    storm_duration_hours,
    impervious_pct,
    green_cover_pct,
    permeable_paver_pct = 0,
    drain_nominal_capacity_m3_s,
    drain_blockage_pct,
  } = inputs;

  // Safe bounds
  const areaHa = Math.max(0.1, catchment_area_ha);
  const intensity = Math.max(1, rainfall_intensity_mm_hr);
  const duration = Math.max(0.1, storm_duration_hours);
  const impFraction = Math.min(100, Math.max(0, impervious_pct)) / 100;
  const greenFraction = Math.min(100 - impFraction * 100, Math.max(0, green_cover_pct)) / 100;
  const permPaverFraction = Math.min(100 - (impFraction + greenFraction) * 100, Math.max(0, permeable_paver_pct)) / 100;
  const otherFraction = Math.max(0, 1 - (impFraction + greenFraction + permPaverFraction));

  // Runoff coefficients by land cover standard:
  // Impervious asphalt/concrete roof: 0.90
  // Vegetated/green space: 0.20
  // Permeable interlocking pavers: 0.35
  // Other mixed/compacted bare soil: 0.60
  const compositeC = Number(
    (
      impFraction * 0.90 +
      greenFraction * 0.20 +
      permPaverFraction * 0.35 +
      otherFraction * 0.60
    ).toFixed(3)
  );

  // Peak runoff rate Q (m³/s) = (C * I * A) / 360
  const peakQ = Number(((compositeC * intensity * areaHa) / 360).toFixed(3));

  // Total runoff volume V (m³) = C * (I * duration / 1000) * (areaHa * 10,000)
  const totalVolumeM3 = Math.round(compositeC * ((intensity * duration) / 1000) * (areaHa * 10000));

  // Effective drain capacity after accounting for sediment/trash blockage
  const effectiveCapacity = Number(
    Math.max(0, drain_nominal_capacity_m3_s * (1 - Math.min(100, drain_blockage_pct) / 100)).toFixed(3)
  );

  const capacityMargin = Number((effectiveCapacity - peakQ).toFixed(3));
  const surchargeRatio = effectiveCapacity > 0 ? Number((peakQ / effectiveCapacity).toFixed(2)) : 999;
  const isSurcharged = surchargeRatio > 1.0;

  // Screening-level flood depth proxy over typical roadway depression area (~15% of catchment)
  let floodDepthCm = 0;
  if (isSurcharged) {
    const excessVolumeM3 = (peakQ - effectiveCapacity) * 3600 * Math.min(duration, 1.5);
    const detentionAreaM2 = areaHa * 10000 * 0.15; // 15% road surface pooling basin
    floodDepthCm = Math.min(120, Math.round((excessVolumeM3 / detentionAreaM2) * 100));
  }

  let riskCategory: "Low" | "Moderate" | "Severe" | "Catastrophic" = "Low";
  if (surchargeRatio >= 2.0 || floodDepthCm > 45) {
    riskCategory = "Catastrophic";
  } else if (surchargeRatio > 1.25 || floodDepthCm > 20) {
    riskCategory = "Severe";
  } else if (surchargeRatio > 0.9 || floodDepthCm > 5) {
    riskCategory = "Moderate";
  }

  return {
    composite_c: compositeC,
    peak_runoff_rate_m3_s: peakQ,
    total_runoff_volume_m3: totalVolumeM3,
    effective_drain_capacity_m3_s: effectiveCapacity,
    capacity_margin_m3_s: capacityMargin,
    surcharge_ratio: surchargeRatio,
    is_surcharged: isSurcharged,
    estimated_flood_depth_cm: floodDepthCm,
    risk_category: riskCategory,
    assumptions_summary: [
      `Rational Method Q = (C · I · A) / 360 applied for catchment area ${areaHa} ha.`,
      `Impervious surface runoff coefficient: 0.90; Vegetated land: 0.20; Permeable pavers: 0.35.`,
      `Drain blockage reduces nominal capacity by ${drain_blockage_pct}%.`,
      `Estimated waterlogging depth assumes localized street depression area equal to 15% of catchment.`,
    ],
    scientific_disclaimer:
      "Screening-level estimate only. The Rational Method assumes uniform rainfall intensity and steady-state sheet flow over small catchments (< 80 ha). It does not substitute for 2D unsteady hydrodynamic routing (e.g. SWMM / HEC-RAS) or stamped engineering certification.",
  };
}

// ----------------------------------------------------------------------
// METRO VERDE INFRASTRUCTURE DATASET (Ahmedabad Region Context)
// ----------------------------------------------------------------------
export const METRO_VERDE_INFRASTRUCTURE: CityInfrastructureData = {
  city_name: "Metro Verde Municipal Region",
  center: [23.028, 72.58],
  zoom: 13,
  is_illustrative: true,
  disclaimer:
    "Illustrative infrastructure topology modeled to reflect Sabarmati riverfront elevation, dense historical downtown street layouts, and critical civic hospital corridors.",
  roads: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "ROAD-MV-01",
        properties: {
          id: "ROAD-MV-01",
          name: "Riverfront Promenade Boulevard",
          classification: "arterial",
          neighbourhood_id: "NB-01",
          neighbourhood_name: "Downtown Core",
          length_m: 1850,
          width_m: 28.0,
          lanes: 4,
          surface_type: "asphalt",
          elevation_m: 46.2,
          slope_pct: 0.4,
          is_low_lying: true,
          is_flood_prone: true,
          is_emergency_route: true,
          near_critical_facility: true,
          critical_facility_name: "Downtown Emergency Medical Substation",
          flood_risk_level: "critical",
          runoff_coefficient_c: 0.88,
          nearby_drainage_assets: ["DRAIN-MV-01", "CULV-MV-01"],
          nearby_buildings: ["BLDG-MV-01", "BLDG-MV-02"],
          proposed_improvement: "Permeable Roadside Strip & Bioretention Bioswales",
          proposed_intervention_id: "int-suds-bioswale",
          estimated_cost_usd: 157250,
          annual_maintenance_usd: 12025,
          implementation_priority: "critical",
          assumptions: "1,850m roadway corridor; 1m bioswale strip on both flanks = 1,850 m² SuDS installation @ $85/m².",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.571, 23.036],
            [72.575, 23.032],
            [72.578, 23.028],
            [72.582, 23.024],
            [72.585, 23.022],
          ],
        },
      },
      {
        type: "Feature",
        id: "ROAD-MV-02",
        properties: {
          id: "ROAD-MV-02",
          name: "Gandhi Commercial Avenue",
          classification: "arterial",
          neighbourhood_id: "NB-01",
          neighbourhood_name: "Downtown Core",
          length_m: 1420,
          width_m: 24.0,
          lanes: 4,
          surface_type: "asphalt",
          elevation_m: 48.5,
          slope_pct: 0.9,
          is_low_lying: false,
          is_flood_prone: false,
          is_emergency_route: true,
          near_critical_facility: false,
          flood_risk_level: "moderate",
          runoff_coefficient_c: 0.85,
          nearby_drainage_assets: ["DRAIN-MV-01"],
          nearby_buildings: ["BLDG-MV-01", "BLDG-MV-03"],
          proposed_improvement: "High-Albedo Reflective Pavement & Street Tree Canopy",
          proposed_intervention_id: "int-urban-forest",
          estimated_cost_usd: 95000,
          annual_maintenance_usd: 7000,
          implementation_priority: "high",
          assumptions: "250 native street trees spaced at 10m intervals to counter urban heat island.",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.568, 23.033],
            [72.575, 23.032],
            [72.583, 23.031],
            [72.591, 23.03],
          ],
        },
      },
      {
        type: "Feature",
        id: "ROAD-MV-03",
        properties: {
          id: "ROAD-MV-03",
          name: "Harbor Freight Access Way",
          classification: "arterial",
          neighbourhood_id: "NB-02",
          neighbourhood_name: "Industrial Harbor",
          length_m: 2200,
          width_m: 32.0,
          lanes: 6,
          surface_type: "concrete",
          elevation_m: 45.1,
          slope_pct: 0.3,
          is_low_lying: true,
          is_flood_prone: true,
          is_emergency_route: false,
          near_critical_facility: true,
          critical_facility_name: "Harbor Hazardous Materials Depot",
          flood_risk_level: "critical",
          runoff_coefficient_c: 0.92,
          nearby_drainage_assets: ["DRAIN-MV-02", "BASIN-MV-01"],
          nearby_buildings: ["BLDG-MV-04"],
          proposed_improvement: "Culvert Capacity Expansion & Detention Basin Expansion",
          proposed_intervention_id: "int-storm-drain-upgrade",
          estimated_cost_usd: 210000,
          annual_maintenance_usd: 14500,
          implementation_priority: "critical",
          assumptions: "Replace 1200mm culvert with twin 1600mm box culvert to alleviate chemical runoff flooding.",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.595, 23.036],
            [72.608, 23.032],
            [72.618, 23.026],
            [72.628, 23.02],
          ],
        },
      },
      {
        type: "Feature",
        id: "ROAD-MV-04",
        properties: {
          id: "ROAD-MV-04",
          name: "Highland Parkway",
          classification: "secondary",
          neighbourhood_id: "NB-03",
          neighbourhood_name: "Westside Highlands",
          length_m: 1650,
          width_m: 18.0,
          lanes: 2,
          surface_type: "asphalt",
          elevation_m: 56.4,
          slope_pct: 2.8,
          is_low_lying: false,
          is_flood_prone: false,
          is_emergency_route: true,
          near_critical_facility: false,
          flood_risk_level: "low",
          runoff_coefficient_c: 0.70,
          nearby_drainage_assets: ["DRAIN-MV-03"],
          nearby_buildings: ["BLDG-MV-05"],
          proposed_improvement: "Permeable Interlocking Paver Parking Shoulders",
          proposed_intervention_id: "int-permeable-pavement",
          estimated_cost_usd: 82500,
          annual_maintenance_usd: 4180,
          implementation_priority: "medium",
          assumptions: "1,100 m² parking verge conversion @ $75/m².",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.54, 23.041],
            [72.55, 23.035],
            [72.56, 23.028],
            [72.568, 23.023],
          ],
        },
      },
      {
        type: "Feature",
        id: "ROAD-MV-05",
        properties: {
          id: "ROAD-MV-05",
          name: "Old City Relief Lane",
          classification: "local",
          neighbourhood_id: "NB-04",
          neighbourhood_name: "Historic Quarter",
          length_m: 980,
          width_m: 8.5,
          lanes: 1,
          surface_type: "pavers",
          elevation_m: 47.0,
          slope_pct: 0.6,
          is_low_lying: true,
          is_flood_prone: true,
          is_emergency_route: true,
          near_critical_facility: true,
          critical_facility_name: "Historic Heritage Clinic & Rescue Hub",
          flood_risk_level: "high",
          runoff_coefficient_c: 0.82,
          nearby_drainage_assets: ["DRAIN-MV-04"],
          nearby_buildings: ["BLDG-MV-06"],
          proposed_improvement: "Porous Stone Pavement & Sub-surface Infiltration Trench",
          proposed_intervention_id: "int-permeable-pavement",
          estimated_cost_usd: 68600,
          annual_maintenance_usd: 3470,
          implementation_priority: "high",
          assumptions: "Preserves historic cobblestone aesthetic using permeable gravel sub-base.",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.578, 23.025],
            [72.584, 23.02],
            [72.589, 23.014],
          ],
        },
      },
      {
        type: "Feature",
        id: "ROAD-MV-06",
        properties: {
          id: "ROAD-MV-06",
          name: "Hospital Emergency Transit Arterial",
          classification: "emergency",
          neighbourhood_id: "NB-01",
          neighbourhood_name: "Downtown Core",
          length_m: 1300,
          width_m: 22.0,
          lanes: 4,
          surface_type: "asphalt",
          elevation_m: 46.8,
          slope_pct: 0.5,
          is_low_lying: true,
          is_flood_prone: true,
          is_emergency_route: true,
          near_critical_facility: true,
          critical_facility_name: "Metro Civil Apex Hospital & Trauma Centre",
          flood_risk_level: "critical",
          runoff_coefficient_c: 0.89,
          nearby_drainage_assets: ["DRAIN-MV-01", "INLET-MV-01"],
          nearby_buildings: ["BLDG-MV-01"],
          proposed_improvement: "Continuous Raised Curb Flood Barrier & Twin High-Flow Grated Inlets",
          proposed_intervention_id: "int-suds-bioswale",
          estimated_cost_usd: 110500,
          annual_maintenance_usd: 8450,
          implementation_priority: "critical",
          assumptions: "Zero tolerance for ambulance route flooding; requires dedicated 3.8 m³/s drainage bypass.",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.575, 23.032],
            [72.576, 23.027],
            [72.577, 23.022],
            [72.578, 23.018],
          ],
        },
      },
      {
        type: "Feature",
        id: "ROAD-MV-07",
        properties: {
          id: "ROAD-MV-07",
          name: "Green Valley Transit Corridor",
          classification: "secondary",
          neighbourhood_id: "NB-07",
          neighbourhood_name: "Green Valley",
          length_m: 2100,
          width_m: 20.0,
          lanes: 2,
          surface_type: "asphalt",
          elevation_m: 52.0,
          slope_pct: 1.4,
          is_low_lying: false,
          is_flood_prone: false,
          is_emergency_route: false,
          near_critical_facility: false,
          flood_risk_level: "low",
          runoff_coefficient_c: 0.65,
          nearby_drainage_assets: ["DRAIN-MV-05"],
          nearby_buildings: ["BLDG-MV-07"],
          proposed_improvement: "Roadside Rain Garden Network & Linear Park Buffer",
          proposed_intervention_id: "int-suds-bioswale",
          estimated_cost_usd: 136500,
          annual_maintenance_usd: 10400,
          implementation_priority: "medium",
          assumptions: "1,600 m² native bioswale verge along municipal rights-of-way.",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.53, 23.01],
            [72.545, 23.018],
            [72.56, 23.024],
          ],
        },
      },
    ],
  },
  intersections: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "JUNC-MV-01",
        properties: {
          id: "JUNC-MV-01",
          name: "Riverfront & Gandhi Crossroad Junction",
          neighbourhood_id: "NB-01",
          elevation_m: 47.1,
          drainage_inlet_present: true,
          flood_history: "Historical waterlogging of 35-45cm recorded during 2022 monsoon cloudburst.",
          connected_roads: ["ROAD-MV-01", "ROAD-MV-02", "ROAD-MV-06"],
        },
        geometry: {
          type: "Point",
          coordinates: [72.575, 23.032],
        },
      },
      {
        type: "Feature",
        id: "JUNC-MV-02",
        properties: {
          id: "JUNC-MV-02",
          name: "Harbor Freight & Trunk Confluence",
          neighbourhood_id: "NB-02",
          elevation_m: 45.4,
          drainage_inlet_present: false,
          flood_history: "Chronic low-velocity pooling; trucks diverted twice in 2023.",
          connected_roads: ["ROAD-MV-03"],
        },
        geometry: {
          type: "Point",
          coordinates: [72.608, 23.032],
        },
      },
      {
        type: "Feature",
        id: "JUNC-MV-03",
        properties: {
          id: "JUNC-MV-03",
          name: "Hospital Emergency Ingress Gate",
          neighbourhood_id: "NB-01",
          elevation_m: 46.5,
          drainage_inlet_present: true,
          flood_history: "Critical access threshold; vulnerable to backwater surcharge from Trunk 1.",
          connected_roads: ["ROAD-MV-06"],
        },
        geometry: {
          type: "Point",
          coordinates: [72.576, 23.027],
        },
      },
    ],
  },
  drainage: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "DRAIN-MV-01",
        properties: {
          id: "DRAIN-MV-01",
          name: "Downtown Riverfront Main Storm Trunk",
          type: "storm_drain",
          neighbourhood_id: "NB-01",
          dimensions_label: "1600mm Reinforced Concrete Pipe (RCP)",
          design_capacity_m3_s: 4.8,
          length_m: 1920,
          slope_pct: 0.45,
          flow_direction: "Southwest towards Sabarmati Outfall OF-01",
          outfall_target: "Sabarmati River Discharge OF-01",
          current_blockage_pct: 35,
          blockage_notes: "Heavy siltation and plastic debris accumulation restricting effective aperture to 3.12 m³/s.",
          status: "partially_silted",
          catchment_area_ha: 38.5,
          upstream_impervious_pct: 82,
          recommended_action: "High-pressure hydrodynamic hydro-jetting and automated vortex silt traps",
          estimated_upgrade_cost_usd: 85000,
          annual_maintenance_usd: 6800,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.57, 23.037],
            [72.574, 23.033],
            [72.578, 23.028],
            [72.583, 23.023],
          ],
        },
      },
      {
        type: "Feature",
        id: "DRAIN-MV-02",
        properties: {
          id: "DRAIN-MV-02",
          name: "Industrial Harbor Open Drainage Channel",
          type: "drainage_channel",
          neighbourhood_id: "NB-02",
          dimensions_label: "3.2m x 1.8m Trapezoidal Masonry Canal",
          design_capacity_m3_s: 6.5,
          length_m: 2400,
          slope_pct: 0.35,
          flow_direction: "South towards Harbor Retention Basin",
          outfall_target: "Harbor Storm Basin BASIN-MV-01",
          current_blockage_pct: 55,
          blockage_notes: "Severe industrial sediment deposits and vegetative choking; capacity down to 2.92 m³/s.",
          status: "critically_blocked",
          catchment_area_ha: 62.0,
          upstream_impervious_pct: 88,
          recommended_action: "Mechanical dredging and bank stabilization with gabion mattresses",
          estimated_upgrade_cost_usd: 145000,
          annual_maintenance_usd: 12000,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.598, 23.038],
            [72.61, 23.033],
            [72.622, 23.025],
            [72.63, 23.018],
          ],
        },
      },
      {
        type: "Feature",
        id: "CULV-MV-01",
        properties: {
          id: "CULV-MV-01",
          name: "Riverfront Expressway Box Culvert",
          type: "culvert",
          neighbourhood_id: "NB-01",
          dimensions_label: "Twin 2.4m x 1.8m Precast Concrete Boxes",
          design_capacity_m3_s: 7.2,
          length_m: 65,
          slope_pct: 0.6,
          flow_direction: "West to Outfall OF-01",
          outfall_target: "Sabarmati River Discharge OF-01",
          current_blockage_pct: 20,
          blockage_notes: "Minor debris drift; operational headloss within safety factor.",
          status: "optimal",
          catchment_area_ha: 45.0,
          upstream_impervious_pct: 80,
          recommended_action: "Install trash rack deflection bar screen at inlet headwall",
          estimated_upgrade_cost_usd: 35000,
          annual_maintenance_usd: 2400,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [72.576, 23.026],
            [72.579, 23.025],
          ],
        },
      },
      {
        type: "Feature",
        id: "BASIN-MV-01",
        properties: {
          id: "BASIN-MV-01",
          name: "Harbor Regional Detention Basin & Wetland",
          type: "detention_basin",
          neighbourhood_id: "NB-02",
          dimensions_label: "25,000 m³ Engineered Attenuation Basin",
          design_capacity_m3_s: 10.5,
          flow_direction: "Controlled release via weir gate to harbor outfall",
          outfall_target: "Harbor Marine Basin",
          current_blockage_pct: 15,
          blockage_notes: "Sediment forebay partially filled; main storage cell clear.",
          status: "optimal",
          catchment_area_ha: 85.0,
          upstream_impervious_pct: 85,
          recommended_action: "Desilt primary sediment forebay and replant reed bed filtration zone",
          estimated_upgrade_cost_usd: 95000,
          annual_maintenance_usd: 8500,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.622, 23.026],
              [72.628, 23.026],
              [72.628, 23.021],
              [72.622, 23.021],
              [72.622, 23.026],
            ],
          ],
        },
      },
      {
        type: "Feature",
        id: "INLET-MV-01",
        properties: {
          id: "INLET-MV-01",
          name: "Hospital Zone High-Capacity Street Inlet",
          type: "catch_basin",
          neighbourhood_id: "NB-01",
          dimensions_label: "Triple 1200mm x 600mm Curb Inlets with Sump",
          design_capacity_m3_s: 1.8,
          flow_direction: "Gravity feed into DRAIN-MV-01",
          current_blockage_pct: 40,
          blockage_notes: "Grate leaves and sand blinding top screen; reduced throughput.",
          status: "partially_silted",
          catchment_area_ha: 4.5,
          upstream_impervious_pct: 90,
          recommended_action: "Bi-weekly inlet basket clearance and installation of bike-safe flow grates",
          estimated_upgrade_cost_usd: 12000,
          annual_maintenance_usd: 1800,
        },
        geometry: {
          type: "Point",
          coordinates: [72.576, 23.027],
        },
      },
      {
        type: "Feature",
        id: "OUTFALL-MV-01",
        properties: {
          id: "OUTFALL-MV-01",
          name: "Sabarmati Riverfront Master Outfall OF-01",
          type: "outfall",
          neighbourhood_id: "NB-01",
          dimensions_label: "Submerged 2000mm Flapped Tidal Outfall",
          design_capacity_m3_s: 12.0,
          flow_direction: "Direct discharge to Sabarmati River channel",
          current_blockage_pct: 10,
          blockage_notes: "Duckbill non-return check valve functional.",
          status: "optimal",
          catchment_area_ha: 140.0,
          upstream_impervious_pct: 78,
          recommended_action: "Inspect elastomeric check valve seal after major storm surges",
          estimated_upgrade_cost_usd: 45000,
          annual_maintenance_usd: 3500,
        },
        geometry: {
          type: "Point",
          coordinates: [72.583, 23.022],
        },
      },
    ],
  },
  buildings: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "BLDG-MV-01",
        properties: {
          id: "BLDG-MV-01",
          name: "Metro Apex Civic & Health Complex",
          neighbourhood_id: "NB-01",
          neighbourhood_name: "Downtown Core",
          use_classification: "critical_facility",
          footprint_area_m2: 6800,
          roof_area_m2: 5400,
          roof_type: "flat_concrete",
          green_roof_suitability: "high",
          green_roof_suitability_reason: "Reinforced concrete deck designed for 4.5 kN/m² live load; excellent structural capacity for intensive/extensive sedum roof.",
          rainwater_harvesting_suitability: "high",
          rainwater_suitability_reason: "Expansive clean roof surface with 6 centralized downspouts feeding directly into basement cistern vault.",
          nearby_road_access: "ROAD-MV-01 Riverfront Promenade & ROAD-MV-06 Hospital Emergency Arterial",
          nearby_drainage_assets: ["DRAIN-MV-01", "INLET-MV-01"],
          local_heat_exposure: "critical",
          local_flood_exposure: "critical",
          green_space_distance_m: 350,
          potential_retrofits: [
            {
              id: "bldg-rf-01",
              label: "Sedum Extensive Green Roof (3,500 m²)",
              description: "Lightweight 90mm vegetative blanket retaining 45% of 100-year cloudburst precipitation while reducing roof solar heat absorption.",
              capex_usd: 385000,
              annual_opex_usd: 15750,
              annual_runoff_retention_m3: 1575,
              heat_mitigation_c: 1.4,
              water_harvest_yield_m3: 0,
              structural_requirements: "Structural verification confirms 120 kg/m² saturated weight well within safety margin.",
              code_compliance_note: "Meets NBC 2016 Fire Safety & Waterproofing standards with root barrier membrane.",
            },
            {
              id: "bldg-rf-02",
              label: "Modular Sub-surface Cistern (350 m³)",
              description: "Underground precast rainwater detention vault capturing 85% of clean roof runoff for non-potable sanitation and cooling towers.",
              capex_usd: 84000,
              annual_opex_usd: 4200,
              annual_runoff_retention_m3: 2850,
              heat_mitigation_c: 0.1,
              water_harvest_yield_m3: 2850,
              structural_requirements: "Basement perimeter excavation outside structural foundation footings.",
              code_compliance_note: "Equipped with automated first-flush diverter and UV disinfection system.",
            },
          ],
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.574, 23.031],
              [72.578, 23.031],
              [72.578, 23.026],
              [72.574, 23.026],
              [72.574, 23.031],
            ],
          ],
        },
      },
      {
        type: "Feature",
        id: "BLDG-MV-02",
        properties: {
          id: "BLDG-MV-02",
          name: "Downtown Financial Towers",
          neighbourhood_id: "NB-01",
          neighbourhood_name: "Downtown Core",
          use_classification: "commercial",
          footprint_area_m2: 4200,
          roof_area_m2: 3800,
          roof_type: "flat_concrete",
          green_roof_suitability: "moderate",
          green_roof_suitability_reason: "High wind sheer above 18 storeys requires modular tray systems and parapet windbreaks.",
          rainwater_harvesting_suitability: "high",
          rainwater_suitability_reason: "Existing dual-plumbing infrastructure ready for non-potable greywater recycling.",
          nearby_road_access: "ROAD-MV-01 Riverfront Promenade Boulevard",
          nearby_drainage_assets: ["DRAIN-MV-01"],
          local_heat_exposure: "high",
          local_flood_exposure: "high",
          green_space_distance_m: 220,
          potential_retrofits: [
            {
              id: "bldg-rf-03",
              label: "Rooftop Rainwater Harvesting Vault (200 m³)",
              description: "Interconnected roof catchment system relieving downstream storm sewer surcharge.",
              capex_usd: 48000,
              annual_opex_usd: 2400,
              annual_runoff_retention_m3: 1950,
              heat_mitigation_c: 0.05,
              water_harvest_yield_m3: 1950,
              structural_requirements: "Existing HVAC plant deck accommodates modular poly tanks.",
              code_compliance_note: "Requires overflow gravity bypass to storm trunk.",
            },
          ],
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.578, 23.034],
              [72.583, 23.034],
              [72.583, 23.03],
              [72.578, 23.03],
              [72.578, 23.034],
            ],
          ],
        },
      },
      {
        type: "Feature",
        id: "BLDG-MV-03",
        properties: {
          id: "BLDG-MV-03",
          name: "Sardar Commercial Plaza & Retail Arcade",
          neighbourhood_id: "NB-01",
          neighbourhood_name: "Downtown Core",
          use_classification: "commercial",
          footprint_area_m2: 5100,
          roof_area_m2: 4800,
          roof_type: "flat_concrete",
          green_roof_suitability: "high",
          green_roof_suitability_reason: "Expansive 3-storey podium roof ideal for publicly accessible green rooftop garden.",
          rainwater_harvesting_suitability: "moderate",
          rainwater_suitability_reason: "Limited basement area; requires underground tank beneath rear parking lot.",
          nearby_road_access: "ROAD-MV-02 Gandhi Commercial Avenue",
          nearby_drainage_assets: ["DRAIN-MV-01"],
          local_heat_exposure: "critical",
          local_flood_exposure: "moderate",
          green_space_distance_m: 480,
          potential_retrofits: [
            {
              id: "bldg-rf-04",
              label: "Accessible Biodiversity Green Roof (2,800 m²)",
              description: "Intensive/extensive hybrid green roof providing urban pollinator habitat and 45% rooftop stormwater retention.",
              capex_usd: 308000,
              annual_opex_usd: 12600,
              annual_runoff_retention_m3: 1260,
              heat_mitigation_c: 1.8,
              water_harvest_yield_m3: 0,
              structural_requirements: "Post-tensioned slab requires structural load check for 200 mm soil depth.",
              code_compliance_note: "Includes perimeter railings and emergency egress routes conforming to IBC.",
            },
          ],
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.584, 23.033],
              [72.59, 23.033],
              [72.59, 23.028],
              [72.584, 23.028],
              [72.584, 23.033],
            ],
          ],
        },
      },
      {
        type: "Feature",
        id: "BLDG-MV-04",
        properties: {
          id: "BLDG-MV-04",
          name: "Harbor Freight Logistics Warehouse",
          neighbourhood_id: "NB-02",
          neighbourhood_name: "Industrial Harbor",
          use_classification: "industrial",
          footprint_area_m2: 9500,
          roof_area_m2: 9200,
          roof_type: "corrugated_sheet",
          green_roof_suitability: "unsuitable",
          green_roof_suitability_reason: "Lightweight steel truss roof cannot support saturated soil overburden (> 80 kg/m²).",
          rainwater_harvesting_suitability: "high",
          rainwater_suitability_reason: "Enormous 9,200 m² catchment area with existing perimeter gutters; ideal for high-volume cistern storage.",
          nearby_road_access: "ROAD-MV-03 Harbor Freight Access Way",
          nearby_drainage_assets: ["DRAIN-MV-02", "BASIN-MV-01"],
          local_heat_exposure: "critical",
          local_flood_exposure: "critical",
          green_space_distance_m: 850,
          potential_retrofits: [
            {
              id: "bldg-rf-05",
              label: "Industrial Perimeter Rainwater Cistern (600 m³)",
              description: "High-capacity modular retention tanks collecting industrial roof runoff for cooling and vehicle washing.",
              capex_usd: 144000,
              annual_opex_usd: 7200,
              annual_runoff_retention_m3: 5200,
              heat_mitigation_c: 0.1,
              water_harvest_yield_m3: 5200,
              structural_requirements: "Ground-level concrete pad outside warehouse loading bays.",
              code_compliance_note: "Meets industrial stormwater pollution prevention plan (SWPPP) guidelines.",
            },
          ],
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.605, 23.034],
              [72.614, 23.034],
              [72.614, 23.028],
              [72.605, 23.028],
              [72.605, 23.034],
            ],
          ],
        },
      },
      {
        type: "Feature",
        id: "BLDG-MV-05",
        properties: {
          id: "BLDG-MV-05",
          name: "Highland Heights Residential Society",
          neighbourhood_id: "NB-03",
          neighbourhood_name: "Westside Highlands",
          use_classification: "residential",
          footprint_area_m2: 3600,
          roof_area_m2: 3200,
          roof_type: "flat_concrete",
          green_roof_suitability: "high",
          green_roof_suitability_reason: "Standard RC frame construction with parapets and direct resident stairwell access.",
          rainwater_harvesting_suitability: "high",
          rainwater_suitability_reason: "Resident-managed rooftop recharge system connected to local groundwater recharge borewell.",
          nearby_road_access: "ROAD-MV-04 Highland Parkway",
          nearby_drainage_assets: ["DRAIN-MV-03"],
          local_heat_exposure: "moderate",
          local_flood_exposure: "low",
          green_space_distance_m: 140,
          potential_retrofits: [
            {
              id: "bldg-rf-06",
              label: "Community Cool Roof & Solar Sedum Array (1,800 m²)",
              description: "Biosolar roof combining PV solar generation with sedum vegetation, reducing heat island index by 1.2°C.",
              capex_usd: 198000,
              annual_opex_usd: 8100,
              annual_runoff_retention_m3: 810,
              heat_mitigation_c: 1.2,
              water_harvest_yield_m3: 0,
              structural_requirements: "Dual wind-ballast mounting approved for 12-storey height.",
              code_compliance_note: "Complies with resident welfare association (RWA) bylaws and state solar subsidy policy.",
            },
          ],
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.545, 23.038],
              [72.552, 23.038],
              [72.552, 23.033],
              [72.545, 23.033],
              [72.545, 23.038],
            ],
          ],
        },
      },
      {
        type: "Feature",
        id: "BLDG-MV-06",
        properties: {
          id: "BLDG-MV-06",
          name: "Heritage Pol Haveli Quarter Cluster",
          neighbourhood_id: "NB-04",
          neighbourhood_name: "Historic Quarter",
          use_classification: "residential",
          footprint_area_m2: 2800,
          roof_area_m2: 2400,
          roof_type: "pitched_tile",
          green_roof_suitability: "unsuitable",
          green_roof_suitability_reason: "Historic timber frame and clay tile roof cannot sustain dead load of green roof soil; heritage protection constraints.",
          rainwater_harvesting_suitability: "high",
          rainwater_suitability_reason: "Traditional 'Tanka' underground courtyard cistern system can be restored and fitted with modern micro-filtration.",
          nearby_road_access: "ROAD-MV-05 Old City Relief Lane",
          nearby_drainage_assets: ["DRAIN-MV-04"],
          local_heat_exposure: "high",
          local_flood_exposure: "critical",
          green_space_distance_m: 620,
          potential_retrofits: [
            {
              id: "bldg-rf-07",
              label: "Traditional Tanka Courtyard Cistern Restoration (150 m³)",
              description: "Restores heritage lime-plaster subterranean rainwater tank with modern pre-filtration, retaining historical street runoff.",
              capex_usd: 36000,
              annual_opex_usd: 1800,
              annual_runoff_retention_m3: 1450,
              heat_mitigation_c: 0.05,
              water_harvest_yield_m3: 1450,
              structural_requirements: "Preserves historic masonry without heavy excavation near load-bearing lime mortar walls.",
              code_compliance_note: "Endorsed by Archaeological Survey & Heritage Conservation Committee.",
            },
          ],
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.58, 23.023],
              [72.585, 23.023],
              [72.585, 23.018],
              [72.58, 23.018],
              [72.58, 23.023],
            ],
          ],
        },
      },
    ],
  },
};

// ----------------------------------------------------------------------
// COASTAL BASIN INFRASTRUCTURE DATASET (Mangaluru / Coastal Context)
// ----------------------------------------------------------------------
export const COASTAL_BASIN_INFRASTRUCTURE: CityInfrastructureData = {
  city_name: "Coastal Basin Estuary District",
  center: [12.914, 74.856],
  zoom: 13,
  is_illustrative: true,
  disclaimer:
    "Illustrative coastal infrastructure topology modeling tidal estuary dynamics, steep Western Ghats runoff slopes, and harbor port access arteries.",
  roads: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "ROAD-CB-01",
        properties: {
          id: "ROAD-CB-01",
          name: "Estuary Shore Highway",
          classification: "arterial",
          neighbourhood_id: "CB-01",
          neighbourhood_name: "Estuary Harbor Core",
          length_m: 2400,
          width_m: 30.0,
          lanes: 4,
          surface_type: "concrete",
          elevation_m: 4.5,
          slope_pct: 0.2,
          is_low_lying: true,
          is_flood_prone: true,
          is_emergency_route: true,
          near_critical_facility: true,
          critical_facility_name: "Coastal Port Coast Guard & Sea Rescue Station",
          flood_risk_level: "critical",
          runoff_coefficient_c: 0.90,
          nearby_drainage_assets: ["DRAIN-CB-01"],
          nearby_buildings: ["BLDG-CB-01"],
          proposed_improvement: "Tidal Surge Berm & Permeable Shoulder Drain",
          proposed_intervention_id: "int-suds-bioswale",
          estimated_cost_usd: 204000,
          annual_maintenance_usd: 15600,
          implementation_priority: "critical",
          assumptions: "Coastal storm surge resilience with non-return check valves.",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [74.84, 12.92],
            [74.846, 12.915],
            [74.852, 12.91],
            [74.858, 12.905],
          ],
        },
      },
      {
        type: "Feature",
        id: "ROAD-CB-02",
        properties: {
          id: "ROAD-CB-02",
          name: "Ghats Ridge Access Road",
          classification: "secondary",
          neighbourhood_id: "CB-02",
          neighbourhood_name: "Ghats Foothills",
          length_m: 1950,
          width_m: 16.0,
          lanes: 2,
          surface_type: "asphalt",
          elevation_m: 24.0,
          slope_pct: 3.8,
          is_low_lying: false,
          is_flood_prone: false,
          is_emergency_route: true,
          near_critical_facility: false,
          flood_risk_level: "low",
          runoff_coefficient_c: 0.68,
          nearby_drainage_assets: ["DRAIN-CB-02"],
          nearby_buildings: ["BLDG-CB-02"],
          proposed_improvement: "Stepped Bioswale Cascades & Silt Basins",
          proposed_intervention_id: "int-suds-bioswale",
          estimated_cost_usd: 126750,
          annual_maintenance_usd: 9650,
          implementation_priority: "high",
          assumptions: "Controls torrential monsoon velocity downhill into lower city.",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [74.86, 12.935],
            [74.868, 12.928],
            [74.876, 12.92],
          ],
        },
      },
    ],
  },
  intersections: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "JUNC-CB-01",
        properties: {
          id: "JUNC-CB-01",
          name: "Port Gate & Coastal Highway Junction",
          neighbourhood_id: "CB-01",
          elevation_m: 4.8,
          drainage_inlet_present: true,
          flood_history: "High-tide combined cloudburst inundation up to 60cm recorded in July 2023.",
          connected_roads: ["ROAD-CB-01"],
        },
        geometry: {
          type: "Point",
          coordinates: [74.846, 12.915],
        },
      },
    ],
  },
  drainage: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "DRAIN-CB-01",
        properties: {
          id: "DRAIN-CB-01",
          name: "Estuary Main Tidal Canal",
          type: "drainage_channel",
          neighbourhood_id: "CB-01",
          dimensions_label: "4.5m x 2.2m Tidal Infiltration Canal",
          design_capacity_m3_s: 8.5,
          length_m: 2100,
          slope_pct: 0.2,
          flow_direction: "West to Estuary Mouth",
          outfall_target: "Arabian Sea Tidal Outfall",
          current_blockage_pct: 45,
          blockage_notes: "Marine sand siltation and coastal debris; flap gate sticking.",
          status: "partially_silted",
          catchment_area_ha: 75.0,
          upstream_impervious_pct: 75,
          recommended_action: "Suction dredging and installation of automated dual-hinge tide gates",
          estimated_upgrade_cost_usd: 160000,
          annual_maintenance_usd: 14000,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [74.842, 12.922],
            [74.848, 12.917],
            [74.855, 12.911],
          ],
        },
      },
    ],
  },
  buildings: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "BLDG-CB-01",
        properties: {
          id: "BLDG-CB-01",
          name: "Coastal Port Administration Complex",
          neighbourhood_id: "CB-01",
          neighbourhood_name: "Estuary Harbor Core",
          use_classification: "critical_facility",
          footprint_area_m2: 5200,
          roof_area_m2: 4600,
          roof_type: "flat_concrete",
          green_roof_suitability: "high",
          green_roof_suitability_reason: "Heavy-duty maritime concrete structure engineered for tropical cyclones.",
          rainwater_harvesting_suitability: "high",
          rainwater_suitability_reason: "Receives >3,200mm annual coastal rainfall; massive harvesting potential.",
          nearby_road_access: "ROAD-CB-01 Estuary Shore Highway",
          nearby_drainage_assets: ["DRAIN-CB-01"],
          local_heat_exposure: "high",
          local_flood_exposure: "critical",
          green_space_distance_m: 380,
          potential_retrofits: [
            {
              id: "bldg-rf-cb-01",
              label: "Tropical Coastal Green Roof (2,500 m²)",
              description: "Salt-tolerant coastal halophyte sedum and succulent blanket reducing cyclone rain surge.",
              capex_usd: 275000,
              annual_opex_usd: 11250,
              annual_runoff_retention_m3: 2250,
              heat_mitigation_c: 1.1,
              water_harvest_yield_m3: 0,
              structural_requirements: "Engineered for 160 km/h wind uplift resistance.",
              code_compliance_note: "Certified with maritime grade waterproof bitumen and root inhibitor.",
            },
          ],
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [74.844, 12.918],
              [74.85, 12.918],
              [74.85, 12.912],
              [74.844, 12.912],
              [74.844, 12.918],
            ],
          ],
        },
      },
    ],
  },
};

export function getCityInfrastructureData(datasetId: string): CityInfrastructureData {
  if (datasetId.toLowerCase().includes("coastal")) {
    return COASTAL_BASIN_INFRASTRUCTURE;
  }
  return METRO_VERDE_INFRASTRUCTURE;
}

// Custom GeoJSON Validator for Road, Drainage, or Building Features
export function validateInfrastructureGeoJSON(geojson: any): {
  valid: boolean;
  type: "roads" | "drainage" | "buildings" | "mixed" | "unknown";
  featuresCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  if (!geojson || typeof geojson !== "object") {
    return { valid: false, type: "unknown", featuresCount: 0, errors: ["Invalid JSON object"] };
  }

  if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    return {
      valid: false,
      type: "unknown",
      featuresCount: 0,
      errors: ["Root must be a FeatureCollection with a features array"],
    };
  }

  let roadCount = 0;
  let drainCount = 0;
  let bldgCount = 0;

  geojson.features.forEach((f: any, idx: number) => {
    if (!f.geometry || !f.geometry.type || !f.geometry.coordinates) {
      errors.push(`Feature #${idx} is missing geometry or coordinates.`);
      return;
    }
    const geomType = f.geometry.type;
    if (geomType === "LineString") {
      if (f.properties?.classification || f.properties?.surface_type) {
        roadCount++;
      } else if (f.properties?.flow_direction || f.properties?.type === "storm_drain") {
        drainCount++;
      } else {
        roadCount++;
      }
    } else if (geomType === "Polygon") {
      if (f.properties?.roof_area_m2 || f.properties?.use_classification) {
        bldgCount++;
      } else if (f.properties?.type === "retention_pond") {
        drainCount++;
      } else {
        bldgCount++;
      }
    } else if (geomType === "Point") {
      if (f.properties?.drainage_inlet_present !== undefined) {
        roadCount++;
      } else {
        drainCount++;
      }
    }
  });

  let detectedType: "roads" | "drainage" | "buildings" | "mixed" | "unknown" = "unknown";
  const total = geojson.features.length;
  if (roadCount > 0 && drainCount === 0 && bldgCount === 0) detectedType = "roads";
  else if (drainCount > 0 && roadCount === 0 && bldgCount === 0) detectedType = "drainage";
  else if (bldgCount > 0 && roadCount === 0 && drainCount === 0) detectedType = "buildings";
  else if (total > 0) detectedType = "mixed";

  return {
    valid: errors.length === 0,
    type: detectedType,
    featuresCount: total,
    errors,
  };
}
