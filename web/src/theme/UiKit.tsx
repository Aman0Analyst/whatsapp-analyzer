import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { METRIC_HELP, type MetricHelp } from "../help/metrics";
import "./ui.css";

export function Page({ children }: { children: ReactNode }) {
  return <div className="page">{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return <button className={`btn btn-${variant} ${className}`.trim()} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="select" {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warn";
}) {
  const suffix = tone === "neutral" ? "" : ` badge-${tone}`;
  return <span className={`badge${suffix}`}>{children}</span>;
}

/**
 * A "?" disclosure that explains one statistic: what it means, how it is
 * computed, and where it misleads.
 */
export function InfoTip({
  metric,
  help,
  align = "start",
}: {
  metric?: keyof typeof METRIC_HELP;
  help?: MetricHelp;
  align?: "start" | "end";
}) {
  const copy = help ?? (metric ? METRIC_HELP[metric] : undefined);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (!copy) return null;

  return (
    <span className="tip" ref={wrap}>
      <button
        type="button"
        className="tip-btn"
        aria-label={`What is ${copy.title}?`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        ?
      </button>
      {open ? (
        <span
          className={`tip-panel${align === "end" ? " tip-panel-end" : ""}`}
          id={panelId}
          role="note"
        >
          <span className="tip-title">{copy.title}</span>
          <p className="tip-body">{copy.what}</p>
          <dl className="tip-meta">
            <dt>How it is measured</dt>
            <dd>{copy.how}</dd>
            {copy.caveat ? (
              <>
                <dt>Read with care</dt>
                <dd>{copy.caveat}</dd>
              </>
            ) : null}
          </dl>
        </span>
      ) : null}
    </span>
  );
}

/** A card with a titled header, optional description, help tip and actions. */
export function SectionCard({
  title,
  description,
  metric,
  aside,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  metric?: keyof typeof METRIC_HELP;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="section-head">
        <div>
          <div className="section-heading">
            <h2>{title}</h2>
            {metric ? <InfoTip metric={metric} /> : null}
          </div>
          {description ? <p className="section-desc">{description}</p> : null}
        </div>
        {aside ? <div className="section-aside">{aside}</div> : null}
      </div>
      {children}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  hint,
  metric,
  align = "start",
}: {
  label: string;
  value: string;
  hint?: string;
  metric?: keyof typeof METRIC_HELP;
  align?: "start" | "end";
}) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {metric ? <InfoTip metric={metric} align={align} /> : null}
      </div>
      <span className="stat-value">{value}</span>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {hint ? <span className="kpi-hint">{hint}</span> : null}
    </div>
  );
}

export function Meter({ share, colorVar }: { share: number; colorVar?: string }) {
  return (
    <div className="meter">
      <div
        className="meter-fill"
        style={{
          width: `${Math.max(1, Math.round(share * 100))}%`,
          background: colorVar ? `var(${colorVar})` : undefined,
        }}
      />
    </div>
  );
}
