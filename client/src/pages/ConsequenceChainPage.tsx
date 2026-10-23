import React, { useState, useEffect } from "react";
import { ConsequenceChainGraph, InterventionDefinition } from "../types";
import { api } from "../api/client";
import { ConsequenceGraph } from "../components/ConsequenceGraph";
import { Sliders, RefreshCw, Layers } from "lucide-react";

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
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Consequence Chain Explorer</h1>
          <p>
            ECO-ECHO Signature Feature: Trace direct physical benefits, life-cycle operational costs, water consumption
            trade-offs, social equity dynamics, and climate shock vulnerabilities.
          </p>
        </div>
      </div>

      {/* Compact Interactive Parameters Panel */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title-group">
            <Sliders size={18} color="var(--forest-green)" />
            <div className="card-title">Intervention & Simulation Parameters</div>
          </div>
          {currentIntervention && (
            <span className="badge badge-neutral">
              Category: {currentIntervention.category.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="grid-cols-3" style={{ marginBottom: 0 }}>
          <div>
            <label className="form-label">Urban Intervention Strategy</label>
            <select
              className="form-control"
              value={selectedInterventionId}
              onChange={(e) => setSelectedInterventionId(e.target.value)}
            >
              {interventions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {currentIntervention && (
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Capital: ${currentIntervention.capital_cost_per_unit}/unit • O&M: ${currentIntervention.annual_maintenance_per_unit}/yr
              </div>
            )}
          </div>

          <div>
            <div className="form-label-row">
              <span>Deployment Scale ({currentIntervention?.unit_label || "units"})</span>
              <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--forest-green)" }}>
                {unitsDeployed.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={unitsDeployed}
              onChange={(e) => setUnitsDeployed(parseInt(e.target.value))}
              className="eco-slider"
            />
            <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Surface Footprint: ~{(unitsDeployed * (currentIntervention?.space_consumed_m2_per_unit || 1)).toLocaleString()} m²
            </div>
          </div>

          <div>
            <label className="form-label">Active Scenario Condition</label>
            <select
              className="form-control"
              value={activeScenario}
              onChange={(e) => setActiveScenario(e.target.value)}
            >
              <option value="normal">Baseline Operating Conditions</option>
              <option value="drought">Severe Prolonged Drought (-50% Water)</option>
              <option value="extreme_rainfall">100-Year Cloudburst (+45% Runoff)</option>
              <option value="budget_cut">Fiscal Austerity Shock (-35% Budget)</option>
            </select>
            <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Simulates downstream stress and triggers mitigation safeguards.
            </div>
          </div>
        </div>
      </div>

      {/* Main Consequence Graph */}
      {graph ? (
        <ConsequenceGraph graph={graph} />
      ) : (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} style={{ margin: "0 auto 12px auto", animation: "spin 1s linear infinite" }} />
          <div>Synthesizing causal consequence graph...</div>
        </div>
      )}
    </div>
  );
};
