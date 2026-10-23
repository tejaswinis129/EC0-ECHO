import React from "react";
import {
  Layers,
  BarChart3,
  Sliders,
  CloudRain,
  GitFork,
  FileText,
  Settings,
  Database,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeDatasetName: string;
  backendOnline: boolean;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  activeDatasetName,
  backendOnline,
  children,
}) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "data", label: "Data Explorer", icon: Database },
    { id: "risk", label: "Risk Analysis", icon: BarChart3 },
    { id: "optimise", label: "Optimisation Studio", icon: Sliders },
    { id: "scenarios", label: "Scenario Lab", icon: CloudRain },
    { id: "consequences", label: "Consequence Chain", icon: GitFork, badge: "Signature" },
    { id: "reports", label: "Reports & Audits", icon: FileText },
    { id: "settings", label: "Settings & Cloud", icon: Settings },
  ];

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-top">
          <div className="brand-section" onClick={() => onSelectTab("overview")}>
            <div className="brand-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 4.42-3.58 8-8 8H6a4 4 0 0 1-4-4c0-3.31 2.69-6 6-6h2" />
                <path d="M14 6a6 6 0 0 1 6 6" />
                <path d="M10 10a2 2 0 0 1 2 2" />
              </svg>
            </div>
            <div>
              <div className="brand-title">
                ECO-ECHO
                <span className="brand-badge">Decision Engine</span>
              </div>
              <div className="brand-subtitle">AI-Driven Urban Sustainability & Resilience</div>
            </div>
          </div>

          <div className="header-meta">
            <div className="status-pill" title="Active Municipal Dataset">
              <Database size={13} color="var(--primary-600)" />
              <span>{activeDatasetName || "Loading..."}</span>
            </div>

            <div className="status-pill">
              <span
                className="status-indicator"
                style={{ background: backendOnline ? "var(--primary-500)" : "var(--rose-600)" }}
              />
              <span>{backendOnline ? "Engine Ready" : "Connecting..."}</span>
            </div>
          </div>
        </div>

        <nav className="nav-bar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${isActive ? "active" : ""}`}
                onClick={() => onSelectTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: "10px",
                      background: isActive ? "var(--primary-600)" : "var(--slate-200)",
                      color: isActive ? "#ffffff" : "var(--slate-700)",
                      padding: "1px 5px",
                      borderRadius: "9999px",
                      fontWeight: 700,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={16} color="var(--primary-700)" />
            <span>ECO-ECHO Decision Support Platform. Heuristic climate planning model.</span>
          </div>

          <div className="footer-links">
            <button onClick={() => onSelectTab("privacy")}>Privacy Policy</button>
            <button onClick={() => onSelectTab("terms")}>Terms of Use</button>
            <a
              href="https://github.com/tejaswinis129/EC0-ECHO"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <span>GitHub Repository</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
