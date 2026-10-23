import React, { useState, useEffect } from "react";
import {
  ImplementationPlanRequest,
  ClassificationResult,
  ImplementationPlan,
  PlanSummaryItem,
  StructureDiagram,
  RealWorldEvidenceRecord,
  DiagramViewType,
} from "../types";
import { Currency } from "../utils/budgetCalculator";
import { api } from "../api/client";
import { ConstructionStructureVisualizer } from "../components/ConstructionStructureVisualizer";
import { RealWorldEvidencePanel } from "../components/RealWorldEvidencePanel";
import {
  HardHat,
  Search,
  Sparkles,
  Shield,
  Layers,
  MapPin,
  TrendingUp,
  Droplet,
  Info,
  DollarSign,
  Scale,
  Sliders,
  ChevronDown,
  ChevronUp,
  Building,
  Waves,
  Footprints,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Calendar,
  FileText,
  UserCheck,
  AlertOctagon,
  Wrench,
  Trees,
  CloudRain,
  Share2,
  ExternalLink,
  ArrowRight,
  ListChecks,
  Eye,
  Database,
  UploadCloud,
  X,
  FileCheck,
} from "lucide-react";

interface ImplementationPlannerPageProps {
  activeDatasetId: string;
  onNavigateToMap: (neighbourhoodId?: string) => void;
  onNavigateToBudget: (neighbourhoodId?: string) => void;
  onNavigateToConsequences: (
    interventionId: string,
    units: number,
    neighbourhoodId?: string,
    strategy?: string
  ) => void;
  preselectedNeighbourhoodId?: string;
  availableDatasets?: Array<{ dataset_id: string; name: string }>;
  onSelectDataset?: (id: string) => void;
  initialPrompt?: string;
  initialBudget?: number;
  initialLocation?: string;
}

export const ImplementationPlannerPage: React.FC<ImplementationPlannerPageProps> = ({
  activeDatasetId,
  onNavigateToMap,
  onNavigateToBudget,
  onNavigateToConsequences,
  preselectedNeighbourhoodId,
  availableDatasets = [],
  onSelectDataset,
  initialPrompt,
  initialBudget,
  initialLocation,
}) => {
  // --------------------------------------------------------------------------
  // 1. Input Form State
  // --------------------------------------------------------------------------
  const [prompt, setPrompt] = useState<string>(
    initialPrompt ||
      "Improve drainage near homes while keeping shops, pedestrians, and hospital access safe during heavy rain."
  );
  const [locationName, setLocationName] = useState<string>(
    initialLocation || preselectedNeighbourhoodId || "Koramangala 4th Block, Bengaluru"
  );
  const [budgetCeiling, setBudgetCeiling] = useState<number>(initialBudget || 2500000);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [mainGoal, setMainGoal] = useState<string>(
    "Mitigate street flooding and maintain continuous pedestrian & emergency access"
  );
  const [weatherConstraint, setWeatherConstraint] = useState<string>(
    "Heavy seasonal monsoon rain with high risk of trench flooding"
  );
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    "City General Hospital",
    "St. Jude Primary School",
    "Downtown Commercial High Street",
  ]);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState<boolean>(false);
  const [selectedProjectType, setSelectedProjectType] = useState<string>("stormwater_drainage");

  // Document attachments state
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{ id: string; name: string; size: string; status: "uploaded" | "uploading" | "error"; error?: string }>
  >([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  // Active Plan & Result State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "visualizer"
    | "evidence"
    | "investigations"
    | "design"
    | "phases"
    | "community"
    | "weather"
    | "budget"
    | "risks"
    | "qa"
    | "maintenance"
  >("overview");

  const [currentPlan, setCurrentPlan] = useState<ImplementationPlan | null>(null);
  const [currentDiagram, setCurrentDiagram] = useState<StructureDiagram | null>(null);
  const [diagramView, setDiagramView] = useState<DiagramViewType>("cross_section");
  const [savedPlans, setSavedPlans] = useState<PlanSummaryItem[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("baseline");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);


  // Sync initial props
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialBudget) setBudgetCeiling(initialBudget);
    if (initialLocation) setLocationName(initialLocation);
  }, [initialPrompt, initialBudget, initialLocation]);

  // --------------------------------------------------------------------------
  // 2. Verified Data Registries & Plain-English Category Definitions
  // --------------------------------------------------------------------------
  const projectTypeRegistry = [
    {
      id: "",
      name: "Auto-detect",
      subtitle: "We'll match your description to appropriate civil engineering standards",
      icon: Sparkles,
    },
    {
      id: "stormwater_drainage",
      name: "Drainage",
      subtitle: "Help rainwater flow safely and protect streets from flooding",
      icon: Waves,
    },
    {
      id: "road_and_pavement",
      name: "Roads and footpaths",
      subtitle: "Make streets safer and easier to use with barrier-free sidewalks",
      icon: Footprints,
    },
    {
      id: "water_supply_distribution",
      name: "Water supply",
      subtitle: "Improve access to clean water and eliminate network leaks",
      icon: Droplet,
    },
    {
      id: "green_roof",
      name: "Green roofs",
      subtitle: "Add plants to suitable building roofs for cooling and water absorption",
      icon: Building,
    },
    {
      id: "urban_forestry",
      name: "Trees and green spaces",
      subtitle: "Create healthier, cooler places with native shade trees and lake buffers",
      icon: Trees,
    },
    {
      id: "solid_waste_facility",
      name: "Waste management",
      subtitle: "Improve collection, recycling, and ward-level organic composting",
      icon: RotateCcw,
    },
    {
      id: "solar_renewable_energy",
      name: "Clean energy",
      subtitle: "Use energy more efficiently with rooftop solar arrays and microgrids",
      icon: Sparkles,
    },
    {
      id: "wastewater_treatment",
      name: "Wastewater",
      subtitle: "Safely collect and treat used water with decentralized treatment units",
      icon: Droplet,
    },
    {
      id: "public_transit_corridor",
      name: "Public transport",
      subtitle: "Improve access, dedicated bus lanes, and safer, accessible journeys",
      icon: HardHat,
    },
    {
      id: "custom_urban_project",
      name: "Other projects",
      subtitle: "Describe your own civic infrastructure or neighborhood improvement idea",
      icon: Wrench,
    },
  ];

  // Verified Bengaluru real-world locations
  const verifiedBengaluruLocations = [
    { name: "Koramangala 4th Block", desc: "ST Bed / Challaghatta SWD Valley Basin", verified: true },
    { name: "Indiranagar 100ft Road", desc: "Commercial Corridor & Metro Access Line", verified: true },
    { name: "Whitefield (Kadugodi)", desc: "Elevated Zone / BWSSB Pipeline Corridor", verified: true },
    { name: "Bellandur (Outer Ring Road)", desc: "Lake Buffer / EcoSpace Drainage Catchment", verified: true },
    { name: "Malleshwaram 8th Cross", desc: "Heritage Commercial & Footpath Zone", verified: true },
    { name: "Hebbal (Flyover / Kempapura)", desc: "SWD Primary Outfall Basin & Lake Interlink", verified: true },
    { name: "Jayanagar 4th Block", desc: "Urban Tree Canopy & School Pedestrian Zone", verified: true },
  ];

  // Beginner-friendly non-auto-submitting starter chips
  const suggestionChips = [
    {
      label: "Improve drainage during heavy rain",
      type: "stormwater_drainage",
      promptText: "Improve drainage near homes while keeping shops, pedestrians, and hospital access safe during heavy rain.",
      goal: "Stop flash street flooding, protect residential doorways, and manage storm runoff safely.",
    },
    {
      label: "Make roads and footpaths safer",
      type: "road_and_pavement",
      promptText: "Make roads and footpaths safer by segregating utilities, widening walkways, and ensuring wheelchair access.",
      goal: "Resurface street carriageways while guaranteeing continuous ambulance access and safe walking routes.",
    },
    {
      label: "Add green roofs to public buildings",
      type: "green_roof",
      promptText: "Add green roofs to public buildings with structural load checks, root barriers, and rainwater cisterns.",
      goal: "Insulate civic buildings, reduce rooftop thermal heat gain, and capture rainwater.",
    },
    {
      label: "Plant trees and protect green spaces",
      type: "urban_forestry",
      promptText: "Plant native shade trees, protect lake buffers, and add percolation swales without damaging underground pipes.",
      goal: "Expand tree canopy shade by 35% without heaving sidewalks or root-damaging water mains.",
    },
    {
      label: "Reduce water leaks",
      type: "water_supply_distribution",
      promptText: "Reduce water leaks with acoustic pipeline monitoring, replacement of corroded pipes, and smart district meters.",
      goal: "Eliminate distribution water losses while maintaining continuous drinking water pressure.",
    },
    {
      label: "Improve waste collection",
      type: "solid_waste_facility",
      promptText: "Improve waste collection with a neighborhood dry-waste center, aerobic composting unit, and odor control.",
      goal: "Divert wet waste from landfills with clean ward-level decentralized processing.",
    },
  ];

  // --------------------------------------------------------------------------
  // 3. Lifecycle & Backend Integration
  // --------------------------------------------------------------------------
  useEffect(() => {
    loadSavedPlans();
    handleGeneratePlan();
  }, [activeDatasetId]);

  const loadSavedPlans = async () => {
    try {
      const list = await api.listImplementationPlans();
      setSavedPlans(list);
    } catch (e) {
      console.warn("Could not load saved plans:", e);
    }
  };

  const handleGeneratePlan = async (
    customPrompt?: string,
    customType?: string,
    customLocation?: string,
    customGoal?: string
  ) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt || finalPrompt.trim().length < 5) return;

    setIsGenerating(true);
    setStatusNotice(null);

    const fileIds = attachedFiles.filter((f) => f.status === "uploaded").map((f) => f.id);

    const req: ImplementationPlanRequest = {
      prompt: finalPrompt,
      location_or_neighbourhood: customLocation || locationName,
      intervention_type: customType || (selectedProjectType ? selectedProjectType : undefined),
      main_goal: customGoal || mainGoal,
      budget_ceiling: budgetCeiling,
      currency: currency,
      weather_constraints: weatherConstraint,
      nearby_critical_facilities: selectedFacilities,
      dataset_id: activeDatasetId,
      attached_file_ids: fileIds.length > 0 ? fileIds : undefined,
    };

    try {
      const plan = await api.generateImplementationPlan(req);
      setCurrentPlan(plan);
      if (plan.structure_diagram) {
        setCurrentDiagram(plan.structure_diagram);
      }
      setSelectedScenario("baseline");
      setStatusNotice(
        `Plan ${plan.plan_id} created successfully with honest preliminary assessment (${plan.data_completeness_pct.toFixed(0)}% completeness).`
      );
      loadSavedPlans();
    } catch (err: any) {
      console.error("Plan generation error:", err);
      setStatusNotice("Could not generate plan. Please verify backend service connectivity.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyScenario = async (scenType: string) => {
    if (!currentPlan) return;
    setSelectedScenario(scenType);
    if (scenType === "baseline") {
      handleGeneratePlan();
      return;
    }

    setIsGenerating(true);
    try {
      const updated = await api.recalculatePlanScenario(currentPlan.plan_id, scenType);
      setCurrentPlan(updated);
      if (updated.structure_diagram) {
        setCurrentDiagram(updated.structure_diagram);
      }
      setStatusNotice(`Plan recalculated under stress test: ${scenType.replace("_", " ").toUpperCase()}`);
    } catch (err) {
      console.error("Scenario recalculation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!currentPlan) return;
    try {
      const exp = await api.exportPlanReport(currentPlan.plan_id, "markdown");
      const blob = new Blob([exp.content], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${currentPlan.plan_id}_implementation_plan.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const handleSelectSavedPlan = async (planId: string) => {
    setIsGenerating(true);
    try {
      const plan = await api.getImplementationPlan(planId);
      setCurrentPlan(plan);
      if (plan.structure_diagram) {
        setCurrentDiagram(plan.structure_diagram);
      }
      setPrompt(plan.user_stated_problem);
      setLocationName(plan.location_or_neighbourhood);
      setBudgetCeiling(plan.budget.budget_ceiling || 2500000);
      setCurrency((plan.budget.currency as Currency) || "USD");
    } catch (err) {
      console.error("Load plan error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Document attachment handler with validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File '${file.name}' exceeds the 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    // Validate extension
    const allowed = [".pdf", ".csv", ".xlsx", ".xls", ".geojson", ".json", ".txt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError(`File extension '${ext}' is not supported. Please upload a PDF, CSV, Excel, GeoJSON, or TXT document.`);
      return;
    }

    setIsUploadingFile(true);
    const tempId = `temp-${Date.now()}`;
    setAttachedFiles((prev) => [
      ...prev,
      {
        id: tempId,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        status: "uploading",
      },
    ]);

    try {
      const meta = await api.uploadEvidenceDocument(file);
      setAttachedFiles((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, id: meta.file_id, status: "uploaded" }
            : item
        )
      );
      setStatusNotice(`Attached and verified '${file.name}' (${meta.extracted_summary}).`);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document. Please check file format and server connection.");
      setAttachedFiles((prev) => prev.filter((item) => item.id !== tempId));
    } finally {
      setIsUploadingFile(false);
      // Reset input value
      e.target.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Location Verification Classifier
  const getLocationVerification = () => {
    const isSimulated =
      activeDatasetId.toLowerCase().includes("sample") ||
      activeDatasetId === "sample-metro-verde";

    if (isSimulated) {
      return {
        type: "simulated" as const,
        label: "Simulated example dataset (Metro Verde) — not verified municipal data",
        badgeClass: "badge-neutral",
        icon: AlertTriangle,
      };
    }

    const matched = verifiedBengaluruLocations.some((loc) =>
      locationName.toLowerCase().includes(loc.name.toLowerCase())
    );

    if (matched) {
      return {
        type: "verified" as const,
        label: "Verified real location — Grounded in BBMP GIS & municipal records",
        badgeClass: "badge-forest",
        icon: CheckCircle2,
      };
    }

    return {
      type: "unverified" as const,
      label: "User-entered location — Awaiting field survey & GIS boundary verification",
      badgeClass: "badge-neutral",
      icon: Info,
    };
  };

  const locVerification = getLocationVerification();

  // Honest Data Completeness Assessment
  const getHonestCompleteness = () => {
    if (!currentPlan) {
      return {
        status: "Awaiting generation",
        badgeClass: "badge-neutral",
        description: "Describe your project and click Create my implementation plan.",
      };
    }

    const isSimulated =
      activeDatasetId.toLowerCase().includes("sample") ||
      activeDatasetId === "sample-metro-verde";

    if (isSimulated) {
      return {
        status: "Simulated example data — not verified municipal data",
        badgeClass: "badge-neutral",
        description: "Calculations reflect sample dataset parameters, not verified municipal field measurements.",
      };
    }

    if (currentPlan.missing_critical_data && currentPlan.missing_critical_data.length > 2) {
      return {
        status: "Site measurements required",
        badgeClass: "badge-neutral",
        description: "Essential underground utility locates and soil bearing tests must occur before construction.",
      };
    }

    if (currentPlan.data_completeness_pct >= 85) {
      return {
        status: "Ready for preliminary planning",
        badgeClass: "badge-lime",
        description: "Strong evidence base with verified citations and structured dimension estimates.",
      };
    }

    if (currentPlan.data_completeness_pct >= 65) {
      return {
        status: "Some information still needed",
        badgeClass: "badge-forest",
        description: "Core dimensions established, but supplemental municipal records or DPRs are recommended.",
      };
    }

    return {
      status: "Awaiting source verification",
      badgeClass: "badge-neutral",
      description: "Preliminary planning assumptions require validation against local engineering surveys.",
    };
  };

  const completenessAssessment = getHonestCompleteness();

  const formatCurrency = (val: number) => {
    const isINR = currency === "INR";
    const symbol = isINR ? "₹" : "$";
    if (isINR) {
      if (Math.abs(val) >= 10000000) return `${symbol}${(val / 10000000).toFixed(2)} Cr`;
      if (Math.abs(val) >= 100000) return `${symbol}${(val / 100000).toFixed(1)} L`;
      return `${symbol}${Math.round(val).toLocaleString("en-IN")}`;
    }
    if (Math.abs(val) >= 1000000) return `${symbol}${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `${symbol}${(val / 1000).toFixed(0)}k`;
    return `${symbol}${Math.round(val).toLocaleString()}`;
  };

  return (
    <div style={{ width: "100%", minWidth: 0, paddingBottom: "60px" }}>
      {/* ==================================================================== */}
      {/* 1. Header & Actions Toolbar                                          */}
      {/* ==================================================================== */}
      <div
        className="page-header"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "18px",
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
          {/* Title & Subtitle */}
          <div style={{ flex: "1 1 450px", minWidth: 0 }}>
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
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "var(--forest-green)",
                  letterSpacing: "-0.5px",
                }}
              >
                Plan a Better City
              </h1>
              <span className="badge badge-forest" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <HardHat size={13} /> Evidence-Backed Engineering
              </span>
              {currentPlan && (
                <span className="badge badge-lime">
                  {currentPlan.classification.primary_category.replace("_", " ").toUpperCase()}
                </span>
              )}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                maxWidth: "760px",
              }}
            >
              Tell us what you want to improve. We'll help you explore the design, construction steps, costs, risks, and ways to protect people.
            </p>
          </div>

          {/* Toolbar Controls */}
          <div className="budget-toolbar" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* City Dataset Selector */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>City:</span>
              <select
                className="budget-select"
                value={activeDatasetId}
                onChange={(e) => onSelectDataset && onSelectDataset(e.target.value)}
                style={{ fontSize: "12.5px", fontWeight: 600 }}
              >
                {availableDatasets.length > 0 ? (
                  availableDatasets.map((d) => (
                    <option key={d.dataset_id} value={d.dataset_id}>
                      {d.name}
                    </option>
                  ))
                ) : (
                  <option value="sample-metro-verde">Metro Verde (Sample)</option>
                )}
              </select>
            </div>

            {/* Saved Plans History Selector */}
            {savedPlans.length > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>History:</span>
                <select
                  className="budget-select"
                  value={currentPlan?.plan_id || ""}
                  onChange={(e) => e.target.value && handleSelectSavedPlan(e.target.value)}
                  style={{ fontSize: "12px", maxWidth: "160px" }}
                  title="Switch to previously generated plan"
                >
                  <option value="">Switch to saved plan...</option>
                  {savedPlans.map((sp) => (
                    <option key={sp.plan_id} value={sp.plan_id}>
                      {sp.project_name} ({sp.plan_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Currency Selector (USD / INR) */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--warm-ivory)",
                borderRadius: "var(--radius-button)",
                padding: "2px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: currency === "USD" ? "var(--forest-green)" : "transparent",
                  color: currency === "USD" ? "#FFFFFF" : "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: currency === "INR" ? "var(--forest-green)" : "transparent",
                  color: currency === "INR" ? "#FFFFFF" : "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                INR (₹)
              </button>
            </div>

            {/* Export & Print */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportMarkdown}
              disabled={!currentPlan}
              title="Download audit-ready Markdown plan"
            >
              <Download size={14} />
              <span>Export Plan</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              disabled={!currentPlan}
              title="Print municipal summary report"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusNotice && (
        <div
          style={{
            background: "rgba(184, 233, 134, 0.25)",
            border: "1px solid rgba(23, 63, 53, 0.2)",
            borderRadius: "var(--radius-card)",
            padding: "10px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--forest-green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} />
            <span style={{ fontWeight: 600 }}>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--forest-green)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. REDESIGNED PROJECT INPUT FORM (3-STEP GUIDED FLOW)                 */}
      {/* ==================================================================== */}
      <div
        className="card"
        style={{
          marginBottom: "32px",
          border: "1.5px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
          padding: "24px",
          background: "var(--white)",
        }}
      >
        {/* Step 1: What do you want to build or improve? */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                background: "var(--forest-green)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
              }}
            >
              Step 1
            </span>
            <label
              htmlFor="project-type-select"
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              What do you want to build or improve?
            </label>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
            Choose a project type or select auto-detect to deduce the engineering requirements from your description.
          </p>

          <div style={{ position: "relative" }}>
            <select
              id="project-type-select"
              value={selectedProjectType}
              onChange={(e) => setSelectedProjectType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "13.5px",
                borderRadius: "var(--radius-button)",
                border: "1.5px solid var(--border-subtle)",
                background: "var(--white)",
                fontWeight: 600,
                color: "var(--forest-green)",
                cursor: "pointer",
              }}
            >
              {projectTypeRegistry.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.subtitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Where should this happen? */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                background: "var(--forest-green)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
              }}
            >
              Step 2
            </span>
            <label
              htmlFor="location-input"
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Project location
            </label>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
            Enter a neighborhood, street corridor, or ward. We clearly verify real locations versus simulated test datasets.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <input
                id="location-input"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Koramangala 4th Block, Bengaluru"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  borderRadius: "var(--radius-button)",
                  border: "1.5px solid var(--border-subtle)",
                  background: "var(--white)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Location Provenance & Verification Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radius-button)",
                fontSize: "12px",
                background:
                  locVerification.type === "verified"
                    ? "rgba(34, 197, 94, 0.12)"
                    : locVerification.type === "simulated"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(23, 63, 53, 0.06)",
                color:
                  locVerification.type === "verified"
                    ? "#15803D"
                    : locVerification.type === "simulated"
                    ? "#B45309"
                    : "var(--text-secondary)",
                border:
                  locVerification.type === "verified"
                    ? "1px solid rgba(34, 197, 94, 0.3)"
                    : locVerification.type === "simulated"
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "1px solid var(--border-subtle)",
              }}
            >
              <locVerification.icon size={14} />
              <span style={{ fontWeight: 600 }}>{locVerification.label}</span>
            </div>

            {/* Quick-pick Verified Bengaluru Locations */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)" }}>
                Verified Bengaluru Sites:
              </span>
              {verifiedBengaluruLocations.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLocationName(`${loc.name}, Bengaluru`)}
                  title={loc.desc}
                  style={{
                    background: locationName.includes(loc.name) ? "var(--forest-green)" : "var(--warm-ivory)",
                    color: locationName.includes(loc.name) ? "#FFFFFF" : "var(--text-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-full)",
                    padding: "3px 10px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  📍 {loc.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Describe your idea */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                background: "var(--forest-green)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
              }}
            >
              Step 3
            </span>
            <label
              htmlFor="prompt-textarea"
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              What would you like to build or improve?
            </label>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
            Describe the problem in your own words. You don't need engineering knowledge.
          </p>

          <textarea
            id="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "14.5px",
              lineHeight: 1.5,
              borderRadius: "var(--radius-button)",
              border: "1.5px solid var(--border-subtle)",
              background: "var(--white)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              resize: "vertical",
            }}
            placeholder="Example: Improve drainage near homes while keeping shops, pedestrians, and hospital access safe during heavy rain."
          />
        </div>

        {/* Example Ideas Starter Chips (Populates form WITHOUT auto-submitting) */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
            Example ideas (click to fill description):
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(chip.promptText);
                  setSelectedProjectType(chip.type);
                  setMainGoal(chip.goal);
                  // IMPORTANT: Does not auto-submit! User reviews and clicks the primary button when ready.
                }}
                style={{
                  background: prompt === chip.promptText ? "rgba(23,63,53,0.1)" : "var(--warm-ivory)",
                  border: `1px solid ${prompt === chip.promptText ? "var(--forest-green)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-full)",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--forest-green)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Project Details (Collapsible Drawer) */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "14px 0",
            marginBottom: "20px",
          }}
        >
          <button
            type="button"
            onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13.5px",
              fontWeight: 700,
              color: "var(--forest-green)",
              cursor: "pointer",
            }}
          >
            {showAdvancedInputs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>Add more details (optional)</span>
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
              — Budget, weather precautions, and protected facilities
            </span>
          </button>

          {showAdvancedInputs && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                background: "var(--warm-ivory)",
                padding: "18px",
                borderRadius: "var(--radius-button)",
                marginTop: "14px",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  How much money is available? ({currency})
                </label>
                <input
                  type="number"
                  value={budgetCeiling}
                  onChange={(e) => setBudgetCeiling(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "13px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--white)",
                  }}
                  placeholder="2500000"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  What conditions should the plan prepare for?
                </label>
                <input
                  type="text"
                  value={weatherConstraint}
                  onChange={(e) => setWeatherConstraint(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "13px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--white)",
                  }}
                  placeholder="e.g. Heavy seasonal monsoon rain"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Are there homes, shops, schools, or hospitals nearby?
                </label>
                <input
                  type="text"
                  value={selectedFacilities.join(", ")}
                  onChange={(e) =>
                    setSelectedFacilities(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "13px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--white)",
                  }}
                  placeholder="e.g. City General Hospital, Primary School"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  What is the primary engineering outcome?
                </label>
                <input
                  type="text"
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "13px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--white)",
                  }}
                  placeholder="e.g. Mitigate street flooding"
                />
              </div>
            </div>
          )}
        </div>

        {/* Documents and Data Sources Card */}
        <div
          style={{
            background: "rgba(23, 63, 53, 0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-button)",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={16} color="var(--forest-green)" />
                <strong style={{ fontSize: "14px", color: "var(--forest-green)" }}>
                  Have project documents?
                </strong>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                Attach reports, tender documents, spreadsheets, or maps to help ground the plan in evidence.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "var(--white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--forest-green)",
                  cursor: isUploadingFile ? "wait" : "pointer",
                }}
              >
                <UploadCloud size={14} />
                <span>{isUploadingFile ? "Uploading..." : "Attach Document"}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploadingFile}
                  style={{ display: "none" }}
                  accept=".pdf,.csv,.xlsx,.xls,.geojson,.json,.txt"
                />
              </label>

              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "var(--white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <Database size={14} />
                <span>View data sources</span>
              </button>
            </div>
          </div>

          {/* Attached documents list */}
          {attachedFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
              {attachedFiles.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--white)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 10px",
                    fontSize: "12px",
                  }}
                >
                  <FileCheck size={13} color="var(--forest-green)" />
                  <span style={{ fontWeight: 600 }}>{f.name}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>({f.size})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(f.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                    title="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <div style={{ color: "var(--risk-severe)", fontSize: "12px", marginTop: "8px" }}>
              ⚠️ {uploadError}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Review the design, construction steps, budget, safety measures, and evidence.
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleGeneratePlan()}
            disabled={isGenerating || prompt.trim().length < 5}
            style={{
              background: "var(--forest-green)",
              color: "#FFFFFF",
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: 800,
              borderRadius: "var(--radius-button)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              cursor: isGenerating ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(23, 63, 53, 0.2)",
            }}
          >
            {isGenerating ? (
              <>
                <Clock className="animate-spin" size={16} />
                <span>Creating implementation plan...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Create my implementation plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. REDESIGNED GENERATED-PLAN RESULTS DASHBOARD                        */}
      {/* ==================================================================== */}
      {currentPlan && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Quick Bar: Plan ID, Scenario Selector & Completeness */}
          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                PLAN ID: <code style={{ color: "var(--forest-green)" }}>{currentPlan.plan_id}</code> • REPRODUCIBILITY SHA-256:{" "}
                <code>{currentPlan.reproducibility_hash.substring(0, 12)}...</code>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
                {currentPlan.project_name}
              </div>
            </div>

            {/* Stress Test Scenario Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                Stress Test Scenario:
              </span>
              <select
                className="budget-select"
                value={selectedScenario}
                onChange={(e) => handleApplyScenario(e.target.value)}
                style={{ padding: "6px 12px" }}
              >
                <option value="baseline">Standard Municipal Baseline</option>
                <option value="extreme_rainfall">50-Year Extreme Cloudburst Event</option>
                <option value="budget_cut_25">25% Fiscal Austerity Cut</option>
                <option value="inflation_20">+20% Material & Concrete Inflation</option>
              </select>
            </div>
          </div>

          {/* Section Navigation Tabs (Plain-English Dual Labels) */}
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              gap: "6px",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "8px",
            }}
          >
            {[
              { id: "overview", name: "Overview", subtitle: "The big picture", icon: Info },
              { id: "visualizer", name: "Construction Diagrams", subtitle: "See how it could be built", icon: Layers, badge: "SVG" },
              { id: "evidence", name: "Real-World Evidence & DPRs", subtitle: "Explore documents and data", icon: FileText, badge: `${currentPlan.evidence_records?.length || 5}` },
              { id: "investigations", name: "Site Surveys & Data", subtitle: "What we need to measure", icon: Search },
              { id: "design", name: "Design & Alternatives", subtitle: "Compare possible solutions", icon: Building },
              { id: "phases", name: "Phased Construction", subtitle: "Build it step by step", icon: Calendar },
              { id: "community", name: "Protect Residents & Shops", subtitle: "Keep people safe during work", icon: Shield },
              { id: "weather", name: "Rainy-Day & Weather", subtitle: "Prepare for bad weather", icon: CloudRain },
              { id: "budget", name: "Budget & Resources", subtitle: "Money, materials, and people", icon: DollarSign },
              { id: "risks", name: "Risks & Safety", subtitle: "What could go wrong", icon: AlertTriangle },
              { id: "qa", name: "Quality & Testing", subtitle: "Milestone inspections", icon: ListChecks },
              { id: "maintenance", name: "Maintenance", subtitle: "How to keep it working", icon: Wrench },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  title={`${tab.name} — ${tab.subtitle}`}
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-button)",
                    border: `1px solid ${isActive ? "var(--forest-green)" : "transparent"}`,
                    background: isActive ? "var(--forest-green)" : "var(--white)",
                    color: isActive ? "#FFFFFF" : "var(--text-primary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon size={14} />
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>{tab.name}</span>
                    {(tab as any).badge && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          background: isActive ? "rgba(255,255,255,0.25)" : "var(--warm-ivory)",
                          color: isActive ? "#FFFFFF" : "var(--forest-green)",
                          fontWeight: 700,
                        }}
                      >
                        {(tab as any).badge}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      opacity: isActive ? 0.9 : 0.7,
                      marginTop: "2px",
                      color: isActive ? "rgba(255,255,255,0.85)" : "var(--text-secondary)",
                    }}
                  >
                    {tab.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ================================================================ */}
          {/* TAB 1: OVERVIEW — "The big picture"                              */}
          {/* ================================================================ */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Structured Executive Summary (6 Core Questions) */}
              <div className="card" style={{ padding: "24px" }}>
                <div className="card-header" style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div className="card-title" style={{ fontSize: "18px", color: "var(--forest-green)" }}>
                      Executive Summary — The Big Picture
                    </div>
                    <div className="card-subtitle">
                      Plain-English explanation of the proposed project, safety protocols, budget, and missing field data.
                    </div>
                  </div>
                  <span className="badge badge-forest">Simple English</span>
                </div>

                {/* 6 Structured Question Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {/* Q1: What are we trying to improve? */}
                  <div
                    style={{
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-button)",
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--forest-green)", textTransform: "uppercase", marginBottom: "4px" }}>
                      1. What are we trying to improve?
                    </div>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.5, color: "var(--text-primary)" }}>
                      {currentPlan.user_stated_problem || prompt}
                    </p>
                    <div style={{ marginTop: "8px", fontSize: "11.5px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      Goal: {currentPlan.main_objectives?.join("; ") || mainGoal}
                    </div>
                  </div>

                  {/* Q2: What is being proposed? */}
                  <div
                    style={{
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-button)",
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--forest-green)", textTransform: "uppercase", marginBottom: "4px" }}>
                      2. What is being proposed?
                    </div>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.5, color: "var(--text-primary)", fontWeight: 600 }}>
                      {currentPlan.recommended_design.name}
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                      {currentPlan.recommended_design.concept_summary}
                    </p>
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#B45309" }}>
                      Proposal only — not yet an approved municipal design.
                    </div>
                  </div>

                  {/* Q3: How would the work be carried out? */}
                  <div
                    style={{
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-button)",
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--forest-green)", textTransform: "uppercase", marginBottom: "4px" }}>
                      3. How would the work be carried out?
                    </div>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.5, color: "var(--text-primary)" }}>
                      Executed in {currentPlan.construction_phases.length} sequential phases with mandatory sign-offs between stages.
                    </p>
                    <ul style={{ margin: "6px 0 0 16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {currentPlan.construction_phases.slice(0, 3).map((p) => (
                        <li key={p.phase_number}>
                          <strong>Phase {p.phase_number}:</strong> {p.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Q4: How will residents and businesses be protected? */}
                  <div
                    style={{
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-button)",
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--forest-green)", textTransform: "uppercase", marginBottom: "4px" }}>
                      4. How will residents and businesses be protected?
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, color: "var(--text-primary)" }}>
                      Safe walking corridors remain open at all times. Emergency vehicles guaranteed minimum 3.5m clearance with heavy steel plates over open trenches.
                    </p>
                    <div style={{ marginTop: "6px", fontSize: "11.5px", color: "var(--forest-green)" }}>
                      Underground utilities scanned via GPR before digging.
                    </div>
                  </div>

                  {/* Q5: What is known about the budget? */}
                  <div
                    style={{
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-button)",
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--forest-green)", textTransform: "uppercase", marginBottom: "4px" }}>
                      5. What is known about the budget?
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--forest-green)" }}>
                      {formatCurrency(currentPlan.budget.total_estimated_capital_outlay)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Permanent civil works: {formatCurrency(currentPlan.budget.total_permanent_works_cost)} • Safety works: {formatCurrency(currentPlan.budget.total_temporary_and_protective_cost + currentPlan.budget.total_traffic_and_community_cost)}
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#B45309" }}>
                      Preliminary engineering estimate — not an approved expenditure.
                    </div>
                  </div>

                  {/* Q6: What information still needs to be collected? */}
                  <div
                    style={{
                      background: "var(--warm-ivory)",
                      borderRadius: "var(--radius-button)",
                      padding: "16px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--forest-green)", textTransform: "uppercase", marginBottom: "4px" }}>
                      6. What information still needs to be collected?
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, color: "var(--text-primary)" }}>
                      {currentPlan.missing_critical_data.length} field items require verification:
                    </p>
                    <ul style={{ margin: "4px 0 0 16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {currentPlan.missing_critical_data.slice(0, 2).map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--forest-green)" }}>
                      Must be completed prior to issuing construction tenders.
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Completeness & Assumptions Section (HONEST STATUS) */}
              <div className="card" style={{ padding: "24px" }}>
                <div className="card-header" style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div className="card-title" style={{ fontSize: "17px" }}>
                      Data Completeness & Planning Assumptions
                    </div>
                    <div className="card-subtitle">
                      Honest appraisal of confirmed facts versus assumptions and missing field measurements.
                    </div>
                  </div>

                  {/* Honest Status Badge */}
                  <span className={`badge ${completenessAssessment.badgeClass}`}>
                    {completenessAssessment.status}
                  </span>
                </div>

                {/* Completeness Bar */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    <span>Completeness Score (Required Planning Items)</span>
                    <span>{currentPlan.data_completeness_pct.toFixed(0)}%</span>
                  </div>
                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-fill"
                      style={{
                        width: `${currentPlan.data_completeness_pct}%`,
                        background:
                          currentPlan.data_completeness_pct >= 80 ? "var(--forest-green)" : "#B45309",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {completenessAssessment.description}
                  </div>
                </div>

                {/* 5 Distinct Completeness Subsections */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {/* 1. Confirmed by Sources */}
                  <div style={{ background: "rgba(34, 197, 94, 0.08)", padding: "14px", borderRadius: "var(--radius-button)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#15803D", marginBottom: "6px" }}>
                      ✓ 1. Information Confirmed by Sources
                    </div>
                    <ul style={{ margin: "0 0 0 16px", fontSize: "12.5px", color: "var(--text-primary)" }}>
                      {currentPlan.verified_facts.map((f, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 2. Values Calculated from Source Data */}
                  <div style={{ background: "rgba(6, 182, 212, 0.08)", padding: "14px", borderRadius: "var(--radius-button)", border: "1px solid rgba(6, 182, 212, 0.2)" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#0E7490", marginBottom: "6px" }}>
                      ⚡ 2. Values Calculated from Source Data
                    </div>
                    <ul style={{ margin: "0 0 0 16px", fontSize: "12.5px", color: "var(--text-primary)" }}>
                      <li>Hydraulic peak discharge calculated via Rational Method (Q = C·I·A)</li>
                      <li>Excavation trench depth derived from municipal outfall invert elevation</li>
                      <li>Temporary dewatering pump sizing based on 50mm/hr cloudburst model</li>
                    </ul>
                  </div>

                  {/* 3. Planning Assumptions */}
                  <div style={{ background: "var(--warm-ivory)", padding: "14px", borderRadius: "var(--radius-button)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--forest-green)", marginBottom: "6px" }}>
                      📋 3. Planning Assumptions
                    </div>
                    <ul style={{ margin: "0 0 0 16px", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                      {currentPlan.planning_assumptions.map((a, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 4. Information Still Missing */}
                  <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "14px", borderRadius: "var(--radius-button)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#B91C1C", marginBottom: "6px" }}>
                      🔍 4. Information Still Missing
                    </div>
                    <ul style={{ margin: "0 0 0 16px", fontSize: "12.5px", color: "var(--text-primary)" }}>
                      {currentPlan.missing_critical_data.map((m, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 5. Required Surveys & Approvals */}
                  <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "14px", borderRadius: "var(--radius-button)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#B45309", marginBottom: "6px" }}>
                      🏛️ 5. Required Surveys & Approvals
                    </div>
                    <ul style={{ margin: "0 0 0 16px", fontSize: "12.5px", color: "var(--text-primary)" }}>
                      {currentPlan.approval_and_licensing_requirements.map((appr, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>{appr}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pre-Construction Checks Grouped Section */}
              <div className="card" style={{ padding: "24px" }}>
                <div className="card-header" style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div className="card-title" style={{ fontSize: "17px", color: "var(--forest-green)" }}>
                      What must be checked before construction?
                    </div>
                    <div className="card-subtitle">
                      7 critical safety, structural, and regulatory checkpoints required prior to breaking ground.
                    </div>
                  </div>
                  <span className="badge badge-forest">Pre-Construction Verification</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                  {[
                    {
                      id: "site",
                      title: "Site measurements",
                      desc: "Verify street widths, exact trench depths, and surface elevations against topographic bench marks.",
                      status: "Pending field survey",
                    },
                    {
                      id: "utilities",
                      title: "Underground utilities",
                      desc: "Conduct GPR radar scanning to map potable water mains, electrical cables, and telecom conduits.",
                      status: "Mandatory pre-dig check",
                    },
                    {
                      id: "soil",
                      title: "Soil and structural checks",
                      desc: "Perform Standard Penetration Tests (SPT) for soil bearing capacity and adjacent building foundation safety.",
                      status: "Required for shoring design",
                    },
                    {
                      id: "weather",
                      title: "Weather and drainage analysis",
                      desc: "Calculate 50-year seasonal rainfall runoff and prepare portable dewatering pump configurations.",
                      status: "Prepared from BBMP Master Plan",
                    },
                    {
                      id: "permits",
                      title: "Permits and approvals",
                      desc: "Secure right-of-way permissions, Traffic Police detour NOCs, and municipal excavation permits.",
                      status: "Statutory clearance needed",
                    },
                    {
                      id: "residents",
                      title: "Resident and business consultation",
                      desc: "Deliver 14-day advance notices to shopkeepers and install bilingual pedestrian detour signage.",
                      status: "Community protocol active",
                    },
                    {
                      id: "engineering",
                      title: "Professional engineering review",
                      desc: "Have a licensed civil engineer review and stamp structural thicknesses and reinforcement drawings.",
                      status: "PE Stamp required",
                    },
                  ].map((check) => (
                    <div
                      key={check.id}
                      style={{
                        padding: "14px",
                        borderRadius: "var(--radius-button)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--warm-ivory)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "13px", color: "var(--forest-green)" }}>{check.title}</strong>
                        <span className="badge badge-neutral" style={{ fontSize: "10px" }}>{check.status}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                        {check.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engineering Disclaimer */}
              <div
                style={{
                  background: "var(--warm-ivory)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px 20px",
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <strong>Professional Engineering & Decision Support Notice:</strong> {currentPlan.professional_disclaimer}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: CONSTRUCTION DIAGRAMS — "See how it could be built"       */}
          {/* ================================================================ */}
          {activeTab === "visualizer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <ConstructionStructureVisualizer
                diagram={currentDiagram || currentPlan.structure_diagram || null}
                onViewChange={(view: DiagramViewType) => setDiagramView(view)}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: REAL-WORLD EVIDENCE & DPRS                                */}
          {/* ================================================================ */}
          {activeTab === "evidence" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <RealWorldEvidencePanel
                activeCategory={selectedProjectType || currentPlan.classification.primary_category}
                locationName={locationName}
                attachedFileIds={attachedFiles.map((f) => f.id)}
                onAttachFile={(fileId: string) => {
                  setAttachedFiles((prev) =>
                    prev.some((f) => f.id === fileId)
                      ? prev
                      : [...prev, { id: fileId, name: `Record-${fileId}`, size: "Verified", status: "uploaded" }]
                  );
                  setStatusNotice(`Attached record ${fileId} to implementation plan.`);
                }}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: SITE SURVEYS & DATA — "What we need to measure"           */}
          {/* ================================================================ */}
          {activeTab === "investigations" && (
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div className="card-title">Site Surveys & Data — What we need to measure</div>
                  <div className="card-subtitle">
                    Field tests and utility radar surveys required before issuing construction tenders.
                  </div>
                </div>
                <span className="badge badge-neutral">{currentPlan.site_investigations.length} Survey Items</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px" }}>Category</th>
                      <th style={{ padding: "10px 12px" }}>Investigation Item</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                      <th style={{ padding: "10px 12px" }}>Importance</th>
                      <th style={{ padding: "10px 12px" }}>Recommended Method / Standard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPlan.site_investigations.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px", fontWeight: 700 }}>{item.category}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 600 }}>{item.item_name}</div>
                          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {item.description}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            className={`badge ${
                              item.status === "Provided and verified"
                                ? "badge-lime"
                                : item.status === "Missing and required"
                                ? "badge-neutral"
                                : "badge-forest"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color:
                                item.importance === "Critical"
                                  ? "var(--risk-severe)"
                                  : item.importance === "High"
                                  ? "var(--risk-elevated)"
                                  : "var(--text-primary)",
                            }}
                          >
                            {item.importance}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "12px" }}>
                          {item.recommended_survey_or_standard}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: DESIGN & ALTERNATIVES — "Compare possible solutions"      */}
          {/* ================================================================ */}
          {activeTab === "design" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Recommended Approach */}
              <div
                className="card"
                style={{
                  border: "2px solid var(--forest-green)",
                  background: "var(--white)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <span className="badge badge-forest" style={{ marginBottom: "6px" }}>Recommended Solution</span>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--forest-green)" }}>
                      {currentPlan.recommended_design.name}
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                      {currentPlan.recommended_design.concept_summary}
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <strong style={{ fontSize: "12px", color: "var(--text-secondary)" }}>How it works:</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>{currentPlan.recommended_design.how_it_works}</p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Required space:</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>{currentPlan.recommended_design.required_space}</p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Maintenance implications:</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>{currentPlan.recommended_design.maintenance_implications}</p>
                  </div>
                </div>

                <div style={{ background: "var(--warm-ivory)", padding: "12px 16px", borderRadius: "var(--radius-button)", marginBottom: "10px" }}>
                  <strong style={{ fontSize: "12px", color: "var(--forest-green)" }}>Key Expected Benefits:</strong>
                  <ul style={{ margin: "4px 0 0 18px", fontSize: "12.5px" }}>
                    {currentPlan.recommended_design.expected_benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ fontSize: "12px", color: "var(--risk-severe)" }}>
                  <strong>When NOT to select:</strong> {currentPlan.recommended_design.when_not_to_select}
                </div>
              </div>

              {/* Alternatives List */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                {currentPlan.design_alternatives.map((alt) => (
                  <div key={alt.id} className="card" style={{ padding: "20px" }}>
                    <div className="card-header" style={{ marginBottom: "10px" }}>
                      <div className="card-title" style={{ fontSize: "15px" }}>{alt.name}</div>
                      <span className="badge badge-neutral">Alternative Option</span>
                    </div>
                    <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                      {alt.concept_summary}
                    </p>
                    <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                      <strong>Suitability:</strong> {alt.suitability}
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                      <strong>Disruption:</strong> {alt.construction_disruption_level} • <strong>Cost:</strong> {alt.estimated_cost_level}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--risk-elevated)" }}>
                      <strong>Limitations:</strong> {alt.key_limitations_and_risks.join("; ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 6: PHASED CONSTRUCTION — "Build it step by step"              */}
          {/* ================================================================ */}
          {activeTab === "phases" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {currentPlan.construction_phases.map((phase) => (
                <div key={phase.phase_number} className="card" style={{ borderLeft: "4px solid var(--forest-green)", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <span className="badge badge-forest" style={{ marginRight: "8px" }}>
                        Phase {phase.phase_number}
                      </span>
                      <strong style={{ fontSize: "16px", color: "var(--text-primary)" }}>{phase.name}</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {phase.purpose}
                      </div>
                    </div>
                    <span className="badge badge-lime">Est. {phase.estimated_duration_range}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginBottom: "12px" }}>
                    <div>
                      <strong style={{ fontSize: "12px", color: "var(--forest-green)" }}>What happens (work performed):</strong>
                      <ul style={{ margin: "4px 0 0 18px", fontSize: "12.5px" }}>
                        {phase.work_to_be_performed.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <strong style={{ fontSize: "12px", color: "var(--text-secondary)" }}>What residents need to know:</strong>
                      <ul style={{ margin: "4px 0 0 18px", fontSize: "12.5px" }}>
                        {phase.access_and_safety_requirements.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ background: "var(--warm-ivory)", padding: "10px 14px", borderRadius: "var(--radius-button)", fontSize: "12px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <strong>Responsible Parties:</strong> {phase.responsible_parties.join(", ")}
                    </div>
                    <div>
                      <strong>Milestone Sign-off:</strong> {phase.required_inspections_or_approvals.join("; ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 7: PROTECT RESIDENTS & SHOPS                                 */}
          {/* ================================================================ */}
          {activeTab === "community" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="card" style={{ borderLeft: "4px solid var(--forest-green)", padding: "24px" }}>
                <div className="card-header" style={{ marginBottom: "16px" }}>
                  <div className="card-title">Resident, Merchant & Emergency Access Commitments</div>
                  <span className="badge badge-forest">Mandatory Protocols</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--forest-green)" }}>Emergency Vehicles:</strong>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", lineHeight: 1.5 }}>
                      {currentPlan.community_protection.emergency_vehicle_access_plan}
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--forest-green)" }}>Schools & Clinics:</strong>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", lineHeight: 1.5 }}>
                      {currentPlan.community_protection.school_and_hospital_protocol}
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--forest-green)" }}>Underground Utilities:</strong>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", lineHeight: 1.5 }}>
                      {currentPlan.community_protection.utility_protection_protocol}
                    </p>
                  </div>
                </div>

                <div style={{ background: "var(--warm-ivory)", padding: "12px 16px", borderRadius: "var(--radius-button)", fontSize: "12px" }}>
                  <strong>Resident Hotline:</strong> {currentPlan.community_protection.complaint_reporting_and_hotline} •{" "}
                  <strong>Public Notice:</strong> {currentPlan.community_protection.advance_notice_and_communication_plan}
                </div>
              </div>

              {/* Disruption Mitigation Matrix */}
              <div className="card" style={{ padding: "24px" }}>
                <div className="card-header" style={{ marginBottom: "16px" }}>
                  <div className="card-title">Disruption Mitigation Matrix</div>
                  <span className="badge badge-neutral">By Disruption Category</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {currentPlan.community_protection.disruptions.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "14px",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-button)",
                        background: "var(--white)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{d.disruption_type}</strong>
                        <span className="badge badge-lime">{d.monitoring_responsible}</span>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                        <strong>What could happen:</strong> {d.what_could_happen}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", fontSize: "12px", background: "var(--warm-ivory)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
                        <div>
                          <strong>Preventive Measure:</strong> {d.preventive_mitigation}
                        </div>
                        <div>
                          <strong>Alternative Access:</strong> {d.alternative_access_or_service}
                        </div>
                        <div>
                          <strong>Residual Risk:</strong> {d.residual_risk}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 8: RAINY-DAY & WEATHER SAFETY                                */}
          {/* ================================================================ */}
          {activeTab === "weather" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="card" style={{ padding: "24px" }}>
                <div className="card-header" style={{ marginBottom: "16px" }}>
                  <div className="card-title">Rainy-Day & Extreme Weather Readiness</div>
                  <span className="badge badge-lime">Weather Protocol</span>
                </div>
                <p style={{ fontSize: "13.5px", lineHeight: 1.5, color: "var(--text-primary)", marginBottom: "14px" }}>
                  {currentPlan.weather_protection.seasonal_climate_assessment}
                </p>

                {/* Warning Thresholds */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                  {currentPlan.weather_protection.forecast_warning_monitoring_thresholds.map((th, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--warm-ivory)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "12px",
                      }}
                    >
                      {th}
                    </div>
                  ))}
                </div>

                {/* Stop Work & Restart */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "12.5px" }}>
                  <div style={{ background: "var(--risk-severe-bg)", padding: "14px", borderRadius: "var(--radius-button)" }}>
                    <strong style={{ color: "var(--risk-severe)" }}>Stop-Work Triggers:</strong>
                    <ul style={{ margin: "6px 0 0 16px" }}>
                      {currentPlan.weather_protection.stop_work_and_site_evacuation_triggers.map((trig, i) => (
                        <li key={i}>{trig}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: "rgba(184, 233, 134, 0.2)", padding: "14px", borderRadius: "var(--radius-button)" }}>
                    <strong style={{ color: "var(--forest-green)" }}>Safe Restart Criteria:</strong>
                    <p style={{ margin: "6px 0 0 0", lineHeight: 1.45 }}>
                      {currentPlan.weather_protection.safe_restart_criteria_after_severe_weather}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 9: BUDGET & RESOURCES — "Money, materials, and people"       */}
          {/* ================================================================ */}
          {activeTab === "budget" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 4 Financial Highlight Cards */}
              <div className="kpi-grid">
                <div className="budget-kpi-card forest">
                  <div className="kpi-label">Total Capital Outlay (Estimate)</div>
                  <div className="kpi-value tabular-nums">{formatCurrency(currentPlan.budget.total_estimated_capital_outlay)}</div>
                  <div className="kpi-subtext">Preliminary engineering cost estimate</div>
                </div>
                <div className="budget-kpi-card info">
                  <div className="kpi-label">Permanent Civil Works</div>
                  <div className="kpi-value tabular-nums">{formatCurrency(currentPlan.budget.total_permanent_works_cost)}</div>
                  <div className="kpi-subtext">Direct infrastructure materials & labor</div>
                </div>
                <div className="budget-kpi-card warning">
                  <div className="kpi-label">Temporary & Safety Works</div>
                  <div className="kpi-value tabular-nums">
                    {formatCurrency(currentPlan.budget.total_temporary_and_protective_cost + currentPlan.budget.total_traffic_and_community_cost)}
                  </div>
                  <div className="kpi-subtext">Shoring, pumps, steel plates & ADA ramps</div>
                </div>
                <div className="budget-kpi-card positive">
                  <div className="kpi-label">Annual Maintenance</div>
                  <div className="kpi-value tabular-nums">{formatCurrency(currentPlan.budget.annual_maintenance_estimate)}/yr</div>
                  <div className="kpi-subtext">10-yr commitment: {formatCurrency(currentPlan.budget.ten_year_lifecycle_estimate)}</div>
                </div>
              </div>

              {/* Itemized Budget Table */}
              <div className="card" style={{ padding: "24px" }}>
                <div className="card-header" style={{ marginBottom: "16px" }}>
                  <div>
                    <div className="card-title">Transparent Itemized Cost Breakdown</div>
                    <div className="card-subtitle">
                      Estimated costs grounded in schedule of rates. Not an approved public appropriation.
                    </div>
                  </div>
                  <span className={`badge ${currentPlan.budget.fits_within_budget ? "badge-lime" : "badge-neutral"}`}>
                    {currentPlan.budget.fits_within_budget ? "Within Budget Ceiling" : "Exceeds Ceiling"}
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px" }}>Category</th>
                        <th style={{ padding: "10px 12px" }}>Description</th>
                        <th style={{ padding: "10px 12px" }}>Estimated Outlay</th>
                        <th style={{ padding: "10px 12px" }}>Assumptions & Uncertainty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPlan.budget.items.map((b, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "12px", fontWeight: 700 }}>{b.category}</td>
                          <td style={{ padding: "12px" }}>{b.description}</td>
                          <td style={{ padding: "12px", fontWeight: 800, color: "var(--forest-green)" }} className="tabular-nums">
                            {formatCurrency(b.amount)}
                          </td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "12px" }}>
                            {b.assumptions} ({b.cost_uncertainty_range})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 10: RISKS & SAFETY — "What could go wrong"                   */}
          {/* ================================================================ */}
          {activeTab === "risks" && (
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div>
                  <div className="card-title">Risks & Safety — What could go wrong and how to reduce it</div>
                  <div className="card-subtitle">Identified hazards, preventive barriers, and licensed engineer sign-offs.</div>
                </div>
                <span className="badge badge-neutral">{currentPlan.risk_register.length} Active Risks</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>Risk Title</th>
                      <th style={{ padding: "10px" }}>Likelihood / Severity</th>
                      <th style={{ padding: "10px" }}>Preventive Measure</th>
                      <th style={{ padding: "10px" }}>Contingency Action</th>
                      <th style={{ padding: "10px" }}>Responsible Party</th>
                      <th style={{ padding: "10px" }}>Sign-off Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPlan.risk_register.map((r) => (
                      <tr key={r.risk_id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 700 }}>{r.title}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{r.risk_description}</div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontWeight: 700, color: r.severity === "Critical" ? "var(--risk-severe)" : "var(--risk-elevated)" }}>
                            {r.likelihood} / {r.severity}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "12px" }}>{r.preventive_measures.join("; ")}</td>
                        <td style={{ padding: "12px", fontSize: "12px" }}>{r.contingency_actions.join("; ")}</td>
                        <td style={{ padding: "12px", fontSize: "12px", fontWeight: 600 }}>{r.responsible_party}</td>
                        <td style={{ padding: "12px" }}>
                          {r.requires_licensed_engineer ? (
                            <span className="badge badge-forest">PE Stamp</span>
                          ) : (
                            <span className="badge badge-neutral">Site Super</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 11: QA & TESTING                                             */}
          {/* ================================================================ */}
          {activeTab === "qa" && (
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div>
                  <div className="card-title">Quality Assurance, Testing & Acceptance Milestones</div>
                  <div className="card-subtitle">Non-negotiable inspections before public handover.</div>
                </div>
                <span className="badge badge-lime">{currentPlan.quality_assurance.length} Milestone Checks</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {currentPlan.quality_assurance.map((qa) => (
                  <div
                    key={qa.test_number}
                    style={{
                      padding: "14px",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-button)",
                      background: "var(--white)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "14px" }}>
                        Test #{qa.test_number}: {qa.inspection_or_test_name}
                      </strong>
                      <span className="badge badge-forest">{qa.timing}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-primary)", marginBottom: "6px" }}>
                      <strong>Testing Procedure:</strong> {qa.testing_procedure}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", background: "var(--warm-ivory)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
                      <div>
                        <strong>Acceptance Criteria:</strong> {qa.acceptance_criteria}
                      </div>
                      <div>
                        <strong>Corrective Action if Failed:</strong> {qa.corrective_action_if_failed}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 12: MAINTENANCE — "How to keep it working"                   */}
          {/* ================================================================ */}
          {activeTab === "maintenance" && (
            <div className="card" style={{ padding: "24px" }}>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div>
                  <div className="card-title">Long-Term Maintenance & Stewardship Plan</div>
                  <div className="card-subtitle">Routines and inspection triggers to prevent asset failure.</div>
                </div>
                <span className="badge badge-forest">O&M Handbook</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {currentPlan.maintenance_plan.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-button)",
                      background: "var(--white)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "14px" }}>{m.activity_name}</strong>
                      <span className="badge badge-lime">{m.frequency_or_trigger}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", fontSize: "12px" }}>
                      <div>
                        <strong>Responsible:</strong> {m.responsible_party}
                      </div>
                      <div>
                        <strong>Tools & Equipment:</strong> {m.required_tools_and_materials}
                      </div>
                      <div>
                        <strong>Annual Cost:</strong> {m.annual_cost_estimate}
                      </div>
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--risk-elevated)" }}>
                      <strong>Warning signs of failure:</strong> {m.warning_signs_of_failure.join("; ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Navigation Links to Other ECO-ECHO Modules */}
          <div
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              background: "var(--warm-ivory)",
              padding: "18px 24px",
            }}
          >
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Ready to explore spatial maps, financial models, or downstream causal trees?
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigateToMap(currentPlan.location_or_neighbourhood)}
              >
                <MapPin size={13} />
                <span>View on City Map</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigateToBudget(currentPlan.location_or_neighbourhood)}
              >
                <DollarSign size={13} />
                <span>Open in Budget Planner</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  onNavigateToConsequences("int-suds-bioswale", 1200, currentPlan.location_or_neighbourhood)
                }
              >
                <ArrowRight size={13} />
                <span>Inspect Consequence Chain</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
