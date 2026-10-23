import React, { useState, useRef } from "react";
import {
  StructureDiagram,
  DiagramComponent,
  DiagramViewType,
  ProvenanceType,
} from "../types";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Info,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Eye,
  FileCode,
  HardHat,
} from "lucide-react";

interface ConstructionStructureVisualizerProps {
  diagram: StructureDiagram | null;
  onViewChange?: (view: DiagramViewType) => void;
  isLoading?: boolean;
}

export const ConstructionStructureVisualizer: React.FC<ConstructionStructureVisualizerProps> = ({
  diagram,
  onViewChange,
  isLoading = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
        <div style={{ display: "inline-block", animation: "spin 1.5s linear infinite", marginBottom: "12px" }}>
          <RotateCcw size={32} color="var(--forest-green)" />
        </div>
        <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
          Generating Technical Structural Diagram...
        </div>
        <div style={{ fontSize: "13px", marginTop: "6px" }}>
          Computing hydraulic clearances, layer elevations, and safety protection buffers...
        </div>
      </div>
    );
  }

  if (!diagram) {
    return (
      <div className="card" style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary)" }}>
        <Layers size={40} color="var(--forest-green)" style={{ opacity: 0.5, marginBottom: "12px" }} />
        <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
          No Structure Diagram Generated Yet
        </div>
        <p style={{ fontSize: "13px", maxWidth: "480px", margin: "8px auto 0", lineHeight: 1.5 }}>
          Click "Generate Implementation Plan" or select an urban infrastructure project type to render technical cross-sections and construction stages.
        </p>
      </div>
    );
  }

  const selectedComponent: DiagramComponent | undefined = diagram.components.find(
    (c) => c.id === selectedComponentId
  );

  const activeStage = diagram.stages[activeStageIndex] || diagram.stages[0];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(2.0, prev + 0.15));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.6, prev - 0.15));
  const handleResetZoom = () => setZoomLevel(1.0);

  const exportSvgFile = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${diagram.diagram_id}_${diagram.view_type}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPngFile = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    canvas.width = 1840;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${diagram.diagram_id}_${diagram.view_type}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  const getProvenanceBadge = (prov: ProvenanceType, isVerified: boolean) => {
    switch (prov) {
      case "VERIFIED_SOURCE_FACT":
        return {
          label: "VERIFIED SOURCE FACT",
          bg: "rgba(34, 197, 94, 0.15)",
          color: "#15803D",
          border: "#16A34A",
          icon: <CheckCircle2 size={12} />,
        };
      case "DERIVED_VALUE":
        return {
          label: "DERIVED VALUE",
          bg: "rgba(6, 182, 212, 0.15)",
          color: "#0E7490",
          border: "#0891B2",
          icon: <Sparkles size={12} />,
        };
      case "ESTIMATE":
        return {
          label: "ESTIMATE",
          bg: "rgba(245, 158, 11, 0.15)",
          color: "#B45309",
          border: "#D97706",
          icon: <Info size={12} />,
        };
      case "SIMULATED":
        return {
          label: "SIMULATED SCENARIO",
          bg: "rgba(168, 85, 247, 0.15)",
          color: "#7E22CE",
          border: "#9333EA",
          icon: <RotateCcw size={12} />,
        };
      case "UNVERIFIED":
        return {
          label: "UNVERIFIED (PENDING SPT)",
          bg: "rgba(239, 68, 68, 0.15)",
          color: "#B91C1C",
          border: "#DC2626",
          icon: <AlertTriangle size={12} />,
        };
      case "MISSING":
        return {
          label: "MISSING FIELD DATA",
          bg: "rgba(239, 68, 68, 0.2)",
          color: "#991B1B",
          border: "#B91C1C",
          icon: <AlertTriangle size={12} />,
        };
      case "ILLUSTRATIVE":
      default:
        return {
          label: "ILLUSTRATIVE ONLY",
          bg: "rgba(100, 116, 139, 0.15)",
          color: "#475569",
          border: "#64748B",
          icon: <HelpCircle size={12} />,
        };
    }
  };

  return (
    <div className="card" style={{ marginBottom: "28px", overflow: "hidden" }}>
      {/* 1. Header Toolbar */}
      <div
        className="card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--warm-ivory)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <HardHat size={20} color="var(--forest-green)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                {diagram.title}
              </span>
              <span className="badge badge-forest" style={{ fontSize: "11px" }}>
                {diagram.diagram_id}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {diagram.subtitle}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* View switcher */}
          <div
            style={{
              display: "inline-flex",
              background: "var(--warm-ivory)",
              padding: "2px",
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => onViewChange && onViewChange("cross_section")}
              title="Cross-section — Look at the structure from the side."
              style={{
                padding: "5px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: diagram.view_type === "cross_section" ? "var(--forest-green)" : "transparent",
                color: diagram.view_type === "cross_section" ? "#FFFFFF" : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cross-section
            </button>
            <button
              type="button"
              onClick={() => onViewChange && onViewChange("plan_view")}
              title="Plan view — Look at the layout from above."
              style={{
                padding: "5px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: diagram.view_type === "plan_view" ? "var(--forest-green)" : "transparent",
                color: diagram.view_type === "plan_view" ? "#FFFFFF" : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Plan view
            </button>
            <button
              type="button"
              onClick={() => onViewChange && onViewChange("construction_stages")}
              title="Construction stages — See the order of work."
              style={{
                padding: "5px 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: diagram.view_type === "construction_stages" ? "var(--forest-green)" : "transparent",
                color: diagram.view_type === "construction_stages" ? "#FFFFFF" : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Construction stages
            </button>
          </div>

          {/* Toggle Dimensions */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowDimensions(!showDimensions)}
            title="Toggle dimension indicators and limits"
            style={{ fontSize: "12px", padding: "6px 10px" }}
          >
            <Eye size={13} />
            <span>{showDimensions ? "Hide Dims" : "Show Dims"}</span>
          </button>

          {/* Zoom Controls */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--warm-ivory)",
              borderRadius: "var(--radius-button)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={handleZoomIn}
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer" }}
              title="Zoom In"
            >
              <ZoomIn size={14} color="var(--forest-green)" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              style={{ padding: "6px 8px", background: "none", border: "none", cursor: "pointer" }}
              title="Zoom Out"
            >
              <ZoomOut size={14} color="var(--forest-green)" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              style={{
                padding: "6px 8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
              title="Reset Zoom"
            >
              {(zoomLevel * 100).toFixed(0)}%
            </button>
          </div>

          {/* Export Buttons */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportSvgFile}
            title="Download SVG vector file"
            style={{ fontSize: "12px", padding: "6px 10px" }}
          >
            <FileCode size={13} />
            <span>SVG</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportPngFile}
            title="Download PNG image"
            style={{ fontSize: "12px", padding: "6px 10px" }}
          >
            <Download size={13} />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* 2. Main Interactive Diagram Canvas Area */}
      <div
        style={{
          position: "relative",
          background: "#F8FAFC",
          borderBottom: "1px solid var(--border-subtle)",
          overflow: "auto",
          maxHeight: "560px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out",
            width: "100%",
            maxWidth: "920px",
          }}
        >
          <svg
            ref={svgRef}
            viewBox={diagram.viewbox}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              background: "#FFFFFF",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              border: "1px solid #E2E8F0",
            }}
          >
            <defs>
              {/* Hatch pattern for soil / aggregate */}
              <pattern id="soilHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#8C5E35" strokeWidth="1.2" opacity="0.4" />
              </pattern>
              <pattern id="concreteHatch" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#475569" opacity="0.5" />
                <circle cx="6" cy="6" r="0.8" fill="#475569" opacity="0.5" />
              </pattern>
              {/* Arrow markers */}
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7" />
              </marker>
              <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#DC2626" />
              </marker>
            </defs>

            {/* Background Grid Pattern */}
            <g opacity="0.15">
              {Array.from({ length: 19 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="540" stroke="#64748B" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 50} x2="920" y2={i * 50} stroke="#64748B" strokeWidth="0.5" />
              ))}
            </g>

            {/* Render Components */}
            {diagram.components.map((comp) => {
              const isSelected = comp.id === selectedComponentId;
              const isActiveInStage = activeStage?.active_component_ids?.includes(comp.id);
              const highlightStroke = isSelected
                ? "#2563EB"
                : isActiveInStage
                ? "var(--forest-green)"
                : comp.svg_props.stroke || "#334155";
              const highlightWidth = isSelected ? 4 : isActiveInStage ? 3 : comp.svg_props.strokeWidth || 2;

              const elementProps = {
                ...comp.svg_props,
                stroke: highlightStroke,
                strokeWidth: highlightWidth,
                cursor: "pointer",
                onClick: () => setSelectedComponentId(comp.id),
                filter: isSelected ? "drop-shadow(0px 0px 6px rgba(37,99,235,0.6))" : undefined,
              };

              return (
                <g key={comp.id} id={comp.id}>
                  {comp.svg_element === "rect" && <rect {...elementProps} />}
                  {comp.svg_element === "circle" && <circle {...elementProps} />}
                  {comp.svg_element === "path" && <path {...elementProps} />}

                  {/* Component interactive label tag */}
                  {comp.dimensions_label && (
                    <text
                      x={
                        comp.svg_props.x
                          ? Number(comp.svg_props.x) + (Number(comp.svg_props.width) || 0) / 2
                          : comp.svg_props.cx || 460
                      }
                      y={
                        comp.svg_props.y
                          ? Number(comp.svg_props.y) + (Number(comp.svg_props.height) || 0) / 2
                          : comp.svg_props.cy || 270
                      }
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10.5"
                      fontWeight="700"
                      fill={comp.is_verified ? "#0F172A" : "#475569"}
                      pointerEvents="none"
                      style={{ textShadow: "0 1px 3px rgba(255,255,255,0.9)" }}
                    >
                      {comp.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Dimension Lines if toggled */}
            {showDimensions &&
              diagram.dimension_lines.map((dim) => (
                <g key={dim.id}>
                  {/* Dimension Leader Line */}
                  <line
                    x1={dim.x1}
                    y1={dim.y1}
                    x2={dim.x2}
                    y2={dim.y2}
                    stroke={dim.is_illustrative ? "#DC2626" : "#0284C7"}
                    strokeWidth="1.8"
                    strokeDasharray={dim.is_illustrative ? "4 3" : undefined}
                    markerStart="url(#dimArrow)"
                    markerEnd="url(#dimArrow)"
                  />
                  {/* Dimension Label Tag */}
                  <rect
                    x={dim.text_x - 6}
                    y={dim.text_y - 12}
                    width={dim.label.length * 6.5 + 16}
                    height="18"
                    fill="#FFFFFF"
                    stroke={dim.is_illustrative ? "#DC2626" : "#0284C7"}
                    strokeWidth="1"
                    rx="3"
                    opacity="0.95"
                  />
                  <text
                    x={dim.text_x}
                    y={dim.text_y}
                    fontSize="10.5"
                    fontWeight="700"
                    fill={dim.is_illustrative ? "#B91C1C" : "#0369A1"}
                  >
                    {dim.label}
                  </text>
                </g>
              ))}

            {/* Persistent Illustrative Watermark if conceptual */}
            <text
              x="890"
              y="525"
              textAnchor="end"
              fontSize="10"
              fontWeight="700"
              fill="#94A3B8"
              opacity="0.8"
            >
              ECO-ECHO Technical Engine • Conceptual Diagram
            </text>
          </svg>
        </div>
      </div>

      {/* 3. Bottom Panel: Component Inspector & Staged Sequence */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", padding: "20px" }}>
        {/* Left: Component Inspector */}
        <div
          style={{
            background: "var(--warm-ivory)",
            padding: "18px",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              <Info size={16} color="var(--forest-green)" />
              <span>Component Inspector</span>
            </div>
            {selectedComponent && (
              <button
                type="button"
                onClick={() => setSelectedComponentId(null)}
                style={{ background: "none", border: "none", fontSize: "11px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600 }}
              >
                Clear Selection
              </button>
            )}
          </div>

          {selectedComponent ? (
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--forest-green)", marginBottom: "4px" }}>
                {selectedComponent.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                {(() => {
                  const b = getProvenanceBadge(selectedComponent.provenance, selectedComponent.is_verified);
                  return (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        background: b.bg,
                        color: b.color,
                        border: `1px solid ${b.border}`,
                      }}
                    >
                      {b.icon} {b.label}
                    </span>
                  );
                })()}
                <span className="badge" style={{ fontSize: "11px", textTransform: "capitalize" }}>
                  Category: {selectedComponent.category.replace("_", " ")}
                </span>
                <span className="badge" style={{ fontSize: "11px" }}>
                  {selectedComponent.construction_stage}
                </span>
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                {selectedComponent.description}
              </p>

              {/* Evidence Citation */}
              {selectedComponent.evidence_ref && (
                <div
                  style={{
                    background: "rgba(184, 233, 134, 0.25)",
                    border: "1px solid rgba(23, 63, 53, 0.2)",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    color: "var(--forest-green)",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ExternalLink size={13} />
                  <span>
                    Linked Record: <strong>{selectedComponent.evidence_ref}</strong> (BBMP / Smart City Open Data)
                  </span>
                </div>
              )}

              {/* Assumptions & Risks */}
              {selectedComponent.assumptions.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Engineering Assumptions
                  </div>
                  <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.4 }}>
                    {selectedComponent.assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedComponent.risks.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#B91C1C", textTransform: "uppercase" }}>
                    Potential Failure Risks
                  </div>
                  <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "#991B1B", lineHeight: 1.4 }}>
                    {selectedComponent.risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--text-secondary)", fontSize: "13px" }}>
              <Layers size={28} color="var(--forest-green)" style={{ opacity: 0.4, marginBottom: "6px" }} />
              <div>Click any element or layer in the diagram above to inspect technical specifications, evidence citations, and safety limits.</div>
            </div>
          )}
        </div>

        {/* Right: Construction Stages Stepper */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "18px",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              <HardHat size={16} color="var(--forest-green)" />
              <span>Staged Implementation Sequence</span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-green)" }}>
              Stage {activeStage.stage_number} of {diagram.stages.length}
            </span>
          </div>

          {/* Stepper Buttons */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", overflowX: "auto", paddingBottom: "4px" }}>
            {diagram.stages.map((st, idx) => (
              <button
                key={st.stage_number}
                type="button"
                onClick={() => setActiveStageIndex(idx)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  border: idx === activeStageIndex ? "2px solid var(--forest-green)" : "1px solid var(--border-subtle)",
                  background: idx === activeStageIndex ? "rgba(184, 233, 134, 0.3)" : "var(--warm-ivory)",
                  color: "var(--forest-green)",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Stage {st.stage_number}: {st.duration_estimate}
              </button>
            ))}
          </div>

          {/* Stage Details Card */}
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
            {activeStage.stage_name}
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.45, margin: "0 0 10px 0" }}>
            {activeStage.description}
          </p>

          {/* Key Actions Checklist */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
              Key Construction Actions:
            </div>
            {activeStage.key_actions.map((act, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "12px", marginBottom: "3px" }}>
                <CheckCircle2 size={13} color="var(--forest-green)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{act}</span>
              </div>
            ))}
          </div>

          {/* Inspection Checkpoint */}
          {activeStage.inspection_checkpoint && (
            <div
              style={{
                background: "rgba(2, 132, 199, 0.1)",
                border: "1px solid rgba(2, 132, 199, 0.25)",
                borderRadius: "6px",
                padding: "8px 10px",
                fontSize: "12px",
                color: "#0369A1",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Shield size={14} />
              <span>
                <strong>Inspection Checkpoint:</strong> {activeStage.inspection_checkpoint}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Persistent Engineering & Legal Disclaimer */}
      <div
        style={{
          background: "rgba(245, 158, 11, 0.1)",
          borderTop: "1px solid rgba(245, 158, 11, 0.25)",
          padding: "10px 20px",
          fontSize: "12px",
          color: "#92400E",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
        <span>
          <strong>Conceptual illustration — not an approved engineering drawing.</strong>{" "}
          {diagram.disclaimer}
        </span>
      </div>
    </div>
  );
};
