import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "primary" | "amber" | "rose" | "sky";
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  variant = "primary",
  badge,
}) => {
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-label">
        <span>{label}</span>
        {badge && (
          <span
            style={{
              fontSize: "10px",
              padding: "1px 6px",
              borderRadius: "4px",
              background: "var(--slate-100)",
              color: "var(--slate-600)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {subtext && <div className="kpi-subtext">{subtext}</div>}
    </div>
  );
};
