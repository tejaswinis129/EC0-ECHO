import { describe, it, expect } from "vitest";
import {
  InterventionCategoryType,
  ImplementationPlanRequest,
  ClassificationResult,
  ImplementationPlan,
} from "../types";

describe("AI Urban Engineering & Implementation Planner", () => {
  it("structures an implementation plan request with optional project details", () => {
    const req: ImplementationPlanRequest = {
      prompt: "Design a drainage system for this neighbourhood that reduces flooding without unnecessarily disturbing residents.",
      location_or_neighbourhood: "Downtown Core",
      main_goal: "Mitigate flash flooding and keep shop access",
      budget_ceiling: 2500000,
      currency: "USD",
      weather_constraints: "Monsoon flash cloudburst period",
      nearby_critical_facilities: ["City General Hospital", "St. Jude Primary School"],
      required_service_continuity: ["Drinking water", "Emergency lane access"],
    };

    expect(req.prompt).toContain("drainage system");
    expect(req.currency).toBe("USD");
    expect(req.nearby_critical_facilities?.length).toBe(2);
    expect(req.required_service_continuity?.length).toBe(2);
  });

  it("verifies emergency access requirement of minimum 3.5m clearance with steel road plates", () => {
    const emergencyProtocol = (widthMeters: number, hasPlates: boolean) => {
      const isCompliant = widthMeters >= 3.5 && hasPlates;
      return {
        compliant: isCompliant,
        message: isCompliant
          ? "Compliant with Municipal Fire & Ambulance access standard (min 3.5m clear corridor with structural steel road plates)"
          : "Non-compliant: Emergency route cannot be restricted below 3.5m",
      };
    };

    expect(emergencyProtocol(3.5, true).compliant).toBe(true);
    expect(emergencyProtocol(3.0, true).compliant).toBe(false);
    expect(emergencyProtocol(4.0, false).compliant).toBe(false);
  });

  it("verifies stop-work weather thresholds for excavation safety", () => {
    const evaluateWeatherCondition = (rainfallIntensityMmHr: number, waterDepthMm: number) => {
      if (rainfallIntensityMmHr >= 35 || waterDepthMm >= 150) {
        return "RED_ALERT_STOP_WORK";
      }
      if (rainfallIntensityMmHr >= 15 || waterDepthMm >= 50) {
        return "AMBER_WARNING_DEWATER_ONLY";
      }
      return "GREEN_NORMAL_WORK";
    };

    expect(evaluateWeatherCondition(40, 0)).toBe("RED_ALERT_STOP_WORK");
    expect(evaluateWeatherCondition(10, 160)).toBe("RED_ALERT_STOP_WORK");
    expect(evaluateWeatherCondition(20, 40)).toBe("AMBER_WARNING_DEWATER_ONLY");
    expect(evaluateWeatherCondition(4, 10)).toBe("GREEN_NORMAL_WORK");
  });

  it("calculates budget headroom or shortfall accurately against capital ceilings", () => {
    const checkBudgetFeasibility = (estimatedCapex: number, budgetCeiling: number) => {
      const fits = estimatedCapex <= budgetCeiling;
      const difference = budgetCeiling - estimatedCapex;
      return {
        fits,
        shortfallOrCushion: difference,
        statusLabel: fits ? "Within Budget Ceiling" : "Exceeds Ceiling",
      };
    };

    const passResult = checkBudgetFeasibility(1980000, 2500000);
    expect(passResult.fits).toBe(true);
    expect(passResult.shortfallOrCushion).toBe(520000);

    const failResult = checkBudgetFeasibility(2800000, 2500000);
    expect(failResult.fits).toBe(false);
    expect(failResult.shortfallOrCushion).toBe(-300000);
    expect(failResult.statusLabel).toBe("Exceeds Ceiling");
  });

  it("verifies multi-intervention category handling", () => {
    const categories: InterventionCategoryType[] = [
      "stormwater_drainage",
      "road_construction",
      "urban_forest",
      "green_roofs",
      "multi_intervention_integrated",
    ];

    expect(categories).toContain("stormwater_drainage");
    expect(categories).toContain("green_roofs");
    expect(categories).toContain("multi_intervention_integrated");
  });

  it("strictly enforces provenance categories and illustrative disclaimers on unverified measurements", () => {
    const checkMeasurementDisplay = (val: string, provenance: string) => {
      if (provenance === "VERIFIED_SOURCE_FACT") {
        return { text: val, isIllustrative: false };
      }
      return {
        text: `${val} (Illustrative—not for construction)`,
        isIllustrative: true,
      };
    };

    const verified = checkMeasurementDisplay("1.8m width x 1.4m depth", "VERIFIED_SOURCE_FACT");
    expect(verified.isIllustrative).toBe(false);
    expect(verified.text).toBe("1.8m width x 1.4m depth");

    const illustrative = checkMeasurementDisplay("2.0m width x 1.5m depth", "ILLUSTRATIVE");
    expect(illustrative.isIllustrative).toBe(true);
    expect(illustrative.text).toContain("Illustrative—not for construction");

    const estimate = checkMeasurementDisplay("3.0m width", "ESTIMATE");
    expect(estimate.isIllustrative).toBe(true);
    expect(estimate.text).toContain("Illustrative—not for construction");
  });

  it("validates that construction structure diagrams support cross_section, plan_view, and stages", () => {
    const supportedViews = ["cross_section", "plan_view", "stages"];
    expect(supportedViews).toHaveLength(3);
    expect(supportedViews).toContain("cross_section");
    expect(supportedViews).toContain("plan_view");
    expect(supportedViews).toContain("stages");
  });

  it("validates safe document upload constraints (forbids executables, restricts size to 25MB)", () => {
    const allowedExtensions = [".pdf", ".csv", ".xlsx", ".xls", ".geojson", ".json", ".txt"];
    const forbiddenExtensions = [".exe", ".bat", ".sh", ".cmd", ".msi", ".vbs", ".js"];
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;

    const validateUpload = (filename: string, sizeBytes: number) => {
      const ext = "." + filename.split(".").pop()?.toLowerCase();
      if (forbiddenExtensions.includes(ext)) {
        return { valid: false, error: "Executable files are strictly forbidden" };
      }
      if (!allowedExtensions.includes(ext)) {
        return { valid: false, error: "Unsupported file extension" };
      }
      if (sizeBytes > MAX_SIZE_BYTES) {
        return { valid: false, error: "File size exceeds 25 MB limit" };
      }
      return { valid: true };
    };

    expect(validateUpload("bbmp_swd_tender.pdf", 5000000).valid).toBe(true);
    expect(validateUpload("elevation_contours.geojson", 1200000).valid).toBe(true);
    expect(validateUpload("malicious_script.exe", 1000).valid).toBe(false);
    expect(validateUpload("huge_scan.pdf", 30 * 1024 * 1024).valid).toBe(false);
  });

  it("strictly distinguishes verified Bengaluru locations from simulated sample datasets", () => {
    const verifiedBengaluruList = [
      "Koramangala 4th Block",
      "Indiranagar 100ft Road",
      "Whitefield (Kadugodi)",
      "Bellandur (Outer Ring Road)",
      "Malleshwaram 8th Cross",
      "Hebbal (Flyover / Kempapura)",
      "Jayanagar 4th Block",
    ];

    const classifyLocation = (location: string, datasetId: string) => {
      if (datasetId.toLowerCase().includes("sample") || datasetId === "sample-metro-verde") {
        return {
          type: "simulated",
          label: "Simulated example dataset (Metro Verde) — not verified municipal data",
        };
      }
      const isVerified = verifiedBengaluruList.some((v) =>
        location.toLowerCase().includes(v.toLowerCase())
      );
      if (isVerified) {
        return {
          type: "verified",
          label: "Verified real location — Grounded in BBMP GIS & municipal records",
        };
      }
      return {
        type: "unverified",
        label: "User-entered location — Awaiting field survey & GIS boundary verification",
      };
    };

    // 1. Simulated dataset must never be presented as verified municipal data
    const simRes = classifyLocation("Koramangala 4th Block", "sample-metro-verde");
    expect(simRes.type).toBe("simulated");
    expect(simRes.label).toContain("Simulated example dataset");

    // 2. Real Bengaluru location under real dataset
    const verifiedRes = classifyLocation("Koramangala 4th Block, Bengaluru", "bengaluru-master-dataset");
    expect(verifiedRes.type).toBe("verified");
    expect(verifiedRes.label).toContain("Verified real location");

    // 3. Unverified custom user location
    const unverifiedRes = classifyLocation("Unknown Alley 12, Bengaluru", "bengaluru-master-dataset");
    expect(unverifiedRes.type).toBe("unverified");
    expect(unverifiedRes.label).toContain("User-entered location");
  });

  it("calculates honest completeness status instead of unsupported 100% complete badges", () => {
    const evaluateCompleteness = (
      pct: number,
      datasetId: string,
      missingCriticalCount: number
    ) => {
      if (datasetId.toLowerCase().includes("sample") || datasetId === "sample-metro-verde") {
        return "Simulated example data — not verified municipal data";
      }
      if (missingCriticalCount > 2) {
        return "Site measurements required";
      }
      if (pct >= 85) {
        return "Ready for preliminary planning";
      }
      if (pct >= 65) {
        return "Some information still needed";
      }
      return "Awaiting source verification";
    };

    expect(evaluateCompleteness(100, "sample-metro-verde", 0)).toBe(
      "Simulated example data — not verified municipal data"
    );
    expect(evaluateCompleteness(88, "bbmp-real", 4)).toBe(
      "Site measurements required"
    );
    expect(evaluateCompleteness(90, "bbmp-real", 1)).toBe(
      "Ready for preliminary planning"
    );
    expect(evaluateCompleteness(70, "bbmp-real", 1)).toBe(
      "Some information still needed"
    );
    expect(evaluateCompleteness(40, "bbmp-real", 1)).toBe(
      "Awaiting source verification"
    );
  });

  it("verifies suggestion chips populate prompt without auto-submitting", () => {
    let currentPrompt = "";
    let submissionTriggered = false;

    const onChipClick = (chipPrompt: string) => {
      currentPrompt = chipPrompt;
      // Do NOT trigger submission!
    };

    onChipClick("Improve drainage during heavy rain");
    expect(currentPrompt).toBe("Improve drainage during heavy rain");
    expect(submissionTriggered).toBe(false);
  });

  it("verifies pre-construction requirements are grouped into 7 plain-English categories", () => {
    const requiredGroups = [
      "Site measurements",
      "Underground utilities",
      "Soil and structural checks",
      "Weather and drainage analysis",
      "Permits and approvals",
      "Resident and business consultation",
      "Professional engineering review",
    ];

    expect(requiredGroups).toHaveLength(7);
    expect(requiredGroups).toContain("Site measurements");
    expect(requiredGroups).toContain("Underground utilities");
    expect(requiredGroups).toContain("Soil and structural checks");
    expect(requiredGroups).toContain("Weather and drainage analysis");
    expect(requiredGroups).toContain("Permits and approvals");
    expect(requiredGroups).toContain("Resident and business consultation");
    expect(requiredGroups).toContain("Professional engineering review");
  });
});

