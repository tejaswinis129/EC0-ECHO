import { describe, it, expect } from "vitest";
import {
  calculateBudgetPlan,
  formatCurrencyValue,
  USD_TO_INR_RATE,
  DEFAULT_BUDGET_INTERVENTIONS,
  BudgetSetupParams,
} from "../utils/budgetCalculator";
import {
  getCityGeoData,
  validateCustomGeoJSON,
  METRO_VERDE_GEO,
  COASTAL_BASIN_GEO,
} from "../data/geoData";

describe("Smart Sustainability Budget Planner", () => {
  const baseParams: BudgetSetupParams = {
    total_budget_cap: 2500000,
    annual_maintenance_ceiling: 180000,
    project_duration_years: 10,
    available_land_m2: 250000,
    water_availability_cap_m3: 40000,
    min_equity_share: 0.3,
    contingency_reserve_pct: 0.05,
    currency: "USD",
  };

  it("calculates baseline planned capex, remaining budget, and contingency correctly", () => {
    const allocations = {
      "int-urban-forest": 1000, // 1000 * $380 = $380,000
      "int-green-roof": 2000,   // 2000 * $110 = $220,000
    };

    const res = calculateBudgetPlan(baseParams, allocations, "baseline");

    expect(res.total_planned_capex).toBe(600000);
    expect(res.effective_budget_cap).toBe(2500000);
    expect(res.contingency_reserve).toBe(125000); // 5% of 2.5M
    expect(res.usable_budget).toBe(2375000);
    expect(res.remaining_budget).toBe(1775000); // 2375000 - 600000
    expect(res.is_feasible).toBe(true);
    expect(res.violations.length).toBe(0);
  });

  it("detects capital budget overrun and flags violation", () => {
    const allocations = {
      "int-urban-forest": 10000, // 10,000 * $380 = $3,800,000 (> 2.375M usable)
    };

    const res = calculateBudgetPlan(baseParams, allocations, "baseline");
    expect(res.is_feasible).toBe(false);
    expect(res.violations.some((v) => v.includes("Budget Overrun"))).toBe(true);
    expect(res.remaining_budget).toBeLessThan(0);
  });

  it("detects maintenance ceiling breach", () => {
    const allocations = {
      "int-urban-forest": 7000, // 7000 * $28/yr = $196,000/yr (> $180k ceiling)
    };

    const res = calculateBudgetPlan(baseParams, allocations, "baseline");
    expect(res.is_feasible).toBe(false);
    expect(res.violations.some((v) => v.includes("Maintenance Ceiling Exceeded"))).toBe(true);
  });

  it("simulates fiscal budget reduction scenarios properly", () => {
    const allocations = {
      "int-urban-forest": 3000, // $1,140,000 capex
    };

    // 50% budget cut reduces 2.5M to 1.25M, usable budget = 1.25M * 0.95 = 1.1875M
    const res50 = calculateBudgetPlan(baseParams, allocations, "budget_cut_50");
    expect(res50.effective_budget_cap).toBe(1250000);
    expect(res50.usable_budget).toBe(1187500);
    expect(res50.total_planned_capex).toBe(1140000);
    expect(res50.remaining_budget).toBe(47500);
  });

  it("enforces drought water restriction scenario requiring net water surplus", () => {
    // Urban forest consumes +1.65 m3/yr per tree
    const treeAllocations = {
      "int-urban-forest": 500,
    };
    const droughtRes = calculateBudgetPlan(baseParams, treeAllocations, "drought_water_cap");
    expect(droughtRes.is_feasible).toBe(false);
    expect(droughtRes.violations.some((v) => v.includes("Drought Water Cap"))).toBe(true);

    // Combining with rainwater harvesting (which supplies 28 m3/yr per unit) restores surplus
    const offsetAllocations = {
      "int-urban-forest": 500, // +825 m3
      "int-rainwater-harvesting": 50, // -1400 m3
    };
    const offsetRes = calculateBudgetPlan(baseParams, offsetAllocations, "drought_water_cap");
    expect(offsetRes.net_water_demand_m3_year).toBeLessThan(0);
    expect(offsetRes.violations.some((v) => v.includes("Drought Water Cap"))).toBe(false);
  });

  it("formats currency consistently in USD and INR without mixing calculations", () => {
    const amountUsd = 1000000;
    const usdFormatted = formatCurrencyValue(amountUsd, "USD", true);
    const inrFormatted = formatCurrencyValue(amountUsd, "INR", true);

    expect(usdFormatted).toBe("$1.00M");
    expect(inrFormatted).toContain("₹");
    expect(inrFormatted).toContain("Cr");

    // Exact INR check: 1,000,000 USD * 83.5 = 83,500,000 INR = 8.35 Cr
    expect(inrFormatted).toBe("₹8.35 Cr");
  });
});

describe("City Map and Geographic Integrity", () => {
  it("returns realistic illustrative GeoJSON for Metro Verde dataset", () => {
    const geo = getCityGeoData("sample-metro-verde");
    expect(geo.is_illustrative).toBe(true);
    expect(geo.features.length).toBe(8);
    expect(geo.features.some((f) => f.id === "NB-01")).toBe(true);
    expect(geo.features.some((f) => f.properties.neighbourhood_name === "Downtown Core")).toBe(true);
    expect(geo.center[0]).toBeCloseTo(23.028, 2);
  });

  it("returns realistic coastal GeoJSON for Coastal Basin dataset", () => {
    const geo = getCityGeoData("coastal_basin_sample");
    expect(geo.is_illustrative).toBe(true);
    expect(geo.features.length).toBe(6);
    expect(geo.features.some((f) => f.id === "CB-01")).toBe(true);
    expect(geo.features.some((f) => f.properties.neighbourhood_name === "Marina Bayfront")).toBe(true);
  });

  it("validates custom GeoJSON and catches invalid syntax", () => {
    const badJson = "{ invalid: json }";
    const invalidRes = validateCustomGeoJSON(badJson);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.error).toBeDefined();

    const notGeoJson = JSON.stringify({ hello: "world" });
    const notGeoRes = validateCustomGeoJSON(notGeoJson);
    expect(notGeoRes.valid).toBe(false);

    const validGeo = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { neighbourhood_id: "CUSTOM-01" },
          geometry: {
            type: "Polygon",
            coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
          },
        },
      ],
    });
    const validRes = validateCustomGeoJSON(validGeo);
    expect(validRes.valid).toBe(true);
    expect(validRes.featureCount).toBe(1);
  });
});
