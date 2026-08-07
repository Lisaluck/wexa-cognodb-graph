import type { TraceNode } from "@/lib/types";

export function NodeList({
  title,
  nodes,
  empty,
}: {
  title: string;
  nodes: TraceNode[];
  empty: string;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="count">{nodes.length}</span>
      </div>
      {nodes.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="node-list">
          {nodes.map((node, index) => (
            <li
              key={`${node.id}-${index}`}
              className="node-item"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className={`badge badge-${node.label.toLowerCase()}`}>
                {node.label}
              </span>
              <div>
                <p className="node-name">{node.name}</p>
                {node.meta ? <p className="muted">{node.meta}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
