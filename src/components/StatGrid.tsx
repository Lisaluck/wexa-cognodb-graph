import type { OverviewStats } from "@/lib/types";

const labels: Array<{ key: keyof OverviewStats; label: string }> = [
  { key: "farms", label: "Farms" },
  { key: "batches", label: "Batches" },
  { key: "facilities", label: "Facilities" },
  { key: "retailers", label: "Retailers" },
  { key: "recalls", label: "Recalls" },
  { key: "relationships", label: "Relationships" },
];

export function StatGrid({ stats }: { stats: OverviewStats }) {
  return (
    <div className="stat-grid">
      {labels.map((item, index) => (
        <article
          key={item.key}
          className="stat"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <p className="stat-label">{item.label}</p>
          <p className="stat-value">{stats[item.key]}</p>
        </article>
      ))}
    </div>
  );
}
