from typing import List, Optional, Dict, Any
from ..models.consequence_chain import (
    ConsequenceChainGraph,
    ConsequenceNode,
    ConsequenceEdge,
    ConsequenceCategory,
    ImpactDirection,
    ConfidenceLevel,
)
from ..models.intervention import InterventionDefinition
from .intervention_service import intervention_service

class ConsequenceEngine:
    def generate_chain(
        self,
        intervention_id: str,
        units_deployed: float,
        neighbourhood_id: Optional[str] = None,
        neighbourhood_name: Optional[str] = None,
        strategy: str = "balanced",
        active_scenario: Optional[str] = None,
    ) -> ConsequenceChainGraph:
        intervention = intervention_service.get_intervention(intervention_id)
        if not intervention:
            # Fallback to urban forest
            intervention = intervention_service.get_intervention("int-urban-forest")

        nodes: List[ConsequenceNode] = []
        edges: List[ConsequenceEdge] = []
        unintended_tradeoffs: List[str] = []
        mitigations: List[str] = []

        # Root Node
        root_id = "node-0-root"
        nodes.append(ConsequenceNode(
            id=root_id,
            label=f"Deploy {intervention.name} ({units_deployed:,.1f} {intervention.unit_label})",
            category=ConsequenceCategory.ROOT,
            affected_metric="Capital & Land Commitment",
            direction=ImpactDirection.POSITIVE,
            magnitude_estimate=f"{units_deployed:,.1f} units deployed in {neighbourhood_name or 'target districts'}",
            source_or_calculation="Urban Sustainability Optimisation Engine allocation",
            confidence=ConfidenceLevel.MEASURED,
            suggested_mitigation=None,
            detailed_explanation=(
                f"Selected intervention allocated under the '{strategy.replace('_', ' ').title()}' strategy. "
                f"Total upfront capital requirement: ${units_deployed * intervention.capital_cost_per_unit:,.0f} USD."
            ),
            depth_level=0
        ))

        # 1. Direct Physical Effect
        direct_id = "node-1-direct"
        surface_area = units_deployed * intervention.space_consumed_m2_per_unit
        nodes.append(ConsequenceNode(
            id=direct_id,
            label=f"Direct Physical Footprint: {surface_area:,.0f} m² Modified",
            category=ConsequenceCategory.DIRECT,
            affected_metric="Urban Land Cover & Permeability",
            direction=ImpactDirection.POSITIVE,
            magnitude_estimate=f"{surface_area:,.0f} m² surface transition",
            source_or_calculation=f"Multiplication: {units_deployed:,.1f} units × {intervention.space_consumed_m2_per_unit} m²/unit",
            confidence=ConfidenceLevel.MEASURED,
            suggested_mitigation="Verify subterranean utility easements and building structural load ratings prior to physical installation.",
            detailed_explanation=(
                f"Physically transforms {surface_area:,.0f} square meters of {intervention.space_type.value.replace('_', ' ')}. "
                f"Replaces conventional impervious or underutilized surfaces with functional green/blue infrastructure."
            ),
            depth_level=1
        ))
        edges.append(ConsequenceEdge(source_id=root_id, target_id=direct_id, relationship_label="Physically deploys"))

        # 2. Environmental Benefits (Heat & Runoff)
        env_heat_id = "node-2-env-heat"
        heat_effect = round(units_deployed * intervention.heat_reduction_index_per_unit, 2)
        nodes.append(ConsequenceNode(
            id=env_heat_id,
            label=f"Local Thermal Cooling (Estimated {heat_effect:.2f} cooling index points)",
            category=ConsequenceCategory.ENVIRONMENTAL,
            affected_metric="Urban Heat Island & Microclimate",
            direction=ImpactDirection.POSITIVE,
            magnitude_estimate=f"Index reduction of ~{heat_effect:.2f} points (~0.4°C to 1.8°C local ambient cooling)",
            source_or_calculation="Evapotranspiration cooling & albedo modification coefficient (EPA Heat Island Compendium)",
            confidence=ConfidenceLevel.MODEL_ESTIMATE,
            suggested_mitigation="Ensure continuous vegetation health through drought; desiccated foliage loses up to 80% of its cooling power.",
            detailed_explanation=(
                f"Provides localized sensible heat reduction via shading and active vegetative evapotranspiration. "
                f"Particularly effective at lowering daytime peak surface temperatures on sun-exposed streets and rooftops."
            ),
            depth_level=2
        ))
        edges.append(ConsequenceEdge(source_id=direct_id, target_id=env_heat_id, relationship_label="Cools ambient microclimate"))

        env_runoff_id = "node-2-env-runoff"
        runoff_effect = round(units_deployed * intervention.runoff_reduction_m3_per_unit_year, 0)
        nodes.append(ConsequenceNode(
            id=env_runoff_id,
            label=f"Stormwater Inundation Diversion ({runoff_effect:,.0f} m³/year)",
            category=ConsequenceCategory.ENVIRONMENTAL,
            affected_metric="Peak Runoff Volume & Sewer Pressure",
            direction=ImpactDirection.POSITIVE,
            magnitude_estimate=f"{runoff_effect:,.0f} m³ stormwater diverted or retained annually",
            source_or_calculation=f"Rational runoff model: {units_deployed:,.1f} units × {intervention.runoff_reduction_m3_per_unit_year} m³/unit/year",
            confidence=ConfidenceLevel.MODEL_ESTIMATE,
            suggested_mitigation="Maintain siltation pre-treatment traps to prevent premature pore clogging during heavy initial storm runoff.",
            detailed_explanation=(
                f"Absorbs, detains, or infiltrates {runoff_effect:,.0f} cubic meters of stormwater during intense precipitation events, "
                f"directly reducing hydraulic surcharge on municipal combined sewers and curbing localized street flooding."
            ),
            depth_level=2
        ))
        edges.append(ConsequenceEdge(source_id=direct_id, target_id=env_runoff_id, relationship_label="Intercepts stormwater"))

        # 3. Water Consequence (Crucial Trade-off!)
        water_id = "node-3-water"
        net_water = round(units_deployed * intervention.water_demand_m3_per_unit_year, 1)
        if net_water > 0:
            water_direction = ImpactDirection.NEGATIVE
            water_mag = f"+{net_water:,.0f} m³/year additional municipal water consumed"
            water_label = f"Water Demand Increase: +{net_water:,.0f} m³/year"
            water_detail = (
                f"Vegetation requires ongoing irrigation, especially during the 24-month establishment phase and hot summer droughts. "
                f"Without auxiliary non-potable supply, this draws directly upon municipal potable drinking water reserves."
            )
            water_mitigation = "Pair tree planting and green roofs with dedicated rainwater harvesting cisterns or recycled greywater."
            unintended_tradeoffs.append(f"Water demand increases by {net_water:,.0f} m³/year, exacerbating municipal water stress during dry seasons.")
            mitigations.append(water_mitigation)
        else:
            water_direction = ImpactDirection.POSITIVE
            water_mag = f"-{abs(net_water):,.0f} m³/year non-potable water harvested"
            water_label = f"Net Water Harvest Yield: {abs(net_water):,.0f} m³/year Captured"
            water_detail = (
                f"Modular retention cisterns collect stormwater from roof downspouts, creating an auxiliary decentralized water supply "
                f"that offsets municipal consumption for landscaping and street cleaning."
            )
            water_mitigation = "Incorporate continuous disinfection filtration and level sensors to prevent stagnant water pathogen growth."

        nodes.append(ConsequenceNode(
            id=water_id,
            label=water_label,
            category=ConsequenceCategory.WATER_RESOURCE,
            affected_metric="Municipal Water Resilience",
            direction=water_direction,
            magnitude_estimate=water_mag,
            source_or_calculation="Asset hydrological demand benchmarking (CIRIA SuDS & ARCSA standards)",
            confidence=ConfidenceLevel.MODEL_ESTIMATE,
            suggested_mitigation=water_mitigation,
            detailed_explanation=water_detail,
            depth_level=2
        ))
        edges.append(ConsequenceEdge(source_id=direct_id, target_id=water_id, relationship_label="Impairs/Enhances water balance"))

        # 4. Financial Consequence (Capex + Lifetime Opex)
        fin_id = "node-4-financial"
        capex = round(units_deployed * intervention.capital_cost_per_unit, 0)
        annual_opex = round(units_deployed * intervention.annual_maintenance_per_unit, 0)
        lifetime_cost = round(capex + (annual_opex * min(25, intervention.expected_lifespan_years)), 0)
        nodes.append(ConsequenceNode(
            id=fin_id,
            label=f"Fiscal Commitment: ${capex:,.0f} Upfront + ${annual_opex:,.0f}/yr O&M",
            category=ConsequenceCategory.FINANCIAL,
            affected_metric="Municipal Budget & Asset Depreciation",
            direction=ImpactDirection.NEGATIVE,
            magnitude_estimate=f"25-Year Lifecycle Cost: ~${lifetime_cost:,.0f} USD",
            source_or_calculation=f"Capital (${intervention.capital_cost_per_unit}/unit) + Annual Maintenance (${intervention.annual_maintenance_per_unit}/unit/yr)",
            confidence=ConfidenceLevel.BENCHMARK_ASSUMPTION,
            suggested_mitigation="Establish an endowment or stormwater utility fee rebate mechanism to fund ongoing stewardship.",
            detailed_explanation=(
                f"While capital cost (${capex:,.0f}) is funded through development grants or bonds, annual maintenance "
                f"(${annual_opex:,.0f}/year) represents a recurring operational burden on city public works departments. "
                f"Neglected maintenance leads to premature asset degradation."
            ),
            depth_level=3
        ))
        edges.append(ConsequenceEdge(source_id=root_id, target_id=fin_id, relationship_label="Requires fiscal allocation"))

        # 5. Social & Equity Consequence
        equity_id = "node-5-equity"
        nodes.append(ConsequenceNode(
            id=equity_id,
            label="Social Distribution & Green Gentrification Risk",
            category=ConsequenceCategory.SOCIAL_EQUITY,
            affected_metric="Environmental Justice & Housing Affordability",
            direction=ImpactDirection.UNCERTAIN,
            magnitude_estimate="High socio-spatial dependency",
            source_or_calculation="Urban green equity scholarship (Wolch et al. & UNEP Environmental Equity Guidelines)",
            confidence=ConfidenceLevel.BENCHMARK_ASSUMPTION,
            suggested_mitigation="Pair green infrastructure investments with community land trusts, tenant protections, and local job training.",
            detailed_explanation=(
                "Adding extensive green amenities to historically disinvested neighbourhoods reduces heat disparities, "
                "but can inadvertently trigger speculative property value increases, resulting in the displacement of low-income renters ('green gentrification')."
            ),
            depth_level=3
        ))
        edges.append(ConsequenceEdge(source_id=env_heat_id, target_id=equity_id, relationship_label="Influences living conditions"))
        unintended_tradeoffs.append("Potential green gentrification and rental displacement pressure in newly greened urban corridors.")

        # 6. Scenario Vulnerability (Dynamic based on active scenario!)
        scen_id = "node-6-scenario"
        if active_scenario == "drought":
            scen_label = "Scenario Risk: Desiccation & Sapling Mortality in Drought"
            scen_detail = "Under severe drought, soil moisture falls below permanent wilting point. Without emergency watering, survival rates drop below 40%."
            scen_dir = ImpactDirection.NEGATIVE
            scen_mit = "Prioritize drought-adapted native species (e.g. Quercus virginiana) and dormant-stage planting schedules."
        elif active_scenario == "extreme_rainfall":
            scen_label = "Scenario Risk: Siltation Surcharge in 100-Year Cloudburst"
            scen_detail = "Peak storm runoff carries heavy silt loads that can blind filter media and overwhelm retention basins within the first 30 minutes."
            scen_dir = ImpactDirection.NEGATIVE
            scen_mit = "Install hydrodynamic vortex separators and sediment forebays upstream of sensitive vegetative media."
        elif active_scenario == "budget_cut":
            scen_label = "Scenario Risk: Maintenance Deferral Under Austerity"
            scen_detail = "Austerity measures inevitably target landscape upkeep, resulting in invasive weed takeover, clogged grates, and reduced stormwater retention."
            scen_dir = ImpactDirection.NEGATIVE
            scen_mit = "Form municipal-community stewardship compacts with volunteer district watch groups to maintain street swales."
        else:
            scen_label = "Scenario Risk: Climate Stress Robustness"
            scen_detail = "Standard operating conditions provide positive returns; however, compound heatwaves and flash drought test structural resilience."
            scen_dir = ImpactDirection.UNCERTAIN
            scen_mit = "Incorporate redundant drainage paths and select diverse polyculture plant palettes."

        nodes.append(ConsequenceNode(
            id=scen_id,
            label=scen_label,
            category=ConsequenceCategory.SCENARIO_RISK,
            affected_metric="Systemic Climate Resilience",
            direction=scen_dir,
            magnitude_estimate="Vulnerability amplified under compound shocks",
            source_or_calculation="Climate scenario stress test simulator",
            confidence=ConfidenceLevel.ILLUSTRATIVE,
            suggested_mitigation=scen_mit,
            detailed_explanation=scen_detail,
            depth_level=4
        ))
        edges.append(ConsequenceEdge(source_id=water_id, target_id=scen_id, relationship_label="Exposes climate vulnerability"))

        # 7. Concrete Synthesis Mitigation Node
        mit_id = "node-7-mitigation"
        nodes.append(ConsequenceNode(
            id=mit_id,
            label="Integrated Lifecycle Mitigation Protocol",
            category=ConsequenceCategory.MITIGATION,
            affected_metric="Risk Minimisation & Value Protection",
            direction=ImpactDirection.POSITIVE,
            magnitude_estimate="Reduces downside operational failure risk by >65%",
            source_or_calculation="Engineering best management practice (ASCE / EPA / CIRIA guidelines)",
            confidence=ConfidenceLevel.MODEL_ESTIMATE,
            suggested_mitigation=None,
            detailed_explanation=(
                f"1. Pre-deployment: Geotechnical soil permeability tests and structural load audit.\n"
                f"2. Resource coupling: Interlock {intervention.name} with local rainwater retention.\n"
                f"3. Equity covenant: Ring-fence 40%+ of capital for high-SVI districts with anti-displacement zoning.\n"
                f"4. Stewardship: 5-year contracted warranty with sensor-driven telemetry."
            ),
            depth_level=4
        ))
        edges.append(ConsequenceEdge(source_id=fin_id, target_id=mit_id, relationship_label="Mitigated by"))
        edges.append(ConsequenceEdge(source_id=equity_id, target_id=mit_id, relationship_label="Safeguarded by"))
        edges.append(ConsequenceEdge(source_id=scen_id, target_id=mit_id, relationship_label="Hardened by"))

        mitigations.append("Adopt sensor-driven soil moisture irrigation and community stewardship agreements.")

        return ConsequenceChainGraph(
            portfolio_strategy=strategy,
            intervention_id=intervention.id,
            intervention_name=intervention.name,
            neighbourhood_id=neighbourhood_id,
            neighbourhood_name=neighbourhood_name,
            units_deployed=units_deployed,
            nodes=nodes,
            edges=edges,
            unintended_tradeoffs_summary=unintended_tradeoffs,
            priority_mitigation_actions=mitigations,
            active_scenario_impacts=active_scenario
        )

consequence_engine = ConsequenceEngine()
