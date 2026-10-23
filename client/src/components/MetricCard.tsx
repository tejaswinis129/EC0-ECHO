import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "forest" | "primary" | "heat" | "water" | "adverse";
  badge?: string;
  icon?: LucideIcon;
  statusWarning?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  variant = "forest",
  badge,
  icon: Icon,
  statusWarning,
}) => {
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-label">
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {Icon && <Icon size={14} />}
          <span>{label}</span>
        </span>
        {badge && <span className="badge badge-neutral">{badge}</span>}
      </div>

      <div className="kpi-value tabular-nums">{value}</div>

      {subtext && <div className="kpi-subtext">{subtext}</div>}

      {statusWarning && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "var(--heat-cost)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: 500,
          }}
        >
          <span>⚠️ {statusWarning}</span>
        </div>
      )}
    </div>
  );
};
