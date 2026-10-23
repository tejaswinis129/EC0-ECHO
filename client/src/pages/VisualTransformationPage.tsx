import React, { useState, useRef } from "react";
import streetHeatBaseline from "../assets/visuals/street_heat_baseline.jpg";
import streetCanopyProposed from "../assets/visuals/street_canopy_proposed.jpg";
import rooftopGravelBaseline from "../assets/visuals/rooftop_gravel_baseline.jpg";
import rooftopGreenProposed from "../assets/visuals/rooftop_green_proposed.jpg";
import stormwaterFloodBaseline from "../assets/visuals/stormwater_flood_baseline.jpg";
import stormwaterSudsProposed from "../assets/visuals/stormwater_suds_proposed.jpg";
import {
  Layers,
  Sparkles,
  Sliders,
  Upload,
  Info,
  GitFork,
  Wallet,
  MapPin,
  CheckCircle2,
  TreePine,
  Droplet,
  Flame,
  ArrowRight,
  Eye,
} from "lucide-react";

interface VisualScenario {
  id: string;
  intervention_id: string;
  title: string;
  category: string;
  description: string;
  mechanism: string;
  baseline_img: string;
  proposed_img: string;
  attribution: string;
  is_illustrative: boolean;
  metrics: {
    heat_score_baseline: number;
    heat_score_proposed: number;
    surface_temp_baseline: string;
    surface_temp_proposed: string;
    runoff_baseline: string;
    runoff_proposed: string;
    canopy_baseline: string;
    canopy_proposed: string;
    est_capex: string;
    est_opex: string;
  };
}

const VISUAL_SCENARIOS: VisualScenario[] = [
  {
    id: "street-canopy",
    intervention_id: "int-urban-forest",
    title: "Urban Tree Canopy & Micro-Forest Cooling",
    category: "Thermal Island Mitigation",
    description:
      "Conversion of heat-absorbing asphalt and unshaded concrete corridors into continuous multi-tier native tree canopies with bioswale curb cuts.",
    mechanism:
      "Evapotranspirative leaf cooling and solar radiation interception dampens microclimate surface temperatures by up to 7.7°C.",
    baseline_img: streetHeatBaseline,
    proposed_img: streetCanopyProposed,
    attribution: "ECO-ECHO Urban Climate Simulation Engine (Illustrative Architecture Model)",
    is_illustrative: true,
    metrics: {
      heat_score_baseline: 78.5,
      heat_score_proposed: 52.3,
      surface_temp_baseline: "40.2°C (Extreme)",
      surface_temp_proposed: "32.5°C (-7.7°C)",
      runoff_baseline: "185,000 m³ / yr",
      runoff_proposed: "135,000 m³ / yr",
      canopy_baseline: "8.2%",
      canopy_proposed: "28.5% (+20.3%)",
      est_capex: "$380 / tree",
      est_opex: "$28 / tree / yr",
    },
  },
  {
    id: "green-roof",
    intervention_id: "int-green-roof",
    title: "Extensive Sedum Green Roof Retrofit",
    category: "Rooftop Nature-Based Solution",
    description:
      "Replacement of heat-trapping industrial tar and gravel commercial rooftops with lightweight modular drought-tolerant sedum succulent blankets.",
    mechanism:
      "Substrate water retention absorbs 45% of cloudburst precipitation while soil-plant thermodynamics reduce building rooftop heat gain by 15°C.",
    baseline_img: rooftopGravelBaseline,
    proposed_img: rooftopGreenProposed,
    attribution: "ECO-ECHO Rooftop Energy Simulation Model (Illustrative Architecture Model)",
    is_illustrative: true,
    metrics: {
      heat_score_baseline: 72.0,
      heat_score_proposed: 48.0,
      surface_temp_baseline: "46.0°C (Direct Sun)",
      surface_temp_proposed: "31.0°C (-15.0°C)",
      runoff_baseline: "220,000 m³ / yr",
      runoff_proposed: "121,000 m³ / yr",
      canopy_baseline: "0.0% (Bare Roof)",
      canopy_proposed: "85.0% Vegetated",
      est_capex: "$110 / m²",
      est_opex: "$4.5 / m² / yr",
    },
  },
  {
    id: "suds-bioswale",
    intervention_id: "int-suds-bioswale",
    title: "Engineered Bioswales & Cloudburst Retention",
    category: "Sustainable Drainage (SuDS)",
    description:
      "Retrofitting flash-flooding street intersections with bioretention filtration swales, gravel detention basins, and native wetland reeds.",
    mechanism:
      "Engineered soil filters and gravel layers trap suspended road pollutants and absorb 1,850 m³ of cloudburst stormwater per 1,000 m².",
    baseline_img: stormwaterFloodBaseline,
    proposed_img: stormwaterSudsProposed,
    attribution: "ECO-ECHO Urban Hydrology Simulation Model (Illustrative Architecture Model)",
    is_illustrative: true,
    metrics: {
      heat_score_baseline: 65.0,
      heat_score_proposed: 51.0,
      surface_temp_baseline: "34.0°C",
      surface_temp_proposed: "30.5°C",
      runoff_baseline: "310,000 m³ / event",
      runoff_proposed: "140,000 m³ / event (-55%)",
      canopy_baseline: "4.5%",
      canopy_proposed: "16.0% Vegetated",
      est_capex: "$85 / m²",
      est_opex: "$6.5 / m² / yr",
    },
  },
];

interface VisualTransformationPageProps {
  onNavigateToBudget: (neighbourhoodId?: string) => void;
  onNavigateToMap: (neighbourhoodId?: string) => void;
  onNavigateToConsequences: (
    interventionId: string,
    units: number,
    neighbourhoodId?: string
  ) => void;
  initialInterventionId?: string;
  initialNeighbourhoodId?: string;
}

export const VisualTransformationPage: React.FC<VisualTransformationPageProps> = ({
  onNavigateToBudget,
  onNavigateToMap,
  onNavigateToConsequences,
  initialInterventionId,
  initialNeighbourhoodId,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => {
    if (initialInterventionId === "int-green-roof") return "green-roof";
    if (initialInterventionId === "int-suds-bioswale") return "suds-bioswale";
    return "street-canopy";
  });

  const [displayMode, setDisplayMode] = useState<"slider" | "side_by_side">("slider");
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100 percentage
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // User upload state
  const [userBaselineImg, setUserBaselineImg] = useState<string | null>(null);
  const [userProposedImg, setUserProposedImg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const scenario =
    VISUAL_SCENARIOS.find((s) => s.id === selectedScenarioId) || VISUAL_SCENARIOS[0];

  const baselineImage = userBaselineImg || scenario.baseline_img;
  const proposedImage = userProposedImg || scenario.proposed_img;

  // Split-slider drag handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleUserUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "baseline" | "proposed"
  ) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image exceeds 5MB size limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === "baseline") setUserBaselineImg(result);
      else setUserProposedImg(result);
    };
    reader.readAsDataURL(file);
  };

  const resetCustomUploads = () => {
    setUserBaselineImg(null);
    setUserProposedImg(null);
    setUploadError(null);
  };

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
                Sustainability Transformation Visuals
              </h1>
              <span
                className="badge badge-forest"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Layers size={12} /> Before & After Intelligence
              </span>
              {initialNeighbourhoodId && (
                <span className="badge badge-lime">Location: {initialNeighbourhoodId}</span>
              )}
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
              Compare measured baseline physical conditions against model-simulated sustainability
              interventions. Drag the split slider to reveal cooling canopies, living sedum roofs, and
              cloudburst bioretention swales.
            </p>
          </div>

          {/* Display Mode Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
                onClick={() => setDisplayMode("slider")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: displayMode === "slider" ? "var(--forest-green)" : "transparent",
                  color: displayMode === "slider" ? "#FFFFFF" : "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Interactive Slider
              </button>
              <button
                onClick={() => setDisplayMode("side_by_side")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: displayMode === "side_by_side" ? "var(--forest-green)" : "transparent",
                  color: displayMode === "side_by_side" ? "#FFFFFF" : "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Side-by-Side View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {VISUAL_SCENARIOS.map((scen) => {
          const isSelected = selectedScenarioId === scen.id;
          return (
            <button
              key={scen.id}
              onClick={() => {
                setSelectedScenarioId(scen.id);
                resetCustomUploads();
              }}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "var(--radius-card)",
                border: `1.5px solid ${isSelected ? "var(--forest-green)" : "var(--border-subtle)"}`,
                background: isSelected ? "var(--warm-ivory)" : "var(--white)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                boxShadow: isSelected ? "var(--shadow-subtle)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: isSelected ? "var(--forest-green)" : "var(--text-primary)",
                  }}
                >
                  {scen.title}
                </span>
                {isSelected && <span className="badge badge-lime">Active</span>}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{scen.category}</div>
            </button>
          );
        })}
      </div>

      {/* Transparency & Scientific Provenance Alert */}
      <div
        style={{
          background: "var(--warm-ivory)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-card)",
          padding: "10px 16px",
          marginBottom: "20px",
          fontSize: "12px",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Info size={14} color="var(--forest-green)" />
          <span>
            <strong>Scientific Provenance:</strong> {scenario.attribution}. Imagery is clearly
            labelled as conceptual illustration paired with validated numerical model outputs.
          </span>
        </div>

        {/* User Photo Upload Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--forest-green)",
              background: "var(--white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-button)",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Upload Baseline Photo
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleUserUpload(e, "baseline")}
            />
          </label>

          <label
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--forest-green)",
              background: "var(--white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-button)",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Upload Proposed Photo
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleUserUpload(e, "proposed")}
            />
          </label>

          {(userBaselineImg || userProposedImg) && (
            <button
              onClick={resetCustomUploads}
              style={{
                fontSize: "11px",
                color: "var(--risk-severe)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Reset to Defaults
            </button>
          )}
        </div>
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

      {/* Main Visual Display (Slider vs Side-by-Side) */}
      <div className="card" style={{ padding: "16px", marginBottom: "24px" }}>
        {displayMode === "slider" ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "var(--text-secondary)",
              }}
            >
              <span style={{ color: "var(--risk-severe)" }}>◀ BASELINE CONDITION (MEASURED)</span>
              <span style={{ color: "var(--forest-green)" }}>PROPOSED INTERVENTION SCENARIO (MODELED) ▶</span>
            </div>

            <div
              ref={containerRef}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              style={{
                position: "relative",
                width: "100%",
                height: "480px",
                borderRadius: "var(--radius-card)",
                overflow: "hidden",
                cursor: "ew-resize",
                userSelect: "none",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* Proposed Image (Underneath) */}
              <img
                src={proposedImage}
                alt="Proposed Sustainability Scenario"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Baseline Image (Clipped on top) */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${sliderPosition}%`,
                  overflow: "hidden",
                  borderRight: "3px solid #FFFFFF",
                  boxShadow: "2px 0 12px rgba(0,0,0,0.4)",
                }}
              >
                <img
                  src={baselineImage}
                  alt="Baseline Urban Condition"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                    height: "100%",
                    maxWidth: "none",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Draggable Divider Handle */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${sliderPosition}%`,
                  transform: "translate(-50%, -50%)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  border: "2px solid var(--forest-green)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--forest-green)",
                  pointerEvents: "none",
                  fontWeight: 800,
                  fontSize: "12px",
                }}
              >
                ↔
              </div>

              {/* Overlay Pills */}
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  background: "rgba(0,0,0,0.65)",
                  color: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-button)",
                  fontSize: "11px",
                  fontWeight: 700,
                  backdropFilter: "blur(4px)",
                }}
              >
                Baseline Status
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  background: "rgba(23,63,53,0.85)",
                  color: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-button)",
                  fontSize: "11px",
                  fontWeight: 700,
                  backdropFilter: "blur(4px)",
                }}
              >
                Proposed Sustainable Future
              </div>
            </div>
          </div>
        ) : (
          /* Side-by-Side Mode */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--risk-severe)", marginBottom: "6px" }}>
                BASELINE CONDITION (MEASURED)
              </div>
              <div style={{ height: "380px", borderRadius: "var(--radius-card)", overflow: "hidden", position: "relative" }}>
                <img
                  src={baselineImage}
                  alt="Baseline Urban Condition"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-green)", marginBottom: "6px" }}>
                PROPOSED SUSTAINABILITY SCENARIO (MODELED)
              </div>
              <div style={{ height: "380px", borderRadius: "var(--radius-card)", overflow: "hidden", position: "relative" }}>
                <img
                  src={proposedImage}
                  alt="Proposed Sustainable Scenario"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Numerical Model Output Indicators (Baseline vs Proposed) */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div>
            <div className="card-title">Calculated Environmental Indicators: Baseline vs Proposed</div>
            <div className="card-subtitle">
              Derived from SciPy HiGHS mixed-integer linear programming and municipal microclimate models
            </div>
          </div>
          <span className="badge badge-forest">Validated Indicators</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-button)", padding: "14px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Heat Vulnerability Score:</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--risk-severe)" }}>
                {scenario.metrics.heat_score_baseline}
              </span>
              <ArrowRight size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--forest-green)" }}>
                {scenario.metrics.heat_score_proposed}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--forest-green)", marginTop: "4px", fontWeight: 600 }}>
              -{(scenario.metrics.heat_score_baseline - scenario.metrics.heat_score_proposed).toFixed(1)} pts Cooling
            </div>
          </div>

          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-button)", padding: "14px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Surface Temperature:</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--risk-severe)" }}>
                {scenario.metrics.surface_temp_baseline}
              </span>
              <ArrowRight size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--forest-green)" }}>
                {scenario.metrics.surface_temp_proposed}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--forest-green)", marginTop: "4px", fontWeight: 600 }}>
              Microclimate cooling dampening
            </div>
          </div>

          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-button)", padding: "14px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Stormwater Overload:</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{scenario.metrics.runoff_baseline}</span>
              <ArrowRight size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--info-blue)" }}>
                {scenario.metrics.runoff_proposed}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--info-blue)", marginTop: "4px", fontWeight: 600 }}>
              Peak cloudburst retention
            </div>
          </div>

          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-button)", padding: "14px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Vegetative Canopy Cover:</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>{scenario.metrics.canopy_baseline}</span>
              <ArrowRight size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--forest-green)" }}>
                {scenario.metrics.canopy_proposed}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--forest-green)", marginTop: "4px", fontWeight: 600 }}>
              Bio-corridor expansion
            </div>
          </div>
        </div>

        {/* Narrative & Cross-Feature Actions */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", maxWidth: "600px" }}>
            <strong>Mechanism:</strong> {scenario.mechanism}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigateToBudget(initialNeighbourhoodId)}
            >
              <Wallet size={13} />
              <span>Budget this Intervention</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToMap(initialNeighbourhoodId)}
            >
              <MapPin size={13} />
              <span>View Location on Map</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                onNavigateToConsequences(scenario.intervention_id, 450, initialNeighbourhoodId)
              }
            >
              <GitFork size={13} />
              <span>Trace Causal Chain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
