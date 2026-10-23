import datetime
import hashlib
from typing import List, Dict, Any, Optional

from ..models.diagram_models import (
    DiagramViewType,
    DiagramComponent,
    DiagramDimensionLine,
    ConstructionStageVisual,
    StructureDiagram,
)
from ..models.evidence import ProvenanceType
from .evidence_source_service import evidence_source_service


class DiagramService:
    """
    Civil-Engineering Structural & Staged Construction Visualizer Engine.
    Generates deterministic, responsive, technically accurate SVG structure diagrams
    and staged construction sequences for all urban infrastructure project types.
    """

    def get_diagram(
        self,
        project_type: str,
        view_type: DiagramViewType = DiagramViewType.CROSS_SECTION,
        location_name: str = "Bengaluru Urban Corridor",
        custom_params: Optional[Dict[str, Any]] = None,
    ) -> StructureDiagram:
        norm_type = self._normalize_type(project_type)
        gen_fn = getattr(self, f"_build_{norm_type}", self._build_custom_infrastructure)
        return gen_fn(view_type=view_type, location_name=location_name, custom_params=custom_params or {})

    def _normalize_type(self, ptype: str) -> str:
        ptype = (ptype or "").lower().replace("-", "_").replace(" ", "_")
        if any(w in ptype for w in ["stormwater", "drain", "drainage", "culvert", "flood", "rajakaluve"]):
            return "stormwater_drainage"
        if any(w in ptype for w in ["road", "street", "footpath", "sidewalk", "pedestrian", "cycle", "tender_sure"]):
            return "roads_and_footpaths"
        if any(w in ptype for w in ["green_roof", "living_roof", "rooftop"]):
            return "green_roofs"
        if any(w in ptype for w in ["water_supply", "pipe", "pipeline", "potable", "cauvery"]):
            return "water_supply_pipeline"
        if any(w in ptype for w in ["rainwater", "harvesting", "cistern", "recharge_well", "rwh"]):
            return "rainwater_harvesting"
        if any(w in ptype for w in ["forest", "tree", "trees", "park", "canopy", "miyawaki", "lake"]):
            return "urban_forest_and_park"
        if any(w in ptype for w in ["sewer", "sewerage", "wastewater", "sanitation", "stp"]):
            return "sewerage_and_wastewater"
        if any(w in ptype for w in ["waste", "compost", "garbage", "solid_waste", "recycling"]):
            return "solid_waste_facility"
        if any(w in ptype for w in ["solar", "renewable", "energy", "photovoltaic"]):
            return "renewable_energy_solar"
        if any(w in ptype for w in ["transit", "bus", "transport", "bus_stop", "metro"]):
            return "public_transport_hub"
        return "custom_infrastructure"

    # =========================================================================
    # 1. STORMWATER DRAINAGE & RAJAKALUVE
    # =========================================================================
    def _build_stormwater_drainage(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        ev_kor = evidence_source_service.get_record("EVID-SWD-KOR-001")

        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Survey, Topography & Ground Penetrating Radar (GPR)",
                duration_estimate="Weeks 1 - 3",
                description="Total-station topographic survey, LiDAR hydraulic alignment verification, and GPR scanning to locate active drinking water mains and underground power cables.",
                key_actions=[
                    "Establish benchmark TBM points tied to Survey of India datum",
                    "Conduct GPR scanning at 5m grid intervals across proposed drain corridor",
                    "Perform trial potholing by hand digging within 1.5m of suspected utilities",
                ],
                safety_measures=["Fluorescent high-visibility barriers", "Trench collapse gas monitors", "Safe pedestrian ramps"],
                active_component_ids=["soil_subgrade", "safe_buffer_zone"],
                inspection_checkpoint="BBMP Public Works & BESCOM joint clearance sign-off",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Monsoon Diversion Berms & Staged Trench Excavation",
                duration_estimate="Weeks 4 - 8",
                description="Excavation of trench prism in 30-meter isolated compartments using sheet pile shoring and sump dewatering pumps to manage dry-weather sewage flows.",
                key_actions=[
                    "Install temporary diversion pipes (min 600mm dia) to bypass upstream baseflow",
                    "Trench excavation with 1:0.5 safe side slope in cohesive soil",
                    "Drive steel trench box shoring plates along vulnerable building frontages",
                ],
                safety_measures=["Mandatory 3.5m fire lane clearance with structural road plates", "Continuous dewatering sump monitoring"],
                active_component_ids=["soil_subgrade", "trench_shoring", "safe_buffer_zone"],
                inspection_checkpoint="Geotechnical engineer approval of subgrade bearing capacity (min 150 kN/m²)",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Subgrade Compaction & PCC Bedding Pour",
                duration_estimate="Weeks 9 - 12",
                description="Laying 150mm thick non-woven geotextile separation fabric followed by 200mm graded crushed stone base and 100mm PCC M15 levelling screed.",
                key_actions=[
                    "Compact natural subgrade to 98% Proctor density using vibrating plate compactor",
                    "Place geotextile class 1 filter fabric across channel invert",
                    "Pour M15 grade Plain Cement Concrete (PCC) bedding slab with 1 in 800 longitudinal fall",
                ],
                safety_measures=["Perimeter silt fences to stop cement wash off into storm culverts"],
                active_component_ids=["soil_subgrade", "geotextile_layer", "pcc_bedding"],
                inspection_checkpoint="Concrete cube compressive strength testing at 7 and 28 days",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Reinforced Concrete Box / Retaining Wall Construction",
                duration_estimate="Weeks 13 - 18",
                description="Erection of steel shuttering, placing Fe500D rebar cage, and pouring monolithic RCC M25 walls with 100mm dia PVC weep holes at 1.5m centers.",
                key_actions=[
                    "Tie structural rebar cage (T12 @ 150mm c/c horizontal, T16 @ 150mm c/c vertical)",
                    "Install 100mm PVC weep holes wrapped in geotextile filter socks",
                    "Pour RCC M25 concrete with integral crystalline waterproofing admixture",
                ],
                safety_measures=["Edge protection handrails on all deep open drain edges"],
                active_component_ids=["rcc_drain_bed", "rcc_walls", "weep_holes"],
                inspection_checkpoint="Water tightness inspection and structural rebar clearance certificate",
            ),
            ConstructionStageVisual(
                stage_number=5,
                stage_name="Silt Trap Chamber, Inlets & Grated Safety Covers",
                duration_estimate="Weeks 19 - 22",
                description="Installation of sediment catch forebays, roadside curb opening inlets, and heavy-duty ductile iron / RCC safety covers to restore pedestrian passage.",
                key_actions=[
                    "Construct drop sediment basin with 300mm sump below culvert invert",
                    "Fit cast iron curb inlets with debris screening trash racks",
                    "Install removable precast RCC covers / galvanised steel grating rated for Class AA loading",
                ],
                safety_measures=["Zero exposed open trenches; continuous flush surface for pedestrian ramps"],
                active_component_ids=["silt_trap_sump", "drain_cover", "flow_channel"],
                inspection_checkpoint="Full hydraulic discharge velocity test and municipal safety sign-off",
            ),
        ]

        if view_type == DiagramViewType.PLAN_VIEW:
            components = [
                DiagramComponent(
                    id="plan_drain_alignment",
                    name="Rajakaluve Primary Alignment Channel",
                    category="hydraulics",
                    description="12.0m wide primary stormwater corridor conveying peak runoff towards lake basin.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Alignment follows BBMP SWD Master Plan Koramangala Valley Cadastral Map"],
                    risks=["Encroachments reducing effective hydraulic width during cloudbursts"],
                    construction_stage="Stage 1 & 4",
                    is_verified=True,
                    dimensions_label="Width: 12.0m [Verified: BBMP SWD DPR]",
                    svg_element="rect",
                    svg_props={"x": 80, "y": 140, "width": 760, "height": 180, "fill": "#A2D2FF", "stroke": "#1E3A8A", "strokeWidth": 3, "opacity": 0.85},
                ),
                DiagramComponent(
                    id="plan_flow_arrows",
                    name="Hydraulic Gravity Flow Direction",
                    category="hydraulics",
                    description="Peak gravity flow (182.4 cumec capacity) designed for 1-in-25 year storm intensity.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Gradient maintained at 1 in 800 slope"],
                    risks=["Silt deposition if flow velocity falls below 0.75 m/s self-cleansing threshold"],
                    construction_stage="Stage 5",
                    is_verified=True,
                    dimensions_label="182.4 m³/s peak [Verified]",
                    svg_element="path",
                    svg_props={"d": "M 120 230 L 780 230 M 740 210 L 780 230 L 740 250 M 420 210 L 460 230 L 420 250", "fill": "none", "stroke": "#0284C7", "strokeWidth": 6, "strokeLinecap": "round"},
                ),
                DiagramComponent(
                    id="plan_sediment_traps",
                    name="Sediment Forebay & Debris Trash Racks",
                    category="hydraulics",
                    description="Concrete silt traps positioned upstream of road culvert crossings to intercept floating plastics and coarse silt.",
                    provenance=ProvenanceType.ESTIMATE,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Cleaned quarterly and after each heavy storm"],
                    risks=["Severe backwater flooding if trash racks are clogged by solid waste"],
                    construction_stage="Stage 5",
                    is_verified=False,
                    dimensions_label="Sump depth 0.6m [Estimated]",
                    svg_element="rect",
                    svg_props={"x": 380, "y": 130, "width": 60, "height": 200, "fill": "#CBD5E1", "stroke": "#475569", "strokeWidth": 2},
                ),
                DiagramComponent(
                    id="plan_utility_clearance",
                    name="Critical Utility Protection Buffer Zone",
                    category="safety_protection",
                    description="Mandatory 2.0m lateral offset preventing structural excavator buckets from piercing BWSSB water mains and underground power cables.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-VRI-002",
                    assumptions=["Hand digging enforced within this buffer zone"],
                    risks=["Catastrophic potable water contamination or electrical electrocution"],
                    construction_stage="Stage 1 & 2",
                    is_verified=True,
                    dimensions_label="Clearance: 2.0m [Verified Standard]",
                    svg_element="rect",
                    svg_props={"x": 80, "y": 90, "width": 760, "height": 40, "fill": "rgba(239, 68, 68, 0.15)", "stroke": "#DC2626", "strokeWidth": 2, "strokeDasharray": "6 4"},
                ),
                DiagramComponent(
                    id="plan_pedestrian_path",
                    name="Restored Pedestrian Walkway & Safety Handrails",
                    category="structural",
                    description="2.5m wide paved walkway along drain berm with continuous 1.2m crash-rated steel safety railing.",
                    provenance=ProvenanceType.ESTIMATE,
                    evidence_ref="EVID-RD-TS-003",
                    assumptions=["Complies with IRC pedestrian footpath guidelines"],
                    risks=["Pedestrian fall hazards during night hours if lighting is omitted"],
                    construction_stage="Stage 5",
                    is_verified=False,
                    dimensions_label="Width: 2.5m [Illustrative—not for construction]",
                    svg_element="rect",
                    svg_props={"x": 80, "y": 330, "width": 760, "height": 60, "fill": "#E2E8F0", "stroke": "#64748B", "strokeWidth": 2},
                ),
            ]
            dim_lines = [
                DiagramDimensionLine(
                    id="dim_plan_width",
                    label="Channel Hydraulic Width: 12.0m [Verified: BBMP SWD Master Plan]",
                    x1=50, y1=140, x2=50, y2=320, text_x=30, text_y=235,
                    is_illustrative=False, citation="BBMP SWD Master Plan Vol II Table 4-3",
                ),
                DiagramDimensionLine(
                    id="dim_buffer",
                    label="Utility Protection Buffer: 2.0m [Verified]",
                    x1=850, y1=90, x2=850, y2=130, text_x=860, text_y=115,
                    is_illustrative=False, citation="BBMP Standard Specifications",
                ),
            ]
            title = f"Stormwater Rajakaluve Plan View — {location_name}"
            subtitle = "Plan view showing hydraulic alignment, flow direction, sediment traps, and utility protection corridor."
        else:
            # Cross-section view (default)
            components = [
                DiagramComponent(
                    id="soil_subgrade",
                    name="Native Soil Subgrade (Compact Clay / Silty Sand)",
                    category="soil_subgrade",
                    description="In-situ foundation strata compacted to 98% maximum dry density. Safe bearing capacity must be field-verified by standard penetration tests (SPT).",
                    provenance=ProvenanceType.ESTIMATE,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Estimated safe bearing capacity: 150 kN/m²"],
                    risks=["Differential settlement cracking retaining walls if soft organic clay pockets are present"],
                    construction_stage="Stage 1 & 2",
                    is_verified=False,
                    dimensions_label="SPT N >= 15 required [Estimate]",
                    svg_element="rect",
                    svg_props={"x": 60, "y": 380, "width": 800, "height": 130, "fill": "#D4A373", "stroke": "#8C5E35", "strokeWidth": 2},
                ),
                DiagramComponent(
                    id="geotextile_layer",
                    name="Non-Woven Geotextile Separation Fabric",
                    category="waterproofing",
                    description="150 GSM non-woven polypropylene geotextile preventing subgrade soil migration into the crushed stone drainage foundation.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Permittivity >= 0.5 sec⁻¹, CBR puncture strength >= 1500 N"],
                    risks=["Tearing during angular aggregate placement if unrolled incorrectly"],
                    construction_stage="Stage 3",
                    is_verified=True,
                    dimensions_label="150 GSM Geotextile [Verified]",
                    svg_element="rect",
                    svg_props={"x": 130, "y": 372, "width": 660, "height": 8, "fill": "#334155", "stroke": "#1E293B", "strokeWidth": 1},
                ),
                DiagramComponent(
                    id="pcc_bedding",
                    name="PCC M15 Bedding Screed (1:2:4)",
                    category="structural",
                    description="100mm thick plain cement concrete levelling course providing a clean, level surface for structural rebar placement.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Minimum 28-day compressive strength of 15 N/mm²"],
                    risks=["Cold joints if pour is interrupted during monsoon downpours"],
                    construction_stage="Stage 3",
                    is_verified=True,
                    dimensions_label="Thickness: 100mm [Verified: BBMP SWD DPR]",
                    svg_element="rect",
                    svg_props={"x": 140, "y": 348, "width": 640, "height": 24, "fill": "#CBD5E1", "stroke": "#475569", "strokeWidth": 1.5},
                ),
                DiagramComponent(
                    id="rcc_drain_bed",
                    name="RCC M25 Structural Invert Bed Slab",
                    category="structural",
                    description="Monolithic reinforced concrete invert slab (250mm thick) designed for scouring velocity up to 3.5 m/s with longitudinal drainage slope of 1 in 800.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Reinforced with Fe500D steel @ 150mm c/c both ways"],
                    risks=["Hydraulic abrasion from debris if aggregate hardness is below specification"],
                    construction_stage="Stage 4",
                    is_verified=True,
                    dimensions_label="Thickness: 250mm [Verified: BBMP DPR]",
                    svg_element="rect",
                    svg_props={"x": 160, "y": 312, "width": 600, "height": 36, "fill": "#94A3B8", "stroke": "#334155", "strokeWidth": 2},
                ),
                DiagramComponent(
                    id="rcc_walls",
                    name="RCC M25 Retaining Side Walls with Weep Holes",
                    category="structural",
                    description="Twin cantilever RCC retaining walls (3.6m verified depth) with 100mm PVC weep holes at 1.5m spacing to relieve lateral hydrostatic groundwater pressure.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Designed for earth pressure at rest plus hydrostatic head"],
                    risks=["Hydrostatic wall failure if weep holes become choked with fine clay"],
                    construction_stage="Stage 4",
                    is_verified=True,
                    dimensions_label="Depth: 3.6m, Thickness: 350mm [Verified]",
                    svg_element="path",
                    svg_props={"d": "M 160 120 L 210 120 L 210 312 L 160 312 Z M 710 120 L 760 120 L 760 312 L 710 312 Z", "fill": "#94A3B8", "stroke": "#334155", "strokeWidth": 2},
                ),
                DiagramComponent(
                    id="flow_channel",
                    name="Stormwater Hydraulic Flow Prisms",
                    category="hydraulics",
                    description="Open trapezoidal/rectangular hydraulic section conveying storm runoff. Normal dry flow vs extreme cloudburst level.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Manning roughness coefficient n = 0.015 for finished concrete"],
                    risks=["Overtopping during cloudbursts exceeding 75mm/hr intensity"],
                    construction_stage="Stage 5",
                    is_verified=True,
                    dimensions_label="Width: 12.0m, Peak Discharge: 182.4 cumec [Verified]",
                    svg_element="rect",
                    svg_props={"x": 210, "y": 180, "width": 500, "height": 132, "fill": "rgba(56, 189, 248, 0.45)", "stroke": "#0284C7", "strokeWidth": 1.5, "strokeDasharray": "4 4"},
                ),
                DiagramComponent(
                    id="weep_holes",
                    name="Subsurface Weep Holes (100mm PVC with Filter Sock)",
                    category="hydraulics",
                    description="Weep holes relieving groundwater build-up behind the concrete retaining walls. Wrapped in non-woven geotextile with gravel pack.",
                    provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Installed at 1.5m staggered centers with 1:20 outward slope"],
                    risks=["Soil piping behind wall if gravel filter pack is omitted"],
                    construction_stage="Stage 4",
                    is_verified=True,
                    dimensions_label="100mm dia @ 1.5m c/c [Verified]",
                    svg_element="path",
                    svg_props={"d": "M 160 250 L 210 255 M 710 255 L 760 250", "fill": "none", "stroke": "#DC2626", "strokeWidth": 4, "strokeLinecap": "round"},
                ),
                DiagramComponent(
                    id="drain_cover",
                    name="Removable Precast Grated Safety Slabs",
                    category="safety_protection",
                    description="Class AA load-bearing precast concrete slabs with slotted steel gratings to admit surface road runoff while protecting pedestrians.",
                    provenance=ProvenanceType.ESTIMATE,
                    evidence_ref="EVID-SWD-KOR-001",
                    assumptions=["Rated for 40-tonne IRC vehicular wheel loading in crossing zones"],
                    risks=["Theft of steel gratings creating open pit fall hazards"],
                    construction_stage="Stage 5",
                    is_verified=False,
                    dimensions_label="Class AA Load Rating [Illustrative—not for construction]",
                    svg_element="rect",
                    svg_props={"x": 190, "y": 105, "width": 540, "height": 20, "fill": "#64748B", "stroke": "#1E293B", "strokeWidth": 2},
                ),
            ]
            dim_lines = [
                DiagramDimensionLine(
                    id="dim_width",
                    label="Clear Channel Width: 12.0m [Verified: BBMP SWD Master Plan]",
                    x1=210, y1=85, x2=710, y2=85, text_x=340, text_y=75,
                    is_illustrative=False, citation="BBMP SWD Master Plan Vol II Table 4-3",
                ),
                DiagramDimensionLine(
                    id="dim_depth",
                    label="Trench Depth: 3.6m [Verified: BBMP SWD Master Plan]",
                    x1=135, y1=120, x2=135, y2=348, text_x=20, text_y=240,
                    is_illustrative=False, citation="BBMP SWD Master Plan Vol II Section 4.2",
                ),
                DiagramDimensionLine(
                    id="dim_wall_thk",
                    label="Wall Thickness: 350mm [Illustrative—not for construction]",
                    x1=710, y1=340, x2=760, y2=340, text_x=710, text_y=365,
                    is_illustrative=True, citation="Standard IRC / BBMP Retaining Wall Guidance",
                ),
            ]
            title = f"Stormwater Drain (Rajakaluve) Cross-Section — {location_name}"
            subtitle = "Verified civil engineering cross-section showing RCC M25 retaining structure, weep holes, bedding, and flow prisms."

        return StructureDiagram(
            diagram_id=f"DIAG-SWD-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="stormwater_drainage",
            project_name="Bengaluru Primary Stormwater Rajakaluve Remodeling",
            location_name=location_name,
            view_type=view_type,
            title=title,
            subtitle=subtitle,
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Channel dimensions and hydraulic sizing reflect BBMP Master Plan baseline records. "
                "All structural wall reinforcement, soil bearing capacities, and flood elevations must be validated "
                "by on-site geotechnical boreholes and certified by a licensed Professional Engineer (PE)."
            ),
            evidence_citations=[
                "BBMP Storm Water Drain Master Plan & Remodeling DPR (Vol I & II, OpenCity/BBMP)",
                "IRC:SP:50 Guidelines on Urban Drainage & AASHTO Highway Drainage Standards",
                "IS 456:2000 Code of Practice for Plain and Reinforced Concrete",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 2. ROADS, FOOTPATHS & TENDER SURE
    # =========================================================================
    def _build_roads_and_footpaths(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Traffic Diverting & Corridor Survey",
                duration_estimate="Weeks 1 - 2",
                description="One-way traffic diversions with traffic police authorization. Night-time topographic scanning.",
                key_actions=["Post 500m advance detour signs", "Set up water-filled crash attenuator barricades", "Mark utility line offsets"],
                safety_measures=["Continuous 3.5m clear corridor for emergency ambulances and fire tenders"],
                active_component_ids=["subgrade", "utility_duct"],
                inspection_checkpoint="Bengaluru City Traffic Police detour compliance clearance",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Utility Duct Trenching & Multi-Utility Placement",
                duration_estimate="Weeks 3 - 6",
                description="Excavating dedicated side utility corridors to house OFC cables, BESCOM power, and BWSSB water without future road cuts.",
                key_actions=["Excavate 1.8m deep utility trench under sidewalk", "Place precast concrete multi-duct modular chambers", "Install gas and power separation partitions"],
                safety_measures=["Zero trenching across active driveway entrances during daylight business hours"],
                active_component_ids=["utility_duct", "water_main_duct"],
                inspection_checkpoint="Joint utility inspection and tag verification",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Carriageway Milling & Granular Sub-Base (GSB)",
                duration_estimate="Weeks 7 - 10",
                description="Cold milling 50mm of cracked asphalt. Laying 200mm graded crushed stone sub-base compacted to 98% modified Proctor.",
                key_actions=["Cold milling to maintain flush driveway thresholds", "Lay 200mm GSB and 150mm Wet Mix Macadam (WMM)", "Prime coat application with bitumen emulsion"],
                safety_measures=["Dust suppression water sprayers during aggregate spreading"],
                active_component_ids=["subgrade", "granular_subbase", "wmm_base"],
                inspection_checkpoint="Field compaction dry-density and nuclear gauge testing",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Bituminous Concrete Carriageway Paving",
                duration_estimate="Weeks 11 - 13",
                description="Laying 50mm Dense Bituminous Macadam (DBM) followed by 40mm Bituminous Concrete (BC) wearing course.",
                key_actions=["Hot mix asphalt laid at 145-160°C", "Dual tandem roller compaction with pneumatic tire finish", "Apply thermoplastic lane markings"],
                safety_measures=["Night paving between 10 PM and 5 AM to prevent commercial disruption"],
                active_component_ids=["dbm_layer", "asphalt_wearing_course"],
                inspection_checkpoint="Asphalt core extraction and smoothness test (roughness index < 2000 mm/km)",
            ),
            ConstructionStageVisual(
                stage_number=5,
                stage_name="Pedestrian Footpath, Kerbs & Tactile Paving",
                duration_estimate="Weeks 14 - 16",
                description="Installing 40MPa precast interlocking concrete pavers, flush granite kerbs, tactile warning tiles for visually impaired, and street furniture.",
                key_actions=["Bed 60mm paver blocks on 40mm sharp sand bedding", "Install blister tactile tiles at road crossings and bus shelters", "Plant shade saplings in tree pits"],
                safety_measures=["Universal wheelchair ramp slope max 1:12 at all road intersections"],
                active_component_ids=["kerb_stone", "footpath_paver", "tactile_paving"],
                inspection_checkpoint="Accessibility audit and pedestrian safety sign-off",
            ),
        ]

        components = [
            DiagramComponent(
                id="subgrade",
                name="Compacted Road Subgrade (CBR >= 8%)",
                category="soil_subgrade",
                description="Natural subgrade soil compacted to 97% maximum dry density to support commercial arterial axle loads.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["California Bearing Ratio (CBR) assumed >= 8%"],
                risks=["Rutting if subgrade is saturated by leaky water pipes"],
                construction_stage="Stage 1 & 3",
                is_verified=False,
                dimensions_label="CBR >= 8% [Estimate]",
                svg_element="rect",
                svg_props={"x": 50, "y": 380, "width": 820, "height": 130, "fill": "#A3704C", "stroke": "#6E4424", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="granular_subbase",
                name="Granular Sub-Base (GSB - 200mm)",
                category="structural",
                description="Crushed stone aggregate layer providing drainage and distributing heavy wheel traffic loads.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WO-KAUN-004",
                assumptions=["Grading III crushed stone aggregate conforming to MoRTH Section 400"],
                risks=["Pothole formation if fines exceed plasticity index limits"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Thickness: 200mm [Verified MoRTH]",
                svg_element="rect",
                svg_props={"x": 50, "y": 330, "width": 520, "height": 50, "fill": "#CBD5E1", "stroke": "#64748B", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="wmm_base",
                name="Wet Mix Macadam Base (WMM - 150mm)",
                category="structural",
                description="Plant-mixed graded crushed stone compacted to dense matrix providing flexural stiffness.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WO-KAUN-004",
                assumptions=["Optimum moisture content strictly monitored"],
                risks=["Raveling if exposed to rain before bitumen tack coat is applied"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Thickness: 150mm [Verified]",
                svg_element="rect",
                svg_props={"x": 50, "y": 285, "width": 520, "height": 45, "fill": "#94A3B8", "stroke": "#475569", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="asphalt_wearing_course",
                name="Asphalt Carriageway (50mm DBM + 40mm Bituminous Concrete)",
                category="structural",
                description="Dual layer hot-mix asphalt carriageway with 2.5% cross-fall crown for rapid rainwater runoff.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WO-KAUN-004",
                assumptions=["Lane width 3.25m per Tender SURE standard"],
                risks=["Reflective cracking if milling depth is insufficient"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="Lane Width: 3.25m, Thickness: 90mm [Verified]",
                svg_element="rect",
                svg_props={"x": 50, "y": 235, "width": 520, "height": 50, "fill": "#1E293B", "stroke": "#0F172A", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="kerb_stone",
                name="Precast Granite Curb with Drainage Inlets",
                category="structural",
                description="Heavy precast granite curb stone (300mm x 150mm) separating roadway traffic from pedestrians.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Height 150mm above finished asphalt carriageway"],
                risks=["Dislodgement if struck by heavy buses if not properly backed with M20 concrete"],
                construction_stage="Stage 5",
                is_verified=True,
                dimensions_label="Height: 150mm [Verified Tender SURE]",
                svg_element="rect",
                svg_props={"x": 570, "y": 210, "width": 30, "height": 75, "fill": "#64748B", "stroke": "#334155", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="footpath_paver",
                name="Tender SURE Continuous Pedestrian Sidewalk",
                category="structural",
                description="2.5m minimum width continuous pedestrian sidewalk with 40MPa permeable interlocking concrete pavers.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["40 MPa compressive strength pavers on 40mm sharp sand bed"],
                risks=["Heaving from tree roots if root barriers are omitted"],
                construction_stage="Stage 5",
                is_verified=True,
                dimensions_label="Width: 2.5m [Verified: Tender SURE]",
                svg_element="rect",
                svg_props={"x": 600, "y": 210, "width": 270, "height": 30, "fill": "#F59E0B", "stroke": "#B45309", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="utility_duct",
                name="Standardized Sub-Surface Multi-Utility Duct",
                category="utilities",
                description="Precast concrete utility chamber (1.8m deep x 1.2m wide) housing power cables, fiber optic internet, and gas pipes.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Allows future utility maintenance without cutting open asphalt"],
                risks=["Water ingress if chamber gasket seals fail"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="1.8m Depth x 1.2m Width [Verified Tender SURE]",
                svg_element="rect",
                svg_props={"x": 640, "y": 250, "width": 190, "height": 130, "fill": "#E2E8F0", "stroke": "#475569", "strokeWidth": 2.5},
            ),
            DiagramComponent(
                id="tactile_paving",
                name="Tactile Warning & Guidance Pavers",
                category="safety_protection",
                description="Yellow blister pavers warning visually impaired pedestrians of curb edges and pedestrian crossing transitions.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Installed 300mm back from roadway curb edge"],
                risks=["Slip hazard during rain if surface friction coefficient is low"],
                construction_stage="Stage 5",
                is_verified=True,
                dimensions_label="300mm Width [Verified]",
                svg_element="rect",
                svg_props={"x": 600, "y": 200, "width": 30, "height": 10, "fill": "#FACC15", "stroke": "#CA8A04", "strokeWidth": 1},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_carriageway",
                label="Carriageway Lane: 3.25m [Verified: Tender SURE Standard]",
                x1=50, y1=190, x2=570, y2=190, text_x=220, text_y=180,
                is_illustrative=False, citation="Tender SURE Design Guidelines Vol 2",
            ),
            DiagramDimensionLine(
                id="dim_sidewalk",
                label="Sidewalk Width: 2.5m [Verified: Tender SURE Standard]",
                x1=600, y1=170, x2=870, y2=170, text_x=650, text_y=160,
                is_illustrative=False, citation="Tender SURE Design Guidelines Vol 2",
            ),
            DiagramDimensionLine(
                id="dim_duct_depth",
                label="Utility Duct Depth: 1.8m [Verified]",
                x1=840, y1=250, x2=840, y2=380, text_x=850, text_y=320,
                is_illustrative=False, citation="Bengaluru Smart City Tender SURE Guidelines",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-RD-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="roads_and_footpaths",
            project_name="Tender SURE Arterial Road & Pedestrian Sidewalk Corridor",
            location_name=location_name,
            view_type=view_type,
            title=f"Tender SURE Road & Sidewalk Cross-Section — {location_name}",
            subtitle="Engineered cross-section showing carriageway pavement layers, curb, tactile pedestrian footpath, and sub-surface utility duct.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Road cross section reflects Tender SURE Bengaluru Smart City standards. Pavement layer thicknesses "
                "must be determined by traffic axle load surveys (MSA) and certified by a highway engineer."
            ),
            evidence_citations=[
                "Tender SURE Design Guidelines (Bengaluru Smart City / Jana Urban Space Foundation)",
                "BBMP Work Orders & Asphalt Milling Specifications (Kaun City Civic Data Commons)",
                "MoRTH Specifications for Road and Bridge Works (5th Revision)",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 3. GREEN ROOFS FOR PUBLIC BUILDINGS
    # =========================================================================
    def _build_green_roofs(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Structural Assessment & Roof Slab Inspection",
                duration_estimate="Weeks 1 - 2",
                description="Core-drill concrete testing and structural live/dead load capacity verification by a licensed structural engineer.",
                key_actions=["Core sampling of RCC roof slab", "Dead load calculation: verify allowance >= 120 kg/m²", "Slope verification: check minimum 1:80 fall to roof drains"],
                safety_measures=["Perimeter parapet edge-fall arrest harnesses"],
                active_component_ids=["rcc_slab"],
                inspection_checkpoint="Structural engineer fitness certificate for green roof dead load",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Waterproofing Membrane & 48-Hour Flood Test",
                duration_estimate="Weeks 3 - 4",
                description="Applying dual elastomeric root-resistant waterproofing membrane followed by a mandatory 48-hour continuous standing water leak test.",
                key_actions=["Apply 2mm SBS polymer-modified bitumen or EPDM sheet", "Seal all vertical parapet flashings up to 300mm above finished soil", "Plug roof drains and pond water to 50mm depth for 48 hours"],
                safety_measures=["Zero smoking or naked flame near primer application"],
                active_component_ids=["waterproofing_membrane", "rcc_slab"],
                inspection_checkpoint="Certified 48-hour leak test pass signed by facility engineer",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Root Barrier, Drainage Mat & Filter Geotextile",
                duration_estimate="Weeks 5 - 6",
                description="Laying 1.0mm HDPE root barrier, dimpled cup drainage retention core, and non-woven geotextile filter fabric.",
                key_actions=["Overlap root barrier seams by min 300mm and hot-air weld", "Lay dimpled polyethylene drainage retention sheet (cups facing upward)", "Cover with thermally bonded needle-punched geotextile filter fabric"],
                safety_measures=["Inspect drain outlets to guarantee free flow during cloudbursts"],
                active_component_ids=["root_barrier", "drainage_mat", "filter_fabric"],
                inspection_checkpoint="Drainage overflow clearance and fabric overlap inspection",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Engineered Lightweight Growing Medium Placement",
                duration_estimate="Weeks 7 - 8",
                description="Spreading 100mm - 150mm of lightweight engineered substrate (expanded clay, perlite, pumice, and organic compost).",
                key_actions=["Blend 70% inorganic lightweight porous aggregate with 30% organic compost", "Spread evenly without compacting or damaging underlying filter fabric", "Check saturated bulk density does not exceed 1150 kg/m³"],
                safety_measures=["Dust masks for workers handling lightweight expanded perlite"],
                active_component_ids=["growing_medium", "inspection_chamber"],
                inspection_checkpoint="Laboratory soil saturation density test report",
            ),
            ConstructionStageVisual(
                stage_number=5,
                stage_name="Vegetation Planting, Drip Irrigation & Commissioning",
                duration_estimate="Weeks 9 - 10",
                description="Planting drought-hardy sedum, native succulents, and installing sub-surface drip irrigation connected to rainwater tank.",
                key_actions=["Plant drought-tolerant local succulents (Portulaca, Sansevieria, Sedum)", "Install automated drip irrigation lines with rain-sensor shutoff", "Place gravel fire-break strip (300mm) around roof perimeter"],
                safety_measures=["Gravel edge border preventing vegetation spread to roof gutters"],
                active_component_ids=["vegetation_layer", "inspection_chamber"],
                inspection_checkpoint="Vegetation establishment and automatic drip irrigation sign-off",
            ),
        ]

        components = [
            DiagramComponent(
                id="rcc_slab",
                name="Existing RCC Structural Roof Slab (150mm)",
                category="structural",
                description="Reinforced concrete slab designed for minimum 150 kg/m² additional dead load from saturated soil substrate.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["Verified structural dead load allowance >= 150 kg/m²"],
                risks=["Catastrophic slab deflection or collapse if structural verification is skipped"],
                construction_stage="Stage 1",
                is_verified=False,
                dimensions_label="150mm RCC [Requires Field Verification]",
                svg_element="rect",
                svg_props={"x": 100, "y": 380, "width": 720, "height": 70, "fill": "#64748B", "stroke": "#334155", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="thermal_screed",
                name="Slope Screed with Thermal Insulation (1:80 Fall)",
                category="structural",
                description="50mm cement screed creating 1:80 drainage slope towards roof rainwater drain outlets.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["1:80 fall guarantees zero ponding water under membrane"],
                risks=["Standing water leading to premature membrane degradation"],
                construction_stage="Stage 1",
                is_verified=False,
                dimensions_label="1:80 Slope [Estimate]",
                svg_element="rect",
                svg_props={"x": 100, "y": 350, "width": 720, "height": 30, "fill": "#CBD5E1", "stroke": "#94A3B8", "strokeWidth": 1},
            ),
            DiagramComponent(
                id="waterproofing_membrane",
                name="Elastomeric Waterproofing Membrane (Dual Layer SBS)",
                category="waterproofing",
                description="Dual layer 4mm SBS elastomeric membrane tested under 48-hour continuous standing water flood test.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["Certified zero leakage under 48h static water head"],
                risks=["Interior building ceiling leaks and electrical damage"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="4mm SBS Elastomeric [Verified Standard]",
                svg_element="rect",
                svg_props={"x": 100, "y": 338, "width": 720, "height": 12, "fill": "#0F172A", "stroke": "#020617", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="root_barrier",
                name="HDPE Heavy Root Barrier Sheet (1.0mm)",
                category="waterproofing",
                description="High-density polyethylene impermeable root barrier preventing aggressive plant root tips from puncturing the waterproofing.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["Welded continuous seams with 300mm overlap"],
                risks=["Micro-punctures allowing root penetration into ceiling concrete"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="1.0mm HDPE [Verified]",
                svg_element="rect",
                svg_props={"x": 100, "y": 326, "width": 720, "height": 12, "fill": "#1E3A8A", "stroke": "#172554", "strokeWidth": 1},
            ),
            DiagramComponent(
                id="drainage_mat",
                name="Dimpled Drainage & Water Retention Core (25mm)",
                category="hydraulics",
                description="Dimpled polystyrene drainage sheet retaining 5 litres/m² of water for plants while rapidly discharging cloudburst surplus.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SWD-KOR-001",
                assumptions=["Continuous lateral drainage transmissivity >= 1.2 l/(m·s)"],
                risks=["Waterlogging of plant roots causing root rot during heavy monsoons"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="25mm Dimpled Core [Verified]",
                svg_element="rect",
                svg_props={"x": 100, "y": 296, "width": 720, "height": 30, "fill": "#0284C7", "stroke": "#0369A1", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="filter_fabric",
                name="Non-Woven Geotextile Filter Fabric (120 GSM)",
                category="waterproofing",
                description="Permeable filter fabric allowing water drainage while preventing fine soil particles from washing down and clogging the dimpled core.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SWD-KOR-001",
                assumptions=["Pore size (O90) = 0.1mm to retain engineered soil"],
                risks=["Clogging from organic fines if fabric pore size is too small"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="120 GSM Filter Fabric [Verified]",
                svg_element="rect",
                svg_props={"x": 100, "y": 286, "width": 720, "height": 10, "fill": "#475569", "stroke": "#334155", "strokeWidth": 1},
            ),
            DiagramComponent(
                id="growing_medium",
                name="Lightweight Engineered Growing Medium (120mm)",
                category="vegetation",
                description="Engineered substrate: 70% volcanic pumice / expanded clay + 30% organic compost. Max saturated weight 115 kg/m².",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["Saturated density <= 1150 kg/m³ to preserve slab dead-load allowance"],
                risks=["Excess dead load if garden topsoil is substituted by contractor"],
                construction_stage="Stage 4",
                is_verified=False,
                dimensions_label="Depth: 120mm [Illustrative—not for construction]",
                svg_element="rect",
                svg_props={"x": 100, "y": 206, "width": 720, "height": 80, "fill": "#78350F", "stroke": "#451A03", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="vegetation_layer",
                name="Drought-Hardy Native Sedum & Succulent Groundcover",
                category="vegetation",
                description="Drought-resistant sedum, Portulaca, and low-growing groundcover providing 35% thermal insulation and rooftop stormwater retention.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["Ambient cooling of 3-5°C on building upper floor"],
                risks=["Fire hazard in summer if vegetation dries out without firebreak gravel strips"],
                construction_stage="Stage 5",
                is_verified=True,
                dimensions_label="Coverage: 90% [Verified]",
                svg_element="rect",
                svg_props={"x": 100, "y": 166, "width": 720, "height": 40, "fill": "#16A34A", "stroke": "#15803D", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="inspection_chamber",
                name="Perimeter Roof Drain Inspection Chamber",
                category="hydraulics",
                description="Removable slotted inspection chamber allowing visual verification and rodding of roof drain outlets.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["Cleaned bi-monthly before each monsoon season"],
                risks=["Overflow through parapet wall if drain leaf-guard is blocked"],
                construction_stage="Stage 4 & 5",
                is_verified=False,
                dimensions_label="Drain dia: 150mm [Illustrative]",
                svg_element="rect",
                svg_props={"x": 750, "y": 206, "width": 50, "height": 130, "fill": "#E2E8F0", "stroke": "#0284C7", "strokeWidth": 2},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_substrate",
                label="Soil Substrate Depth: 120mm [Illustrative—requires structural sign-off]",
                x1=70, y1=206, x2=70, y2=286, text_x=10, text_y=250,
                is_illustrative=True, citation="FLL Green Roof Guidelines / IS 456 Structural Limits",
            ),
            DiagramDimensionLine(
                id="dim_slab",
                label="Existing RCC Slab Dead Load Capacity: >= 150 kg/m² [Field Verification Required]",
                x1=70, y1=380, x2=70, y2=450, text_x=10, text_y=420,
                is_illustrative=True, citation="Structural Core-Test Report",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-GR-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="green_roofs",
            project_name="Public Building Extensive Green Roof & Thermal Shield",
            location_name=location_name,
            view_type=view_type,
            title=f"Extensive Green Roof Cross-Section — {location_name}",
            subtitle="Multi-layer structural detail showing waterproofing, HDPE root barrier, drainage core, engineered soil, and vegetation.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Green roof layer thicknesses and structural load capacity (120-150 kg/m²) must be verified by "
                "core tests and certified by a registered Structural Engineer prior to soil placement."
            ),
            evidence_citations=[
                "FLL Guidelines for the Planning, Construction and Maintenance of Green Roofing",
                "BESCOM / KREDL Rooftop Photovoltaic and Thermal Insulation Standards",
                "IS 456:2000 Code of Practice for Plain and Reinforced Concrete",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 4. WATER SUPPLY PIPELINES
    # =========================================================================
    def _build_water_supply_pipeline(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Underground Utility Mapping & Trench Excavation",
                duration_estimate="Weeks 1 - 3",
                description="GPR detection of live electric lines followed by vertical trench excavation with steel shoring.",
                key_actions=["Potholing every 20m along pipeline center line", "Maintain 1.5m minimum cover depth", "Install trench shoring cages"],
                safety_measures=["Continuous gas monitoring for methane in proximity to sewer lines"],
                active_component_ids=["trench_bed", "soil_subgrade"],
                inspection_checkpoint="Municipal trench permit and underground clearance",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Sand Bedding & Ductile Iron Pipe Laying",
                duration_estimate="Weeks 4 - 6",
                description="Spreading 150mm washed sand bedding. Lowering and jointing DI K9 spigot and socket pipes.",
                key_actions=["150mm river sand bedding compacted to 95%", "Lower DI K9 pipe sections using nylon slings", "Fit EPDM Tyton rubber gaskets with food-grade lubricant"],
                safety_measures=["No workers allowed inside trench while pipe lengths are hoisted"],
                active_component_ids=["sand_bedding", "di_pipe"],
                inspection_checkpoint="Pipe deflection and laser alignment check",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Hydrostatic Pressure Testing & Disinfection",
                duration_estimate="Weeks 7 - 8",
                description="Pressurizing pipeline to 1.5x working pressure (18.75 bar) for 24 hours. Superchlorination disinfection.",
                key_actions=["Fill section with water and bleed air at high points", "Hold 18.75 bar pressure for 24 hours without drop", "Flush with 50 ppm chlorine solution for 24 hours"],
                safety_measures=["Concrete thrust blocks installed at all pipe bends before testing"],
                active_component_ids=["di_pipe", "thrust_block"],
                inspection_checkpoint="BWSSB hydrostatic test certificate and water bacteriological clearance",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Warning Tape, Backfilling & Road Restoration",
                duration_estimate="Weeks 9 - 10",
                description="Placing metallic tracer wire, detectable blue warning tape, and compacted granular backfill in 150mm layers.",
                key_actions=["Lay detectable blue warning tape 300mm above pipe crown", "Backfill in 150mm layers compacted with tamper", "Restore road pavement to match original specification"],
                safety_measures=["Road traffic warning lights on all active backfill zones"],
                active_component_ids=["warning_tape", "granular_backfill"],
                inspection_checkpoint="Road surface roughness and compaction sign-off",
            ),
        ]

        components = [
            DiagramComponent(
                id="soil_subgrade",
                name="Excavated Trench Prism in Natural Ground",
                category="soil_subgrade",
                description="Trench excavated to 2.8m depth with vertical shored walls to protect adjacent road carriageway.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Depth determined by hydraulic gradient and frost/cover depth"],
                risks=["Trench wall collapse during heavy rain if shoring is dismantled prematurely"],
                construction_stage="Stage 1",
                is_verified=False,
                dimensions_label="Depth: 2.8m [Estimate]",
                svg_element="rect",
                svg_props={"x": 120, "y": 80, "width": 680, "height": 430, "fill": "#B08968", "stroke": "#7F5539", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="sand_bedding",
                name="Compacted Sand Bedding (150mm)",
                category="soil_subgrade",
                description="Clean, graded river sand providing uniform radial support along the pipe invert and preventing point rock loads.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Compacted to 95% standard Proctor density"],
                risks=["Pipe shear cracking if pipe rests directly on rock ledges"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="Thickness: 150mm [Verified: BWSSB DPR]",
                svg_element="rect",
                svg_props={"x": 240, "y": 380, "width": 440, "height": 100, "fill": "#FDE68A", "stroke": "#D97706", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="di_pipe",
                name="Ductile Iron (DI) K9 Potable Water Trunk Main",
                category="structural",
                description="1200mm diameter DI K9 pipeline lined internally with sulfate-resistant cement mortar for potable water transmission.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Operating pressure 12.5 bar, tested at 18.75 bar"],
                risks=["High-pressure pipe burst causing catastrophic street sinkholes"],
                construction_stage="Stage 2 & 3",
                is_verified=True,
                dimensions_label="Dia: 1200mm, Operating: 12.5 bar [Verified: BWSSB]",
                svg_element="circle",
                svg_props={"cx": 460, "cy": 330, "r": 90, "fill": "#0284C7", "stroke": "#0369A1", "strokeWidth": 4},
            ),
            DiagramComponent(
                id="pipe_water_core",
                name="Pressurized Potable Drinking Water Flow",
                category="hydraulics",
                description="Treated drinking water conveying 120 MLD to city distribution zones.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Flow velocity between 1.0 m/s and 2.0 m/s"],
                risks=["Water hammer pressure surge on pump trip if air valves fail"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="120 MLD Transmission [Verified]",
                svg_element="circle",
                svg_props={"cx": 460, "cy": 330, "r": 72, "fill": "#E0F2FE", "stroke": "#38BDF8", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="warning_tape",
                name="Detectable Warning Tape & Tracer Wire",
                category="safety_protection",
                description="Blue detectable polyethylene warning tape with stainless steel tracer wire placed 300mm above pipe crown to prevent excavator strikes.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Provides early warning to third-party utility excavators"],
                risks=["Accidental rupture if warning tape is torn by backhoes"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="300mm above crown [Verified]",
                svg_element="rect",
                svg_props={"x": 300, "y": 200, "width": 320, "height": 8, "fill": "#2563EB", "stroke": "#1D4ED8", "strokeWidth": 1},
            ),
            DiagramComponent(
                id="granular_backfill",
                name="Engineered Granular Backfill (150mm Layers)",
                category="soil_subgrade",
                description="Selected cohesive granular fill compacted in 150mm lifts to match existing road base modulus.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Compacted to 98% Proctor density"],
                risks=["Trench depression settling after monsoon rains"],
                construction_stage="Stage 4",
                is_verified=False,
                dimensions_label="Cover: 1.5m minimum [Verified Standard]",
                svg_element="rect",
                svg_props={"x": 240, "y": 100, "width": 440, "height": 100, "fill": "#D6D3D1", "stroke": "#78716C", "strokeWidth": 1.5},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_pipe_dia",
                label="Pipe Diameter: 1200mm [Verified: BWSSB Cauvery Stage V DPR]",
                x1=370, y1=330, x2=550, y2=330, text_x=380, text_y=320,
                is_illustrative=False, citation="BWSSB Cauvery Stage V Chapter 5",
            ),
            DiagramDimensionLine(
                id="dim_cover_depth",
                label="Minimum Ground Cover: 1.5m [Verified Standard]",
                x1=210, y1=100, x2=210, y2=240, text_x=60, text_y=175,
                is_illustrative=False, citation="BWSSB Water Main Trench Specifications",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-WTR-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="water_supply",
            project_name="BWSSB High-Pressure Potable Water Transmission Main",
            location_name=location_name,
            view_type=view_type,
            title=f"Water Transmission Pipeline Trench Detail — {location_name}",
            subtitle="Cross-section showing DI K9 trunk main, compacted sand bedding, detectable warning tape, and backfill profile.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Pipe sizing, bedding depth, and operating pressure ratings reflect BWSSB engineering documents. "
                "Thrust blocks, air-release valves, and surge tanks must be designed by a hydraulic engineer."
            ),
            evidence_citations=[
                "BWSSB Cauvery Water Supply Project Stage V Detailed Project Report",
                "CPHEEO Manual on Water Supply and Treatment (Ministry of Housing and Urban Affairs)",
                "IS 8329:2000 Centrifugally Cast (Ductile) Iron Pressure Pipes",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 5. RAINWATER HARVESTING & RECHARGE WELL
    # =========================================================================
    def _build_rainwater_harvesting(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Percolation Testing & Hydrogeological Siting",
                duration_estimate="Week 1",
                description="Percolation rate test to verify sandy/weathered granite aquifer absorption capacity.",
                key_actions=["Borehole percolation test", "Verify water table depth > 3.0m below well invert", "Confirm minimum 5.0m setback from building foundations"],
                safety_measures=["Cordon off excavation zone with safety fence"],
                active_component_ids=["soil_aquifer"],
                inspection_checkpoint="Hydrogeologist percolation test report (min 25 mm/hr infiltration)",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Well Pit Excavation & Precast RCC Ring Lowering",
                duration_estimate="Week 2",
                description="Manual well-sinking: excavating soil inside 1.2m dia precast perforated RCC rings as they descend.",
                key_actions=["Excavate 4.5m deep cylindrical well pit", "Lower perforated precast concrete rings (1.2m dia x 0.3m height)", "Maintain vertical plumbness using bubble level"],
                safety_measures=["Continuous oxygen ventilation and tripod hoist rescue harness"],
                active_component_ids=["rcc_rings", "soil_aquifer"],
                inspection_checkpoint="Ring alignment and structural integrity check",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Multi-Layer Graded Filter Media Packing",
                duration_estimate="Week 3",
                description="Placing washed granite boulders, 40mm jelly aggregate, 20mm aggregate, and coarse river sand.",
                key_actions=["Layer 1: 450mm clean granite boulders (100-150mm) at base", "Layer 2: 300mm of 40mm crushed metal", "Layer 3: 200mm coarse river sand wrapped in geotextile"],
                safety_measures=["Wash all aggregates prior to placing to eliminate silt"],
                active_component_ids=["filter_media", "rcc_rings"],
                inspection_checkpoint="Filter media grading and cleanliness verification",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="First Flush Diverter, De-Silting Chamber & Cover",
                duration_estimate="Week 4",
                description="Installing roof inlet pipe, 1.5mm first-flush diverter valve, sediment chamber, and lockable cover slab.",
                key_actions=["Fit PVC first-flush diverter with automatic floating ball valve", "Connect road/rooftop drain with mesh leaf screen", "Install heavy-duty lockable RCC safety cover"],
                safety_measures=["Zero open holes; secure lock preventing accidental child entry"],
                active_component_ids=["first_flush", "well_cover"],
                inspection_checkpoint="Simulated rainfall recharge flow test and municipal BWSSB compliance sign-off",
            ),
        ]

        components = [
            DiagramComponent(
                id="soil_aquifer",
                name="Weathered Granite / Sandy Aquifer Strata",
                category="soil_subgrade",
                description="Permeable weathered soil allowing fast natural infiltration to recharge the Bengaluru shallow aquifer.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["Infiltration rate >= 30 mm/hr"],
                risks=["Groundwater contamination if untreated surface runoff containing motor oil enters well"],
                construction_stage="Stage 1",
                is_verified=True,
                dimensions_label="Percolation >= 30 mm/hr [Verified Standard]",
                svg_element="rect",
                svg_props={"x": 80, "y": 80, "width": 760, "height": 430, "fill": "#E5D0BA", "stroke": "#A98467", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="rcc_rings",
                name="Precast Perforated RCC Well Rings (1.2m dia)",
                category="structural",
                description="Precast concrete rings with 25mm weep perforations allowing filtered water to seep into surrounding aquifer.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["1.2m diameter x 4.5m total depth per BWSSB Bye-Laws"],
                risks=["Well collapse if rings are displaced during seismic tremors"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="Dia: 1.2m, Depth: 4.5m [Verified Bye-Law Standard]",
                svg_element="rect",
                svg_props={"x": 340, "y": 140, "width": 240, "height": 340, "fill": "#CBD5E1", "stroke": "#475569", "strokeWidth": 3},
            ),
            DiagramComponent(
                id="filter_media",
                name="Graded Multi-Layer Filter Bed (Sand, Jelly, Boulders)",
                category="hydraulics",
                description="450mm base boulders (100-150mm) + 300mm 40mm jelly + 200mm coarse river sand. Traps suspended solids.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["Replaced or cleaned every 2 years"],
                risks=["Well clogging with colloidal clay if first flush diverter is omitted"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Total Filter Depth: 950mm [Verified]",
                svg_element="rect",
                svg_props={"x": 350, "y": 320, "width": 220, "height": 150, "fill": "#F59E0B", "stroke": "#B45309", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="first_flush",
                name="Automatic First-Flush Diverter Chamber",
                category="hydraulics",
                description="100mm PVC diverter chamber that discards the initial 1.5mm of contaminated roof wash water containing dust and bird droppings.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["Discharges to municipal storm drain before recharge starts"],
                risks=["Recharge water contamination if diverter float ball sticks in open position"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="First Flush: 1.5mm [Verified Bye-Law]",
                svg_element="rect",
                svg_props={"x": 160, "y": 140, "width": 140, "height": 80, "fill": "#93C5FD", "stroke": "#1D4ED8", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="inlet_pipe",
                name="Rooftop & Paved Area Inflow Pipe (150mm PVC)",
                category="hydraulics",
                description="150mm diameter PVC pipe feeding collected rainwater from building roofs into the recharge well.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["Slope 1 in 100 towards recharge well"],
                risks=["Backwater flooding if inlet screen is blocked"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="150mm dia PVC [Verified]",
                svg_element="path",
                svg_props={"d": "M 80 160 L 340 160", "fill": "none", "stroke": "#0284C7", "strokeWidth": 8},
            ),
            DiagramComponent(
                id="well_cover",
                name="Heavy-Duty Ventilated RCC Safety Cover Slab",
                category="safety_protection",
                description="Lockable precast concrete cover slab with air vent pipe preventing accidental falls while allowing displaced air to escape during flash recharge.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RWH-MANDATE-006",
                assumptions=["Rated for pedestrian and vehicle wheel loads where applicable"],
                risks=["Child or animal entrapment if cover is left unlocked"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="Lockable Cover with Vent [Verified]",
                svg_element="rect",
                svg_props={"x": 320, "y": 120, "width": 280, "height": 20, "fill": "#64748B", "stroke": "#1E293B", "strokeWidth": 2},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_well_depth",
                label="Recharge Well Depth: 4.5m [Verified: BWSSB Mandatory RWH Standard]",
                x1=310, y1=140, x2=310, y2=480, text_x=130, text_y=310,
                is_illustrative=False, citation="BWSSB Bye-Laws Section 72A",
            ),
            DiagramDimensionLine(
                id="dim_well_dia",
                label="Well Diameter: 1.2m [Verified: BWSSB Standard]",
                x1=340, y1=100, x2=580, y2=100, text_x=370, text_y=90,
                is_illustrative=False, citation="BWSSB RWH Manual Table 3",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-RWH-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="rainwater_harvesting",
            project_name="Mandatory Groundwater Recharge Well & First-Flush Unit",
            location_name=location_name,
            view_type=view_type,
            title=f"Rainwater Recharge Well Cross-Section — {location_name}",
            subtitle="Cross-section showing precast perforated rings, multi-layer gravel filter, first-flush diverter, and safety cover.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Well diameter and depth reflect BWSSB mandatory bye-law specifications for 60L/m² roof catchment. "
                "Local infiltration capacity must be verified by field percolation tests."
            ),
            evidence_citations=[
                "BWSSB (Amendment) Act & Mandatory Rainwater Harvesting Bye-Laws",
                "National Water Data Portal (NWDP / NWIC Cauvery Basin Aquifer Data)",
                "Central Ground Water Board (CGWB) Guide on Artificial Recharge to Groundwater",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 6. URBAN FOREST & BIODIVERSITY PARK
    # =========================================================================
    def _build_urban_forest_and_park(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Underground Utility Locate & Root Barrier Trenching",
                duration_estimate="Weeks 1 - 2",
                description="GPR scanning to locate water mains and power cables. Digging 1.5m root barrier trench to protect pipes from root intrusion.",
                key_actions=["Locate all underground cables within 10m radius", "Trench 1.5m vertical slot along utility corridor", "Install 1.5mm HDPE impermeable root barrier deflectors"],
                safety_measures=["Hand potholing within 2.0m of known telecom or gas utilities"],
                active_component_ids=["root_barrier_wall"],
                inspection_checkpoint="Utility coordination sign-off and root barrier depth check",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Soil Decompaction & Organic Composting",
                duration_estimate="Weeks 3 - 4",
                description="Deep ripping to 1.0m depth to eliminate construction hardpan, followed by amending soil with vermicompost and cocopeat.",
                key_actions=["Decompact compacted urban fill to 1.0m depth", "Incorporate 30% organic compost, leaf mold, and biochar", "Test soil pH (target 6.5 - 7.5) and organic carbon content"],
                safety_measures=["Zero burning of plant debris on site"],
                active_component_ids=["amended_soil"],
                inspection_checkpoint="Soil agronomy test certificate (organic matter >= 2.5%)",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Native Multi-Tier Sapling Planting (Miyawaki Method)",
                duration_estimate="Weeks 5 - 6",
                description="Planting 3-5 native saplings per m² across canopy, sub-tree, and shrub layers.",
                key_actions=["Plant native species: Honge, Neem, Mahua, Peepal, and Amla", "Mix 40 species for biodiversity resilience", "Stake all saplings with bamboo poles to resist windthrow"],
                safety_measures=["Space large-canopy trees minimum 4.0m from street lamp posts and overhead wires"],
                active_component_ids=["canopy_trees", "shrub_layer"],
                inspection_checkpoint="Species inventory and density count verification",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Mulching, Drip Irrigation & Canopy Monitoring",
                duration_estimate="Weeks 7 - 8",
                description="Applying 150mm organic woodchip mulch and installing automated solar-powered drip irrigation for the first 24 months.",
                key_actions=["Apply 150mm thick woodchip mulch to suppress weeds and retain moisture", "Lay pressure-compensating drip tubing", "Establish monthly survival rate and temperature monitoring sensors"],
                safety_measures=["Firebreak perimeter around urban forest plot"],
                active_component_ids=["mulch_layer"],
                inspection_checkpoint="100% drip emitter flow verification and handover",
            ),
        ]

        components = [
            DiagramComponent(
                id="soil_profile",
                name="Decompacted Native Soil Subgrade",
                category="soil_subgrade",
                description="Deep-ripped urban subgrade (1.0m depth) allowing deep taproot penetration and groundwater recharge.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["Bulk density reduced below 1.4 g/cm³"],
                risks=["Poor root anchorage if hardpan remains unripped"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="1.0m Depth [Verified IISc Study]",
                svg_element="rect",
                svg_props={"x": 50, "y": 320, "width": 820, "height": 190, "fill": "#8B5A2B", "stroke": "#5C3D1E", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="amended_soil",
                name="Biochar & Organic Compost Amended Stratum (400mm)",
                category="vegetation",
                description="Upper 400mm amended with 30% local leaf compost, cocopeat, and biochar to retain 45% moisture during dry summers.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["High mycorrhizal fungal inoculation for fast tree growth"],
                risks=["Weed competition if topsoil seeds are not suppressed"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="Depth: 400mm [Verified]",
                svg_element="rect",
                svg_props={"x": 50, "y": 270, "width": 820, "height": 50, "fill": "#5C3A21", "stroke": "#3D2616", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="mulch_layer",
                name="Organic Woodchip Mulch Bed (150mm)",
                category="vegetation",
                description="150mm coarse woodchip and bark mulch reducing soil evaporation by 60% and lowering summer soil temperatures by 4°C.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["Replenished annually for 2 years until canopy closes"],
                risks=["Dry mulch fire hazard during peak summer if litter is dumped"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="Thickness: 150mm [Verified]",
                svg_element="rect",
                svg_props={"x": 50, "y": 240, "width": 820, "height": 30, "fill": "#A0522D", "stroke": "#6E361D", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="root_barrier_wall",
                name="Vertical HDPE Utility Root Barrier (1.5mm thick x 1.5m deep)",
                category="safety_protection",
                description="Vertical root deflector barrier placed between the urban forest edge and adjacent municipal water and power cables.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["Deflects aggressive lateral roots downward away from pipes"],
                risks=["Pavement heaving or water pipe rupture if root barrier is omitted"],
                construction_stage="Stage 1",
                is_verified=True,
                dimensions_label="Depth: 1.5m, Thk: 1.5mm [Verified]",
                svg_element="rect",
                svg_props={"x": 760, "y": 180, "width": 16, "height": 240, "fill": "#1E293B", "stroke": "#0F172A", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="canopy_trees",
                name="Native Canopy Stratum (Honge, Neem, Mahua)",
                category="vegetation",
                description="Upper canopy trees providing 35% ambient shade, capturing 24.5 kg CO₂/tree/yr, and reducing temperatures by 3.8°C.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["Expected mature height 12 - 18 meters"],
                risks=["Branch shedding in storm squalls if formative pruning is neglected"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="3.8°C Cooling, 24.5kg CO2/yr [Verified: IISc]",
                svg_element="path",
                svg_props={"d": "M 200 240 L 200 130 M 140 130 Q 200 40 260 130 Z M 480 240 L 480 110 M 410 110 Q 480 20 550 110 Z", "fill": "#15803D", "stroke": "#166534", "strokeWidth": 3},
            ),
            DiagramComponent(
                id="shrub_layer",
                name="Pollinator Shrub & Understory Layer",
                category="vegetation",
                description="Native flowering shrubs supporting local honeybees, butterflies, and urban birds.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["No synthetic chemical pesticides used"],
                risks=["Damage by stray livestock during initial 6 months"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Pollinator Support [Verified]",
                svg_element="path",
                svg_props={"d": "M 300 240 Q 330 180 360 240 Z M 600 240 Q 640 170 680 240 Z", "fill": "#4ADE80", "stroke": "#16A34A", "strokeWidth": 2},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_clearance",
                label="Root Barrier Clearance from Utilities: 2.5m [Verified: IISc Forestry Standards]",
                x1=760, y1=150, x2=870, y2=150, text_x=650, text_y=140,
                is_illustrative=False, citation="IISc Tech Report 148 / Urban Forest Guidelines",
            ),
            DiagramDimensionLine(
                id="dim_soil_depth",
                label="Decompacted Rooting Depth: 1.0m [Verified]",
                x1=30, y1=240, x2=30, y2=450, text_x=40, text_y=350,
                is_illustrative=False, citation="Miyawaki Afforestation Standard",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-FOR-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="urban_forest",
            project_name="Micro-Forest Canopy, Soil Stratum & Utility Root Barrier",
            location_name=location_name,
            view_type=view_type,
            title=f"Urban Micro-Forest Soil & Canopy Profile — {location_name}",
            subtitle="Cross-section showing multi-tier native canopy, amended biochar soil, woodchip mulch, and vertical utility root barrier.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Ecological Diagram — Illustrative only. Not for construction. "
                "Species selections and root clearance distances reflect IISc micro-climate studies. "
                "Utility locations must be cleared with BESCOM, BWSSB, and GAIL prior to excavation."
            ),
            evidence_citations=[
                "IISc Ecological Sciences Tech Report 148 (Micro-climate Regulation by Urban Parks)",
                "Karnataka Forest Department Guidelines for Urban Tree Planting",
                "Smart Cities Mission Nature-Based Solutions Manual",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 7. SEWERAGE & WASTEWATER INFRASTRUCTURE
    # =========================================================================
    def _build_sewerage_and_wastewater(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Topographic Invert Survey & Bypass Pumping Setup",
                duration_estimate="Weeks 1 - 3",
                description="Laser leveling of sewer gradient. Setting up temporary above-ground sewage bypass pumps to maintain resident sanitation.",
                key_actions=["Establish laser invert levels ensuring minimum 1:200 self-cleansing slope", "Install high-capacity diesel bypass pumps (min 200 l/s) with silenced enclosures", "Notify all connected households of construction schedule"],
                safety_measures=["Continuous hydrogen sulfide (H2S) gas meters at trench edge"],
                active_component_ids=["sewer_subgrade"],
                inspection_checkpoint="BWSSB wastewater diversion permit and environmental health sign-off",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Deep Shored Trenching & Granular Bedding",
                duration_estimate="Weeks 4 - 8",
                description="Excavating 3.5m deep sewer trench with steel drag-box shoring. Placing 150mm crushed granite bedding.",
                key_actions=["Drive steel trench shoring boxes along roadway", "Dewater trench using wellpoint vacuum pumps", "Place and compact 150mm graded stone aggregate bedding"],
                safety_measures=["Zero open trench left uncovered overnight; deploy heavy steel crossing plates"],
                active_component_ids=["sewer_bedding", "sewer_pipe"],
                inspection_checkpoint="Bedding compaction and invert level laser inspection",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Vitrified Clay / RCC Pipe Jointing & Drop Manholes",
                duration_estimate="Weeks 9 - 13",
                description="Laying 600mm sulfate-resistant pipes with flexible elastomeric seal joints and building brick/RCC drop manholes at 30m intervals.",
                key_actions=["Joint pipes using flexible polyurethane/rubber gasket ring seals", "Construct precast RCC circular manholes with epoxy protective coating", "Construct internal concrete benching and flow channels"],
                safety_measures=["Harness and gas detectors for all manhole entries"],
                active_component_ids=["sewer_pipe", "manhole_chamber"],
                inspection_checkpoint="Hydrostatic exfiltration air/water testing (zero leakage under 1.5m head)",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="CCTV Inspection, Backfill & Odor Vent Installation",
                duration_estimate="Weeks 14 - 16",
                description="Crawler CCTV camera survey of pipe internal joints. Controlled backfilling and installing activated carbon odor vents.",
                key_actions=["Run robotic CCTV camera through 100% of pipeline lengths", "Verify zero joint displacement or gravel intrusion", "Install heavy-duty air-tight ductile iron manhole covers and bio-filter vents"],
                safety_measures=["Air-tight seal testing to prevent sewer odor escape into commercial shopfronts"],
                active_component_ids=["manhole_cover", "sewer_flow"],
                inspection_checkpoint="CCTV audit report archiving and BWSSB final commissioning",
            ),
        ]

        components = [
            DiagramComponent(
                id="sewer_subgrade",
                name="Shoring & Trench Prism in Native Soil",
                category="soil_subgrade",
                description="3.5m deep trench supported by heavy steel shoring boxes to prevent road collapse.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Trench depth governed by gravity flow connection to trunk sewer"],
                risks=["Trench collapse undermining adjacent building foundations"],
                construction_stage="Stage 1 & 2",
                is_verified=False,
                dimensions_label="Depth: 3.5m [Estimate]",
                svg_element="rect",
                svg_props={"x": 80, "y": 80, "width": 760, "height": 430, "fill": "#8D6E63", "stroke": "#5D4037", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="sewer_bedding",
                name="Crushed Granite Gravel Bedding (150mm)",
                category="soil_subgrade",
                description="150mm thick washed 20mm aggregate bedding supporting pipe barrel.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["180-degree cradle support for heavy vitrified pipes"],
                risks=["Pipe shearing if bedding is washed away by groundwater"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="150mm Crushed Granite [Verified]",
                svg_element="rect",
                svg_props={"x": 160, "y": 400, "width": 600, "height": 70, "fill": "#BCAAA4", "stroke": "#795548", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="sewer_pipe",
                name="Sulfate-Resistant Reinforced Concrete Sewer Pipe (600mm dia)",
                category="structural",
                description="Class NP3 RCC pipe lined internally with high-alumina cement to resist biogenic sulfuric acid corrosion.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Slope 1 in 200 maintains self-cleansing velocity >= 0.75 m/s"],
                risks=["Crown corrosion from H2S gas if ventilation is poor"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Dia: 600mm, Slope: 1 in 200 [Verified]",
                svg_element="circle",
                svg_props={"cx": 320, "cy": 350, "r": 65, "fill": "#546E7A", "stroke": "#263238", "strokeWidth": 4},
            ),
            DiagramComponent(
                id="sewer_flow",
                name="Gravity Wastewater Flow Prism",
                category="hydraulics",
                description="Domestic and commercial wastewater conveying to decentralized or trunk Sewage Treatment Plant (STP).",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Designed for half-full flow at peak daily dry-weather discharge"],
                risks=["Backflow flooding into basements during blockages"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="Half-pipe gravity flow [Verified]",
                svg_element="path",
                svg_props={"d": "M 265 350 A 55 55 0 0 0 375 350 Z", "fill": "#827717", "stroke": "#558B2F", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="manhole_chamber",
                name="Precast RCC Drop Manhole Chamber with Epoxy Lining",
                category="structural",
                description="1.2m internal diameter precast concrete inspection chamber coated with chemical-resistant coal-tar epoxy.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Located at 30m maximum spacing and all change of directions"],
                risks=["Gas accumulation (H2S and methane) requiring mechanical ventilation before entry"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Dia: 1.2m Precast RCC [Verified]",
                svg_element="rect",
                svg_props={"x": 580, "y": 140, "width": 180, "height": 300, "fill": "#CFD8DC", "stroke": "#455A64", "strokeWidth": 3},
            ),
            DiagramComponent(
                id="manhole_cover",
                name="Air-Tight Ductile Iron Double-Sealed Manhole Cover",
                category="safety_protection",
                description="Heavy-duty Class D400 ductile iron cover with neoprene gasket seal preventing toxic sewer gas escape into roadways.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Class D400 rated for 40-tonne commercial bus wheel loading"],
                risks=["Theft of covers leading to deadly vehicular and pedestrian falls"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="Class D400 (40 Tonne) [Verified]",
                svg_element="rect",
                svg_props={"x": 560, "y": 115, "width": 220, "height": 25, "fill": "#263238", "stroke": "#000000", "strokeWidth": 2},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_sewer_dia",
                label="Pipe Diameter: 600mm NP3 [Verified: BWSSB Master Standard]",
                x1=255, y1=350, x2=385, y2=350, text_x=260, text_y=335,
                is_illustrative=False, citation="BWSSB Sewer Design Guidelines",
            ),
            DiagramDimensionLine(
                id="dim_trench_depth",
                label="Invert Trench Depth: 3.5m [Illustrative—not for construction]",
                x1=120, y1=80, x2=120, y2=430, text_x=20, text_y=260,
                is_illustrative=True, citation="CPHEEO Sewerage Manual Table 4-2",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-SEW-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="sewerage_and_wastewater",
            project_name="Underground Gravity Sanitary Sewer & Drop Manhole",
            location_name=location_name,
            view_type=view_type,
            title=f"Sanitary Sewer & Drop Manhole Cross-Section — {location_name}",
            subtitle="Cross-section showing NP3 sulfate-resistant concrete pipe, crushed stone cradle bedding, and air-tight precast drop manhole.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Sewer gradients and pipe diameters require hydraulic flow validation against actual ward wastewater discharge. "
                "All deep excavation shoring must be certified by a registered structural engineer."
            ),
            evidence_citations=[
                "CPHEEO Manual on Sewerage and Sewage Treatment Systems",
                "BWSSB Standard Specifications for Underground Drainage Works",
                "IS 458:2003 Precast Concrete Pipes (With and Without Reinforcement)",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 8. SOLID WASTE & COMPOSTING FACILITY
    # =========================================================================
    def _build_solid_waste_facility(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Subgrade Grading, Compaction & Leachate Sump Siting",
                duration_estimate="Weeks 1 - 2",
                description="Excavation of processing slab to 1:50 inward slope towards leachate collection sump.",
                key_actions=["Excavate subgrade and compact to 98% Proctor density", "Excavate leachate retention sump with zero overflow to storm drains", "Install windbreak buffer berm around perimeter"],
                safety_measures=["Maintain 100m setback from residential property lines"],
                active_component_ids=["facility_subgrade"],
                inspection_checkpoint="Karnataka State Pollution Control Board (KSPCB) site siting clearance",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Impermeable Geomembrane & Heavy Concrete Pad",
                duration_estimate="Weeks 3 - 5",
                description="Laying 1.5mm HDPE geomembrane under 200mm thick fiber-reinforced concrete pad to prevent groundwater pollution.",
                key_actions=["Lay and seam-weld 1.5mm HDPE geomembrane barrier", "Pour 200mm M30 grade concrete with polypropylene anti-crack fibers", "Finish with chemical-resistant crystalline surface densifier"],
                safety_measures=["Air pressure test on all HDPE welded seams"],
                active_component_ids=["geomembrane_liner", "concrete_pad"],
                inspection_checkpoint="Geomembrane spark leak test and concrete compressive strength sign-off",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Aerated Composting Windrow Bays & Forced Air Ducts",
                duration_estimate="Weeks 6 - 8",
                description="Constructing precast concrete windrow dividers, slotted sub-floor aeration pipes, and blower fans.",
                key_actions=["Install 150mm perforated stainless steel aeration pipes in floor slots", "Construct 1.8m high precast dividing retaining walls", "Connect variable-speed aeration blowers with timer control"],
                safety_measures=["Flame-proof wiring in organic methane generation zones"],
                active_component_ids=["aeration_pipes", "windrow_walls"],
                inspection_checkpoint="Mechanical aeration airflow velocity test",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Biofilter Odor Scrubbing & Leachate Recirculation System",
                duration_estimate="Weeks 9 - 10",
                description="Constructing woodchip-packed biofilter bed and sealed pump station to recirculate moisture back into compost windrows.",
                key_actions=["Install negative-pressure air collection ducts over bays", "Construct 1.2m deep bark/woodchip biological odor filter bed", "Connect leachate recirculation pump to maintain 55% compost moisture"],
                safety_measures=["Odor sensory panel and ambient ammonia/H2S monitors"],
                active_component_ids=["biofilter_bed", "leachate_sump"],
                inspection_checkpoint="KSPCB consent to operate (CTO) emission compliance verification",
            ),
        ]

        components = [
            DiagramComponent(
                id="facility_subgrade",
                name="Compacted Foundation Subgrade (1:50 Slope)",
                category="soil_subgrade",
                description="Clay subgrade graded with 2% cross-slope directing all wash water into the leachate sump.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-SWD-KOR-001",
                assumptions=["Clay barrier permeability k < 10⁻⁷ cm/s"],
                risks=["Groundwater contamination if underlying soil is porous fractured rock"],
                construction_stage="Stage 1",
                is_verified=False,
                dimensions_label="1:50 Slope [Estimate]",
                svg_element="rect",
                svg_props={"x": 60, "y": 380, "width": 800, "height": 130, "fill": "#8C6239", "stroke": "#5A3818", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="geomembrane_liner",
                name="Impermeable HDPE Geomembrane Liner (1.5mm)",
                category="waterproofing",
                description="High-density polyethylene barrier completely preventing leachate infiltration into the local water table.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Thermal wedge welded seams with vacuum testing"],
                risks=["Tear from sharp stone puncture leading to toxic groundwater pollution"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="1.5mm HDPE [Verified SWM Rules]",
                svg_element="rect",
                svg_props={"x": 80, "y": 370, "width": 760, "height": 10, "fill": "#0F172A", "stroke": "#020617", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="concrete_pad",
                name="Heavy-Duty M30 Concrete Apron with Fiber Reinforcement",
                category="structural",
                description="200mm thick monolithic concrete slab with synthetic macro-fibers resistant to organic acids and bobcat loader scraping.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Resistant to organic acetic and butyric acids"],
                risks=["Pitting corrosion if surface sealing is omitted"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="200mm M30 Concrete [Verified]",
                svg_element="rect",
                svg_props={"x": 80, "y": 320, "width": 640, "height": 50, "fill": "#94A3B8", "stroke": "#475569", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="windrow_walls",
                name="Precast Concrete Aerated Composting Bays (1.8m height)",
                category="structural",
                description="Interlocking precast concrete divider walls containing composting organic windrows.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Resists lateral thrust of damp organic compost"],
                risks=["Overturning during mechanical loader bucket strikes"],
                construction_stage="Stage 3",
                is_verified=False,
                dimensions_label="Height: 1.8m [Illustrative]",
                svg_element="path",
                svg_props={"d": "M 100 160 L 130 160 L 130 320 L 100 320 Z M 400 160 L 430 160 L 430 320 L 400 320 Z M 700 160 L 730 160 L 730 320 L 700 320 Z", "fill": "#64748B", "stroke": "#334155", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="compost_pile",
                name="Aerobic Organic Windrows (Thermophilic 55°C - 65°C)",
                category="vegetation",
                description="Segregated wet municipal organic waste undergoing high-temperature pathogen pasteurization.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-FOR-LAL-007",
                assumptions=["Temperature maintained above 55°C for 15 days to kill weed seeds and pathogens"],
                risks=["Anaerobic odor and fly breeding if pile turns sour due to lack of air"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="55°C-65°C Thermophilic [Verified SWM Rules]",
                svg_element="path",
                svg_props={"d": "M 140 320 Q 265 190 390 320 Z M 440 320 Q 565 190 690 320 Z", "fill": "#78350F", "stroke": "#451A03", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="leachate_sump",
                name="Double-Lined Sealed Leachate Collection Sump",
                category="hydraulics",
                description="Fully enclosed concrete sump with submersible cutter pump that transfers toxic leachate for treatment or re-application.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-WTR-BWSSB-005",
                assumptions=["Zero discharge to stormwater drains"],
                risks=["Catastrophic overflow during cloudburst storms if sizing is inadequate"],
                construction_stage="Stage 1 & 4",
                is_verified=True,
                dimensions_label="Zero Overflow Sump [Verified]",
                svg_element="rect",
                svg_props={"x": 740, "y": 300, "width": 100, "height": 90, "fill": "#334155", "stroke": "#0F172A", "strokeWidth": 2},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_slab_thk",
                label="Concrete Slab Thickness: 200mm M30 [Verified]",
                x1=50, y1=320, x2=50, y2=370, text_x=10, text_y=350,
                is_illustrative=False, citation="Solid Waste Management Rules 2016",
            ),
            DiagramDimensionLine(
                id="dim_bay_width",
                label="Windrow Bay Width: 2.7m [Illustrative—not for construction]",
                x1=130, y1=140, x2=400, y2=140, text_x=220, text_y=130,
                is_illustrative=True, citation="CPHEEO Municipal Solid Waste Manual",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-SWM-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="solid_waste_facility",
            project_name="Decentralized Aerated Organic Waste Composting Unit",
            location_name=location_name,
            view_type=view_type,
            title=f"Aerated Composting & Leachate Control Facility — {location_name}",
            subtitle="Cross-section showing HDPE geomembrane, heavy concrete apron, precast windrow bays, and double-lined leachate sump.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Leachate sump volume and liner specifications must comply with Central Pollution Control Board (CPCB) "
                "Solid Waste Management Rules 2016 and be approved by the State Pollution Control Board."
            ),
            evidence_citations=[
                "Solid Waste Management Rules 2016 (Ministry of Environment, Forest and Climate Change)",
                "CPHEEO Manual on Municipal Solid Waste Management",
                "Karnataka State Pollution Control Board (KSPCB) Siting Guidelines for Waste Processing",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 9. RENEWABLE ENERGY & ROOFTOP SOLAR
    # =========================================================================
    def _build_renewable_energy_solar(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Roof Structural Verification & Shading Analysis",
                duration_estimate="Week 1",
                description="3D shadow profiling and structural assessment of dead/wind load (up to 150 km/h wind gusts).",
                key_actions=["Structural load calculation: dead load addition 15 kg/m²", "3D Solar Pathfinder shade analysis (min 5.5 peak sun hours)", "Locate roof lightning arrestor terminals"],
                safety_measures=["100% tie-off safety harness on open roofs"],
                active_component_ids=["roof_slab"],
                inspection_checkpoint="Structural engineer certificate for solar racking dead and wind loads",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Ballasted Non-Penetrating Racking Installation",
                duration_estimate="Weeks 2 - 3",
                description="Setting precast concrete ballast blocks on rubber protection pads to avoid puncturing the roof waterproofing.",
                key_actions=["Lay EPDM rubber protection pads under all contact points", "Place precast concrete ballast blocks (rated for 140 km/h wind uplift)", "Assemble anodized aluminum racking tilted at 13° South (Bengaluru latitude)"],
                safety_measures=["Zero mechanical drilling into existing roof waterproofing membrane"],
                active_component_ids=["ballast_blocks", "aluminum_racking"],
                inspection_checkpoint="Racking torque verification and ballast weight inspection",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Mono-PERC Solar PV Module Mounting & DC Cabling",
                duration_estimate="Weeks 4 - 5",
                description="Fixing 550W high-efficiency mono-crystalline solar panels with UV-resistant DC cabling in covered metal trays.",
                key_actions=["Bolt 550W Mono-PERC modules to racking with stainless steel mid-clamps", "Route solar DC cables (4mm² copper XLPO) in galvanized steel cable trays", "Install surge protection devices (Type II SPD) at string combiner boxes"],
                safety_measures=["Insulated gloves (1000V rated) while connecting DC string series"],
                active_component_ids=["solar_modules", "cable_tray"],
                inspection_checkpoint="String open-circuit voltage (Voc) and short-circuit current (Isc) testing",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Grid Inverter, Bi-Directional Meter & BESCOM Commissioning",
                duration_estimate="Weeks 6 - 7",
                description="Connecting 3-phase grid-tied string inverter, chemical earthing pits, and bi-directional net-meter.",
                key_actions=["Install 3 dedicated chemical maintenance-free earthing pits (< 2 ohms resistance)", "Mount IP65 inverter with anti-islanding protection", "Coordinate BESCOM technical inspection and bi-directional meter sealing"],
                safety_measures=["Lockout-Tagout (LOTO) protocols on primary AC distribution panel"],
                active_component_ids=["inverter_panel", "earthing_pit"],
                inspection_checkpoint="BESCOM net-metering commissioning and CEIG electrical safety approval",
            ),
        ]

        components = [
            DiagramComponent(
                id="roof_slab",
                name="Existing Municipal RCC Roof Slab",
                category="structural",
                description="Reinforced concrete slab supporting solar ballasted installation with 15 kg/m² added dead load.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["Structural dead load allowance verified >= 15 kg/m²"],
                risks=["Membrane puncture if direct mechanical anchor bolts are drilled"],
                construction_stage="Stage 1",
                is_verified=True,
                dimensions_label="Dead Load: 15 kg/m² [Verified: BESCOM]",
                svg_element="rect",
                svg_props={"x": 80, "y": 380, "width": 760, "height": 80, "fill": "#64748B", "stroke": "#334155", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="ballast_blocks",
                name="Precast Concrete Aerodynamic Ballast Blocks on Rubber Mats",
                category="structural",
                description="Non-penetrating precast concrete ballast blocks placed over protective neoprene mats to prevent wind uplift.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["Resists 140 km/h wind gusts without roof drilling"],
                risks=["Movement during severe cyclones if ballast weight is under-calculated"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="140 km/h Wind Rating [Verified]",
                svg_element="rect",
                svg_props={"x": 160, "y": 350, "width": 80, "height": 30, "fill": "#94A3B8", "stroke": "#475569", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="ballast_blocks_2",
                name="Rear Ballast Anchor Block",
                category="structural",
                description="Rear precast counter-weight stabilizing solar tilt frame.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["Equally distributed loading"],
                risks=["Uneven point loading on hollow-block roofs"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="Ballast Unit [Verified]",
                svg_element="rect",
                svg_props={"x": 520, "y": 350, "width": 80, "height": 30, "fill": "#94A3B8", "stroke": "#475569", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="aluminum_racking",
                name="Anodized Aluminum Triangle Racking (13° South Tilt)",
                category="structural",
                description="Corrosion-resistant 6063-T6 aluminum mounting structure angled at 13° south latitude for optimum year-round solar yield.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["13-degree tilt matches Bengaluru latitude (12.97° N)"],
                risks=["Galvanic corrosion if stainless fasteners are paired directly with un-anodized steel"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="Tilt: 13° South [Verified Solar Geometry]",
                svg_element="path",
                svg_props={"d": "M 200 350 L 560 350 L 560 210 Z", "fill": "none", "stroke": "#CBD5E1", "strokeWidth": 4},
            ),
            DiagramComponent(
                id="solar_modules",
                name="High-Efficiency Mono-PERC Solar PV Modules (550W)",
                category="structural",
                description="Tier-1 Mono-crystalline PERC photovoltaic modules with anti-reflective glass yielding 4.2 kWh/kWp/day in Bengaluru.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["4.2 kWh/kWp daily average generation"],
                risks=["Hot-spot cell degradation if bird droppings are left uncleaned"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="550W Modules, 4.2 kWh/kWp/day [Verified]",
                svg_element="path",
                svg_props={"d": "M 180 355 L 580 205 L 600 212 L 200 362 Z", "fill": "#1E3A8A", "stroke": "#1E40AF", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="cable_tray",
                name="Galvanized Steel Weatherproof Cable Tray",
                category="utilities",
                description="Enclosed galvanized steel cable trunking protecting DC string wires from UV degradation, rain, and rodent chewing.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["Complies with Indian Electricity Rules 1956"],
                risks=["DC arc faults if cables are exposed to direct sunlight"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Galvanized Tray [Verified]",
                svg_element="rect",
                svg_props={"x": 580, "y": 350, "width": 180, "height": 20, "fill": "#CBD5E1", "stroke": "#475569", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="inverter_panel",
                name="Three-Phase Grid-Tied Solar Inverter with Anti-Islanding",
                category="utilities",
                description="High-efficiency (98.6%) string inverter automatically synchronizing solar power with the BESCOM municipal power grid.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-SOL-BESCOM-008",
                assumptions=["Immediate trip within 0.1s during grid blackout to protect utility lineworkers"],
                risks=["Inverter overheating if installed on unshaded west-facing walls"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="Anti-Islanding Protection [Verified: BESCOM]",
                svg_element="rect",
                svg_props={"x": 720, "y": 240, "width": 70, "height": 110, "fill": "#F8FAFC", "stroke": "#0284C7", "strokeWidth": 2.5},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_tilt",
                label="Solar Tilt Angle: 13° South [Verified: Bengaluru Latitude]",
                x1=200, y1=330, x2=250, y2=315, text_x=260, text_y=310,
                is_illustrative=False, citation="MNRE National Solar Guidelines",
            ),
            DiagramDimensionLine(
                id="dim_clearance",
                label="Roof Maintenance Walkway: 1.2m [Verified Standard]",
                x1=600, y1=370, x2=720, y2=370, text_x=620, text_y=395,
                is_illustrative=False, citation="BESCOM Rooftop Solar Net Metering Rules",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-SOL-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="renewable_energy",
            project_name="Public Building Rooftop Solar PV & Grid Intertie",
            location_name=location_name,
            view_type=view_type,
            title=f"Rooftop Solar PV Ballasted Mount Detail — {location_name}",
            subtitle="Cross-section showing non-penetrating ballast blocks, 13° south aluminum racking, 550W Mono-PERC modules, and cable management.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Ballast weight calculations, wind uplift modeling (IS 875 Part 3), and electrical single-line diagrams "
                "must be stamped by a licensed Electrical and Structural Engineer and approved by BESCOM."
            ),
            evidence_citations=[
                "BESCOM & KERC Rooftop Solar Photovoltaic Grid Interactive Regulations 2022",
                "MNRE Quality Standards for Grid-Connected Solar Rooftop PV Systems",
                "IS 875 (Part 3): Wind Loads on Buildings and Structures",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 10. PUBLIC TRANSPORT & BUS STOPS
    # =========================================================================
    def _build_public_transport_hub(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Passenger Demarcation & Temporary Bus Boarding Bay",
                duration_estimate="Week 1",
                description="Setting up barricaded temporary passenger waiting bays 50m upstream so bus transit continues uninterrupted.",
                key_actions=["Install illuminated detour signs and passenger shelter tent", "Mark temporary bus stop with Bengaluru BMTC bus schedule updates", "Set up crash barriers along traffic lane"],
                safety_measures=["Zero passenger boarding permitted from live traffic lanes"],
                active_component_ids=["curb_boarding"],
                inspection_checkpoint="BMTC transit operations clearance",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Cantilever Foundation Footings & Trench Excavation",
                duration_estimate="Weeks 2 - 3",
                description="Excavating isolated pad footings (1.5m depth) and casting RCC M25 foundation pedestals with heavy anchor bolts.",
                key_actions=["Excavate footing pits with shoring", "Tie rebar cages and cast M25 concrete with anchor bolt templates", "Install underground conduit for bus digital arrival display screens"],
                safety_measures=["Cover all open footing pits with timber and road plates"],
                active_component_ids=["bus_shelter_footing"],
                inspection_checkpoint="Structural anchor bolt tension test",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Kassel Raised Bus Curb & Tactile Boarding Edge",
                duration_estimate="Weeks 4 - 5",
                description="Installing 180mm high Kassel self-guiding bus curbs to eliminate boarding steps for low-floor BMTC buses.",
                key_actions=["Set Kassel profile precast curb stones backed with M20 concrete", "Install yellow blister tactile guidance paving for visually impaired passengers", "Cast universal wheelchair boarding ramp with max 1:12 slope"],
                safety_measures=["Flush surface alignment with zero trip hazards"],
                active_component_ids=["curb_boarding", "tactile_paving"],
                inspection_checkpoint="Accessibility compliance audit and step-free clearance verification",
            ),
            ConstructionStageVisual(
                stage_number=4,
                stage_name="Cantilever Steel Shelter Canopy, Solar Lighting & Testing",
                duration_estimate="Weeks 6 - 7",
                description="Erecting structural steel cantilever canopy, vandal-resistant seating, real-time bus display, and solar roof.",
                key_actions=["Erect powder-coated structural steel cantilever frame", "Fit tempered laminated glass rain canopy", "Commission digital passenger information display (PID) and solar roof light"],
                safety_measures=["Anti-shatter laminated safety glass rated for high wind gusts"],
                active_component_ids=["shelter_canopy", "passenger_bench"],
                inspection_checkpoint="BMTC transit authority and BBMP public works joint handover",
            ),
        ]

        components = [
            DiagramComponent(
                id="bus_lane_pavement",
                name="Reinforced Concrete Bus Bay Pavement (250mm M35)",
                category="structural",
                description="Heavy rigid concrete pavement engineered to withstand high static shear stress from heavy idling BMTC buses without asphalt rutting.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Resists repeated 10.2-tonne standard bus axle load"],
                risks=["Cracking if joint dowel bars are misaligned"],
                construction_stage="Stage 2",
                is_verified=True,
                dimensions_label="250mm M35 Rigid Concrete [Verified]",
                svg_element="rect",
                svg_props={"x": 50, "y": 320, "width": 380, "height": 90, "fill": "#1E293B", "stroke": "#0F172A", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="curb_boarding",
                name="Kassel Step-Free Bus Boarding Curb (180mm)",
                category="structural",
                description="Specialized concave profile curb guiding bus tires flush against the platform, achieving zero horizontal gap and level step-free wheelchair boarding.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Height 180mm perfectly matches low-floor bus floor height"],
                risks=["Tire scrubbing damage if curve alignment is inaccurate"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Height: 180mm Step-Free [Verified]",
                svg_element="rect",
                svg_props={"x": 430, "y": 280, "width": 40, "height": 60, "fill": "#94A3B8", "stroke": "#475569", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="sidewalk_platform",
                name="Elevated Passenger Waiting Platform & Sidewalk",
                category="structural",
                description="3.0m wide pedestrian waiting platform with 40MPa permeable paver blocks and integrated drainage.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Paved with non-slip textured pavers"],
                risks=["Ponding water during monsoons if cross-fall is inadequate"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Platform Width: 3.0m [Verified Tender SURE]",
                svg_element="rect",
                svg_props={"x": 470, "y": 280, "width": 400, "height": 130, "fill": "#E2E8F0", "stroke": "#64748B", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="tactile_paving",
                name="Tactile Platform Edge Warning Tiles",
                category="safety_protection",
                description="Bright yellow blister paving alerting visually impaired commuters that they are approaching the platform boarding curb.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Installed continuous along full length of bus boarding zone"],
                risks=["Tripping hazard if paver joints become loose"],
                construction_stage="Stage 3",
                is_verified=True,
                dimensions_label="Tactile Edge [Verified Standard]",
                svg_element="rect",
                svg_props={"x": 470, "y": 270, "width": 40, "height": 10, "fill": "#FACC15", "stroke": "#CA8A04", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="bus_shelter_footing",
                name="RCC M25 Structural Cantilever Column Footing",
                category="structural",
                description="1.5m deep reinforced concrete foundation resisting wind overturning moments on the cantilever shelter roof.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Engineered for wind gust up to 140 km/h"],
                risks=["Cantilever sag if foundation anchor bolts stretch"],
                construction_stage="Stage 2",
                is_verified=False,
                dimensions_label="Depth: 1.5m [Estimate]",
                svg_element="rect",
                svg_props={"x": 720, "y": 360, "width": 100, "height": 100, "fill": "#64748B", "stroke": "#334155", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="shelter_canopy",
                name="Cantilever Steel Canopy with Solar Glass Roof",
                category="structural",
                description="High-clearance cantilever structural steel canopy providing rain and solar shade while leaving the walkway completely unobstructed.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Minimum 2.4m clear headroom under all canopy elements"],
                risks=["Water runoff discharging directly onto passengers if gutter slopes backward"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="2.4m Clear Headroom [Verified]",
                svg_element="path",
                svg_props={"d": "M 760 360 L 760 140 L 440 110 L 440 100 L 780 130 L 780 360 Z", "fill": "#0284C7", "stroke": "#0369A1", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="passenger_bench",
                name="Ergonomic Stainless Steel Seating & Wheelchair Bay",
                category="structural",
                description="Vandal-resistant perching bench with dedicated 900mm wide alongside wheelchair bay.",
                provenance=ProvenanceType.VERIFIED_SOURCE_FACT,
                evidence_ref="EVID-RD-TS-003",
                assumptions=["Accessible to elderly and disabled commuters"],
                risks=["Vandalism if non-welded fasteners are used"],
                construction_stage="Stage 4",
                is_verified=True,
                dimensions_label="Dedicated Wheelchair Bay [Verified]",
                svg_element="rect",
                svg_props={"x": 640, "y": 240, "width": 80, "height": 40, "fill": "#94A3B8", "stroke": "#475569", "strokeWidth": 1.5},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_headroom",
                label="Canopy Minimum Headroom: 2.4m [Verified: Tender SURE Standard]",
                x1=480, y1=115, x2=480, y2=270, text_x=340, text_y=190,
                is_illustrative=False, citation="Tender SURE Guidelines Section 4.5",
            ),
            DiagramDimensionLine(
                id="dim_platform_width",
                label="Waiting Platform Width: 3.0m [Verified]",
                x1=470, y1=420, x2=870, y2=420, text_x=620, text_y=445,
                is_illustrative=False, citation="BMTC Bus Stop Standards",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-BUS-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="public_transport",
            project_name="Accessible Low-Floor Bus Transit Boarding Platform",
            location_name=location_name,
            view_type=view_type,
            title=f"Step-Free Bus Platform & Cantilever Canopy Detail — {location_name}",
            subtitle="Cross-section showing M35 rigid bus lane pavement, Kassel step-free curb, tactile safety paving, and cantilever shelter.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Conceptual Engineering Diagram — Illustrative only. Not for construction. "
                "Canopy cantilever structural steel sizing and foundation overturning resistance "
                "must be engineered to resist IS 875 wind forces and stamped by a licensed Professional Engineer."
            ),
            evidence_citations=[
                "Tender SURE Design Guidelines for Bus Stops and Accessible Sidewalks",
                "IRC:SP:112 Guidelines on Transit Stops and Pedestrian Facilities",
                "Harmonized Guidelines and Standards for Universal Accessibility in India (MoHUA 2021)",
            ],
            generated_at=now_iso,
        )

    # =========================================================================
    # 11. CUSTOM / OTHER INFRASTRUCTURE
    # =========================================================================
    def _build_custom_infrastructure(
        self, view_type: DiagramViewType, location_name: str, custom_params: Dict[str, Any]
    ) -> StructureDiagram:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        stages = [
            ConstructionStageVisual(
                stage_number=1,
                stage_name="Site Geotechnical Boreholes & Utility Locating",
                duration_estimate="Weeks 1 - 2",
                description="Core drilling to evaluate soil strata and ground-penetrating radar scanning to locate hidden utilities.",
                key_actions=["Execute 3 standard penetration test (SPT) boreholes", "Map underground utilities and establish safety clearances", "Obtain municipal right-of-way work authorization"],
                safety_measures=["Continuous perimeter barricading and pedestrian detour signage"],
                active_component_ids=["custom_subgrade"],
                inspection_checkpoint="Geotechnical engineer foundation recommendation report",
            ),
            ConstructionStageVisual(
                stage_number=2,
                stage_name="Excavation & Shored Foundation Pour",
                duration_estimate="Weeks 3 - 6",
                description="Excavating foundation trench, laying non-woven geotextile, and pouring reinforced concrete base slab.",
                key_actions=["Excavate with shored side walls to prevent soil slumping", "Place 100mm PCC M15 bedding layer", "Tie rebar and pour RCC M25 structural base with waterproof admixture"],
                safety_measures=["Dewatering sump pumps ready in case of unexpected rain"],
                active_component_ids=["custom_bedding", "custom_structure"],
                inspection_checkpoint="Concrete 28-day compression cube test certificate",
            ),
            ConstructionStageVisual(
                stage_number=3,
                stage_name="Superstructure Erection & Protective Waterproofing",
                duration_estimate="Weeks 7 - 10",
                description="Erecting structural elements, protective coatings, and backfilling with compacted granular fill.",
                key_actions=["Assemble superstructure components with certified torque checks", "Apply protective waterproofing barrier", "Backfill in 150mm lifts with vibrating plate compaction"],
                safety_measures=["Safety safety harness for any work elevated above 1.8m"],
                active_component_ids=["custom_protective_layer", "custom_structure"],
                inspection_checkpoint="Final municipal quality assurance and safety inspection",
            ),
        ]

        components = [
            DiagramComponent(
                id="custom_subgrade",
                name="Natural Foundation Subgrade [Pending SPT Boreholes]",
                category="soil_subgrade",
                description="In-situ foundation soil requiring field standard penetration tests (SPT) to determine allowable bearing capacity.",
                provenance=ProvenanceType.MISSING,
                evidence_ref=None,
                assumptions=["Assumed standard municipal bearing capacity (150 kN/m²) pending laboratory soil testing"],
                risks=["Differential settlement if soft clay lenses exist below footing depth"],
                construction_stage="Stage 1",
                is_verified=False,
                dimensions_label="SPT N-value Missing [Field Verification Required]",
                svg_element="rect",
                svg_props={"x": 100, "y": 380, "width": 720, "height": 120, "fill": "#A8A29E", "stroke": "#78716C", "strokeWidth": 2},
            ),
            DiagramComponent(
                id="custom_bedding",
                name="Engineered Aggregate Bedding (150mm)",
                category="structural",
                description="150mm compacted granular bedding layer providing uniform load distribution.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref=None,
                assumptions=["Compacted to 98% maximum dry density"],
                risks=["Uneven settlement if compacted without optimum moisture control"],
                construction_stage="Stage 2",
                is_verified=False,
                dimensions_label="150mm Bedding [Illustrative—not for construction]",
                svg_element="rect",
                svg_props={"x": 160, "y": 330, "width": 600, "height": 50, "fill": "#E7E5E4", "stroke": "#A8A29E", "strokeWidth": 1.5},
            ),
            DiagramComponent(
                id="custom_structure",
                name="Engineered Infrastructure Core Structure",
                category="structural",
                description="Primary reinforced structural envelope designed to meet municipal infrastructure standards.",
                provenance=ProvenanceType.ILLUSTRATIVE,
                evidence_ref=None,
                assumptions=["Concept-level representation. Requires project-specific architectural and civil drawings."],
                risks=["Structural failure if designed without licensed engineer verification"],
                construction_stage="Stage 2 & 3",
                is_verified=False,
                dimensions_label="Custom Geometry [Illustrative—not for construction]",
                svg_element="rect",
                svg_props={"x": 200, "y": 170, "width": 520, "height": 160, "fill": "#0284C7", "stroke": "#0369A1", "strokeWidth": 3},
            ),
            DiagramComponent(
                id="custom_protective_layer",
                name="Protective Barrier & Surface Restoration",
                category="safety_protection",
                description="Protective surface coating, pedestrian railing, and restored public right-of-way.",
                provenance=ProvenanceType.ESTIMATE,
                evidence_ref=None,
                assumptions=["Restores site to equal or better condition than prior to excavation"],
                risks=["Public complaints if road surface is not properly repaved"],
                construction_stage="Stage 3",
                is_verified=False,
                dimensions_label="Surface Protection [Estimate]",
                svg_element="rect",
                svg_props={"x": 100, "y": 150, "width": 720, "height": 20, "fill": "#F59E0B", "stroke": "#D97706", "strokeWidth": 2},
            ),
        ]

        dim_lines = [
            DiagramDimensionLine(
                id="dim_custom_span",
                label="Structural Footprint [Illustrative—requires site survey]",
                x1=200, y1=130, x2=720, y2=130, text_x=340, text_y=120,
                is_illustrative=True, citation="Preliminary Concept Layout",
            ),
        ]

        return StructureDiagram(
            diagram_id=f"DIAG-GEN-{hashlib.md5((location_name + view_type.value).encode()).hexdigest()[:6].upper()}",
            project_type="custom_infrastructure",
            project_name="Preliminary Modular Urban Infrastructure Visualizer",
            location_name=location_name,
            view_type=view_type,
            title=f"Preliminary Structural Diagram — {location_name}",
            subtitle="Generic engineered foundation, structural core, and protective envelope awaiting site-specific civil drawings.",
            viewbox="0 0 920 540",
            components=components,
            dimension_lines=dim_lines,
            stages=stages,
            disclaimer=(
                "⚠️ Preliminary Conceptual Diagram — Illustrative only. Not for construction. "
                "This project does not yet have verified local geotechnical boreholes or stamped civil engineering drawings. "
                "Dimensions, structural thickness, and foundation design must be prepared and sealed by a licensed Professional Engineer."
            ),
            evidence_citations=[
                "National Building Code of India (NBC 2016)",
                "IRC and CPHEEO General Civil Infrastructure Standards",
            ],
            generated_at=now_iso,
        )


diagram_service = DiagramService()
