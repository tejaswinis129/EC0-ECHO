import React, { useState, useEffect } from "react";
import { ConsequenceChainGraph, InterventionDefinition } from "../types";
import { api } from "../api/client";
import { ConsequenceGraph } from "../components/ConsequenceGraph";
import { GitFork, RefreshCw, Sliders, Layers } from "lucide-react";

interface ConsequenceChainPageProps {
  initialInterventionId?: string;
  initialUnits?: number;
  initialNeighbourhoodId?: string;
  initialStrategy?: string;
}

export const ConsequenceChainPage: React.FC<ConsequenceChainPageProps> = ({
  initialInterventionId = "int-urban-forest",
  initialUnits = 450,
  initialNeighbourhoodId,
  initialStrategy = "balanced",
}) => {
  const [interventions, setInterventions] = useState<InterventionDefinition[]>([]);
  const [selectedInterventionId, setSelectedInterventionId] = useState<string>(initialInterventionId);
  const [unitsDeployed, setUnitsDeployed] = useState<number>(initialUnits);
  const [activeScenario, setActiveScenario] = useState<string>("normal");
  const [graph, setGraph] = useState<ConsequenceChainGraph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadInterventions();
  }, []);

  useEffect(() => {
    loadGraph();
  }, [selectedInterventionId, unitsDeployed, activeScenario]);

  const loadInterventions = async () => {
    try {
      const list = await api.listInterventions();
      setInterventions(list);
    } catch (err) {
      console.error("Failed to load interventions", err);
    }
  };

  const loadGraph = async () => {
    setIsLoading(true);
    try {
      const res = await api.getConsequenceChain({
        intervention_id: selectedInterventionId,
        units_deployed: unitsDeployed,
        neighbourhood_id: initialNeighbourhoodId,
        strategy: initialStrategy,
        active_scenario: activeScenario !== "normal" ? activeScenario : undefined,
      });
      setGraph(res);
    } catch (err) {
      console.error("Failed to generate consequence chain", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentIntervention = interventions.find((i) => i.id === selectedInterventionId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consequence Chain Explorer</h1>
          <p className="page-description">
            ECO-ECHO Signature Innovation: Trace causal ripple effects, water and maintenance trade-offs, equity shifts, and climate stress mitigations.
          </p>
        </div>
      </div>

      {/* Control Studio */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="var(--primary-700)" />
            <span>Interactive Chain Parameters</span>
          </div>
        </div>

        <div className="grid-3">
          <div>
            <label className="form-label">Select Urban Intervention</label>
            <select
              className="form-select"
              value={selectedInterventionId}
              onChange={(e) => setSelectedInterventionId(e.target.value)}
            >
              {interventions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
            {currentIntervention && (
              <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "6px" }}>
                Capital: ${currentIntervention.capital_cost_per_unit}/unit | O&M: ${currentIntervention.annual_maintenance_per_unit}/yr
              </div>
            )}
          </div>

          <div>
            <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Deployment Scale ({currentIntervention?.unit_label || "units"})</span>
              <span style={{ fontWeight: 700 }}>{unitsDeployed.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={unitsDeployed}
              onChange={(e) => setUnitsDeployed(parseInt(e.target.value))}
              className="range-slider"
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "4px" }}>
              Total Surface Footprint: ~{(unitsDeployed * (currentIntervention?.space_consumed_m2_per_unit || 1)).toLocaleString()} m²
            </div>
          </div>

          <div>
            <label className="form-label">Active Scenario Condition</label>
            <select
              className="form-select"
              value={activeScenario}
              onChange={(e) => setActiveScenario(e.target.value)}
            >
              <option value="normal">Baseline Operating Conditions</option>
              <option value="drought">Severe Prolonged Drought (-50% Water)</option>
              <option value="extreme_rainfall">100-Year Cloudburst (+45% Runoff)</option>
              <option value="budget_cut">Fiscal Austerity Shock (-35% Budget)</option>
            </select>
            <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "6px" }}>
              Updates the scenario risk node and dynamic mitigation protocols.
            </div>
          </div>
        </div>
      </div>

      {/* Main Consequence Graph */}
      {graph ? (
        <ConsequenceGraph graph={graph} />
      ) : (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--slate-500)" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <div>Synthesizing causal consequence graph...</div>
        </div>
      )}
    </div>
  );
};
