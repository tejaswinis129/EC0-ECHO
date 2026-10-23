import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  CityGeoCollection,
  getCityGeoData,
  validateCustomGeoJSON,
} from "../data/geoData";
import { api } from "../api/client";
import { RiskOverview, NeighbourhoodRiskScore, DatasetMetadata } from "../types";
import {
  MapPin,
  Layers,
  Sparkles,
  ShieldAlert,
  Droplet,
  Flame,
  Info,
  Maximize2,
  Upload,
  ExternalLink,
  GitFork,
  Wallet,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface CityMapPageProps {
  activeDatasetId: string;
  onNavigateToBudget: (neighbourhoodId?: string) => void;
  onNavigateToRisk: () => void;
  onNavigateToTransformation: (interventionId?: string, neighbourhoodId?: string) => void;
  onNavigateToConsequences: (
    interventionId: string,
    units: number,
    neighbourhoodId?: string
  ) => void;
  selectedNeighbourhoodId?: string;
  onSelectNeighbourhood?: (id: string) => void;
  availableDatasets?: Array<{ dataset_id: string; name: string }>;
  onSelectDataset?: (id: string) => void;
}

type ActiveMapLayer = "composite" | "heat" | "flood" | "water";

export const CityMapPage: React.FC<CityMapPageProps> = ({
  activeDatasetId,
  onNavigateToBudget,
  onNavigateToRisk,
  onNavigateToTransformation,
  onNavigateToConsequences,
  selectedNeighbourhoodId,
  onSelectNeighbourhood,
  availableDatasets,
  onSelectDataset,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const [activeLayer, setActiveLayer] = useState<ActiveMapLayer>("composite");
  const [riskOverview, setRiskOverview] = useState<RiskOverview | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    selectedNeighbourhoodId || "NB-01"
  );
  const [customGeoData, setCustomGeoData] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);

  // Load Risk Analysis Data
  useEffect(() => {
    loadRiskData();
  }, [activeDatasetId]);

  const loadRiskData = async () => {
    setIsLoadingRisk(true);
    try {
      const data = await api.calculateRisk(activeDatasetId);
      setRiskOverview(data);
      if (data.neighbourhood_scores.length > 0 && !selectedDistrictId) {
        setSelectedDistrictId(data.neighbourhood_scores[0].neighbourhood_id);
      }
    } catch (err) {
      console.error("Failed to load map risk data", err);
    } finally {
      setIsLoadingRisk(false);
    }
  };

  const geoCollection = customGeoData || getCityGeoData(activeDatasetId);

  // Helper to get score by active layer
  const getScoreForDistrict = (
    districtId: string,
    scores: NeighbourhoodRiskScore[] | undefined
  ): { value: number; label: string; color: string } => {
    const item = scores?.find(
      (s) =>
        s.neighbourhood_id.toLowerCase() === districtId.toLowerCase() ||
        s.neighbourhood_name.toLowerCase() === districtId.toLowerCase()
    );

    let val = 50;
    if (item) {
      if (activeLayer === "composite") val = item.composite_risk_score;
      else if (activeLayer === "heat") val = item.heat_risk_score;
      else if (activeLayer === "flood") val = item.flood_risk_score;
      else if (activeLayer === "water") val = item.water_stress_score;
    }

    // Color logic
    let color = "#10b981"; // Low (0-40)
    let label = "Low Risk";
    if (val >= 75) {
      color = "#ef4444"; // Severe (75-100)
      label = "Severe Risk";
    } else if (val >= 60) {
      color = "#f97316"; // Elevated (60-74)
      label = "Elevated Risk";
    } else if (val >= 40) {
      color = "#f59e0b"; // Moderate (40-59)
      label = "Moderate Risk";
    }

    return { value: val, label, color };
  };

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: geoCollection.center,
        zoom: geoCollection.zoom,
        zoomControl: true,
      });

      // Tile Layer with fallback listener
      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      });

      tileLayer.on("tileerror", () => {
        setTileError(true);
      });

      tileLayer.addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(geoCollection.center, geoCollection.zoom);
    }

    const map = mapInstanceRef.current;

    // Remove existing GeoJSON layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    // Add GeoJSON Layer with risk styling
    const layer = L.geoJSON(geoCollection as any, {
      style: (feature) => {
        const id = feature?.id || feature?.properties?.neighbourhood_id || "";
        const { color } = getScoreForDistrict(id, riskOverview?.neighbourhood_scores);
        const isSelected = id.toLowerCase() === selectedDistrictId.toLowerCase();

        return {
          color: isSelected ? "#173F35" : "#4b5563",
          weight: isSelected ? 3.5 : 1.5,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: isSelected ? 0.65 : 0.42,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const id = feature?.id || feature?.properties?.neighbourhood_id || "";
        const name = feature?.properties?.neighbourhood_name || id;
        const { value, label } = getScoreForDistrict(id, riskOverview?.neighbourhood_scores);

        // Tooltip
        featureLayer.bindTooltip(
          `<div style="font-family: Inter, sans-serif; padding: 4px 6px;">
            <div style="font-weight: 700; font-size: 12px; color: #173F35;">${name}</div>
            <div style="font-size: 11px; color: #4b5563;">${activeLayer.toUpperCase()} Score: <strong>${value.toFixed(1)}</strong> (${label})</div>
          </div>`,
          { sticky: true }
        );

        // Click handler
        featureLayer.on({
          click: () => {
            setSelectedDistrictId(id);
            if (onSelectNeighbourhood) onSelectNeighbourhood(id);
          },
        });
      },
    });

    layer.addTo(map);
    geoJsonLayerRef.current = layer;
  }, [geoCollection, activeLayer, riskOverview, selectedDistrictId]);

  const handleFitToCity = () => {
    if (mapInstanceRef.current && geoJsonLayerRef.current) {
      mapInstanceRef.current.fitBounds(geoJsonLayerRef.current.getBounds(), { padding: [20, 20] });
    }
  };

  const handleCustomGeoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = validateCustomGeoJSON(text);
      if (!res.valid) {
        setUploadError(res.error || "Invalid GeoJSON file.");
      } else {
        setCustomGeoData(res.data);
        setUploadSuccess(`Successfully loaded ${res.featureCount} administrative polygons.`);
      }
    };
    reader.readAsText(file);
  };

  // Find selected district details
  const selectedDistrictScore = riskOverview?.neighbourhood_scores.find(
    (s) =>
      s.neighbourhood_id.toLowerCase() === selectedDistrictId.toLowerCase() ||
      s.neighbourhood_name.toLowerCase() === selectedDistrictId.toLowerCase()
  ) || riskOverview?.neighbourhood_scores[0];

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            width: "100%",
          }}
        >
          <div className="page-header-text" style={{ flex: "1 1 480px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "6px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px",
                }}
              >
                Interactive Geographic City Map
              </h1>
              <span
                className="badge badge-forest"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <MapPin size={12} /> GIS District Intelligence
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13.5px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                maxWidth: "760px",
              }}
            >
              Explore multi-hazard spatial vulnerability across urban administrative boundaries.
              Click any district to inspect environmental risk indicators, trigger budget allocations,
              and preview physical sustainability transformations.
            </p>
          </div>

          {/* Dataset Selector & Fit to City Action */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            {availableDatasets && availableDatasets.length > 0 && onSelectDataset && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-button)",
                  padding: "6px 10px",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  City:
                </span>
                <select
                  value={activeDatasetId}
                  onChange={(e) => onSelectDataset(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {availableDatasets.map((d) => (
                    <option key={d.dataset_id} value={d.dataset_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleFitToCity}
              title="Reset Map Bounds to City Center"
            >
              <Maximize2 size={13} />
              <span>Fit to City</span>
            </button>
          </div>
        </div>
      </div>

      {/* Illustrative Geography Transparency Label */}
      <div
        style={{
          background: "var(--warm-ivory)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-card)",
          padding: "10px 16px",
          marginBottom: "18px",
          fontSize: "12px",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Info size={14} color="var(--forest-green)" />
          <span>
            <strong>Illustrative Geography:</strong> District spatial polygons are synthesized to
            reflect {geoCollection.city_name} density and drainage corridors while retaining exact
            numerical risk data.
          </span>
        </div>

        {/* Custom GeoJSON Upload Action */}
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11.5px",
            fontWeight: 700,
            color: "var(--forest-green)",
            cursor: "pointer",
            background: "var(--white)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-button)",
            padding: "4px 8px",
          }}
        >
          <Upload size={12} />
          <span>Upload Custom GeoJSON</span>
          <input
            type="file"
            accept=".json,.geojson"
            style={{ display: "none" }}
            onChange={handleCustomGeoUpload}
          />
        </label>
      </div>

      {uploadError && (
        <div
          style={{
            background: "var(--risk-severe-bg)",
            border: "1px solid #f3cbc8",
            borderRadius: "var(--radius-card)",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "var(--risk-severe)",
          }}
        >
          {uploadError}
        </div>
      )}

      {uploadSuccess && (
        <div
          style={{
            background: "rgba(184, 233, 134, 0.2)",
            border: "1px solid rgba(23, 63, 53, 0.25)",
            borderRadius: "var(--radius-card)",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "var(--forest-green)",
          }}
        >
          {uploadSuccess}
        </div>
      )}

      {/* Layer Switcher & Risk Legend Bar */}
      <div
        className="card"
        style={{
          padding: "12px 18px",
          marginBottom: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Layer Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-secondary)",
            }}
          >
            Risk Layer:
          </span>
          <div
            style={{
              display: "inline-flex",
              background: "var(--warm-ivory)",
              borderRadius: "var(--radius-button)",
              padding: "3px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setActiveLayer("composite")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: activeLayer === "composite" ? "var(--forest-green)" : "transparent",
                color: activeLayer === "composite" ? "#FFFFFF" : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Composite Risk
            </button>
            <button
              onClick={() => setActiveLayer("heat")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: activeLayer === "heat" ? "var(--forest-green)" : "transparent",
                color: activeLayer === "heat" ? "#FFFFFF" : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Heat Exposure
            </button>
            <button
              onClick={() => setActiveLayer("flood")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: activeLayer === "flood" ? "var(--forest-green)" : "transparent",
                color: activeLayer === "flood" ? "#FFFFFF" : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Flood Runoff
            </button>
            <button
              onClick={() => setActiveLayer("water")}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: activeLayer === "water" ? "var(--forest-green)" : "transparent",
                color: activeLayer === "water" ? "#FFFFFF" : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Water Stress
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11.5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#10b981" }} />
            <span>Low (&lt;40)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#f59e0b" }} />
            <span>Moderate (40–59)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#f97316" }} />
            <span>Elevated (60–74)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#ef4444" }} />
            <span>Severe (&ge;75)</span>
          </div>
        </div>
      </div>

      {/* Main Map + District Inspector Workspace */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.8fr) minmax(280px, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Left: Leaflet Map Container */}
        <div className="card" style={{ padding: "0px", overflow: "hidden", position: "relative" }}>
          <div
            ref={mapContainerRef}
            style={{
              height: "580px",
              width: "100%",
              background: "#F5F4E9",
              borderRadius: "var(--radius-card)",
              zIndex: 1,
            }}
          />

          {tileError && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                background: "rgba(255,255,255,0.95)",
                padding: "8px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: 10,
              }}
            >
              ℹ️ OpenStreetMap tile server unreachable — operating in high-performance local vector overlay mode.
            </div>
          )}
        </div>

        {/* Right: District Intelligence & Decision Actions Inspector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {selectedDistrictScore ? (
            <div className="card" style={{ borderLeft: "4px solid var(--forest-green)" }}>
              <div className="card-header">
                <div>
                  <div className="card-title">{selectedDistrictScore.neighbourhood_name}</div>
                  <div className="card-subtitle">
                    ID: {selectedDistrictScore.neighbourhood_id} • Pop:{" "}
                    {selectedDistrictScore.population.toLocaleString()}
                  </div>
                </div>
                <span
                  className="badge"
                  style={{
                    background:
                      selectedDistrictScore.composite_risk_score >= 70
                        ? "var(--risk-severe-bg)"
                        : "rgba(184, 233, 134, 0.25)",
                    color:
                      selectedDistrictScore.composite_risk_score >= 70
                        ? "var(--risk-severe)"
                        : "var(--forest-green)",
                    fontWeight: 700,
                  }}
                >
                  Score: {selectedDistrictScore.composite_risk_score.toFixed(1)}/100
                </span>
              </div>

              {/* Indicator Metrics */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <div className="form-label-row">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Flame size={13} color="var(--risk-elevated)" />
                      <span>Heat Island Exposure</span>
                    </span>
                    <span className="tabular-nums" style={{ fontWeight: 700 }}>
                      {selectedDistrictScore.heat_risk_score.toFixed(1)}/100 ({selectedDistrictScore.surface_temp_c}°C)
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--warm-ivory-dark)",
                      borderRadius: "var(--radius-full)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrictScore.heat_risk_score}%`,
                        background: "var(--risk-elevated)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Droplet size={13} color="var(--info-blue)" />
                      <span>Flood & Stormwater Overload</span>
                    </span>
                    <span className="tabular-nums" style={{ fontWeight: 700 }}>
                      {selectedDistrictScore.flood_risk_score.toFixed(1)}/100
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--warm-ivory-dark)",
                      borderRadius: "var(--radius-full)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrictScore.flood_risk_score}%`,
                        background: "var(--info-blue)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShieldAlert size={13} color="var(--risk-moderate)" />
                      <span>Water Supply Deficit</span>
                    </span>
                    <span className="tabular-nums" style={{ fontWeight: 700 }}>
                      {selectedDistrictScore.water_stress_score.toFixed(1)}/100
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--warm-ivory-dark)",
                      borderRadius: "var(--radius-full)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedDistrictScore.water_stress_score}%`,
                        background: "var(--risk-moderate)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span>Social Vulnerability Index (SVI)</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--forest-green)" }}>
                      {selectedDistrictScore.social_vulnerability_index.toFixed(2)}
                      {selectedDistrictScore.social_vulnerability_index >= 0.6 ? " (Frontline)" : " (General)"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="form-label-row">
                    <span>Primary Risk Driver</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {selectedDistrictScore.primary_risk_driver}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cross-Feature Action Triggers */}
              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Connected Planning Actions:
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigateToBudget(selectedDistrictScore.neighbourhood_id)}
                  style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                >
                  <Wallet size={13} />
                  <span>Allocate Budget for {selectedDistrictScore.neighbourhood_name}</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToTransformation(undefined, selectedDistrictScore.neighbourhood_id)}
                  style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                >
                  <Eye size={13} />
                  <span>View Before & After Transformation</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    onNavigateToConsequences(
                      "int-urban-forest",
                      450,
                      selectedDistrictScore.neighbourhood_id
                    )
                  }
                  style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                >
                  <GitFork size={13} />
                  <span>Inspect Consequence Chain</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                Select a district on the map to inspect risk indicators.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
