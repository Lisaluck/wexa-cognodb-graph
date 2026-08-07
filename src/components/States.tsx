export function LoadingState({ label = "Loading graph…" }: { label?: string }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <div className="pulse-bar" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="state-box empty">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-box error" role="alert">
      <h3>{title}</h3>
      <p>{body}</p>
      {onRetry ? (
        <button type="button" className="btn secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
