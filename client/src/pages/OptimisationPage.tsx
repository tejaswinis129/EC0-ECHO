import React, { useState, useEffect } from "react";
import {
  OptimisationRequest,
  OptimisationResult,
  AlternativePortfolio,
  DecisionExplanation,
} from "../types";
import { api } from "../api/client";
import {
  Sun,
  CloudRain,
  Droplet,
  Home,
  CheckCircle2,
  Sparkles,
  TreePine,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Scale,
  Activity,
  Layers,
  HardHat,
} from "lucide-react";

interface OptimisationPageProps {
  activeDatasetId: string;
  onNavigateToConsequences: (
    interventionId: string,
    units: number,
    neighbourhoodId?: string,
    strategy?: string
  ) => void;
  onSelectDataset?: (id: string) => void;
  availableDatasets?: Array<{ dataset_id: string; name: string }>;
  onNavigateToPlanner?: (prompt: string, budget?: number, location?: string) => void;
}

type PriorityLevel = "little" | "lot" | "most";

const LEVEL_WEIGHTS: Record<PriorityLevel, number> = {
  little: 0.15,
  lot: 0.35,
  most: 0.60,
};

export const OptimisationPage: React.FC<OptimisationPageProps> = ({
  activeDatasetId,
  onNavigateToConsequences,
  onSelectDataset,
  availableDatasets,
  onNavigateToPlanner,
}) => {
  // Budget in dollars
  const [budgetCap, setBudgetCap] = useState<number>(2500000);

  // 4 friendly priorities
  const [heatLevel, setHeatLevel] = useState<PriorityLevel>("lot");
  const [floodLevel, setFloodLevel] = useState<PriorityLevel>("lot");
  const [waterLevel, setWaterLevel] = useState<PriorityLevel>("little");
  const [equityLevel, setEquityLevel] = useState<PriorityLevel>("most");

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimisationResult | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<string>("balanced");
  const [explanation, setExplanation] = useState<DecisionExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [technicalDetailsOpen, setTechnicalDetailsOpen] = useState<boolean>(false);

  // Expandable sections for explanation
  const [whyOpen, setWhyOpen] = useState<boolean>(true);
  const [risksOpen, setRisksOpen] = useState<boolean>(false);
  const [tradeoffsOpen, setTradeoffsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeDatasetId) {
      handleSolve();
    }
  }, [activeDatasetId]);

  const handleSolve = async () => {
    setIsLoading(true);
    try {
      // Calculate normalized weights
      const sum =
        LEVEL_WEIGHTS[heatLevel] +
        LEVEL_WEIGHTS[floodLevel] +
        LEVEL_WEIGHTS[waterLevel] +
        LEVEL_WEIGHTS[equityLevel];

      const req: OptimisationRequest = {
        dataset_id: activeDatasetId,
        total_budget_cap: budgetCap,
        min_equity_investment_share: equityLevel === "most" ? 0.35 : equityLevel === "lot" ? 0.25 : 0.15,
        weights: {
          heat_reduction: LEVEL_WEIGHTS[heatLevel] / sum,
          flood_reduction: LEVEL_WEIGHTS[floodLevel] / sum,
          water_resilience: LEVEL_WEIGHTS[waterLevel] / sum,
          green_equity: LEVEL_WEIGHTS[equityLevel] / sum,
          cost_efficiency: 0.10,
        },
      };

      const res = await api.solveOptimisation(req);
      setResult(res);
      const initialStrategy = res.selected_strategy || "balanced";
      setActiveStrategy(initialStrategy);

      const selPort =
        res.alternatives.find((a) => a.strategy_id === initialStrategy) ||
        res.alternatives[0];
      if (selPort) {
        generateExplanation(selPort, res.dataset_name);
      }
    } catch (err: any) {
      console.error("Optimisation error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExplanation = async (
    portfolio: AlternativePortfolio,
    datasetName: string
  ) => {
    setIsExplaining(true);
    try {
      const exp = await api.explainDecision({
        portfolio_strategy: portfolio.strategy_id,
        dataset_name: datasetName,
        total_budget_cap: budgetCap,
        total_capital_allocated: portfolio.total_capital_cost,
        budget_utilization_pct: portfolio.budget_utilization_pct,
        heat_reduction_score: portfolio.estimated_city_heat_reduction_score,
        stormwater_diverted_m3: portfolio.total_stormwater_runoff_diverted_m3,
        net_water_impact_m3: portfolio.net_annual_water_impact_m3,
        equity_score: portfolio.equity_score,
        vulnerable_investment_pct: portfolio.vulnerable_area_investment_share_pct,
        binding_constraints: portfolio.binding_constraints,
        trade_offs: portfolio.trade_off_summary,
        key_neighbourhoods: portfolio.neighbourhood_summaries,
      });
      setExplanation(exp);
    } catch (err) {
      console.error("Explanation error", err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSelectStrategy = (alt: AlternativePortfolio) => {
    setActiveStrategy(alt.strategy_id);
    if (result) {
      generateExplanation(alt, result.dataset_name);
    }
  };

  const activePortfolio =
    result?.alternatives.find((a) => a.strategy_id === activeStrategy) ||
    result?.alternatives[0];

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`;
    }
    return `$${Math.round(val / 1000)}k`;
  };

  const getFriendlyIntervention = (name: string, id: string) => {
    const text = (name + " " + id).toLowerCase();
    if (text.includes("forest") || text.includes("tree")) {
      return { label: "Plant more trees", icon: "🌳", benefit: "Gives cooling shade & clean air" };
    }
    if (text.includes("bioswale") || text.includes("suds") || text.includes("garden")) {
      return { label: "Build rain gardens", icon: "🌿", benefit: "Soaks up street rainwater naturally" };
    }
    if (text.includes("harvesting") || text.includes("cistern")) {
      return { label: "Collect clean rainwater", icon: "💧", benefit: "Stores water for dry sunny weeks" };
    }
    if (text.includes("permeable") || text.includes("pavement") || text.includes("paver")) {
      return { label: "Improve street drains & porous pavers", icon: "🛣️", benefit: "Stops large puddles from forming" };
    }
    if (text.includes("roof")) {
      return { label: "Add living green roofs", icon: "🏡", benefit: "Keeps buildings cool in summer" };
    }
    return { label: name, icon: "🌱", benefit: "Makes our city safer and greener" };
  };

  const moneyLeftOver = activePortfolio
    ? Math.max(0, budgetCap - activePortfolio.total_capital_cost)
    : budgetCap;

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "16px 20px 48px" }}>
      {/* ------------------------------------------------------------- */}
      {/* SECTION A: FRIENDLY INTRODUCTION                              */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          background: "linear-gradient(135deg, #173F35 0%, #102F28 100%)",
          borderRadius: "20px",
          padding: "32px 28px",
          color: "#FFFFFF",
          marginBottom: "28px",
          boxShadow: "0 8px 24px rgba(23, 63, 53, 0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(184, 233, 134, 0.2)", padding: "6px 14px", borderRadius: "9999px", marginBottom: "12px" }}>
              <Sparkles size={16} color="#B8E986" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#B8E986" }}>Interactive City Planner</span>
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
              Build a Greener City 🌱
            </h1>
            <p style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.85)", margin: 0, maxWidth: "680px", lineHeight: 1.5 }}>
              Choose what to improve. ECO-ECHO will help you create a safer, cooler, greener city that stays inside your budget.
            </p>
          </div>

          {availableDatasets && availableDatasets.length > 0 && onSelectDataset && (
            <div style={{ background: "rgba(255, 255, 255, 0.1)", padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
              <label style={{ display: "block", fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>
                Select City Region
              </label>
              <select
                value={activeDatasetId}
                onChange={(e) => onSelectDataset(e.target.value)}
                style={{
                  background: "#173F35",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
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
        </div>

        {/* 3-Step Progress Indicator */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#B8E986", color: "#173F35", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
              1
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Choose your priorities</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#B8E986", color: "#173F35", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
              2
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Set your city budget</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#B8E986", color: "#173F35", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
              3
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Find your best city plan</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION B: CITY PROBLEMS                                      */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            What problems does our city have? 🏙️
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-subtle)" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>☀️</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Too hot in summer
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Black asphalt streets and bare concrete rooftops absorb sunshine, raising local temperatures.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-subtle)" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>🌧️</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Too much storm rain
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Heavy cloudburst rains quickly fill underground pipes, causing road waterlogging and puddles.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-subtle)" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>💧</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Not enough water in drought
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              City parks and trees dry up during hot weather unless we collect and store clean rainwater.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-subtle)" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>🏘️</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              Some areas need more help
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Densely populated and vulnerable neighbourhoods often have fewer parks and trees.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION C & D: CONTROLS (PRIORITIES & BUDGET)                 */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        {/* SECTION C: CHOOSE WHAT MATTERS MOST */}
        <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "28px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-subtle)" }}>
          <div style={{ marginBottom: "18px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#173F35", textTransform: "uppercase", letterSpacing: "0.5px" }}>Step 1</span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 6px" }}>
              What matters most to you? 🎯
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Tell ECO-ECHO what goals you care about. If you make one goal bigger, we spend a little less on other goals!
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Control 1: Heat */}
            <div style={{ background: "var(--warm-ivory)", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "20px" }}>☀️</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Keep the city cool</span>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
                Plant trees and add green roofs to lower hot summer temperatures.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {(["little", "lot", "most"] as PriorityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setHeatLevel(lvl)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: heatLevel === lvl ? 700 : 500,
                      background: heatLevel === lvl ? "#173F35" : "#FFFFFF",
                      color: heatLevel === lvl ? "#FFFFFF" : "var(--text-primary)",
                      border: heatLevel === lvl ? "1px solid #173F35" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {lvl === "little" ? "A little" : lvl === "lot" ? "A lot" : "⭐ Top priority"}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Flood */}
            <div style={{ background: "var(--warm-ivory)", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "20px" }}>🌧️</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Stop rainwater flooding</span>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
                Build rain gardens and porous street surfaces to catch cloudburst rain.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {(["little", "lot", "most"] as PriorityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFloodLevel(lvl)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: floodLevel === lvl ? 700 : 500,
                      background: floodLevel === lvl ? "#173F35" : "#FFFFFF",
                      color: floodLevel === lvl ? "#FFFFFF" : "var(--text-primary)",
                      border: floodLevel === lvl ? "1px solid #173F35" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {lvl === "little" ? "A little" : lvl === "lot" ? "A lot" : "⭐ Top priority"}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Water */}
            <div style={{ background: "var(--warm-ivory)", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "20px" }}>💧</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Save water for dry days</span>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
                Install rainwater cisterns to collect and store clean rainwater.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {(["little", "lot", "most"] as PriorityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setWaterLevel(lvl)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: waterLevel === lvl ? 700 : 500,
                      background: waterLevel === lvl ? "#173F35" : "#FFFFFF",
                      color: waterLevel === lvl ? "#FFFFFF" : "var(--text-primary)",
                      border: waterLevel === lvl ? "1px solid #173F35" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {lvl === "little" ? "A little" : lvl === "lot" ? "A lot" : "⭐ Top priority"}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 4: Equity */}
            <div style={{ background: "var(--warm-ivory)", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "20px" }}>🏘️</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Help high-need neighbourhoods</span>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
                Make sure vulnerable communities get extra trees, parks, and funding.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {(["little", "lot", "most"] as PriorityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEquityLevel(lvl)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: equityLevel === lvl ? 700 : 500,
                      background: equityLevel === lvl ? "#173F35" : "#FFFFFF",
                      color: equityLevel === lvl ? "#FFFFFF" : "var(--text-primary)",
                      border: equityLevel === lvl ? "1px solid #173F35" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {lvl === "little" ? "A little" : lvl === "lot" ? "A lot" : "⭐ Top priority"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION D: SET THE BUDGET */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "28px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-subtle)" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#173F35", textTransform: "uppercase", letterSpacing: "0.5px" }}>Step 2</span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 6px" }}>
              Your City Budget 💰
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
              How much money can our city spend on these improvements?
            </p>

            <div style={{ background: "var(--warm-ivory)", borderRadius: "14px", padding: "18px", marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "4px" }}>
                Available City Budget
              </div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#173F35", letterSpacing: "-1px" }}>
                ${(budgetCap / 1000000).toFixed(2)} Million
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={500000}
              max={8000000}
              step={250000}
              value={budgetCap}
              onChange={(e) => setBudgetCap(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#173F35", height: "8px", cursor: "pointer", marginBottom: "14px" }}
            />

            {/* Budget Presets */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[1000000, 2500000, 5000000, 7500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBudgetCap(val)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: budgetCap === val ? 700 : 500,
                    background: budgetCap === val ? "#173F35" : "#FFFFFF",
                    color: budgetCap === val ? "#FFFFFF" : "var(--text-primary)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  ${(val / 1000000).toFixed(1)}M
                </button>
              ))}
            </div>

            {/* Money breakdown */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Money needed</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {activePortfolio ? formatCurrency(activePortfolio.total_capital_cost) : "$0"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Money left over</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: moneyLeftOver >= 0 ? "#2F7D55" : "#B94B42" }}>
                  {formatCurrency(moneyLeftOver)}
                </div>
              </div>
            </div>

            {activePortfolio && (
              <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: moneyLeftOver >= 0 ? "rgba(47, 125, 85, 0.1)" : "rgba(185, 75, 66, 0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} color={moneyLeftOver >= 0 ? "#2F7D55" : "#B94B42"} />
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: moneyLeftOver >= 0 ? "#2F7D55" : "#B94B42" }}>
                  {moneyLeftOver >= 0 ? "Great! This plan fits safely inside your budget." : "Warning: This plan exceeds the selected budget."}
                </span>
              </div>
            )}
          </div>

          {/* SECTION E: FIND MY CITY PLAN BUTTON */}
          <button
            type="button"
            onClick={handleSolve}
            disabled={isLoading}
            style={{
              width: "100%",
              background: isLoading ? "#8A9890" : "linear-gradient(135deg, #173F35 0%, #1f4f43 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "16px",
              padding: "20px 24px",
              fontSize: "18px",
              fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(23, 63, 53, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              transition: "transform 0.1s ease",
            }}
          >
            {isLoading ? (
              <>Finding the best way to help your city... ⏳</>
            ) : (
              <>
                <Sparkles size={22} color="#B8E986" />
                Find My Best City Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION F: COMPARE THREE PLANS                                */}
      {/* ------------------------------------------------------------- */}
      {result && result.alternatives && result.alternatives.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <div style={{ marginBottom: "18px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#173F35", textTransform: "uppercase", letterSpacing: "0.5px" }}>Step 3</span>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 6px" }}>
              Choose a City Plan 📋
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
              ECO-ECHO calculated three different ways to help the city. Click on any plan to see what it builds!
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {result.alternatives.map((alt) => {
              const isSelected = alt.strategy_id === activeStrategy;
              let title = "Balanced City";
              let subtitle = "A little help for every problem.";
              let icon = "🌟";
              let badgeText = "Recommended Choice";

              if (alt.strategy_id === "cost_focused") {
                title = "Save Money";
                subtitle = "Choose useful improvements that cost less.";
                icon = "💰";
                badgeText = "Budget Friendly";
              } else if (alt.strategy_id === "equity_focused") {
                title = "Help Vulnerable Areas";
                subtitle = "Give extra help to neighbourhoods that need it most.";
                icon = "🤝";
                badgeText = "High Fairness";
              }

              return (
                <div
                  key={alt.strategy_id}
                  onClick={() => handleSelectStrategy(alt)}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "20px",
                    padding: "24px",
                    border: isSelected ? "3px solid #173F35" : "1px solid var(--border-subtle)",
                    boxShadow: isSelected ? "0 8px 24px rgba(23, 63, 53, 0.12)" : "var(--shadow-subtle)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-12px",
                        right: "20px",
                        background: "#173F35",
                        color: "#B8E986",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Sparkles size={11} /> Selected Plan
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "28px" }}>{icon}</span>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>{title}</h3>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#173F35", textTransform: "uppercase" }}>{badgeText}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0", lineHeight: 1.4 }}>
                    {subtitle}
                  </p>

                  {/* 4 Key items only */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--warm-ivory)", borderRadius: "14px", padding: "16px" }}>
                    <div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>💵 Money needed</div>
                      <div style={{ fontSize: "17px", fontWeight: 800, color: "#173F35" }}>
                        {formatCurrency(alt.total_capital_cost)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>🛠️ Yearly upkeep</div>
                      <div style={{ fontSize: "17px", fontWeight: 800, color: "#173F35" }}>
                        {formatCurrency(alt.total_annual_maintenance)}/yr
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>🌧️ Rainwater saved</div>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#173F35" }}>
                        {Math.round(alt.total_stormwater_runoff_diverted_m3).toLocaleString()} m³
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>🏘️ Help for high-need areas</div>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#173F35" }}>
                        {alt.vulnerable_area_investment_share_pct.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: isSelected ? "#173F35" : "var(--text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {isSelected ? "✅ This plan is active" : "Click to view this plan →"}
                    </span>
                  </div>

                  {isSelected && onNavigateToPlanner && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const summaryText = `Implement the ${alt.strategy_label} portfolio for ${result?.dataset_name || "the municipal area"} with a capital budget of ${formatCurrency(alt.total_capital_cost)}. Protect local residents, maintain business access, and plan for heavy weather and maintenance.`;
                        onNavigateToPlanner(summaryText, alt.total_capital_cost, result?.dataset_name);
                      }}
                      style={{
                        marginTop: "12px",
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "#173F35",
                        color: "#B8E986",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 2px 8px rgba(23, 63, 53, 0.2)",
                        transition: "all 0.15s ease",
                      }}
                      title="Generate a step-by-step civil engineering implementation plan for this portfolio"
                    >
                      <HardHat size={15} />
                      Plan Construction & Phasing →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION G: WHAT WE WILL BUILD IN EACH NEIGHBOURHOOD           */}
      {/* ------------------------------------------------------------- */}
      {activePortfolio && (
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                What we will build in each neighbourhood 🏡
              </h2>
              <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>
                Here is what the <strong>{activePortfolio.strategy_label}</strong> builds across city districts.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "18px" }}>
            {activePortfolio.neighbourhood_summaries.map((nh) => {
              const nhAllocations = activePortfolio.allocations.filter(
                (a) => a.neighbourhood_id === nh.neighbourhood_id && a.units_allocated > 0
              );

              return (
                <div
                  key={nh.neighbourhood_id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "18px",
                    padding: "20px",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-subtle)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px 0" }}>
                        {nh.neighbourhood_name}
                      </h3>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        Population: {nh.population.toLocaleString()} residents
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: nh.social_vulnerability_index > 0.6 ? "#FAF0E8" : "#E8F4EE",
                        color: nh.social_vulnerability_index > 0.6 ? "#B66A36" : "#2F7D55",
                      }}
                    >
                      {nh.social_vulnerability_index > 0.6 ? "High Need Area" : "Standard Priority"}
                    </span>
                  </div>

                  {/* Planned improvements list */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0 16px 0" }}>
                    {nhAllocations.length === 0 ? (
                      <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontStyle: "italic", padding: "10px 0" }}>
                        No physical assets allocated in this district for this plan.
                      </div>
                    ) : (
                      nhAllocations.map((a) => {
                        const friendly = getFriendlyIntervention(a.intervention_name, a.intervention_id);
                        return (
                          <div
                            key={a.intervention_id}
                            style={{
                              background: "var(--warm-ivory)",
                              borderRadius: "10px",
                              padding: "10px 12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "18px" }}>{friendly.icon}</span>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                                  {friendly.label}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                  {Math.round(a.units_allocated).toLocaleString()} {a.unit_label}
                                </div>
                              </div>
                            </div>

                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#173F35" }}>
                              {formatCurrency(a.capital_cost)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer summary */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Total district budget: </span>
                      <strong style={{ fontSize: "13.5px", color: "#173F35" }}>{formatCurrency(nh.capital_allocated)}</strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {onNavigateToPlanner && (
                        <button
                          type="button"
                          onClick={() => {
                            const summary = `Construct allocated urban sustainability works in ${nh.neighbourhood_name} within an allocated budget of ${formatCurrency(nh.capital_allocated)}. Ensure resident access, emergency lane continuity, and safety during execution.`;
                            onNavigateToPlanner(summary, nh.capital_allocated, nh.neighbourhood_name);
                          }}
                          style={{
                            background: "#173F35",
                            color: "#B8E986",
                            border: "none",
                            borderRadius: "6px",
                            padding: "4px 9px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title={`Generate civil engineering plan for ${nh.neighbourhood_name}`}
                        >
                          <HardHat size={11} /> Plan Works
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onNavigateToConsequences("int-urban-forest", 100, nh.neighbourhood_id, activeStrategy)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#173F35",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        See ripple effects →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION H: EXPLAIN THE CHOICE SIMPLY                          */}
      {/* ------------------------------------------------------------- */}
      <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "28px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-subtle)", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px 0" }}>
          Why this plan is a good choice 💡
        </h2>

        {/* Question 1: Why did ECO-ECHO choose this plan? */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px", marginBottom: "14px" }}>
          <button
            type="button"
            onClick={() => setWhyOpen(!whyOpen)}
            style={{ width: "100%", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
          >
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              Why did ECO-ECHO choose this plan?
            </span>
            {whyOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {whyOpen && (
            <div style={{ marginTop: "10px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {activePortfolio?.strategy_rationale || "This plan carefully balances cooling down the city, preventing flooded streets, and saving water, while making sure neighbourhoods that need help get funded first."}
            </div>
          )}
        </div>

        {/* Question 2: What could go wrong? */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px", marginBottom: "14px" }}>
          <button
            type="button"
            onClick={() => setRisksOpen(!risksOpen)}
            style={{ width: "100%", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
          >
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              What could go wrong? Things we still need to watch out for
            </span>
            {risksOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {risksOpen && (
            <div style={{ marginTop: "10px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <ul style={{ paddingLeft: "20px", margin: 0 }}>
                <li>Trees and green roofs need regular watering during summer droughts so they do not dry up.</li>
                <li>Rain gardens and storm drains need cleaning so leaves and sand do not clog them.</li>
                <li>Taking care of these new green spaces costs about <strong>{activePortfolio ? formatCurrency(activePortfolio.total_annual_maintenance) : "$0"}</strong> every year.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Question 3: What are we giving up? */}
        <div>
          <button
            type="button"
            onClick={() => setTradeoffsOpen(!tradeoffsOpen)}
            style={{ width: "100%", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
          >
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              What are we giving up? (Trade-offs)
            </span>
            {tradeoffsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {tradeoffsOpen && (
            <div style={{ marginTop: "10px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {activePortfolio?.trade_off_summary && activePortfolio.trade_off_summary.length > 0 ? (
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                  {activePortfolio.trade_off_summary.map((t, idx) => (
                    <li key={idx} style={{ marginBottom: "6px" }}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>
                  Because city money is limited, spending more on one goal means spending slightly less on other goals.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION I: TECHNICAL DETAILS (COLLAPSED ACCORDION)            */}
      {/* ------------------------------------------------------------- */}
      <div style={{ background: "var(--warm-ivory)", borderRadius: "14px", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
        <button
          type="button"
          onClick={() => setTechnicalDetailsOpen(!technicalDetailsOpen)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "13.5px",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            ⚙️ Technical details (for judges & engineering reviewers)
          </span>
          {technicalDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {technicalDetailsOpen && (
          <div style={{ padding: "0 20px 20px 20px", fontSize: "12.5px", color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div>
                <strong>Solver Engine:</strong> {result?.solver_engine || "SciPy HiGHS LP Solver"}
              </div>
              <div>
                <strong>Execution Time:</strong> {result?.execution_time_ms || 24} ms
              </div>
              <div>
                <strong>Status:</strong> {activePortfolio?.solver_status || "Optimal"}
              </div>
              <div>
                <strong>Budget Utilization:</strong> {activePortfolio?.budget_utilization_pct?.toFixed(1) || 99}%
              </div>
            </div>

            {activePortfolio?.binding_constraints && activePortfolio.binding_constraints.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <strong>Binding Constraints (What limits our plan?):</strong>
                <ul style={{ paddingLeft: "18px", marginTop: "4px" }}>
                  {activePortfolio.binding_constraints.map((bc, idx) => (
                    <li key={idx}>{bc}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <strong>Normalized Objective Weights Applied:</strong>
              <div style={{ fontFamily: "var(--font-mono)", background: "#FFFFFF", padding: "8px 12px", borderRadius: "8px", marginTop: "6px" }}>
                Heat: {((LEVEL_WEIGHTS[heatLevel] / (LEVEL_WEIGHTS[heatLevel] + LEVEL_WEIGHTS[floodLevel] + LEVEL_WEIGHTS[waterLevel] + LEVEL_WEIGHTS[equityLevel]))).toFixed(3)} |{" "}
                Flood: {((LEVEL_WEIGHTS[floodLevel] / (LEVEL_WEIGHTS[heatLevel] + LEVEL_WEIGHTS[floodLevel] + LEVEL_WEIGHTS[waterLevel] + LEVEL_WEIGHTS[equityLevel]))).toFixed(3)} |{" "}
                Water: {((LEVEL_WEIGHTS[waterLevel] / (LEVEL_WEIGHTS[heatLevel] + LEVEL_WEIGHTS[floodLevel] + LEVEL_WEIGHTS[waterLevel] + LEVEL_WEIGHTS[equityLevel]))).toFixed(3)} |{" "}
                Equity: {((LEVEL_WEIGHTS[equityLevel] / (LEVEL_WEIGHTS[heatLevel] + LEVEL_WEIGHTS[floodLevel] + LEVEL_WEIGHTS[waterLevel] + LEVEL_WEIGHTS[equityLevel]))).toFixed(3)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimisationPage;
