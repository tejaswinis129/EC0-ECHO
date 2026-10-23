import React, { useState } from "react";
import {
  LayoutDashboard,
  Database,
  BarChart2,
  Sliders,
  CloudRain,
  GitFork,
  FileCheck2,
  Settings as SettingsIcon,
  ShieldCheck,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeDatasetId: string;
  onSelectDataset: (id: string) => void;
  availableDatasets: Array<{ dataset_id: string; name: string }>;
  backendOnline: boolean;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  activeDatasetId,
  onSelectDataset,
  availableDatasets,
  backendOnline,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      description: "Urban intelligence overview",
    },
    {
      id: "data",
      label: "Data Explorer",
      icon: Database,
      description: "Ingestion & spatial datasets",
    },
    {
      id: "risk",
      label: "Risk Analysis",
      icon: BarChart2,
      description: "Multi-hazard spatial vulnerability",
    },
    {
      id: "optimise",
      label: "Optimisation Studio",
      icon: Sliders,
      description: "Constrained decision solver",
    },
    {
      id: "scenarios",
      label: "Scenario Lab",
      icon: CloudRain,
      description: "Climate shocks & stress-testing",
    },
    {
      id: "consequences",
      label: "Consequence Chain",
      icon: GitFork,
      badge: "Signature",
      description: "Downstream causal impacts",
    },
    {
      id: "reports",
      label: "Reports & Audits",
      icon: FileCheck2,
      description: "Cryptographic decision records",
    },
    {
      id: "settings",
      label: "Settings",
      icon: SettingsIcon,
      description: "Architecture & credentials",
    },
  ];

  const currentNav =
    navigationItems.find((item) => item.id === currentTab) || {
      id: currentTab,
      label: currentTab === "privacy" ? "Privacy Policy" : currentTab === "terms" ? "Terms of Use" : "Analytics",
      description: "ECO-ECHO Urban Sustainability Intelligence Platform",
    };

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(23, 63, 53, 0.6)",
            zIndex: 90,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Forest Green Sidebar */}
      <aside className={`app-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div
            className="brand-badge-row"
            onClick={() => handleTabClick("overview")}
            title="ECO-ECHO Home"
          >
            <div className="brand-icon-box">
              {/* Geometric leaf / echo-wave vector mark */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 0 1 10 10c0 4.42-3.58 8-8 8H6a4 4 0 0 1-4-4c0-3.31 2.69-6 6-6h2" />
                <path d="M14 6a6 6 0 0 1 6 6" />
                <path d="M10 10a2 2 0 0 1 2 2" />
              </svg>
            </div>
            <div className="brand-text-block">
              <div className="brand-title-main">
                <span>ECO-ECHO</span>
              </div>
              <div className="brand-tagline-sub">
                Understand the consequences.
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleTabClick(item.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="engine-status-box">
            <div className="engine-status-left">
              <span
                className={`pulse-dot ${backendOnline ? "" : "offline"}`}
              />
              <span>{backendOnline ? "Engine Ready" : "Reconnecting..."}</span>
            </div>
            <span style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.55)", fontFamily: "var(--font-mono)" }}>
              v1.0.0
            </span>
          </div>

          <div className="sidebar-footer-links">
            <button
              className="sidebar-footer-link"
              onClick={() => handleTabClick("privacy")}
            >
              Privacy Policy
            </button>
            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
            <button
              className="sidebar-footer-link"
              onClick={() => handleTabClick("terms")}
            >
              Terms of Use
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="app-main-viewport">
        {/* Top Header Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="top-bar-title-block">
              <h2>{currentNav.label}</h2>
              <p>{currentNav.description}</p>
            </div>
          </div>

          <div className="top-bar-right">
            {/* Dataset Selector Dropdown */}
            <div className="dataset-select-wrapper" title="Switch Active City Dataset">
              <Database size={14} color="var(--primary-green)" />
              <select
                value={activeDatasetId}
                onChange={(e) => onSelectDataset(e.target.value)}
                aria-label="Active Dataset Selection"
              >
                {availableDatasets.length > 0 ? (
                  availableDatasets.map((ds) => (
                    <option key={ds.dataset_id} value={ds.dataset_id}>
                      {ds.name}
                    </option>
                  ))
                ) : (
                  <option value="sample-metro-verde">Metro Verde Urban Resilience</option>
                )}
              </select>
              <ChevronDown size={13} color="var(--secondary-text)" />
            </div>

            {/* GitHub Link */}
            <a
              href="https://github.com/tejaswinis129/EC0-ECHO"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              title="View on GitHub"
            >
              <ShieldCheck size={14} color="var(--primary-green)" />
              <span>Repository</span>
              <ExternalLink size={12} color="var(--secondary-text)" />
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
};
