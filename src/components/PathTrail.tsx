import type { PathHop } from "@/lib/types";

export function PathTrail({ hops }: { hops: PathHop[] }) {
  return (
    <ol className="path-trail">
      {hops.map((hop, index) => (
        <li key={`${hop.id}-${index}`} className="path-hop">
          {hop.relationship ? (
            <span className="path-rel">{hop.relationship.replaceAll("_", " ")}</span>
          ) : null}
          <div className="path-node">
            <span className={`badge badge-${hop.label.toLowerCase()}`}>
              {hop.label}
            </span>
            <p>{hop.name}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
