import type { ReactNode, CSSProperties } from "react";
import { useApp } from "../state";
import { link, type Chapter } from "../model";
const paths: Record<string, string> = {
  home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  chapters: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  practice: "M8 3h8v4H8zM6 5H4v16h16V5h-2M8 12h8M8 16h5",
  progress: "M4 20V4M4 20h17M8 16v-4M13 16V8M18 16V5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  bookmark: "M6 3h12v18l-6-4-6 4Z",
  check: "m5 12 4 4L19 6",
  back: "m14 6-6 6 6 6",
  search: "M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  play: "m8 4 12 8-12 8Z",
};
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.chapters} />
    </svg>
  );
}
export const ButtonLink = ({
  to,
  children,
  kind = "btn-blue",
}: {
  to: string;
  children: ReactNode;
  kind?: string;
}) => (
  <a className={"btn " + kind} href={to}>
    {children}
    <Icon name="arrow" size={18} />
  </a>
);
export function Heading({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function ChapterCard({ chapter: c }: { chapter: Chapter }) {
  const { language, T, score } = useApp();
  return (
    <a
      className="chapter-card"
      style={{ "--chapter": c.color } as CSSProperties}
      href={link(c.id)}
    >
      <div className="card-top">
        <span className="chapter-number">{c.id}</span>
        <span className="formula-mark">{c.formula}</span>
      </div>
      <h3>{c[language]}</h3>
      <p>{c.description[language]}</p>
      <div className="card-footer">
        <span>
          {c.lessons.length} {T("subchapters", "உட்பாடங்கள்")}
        </span>
        <Icon name="arrow" size={17} />
      </div>
      {c.id === "02" && score.total > 0 && (
        <div className="card-evidence">
          {T(
            "Projectile practice in progress",
            "எறிய இயக்கப் பயிற்சி தொடங்கியுள்ளது",
          )}
        </div>
      )}
    </a>
  );
}
export function Trajectory() {
  return (
    <svg
      className="trajectory"
      viewBox="0 0 400 180"
      role="img"
      aria-label="Projectile trajectory"
    >
      <defs>
        <pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse">
          <path d="M35 0H0V35" fill="none" stroke="white" strokeOpacity=".1" />
        </pattern>
      </defs>
      <rect width="400" height="180" fill="url(#grid)" />
      <path
        d="M24 151Q194 -88 367 151"
        fill="none"
        stroke="#d5fb69"
        strokeWidth="3"
        strokeDasharray="5 7"
      />
      <path d="M24 151H377" stroke="white" strokeOpacity=".4" />
      <circle cx="196" cy="31" r="7" fill="#d5fb69" />
      <path
        d="M196 31h69m-8-6 8 6-8 6"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
      <text x="270" y="36" fill="white">
        vₓ
      </text>
      <text x="177" y="64" fill="#d5fb69">
        vᵧ = 0
      </text>
    </svg>
  );
}
