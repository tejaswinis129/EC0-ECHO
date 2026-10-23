import React, { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { OverviewPage } from "./pages/OverviewPage";
import { DataExplorerPage } from "./pages/DataExplorerPage";
import { RiskAnalysisPage } from "./pages/RiskAnalysisPage";
import { OptimisationPage } from "./pages/OptimisationPage";
import { ScenarioLabPage } from "./pages/ScenarioLabPage";
import { ConsequenceChainPage } from "./pages/ConsequenceChainPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { CityMapPage } from "./pages/CityMapPage";
import { BudgetPlannerPage } from "./pages/BudgetPlannerPage";
import { VisualTransformationPage } from "./pages/VisualTransformationPage";

import { api } from "./api/client";
import { DatasetMetadata, DatasetSummary, RiskOverview } from "./types";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>("overview");
  const [activeDatasetId, setActiveDatasetId] = useState<string>("sample-metro-verde");
  const [metadata, setMetadata] = useState<DatasetMetadata | undefined>(undefined);
  const [summary, setSummary] = useState<DatasetSummary | undefined>(undefined);
  const [riskOverview, setRiskOverview] = useState<RiskOverview | undefined>(undefined);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Shared cross-feature state
  const [selectedNeighbourhoodId, setSelectedNeighbourhoodId] = useState<string>("NB-01");
  const [selectedInterventionId, setSelectedInterventionId] = useState<string>("int-urban-forest");

  // Jump-to-consequence state
  const [consequenceTarget, setConsequenceTarget] = useState<{
    interventionId: string;
    units: number;
    neighbourhoodId?: string;
    strategy?: string;
  }>({
    interventionId: "int-urban-forest",
    units: 450,
  });

  useEffect(() => {
    checkHealthAndLoad();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeDatasetId) {
      loadActiveDataset(activeDatasetId);
    }
  }, [activeDatasetId]);

  const checkBackendHealth = async () => {
    try {
      const h = await api.checkHealth();
      setBackendOnline(h.status === "healthy");
    } catch {
      setBackendOnline(false);
    }
  };

  const checkHealthAndLoad = async () => {
    await checkBackendHealth();
    await loadActiveDataset(activeDatasetId);
  };

  const [availableDatasets, setAvailableDatasets] = useState<Array<{ dataset_id: string; name: string }>>([]);

  const loadActiveDataset = async (datasetId: string) => {
    try {
      const list = await api.listDatasets();
      setAvailableDatasets(list.map((d) => ({ dataset_id: d.dataset_id, name: d.name })));
      const meta = list.find((d) => d.dataset_id === datasetId);
      if (meta) setMetadata(meta);

      const sum = await api.getDatasetSummary(datasetId);
      setSummary(sum);

      const ro = await api.calculateRisk(datasetId);
      setRiskOverview(ro);
    } catch (err) {
      console.error("Error loading active dataset", err);
    }
  };

  const handleNavigateToConsequences = (
    interventionId: string,
    units: number,
    neighbourhoodId?: string,
    strategy?: string
  ) => {
    setConsequenceTarget({
      interventionId,
      units,
      neighbourhoodId,
      strategy,
    });
    setCurrentTab("consequences");
  };

  const handleNavigateToBudget = (neighbourhoodId?: string) => {
    if (neighbourhoodId) setSelectedNeighbourhoodId(neighbourhoodId);
    setCurrentTab("budget");
  };

  const handleNavigateToMap = (neighbourhoodId?: string) => {
    if (neighbourhoodId) setSelectedNeighbourhoodId(neighbourhoodId);
    setCurrentTab("map");
  };

  const handleNavigateToTransformation = (interventionId?: string, neighbourhoodId?: string) => {
    if (interventionId) setSelectedInterventionId(interventionId);
    if (neighbourhoodId) setSelectedNeighbourhoodId(neighbourhoodId);
    setCurrentTab("transformation");
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      activeDatasetId={activeDatasetId}
      onSelectDataset={setActiveDatasetId}
      availableDatasets={availableDatasets}
      backendOnline={backendOnline}
    >
      {currentTab === "overview" && (
        <OverviewPage
          metadata={metadata}
          summary={summary}
          riskOverview={riskOverview}
          onNavigate={setCurrentTab}
        />
      )}

      {currentTab === "map" && (
        <CityMapPage
          activeDatasetId={activeDatasetId}
          onNavigateToBudget={handleNavigateToBudget}
          onNavigateToRisk={() => setCurrentTab("risk")}
          onNavigateToTransformation={handleNavigateToTransformation}
          onNavigateToConsequences={handleNavigateToConsequences}
          selectedNeighbourhoodId={selectedNeighbourhoodId}
          onSelectNeighbourhood={setSelectedNeighbourhoodId}
          availableDatasets={availableDatasets}
          onSelectDataset={setActiveDatasetId}
        />
      )}

      {currentTab === "risk" && (
        <RiskAnalysisPage
          activeDatasetId={activeDatasetId}
          riskOverview={riskOverview}
          onUpdateRiskOverview={setRiskOverview}
          onNavigateToConsequences={handleNavigateToConsequences}
          onNavigateToMap={handleNavigateToMap}
        />
      )}

      {currentTab === "budget" && (
        <BudgetPlannerPage
          activeDatasetId={activeDatasetId}
          onNavigateToMap={handleNavigateToMap}
          onNavigateToTransformation={handleNavigateToTransformation}
          onNavigateToConsequences={handleNavigateToConsequences}
          preselectedNeighbourhoodId={selectedNeighbourhoodId}
        />
      )}

      {currentTab === "optimise" && (
        <OptimisationPage
          activeDatasetId={activeDatasetId}
          onNavigateToConsequences={handleNavigateToConsequences}
          onSelectDataset={setActiveDatasetId}
          availableDatasets={availableDatasets}
        />
      )}

      {currentTab === "transformation" && (
        <VisualTransformationPage
          onNavigateToBudget={handleNavigateToBudget}
          onNavigateToMap={handleNavigateToMap}
          onNavigateToConsequences={handleNavigateToConsequences}
          initialInterventionId={selectedInterventionId}
          initialNeighbourhoodId={selectedNeighbourhoodId}
        />
      )}

      {currentTab === "scenarios" && (
        <ScenarioLabPage activeDatasetId={activeDatasetId} />
      )}

      {currentTab === "consequences" && (
        <ConsequenceChainPage
          initialInterventionId={consequenceTarget.interventionId}
          initialUnits={consequenceTarget.units}
          initialNeighbourhoodId={consequenceTarget.neighbourhoodId}
          initialStrategy={consequenceTarget.strategy}
        />
      )}

      {currentTab === "reports" && (
        <ReportsPage activeDatasetId={activeDatasetId} />
      )}

      {currentTab === "data" && (
        <DataExplorerPage
          activeDatasetId={activeDatasetId}
          onSelectDataset={(id) => {
            setActiveDatasetId(id);
          }}
        />
      )}

      {currentTab === "settings" && <SettingsPage />}

      {currentTab === "privacy" && <PrivacyPage />}

      {currentTab === "terms" && <TermsPage />}
    </Layout>
  );
};

export default App;
