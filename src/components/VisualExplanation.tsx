import { ConceptArt } from "./ConceptArt";
import { useState } from "react";
import { useApp } from "../state";
import type { ContentBlock } from "./ManagedLesson";
export function splitConcepts(text: string) {
  return text
    .split(/\n\s*\n/)
    .filter((x) => x.trim())
    .map((chunk) => {
      const [heading, ...lines] = chunk.split("\n");
      return { heading, body: lines.join("\n") };
    });
}
export function VisualExplanation({ block }: { block: ContentBlock }) {
  const { T, language } = useApp();
  const [active, setActive] = useState(0);
  const items = splitConcepts(
    block[language === "ta" ? "body_ta" : "body_en"] ?? "",
  );
  const step = Math.min(active, items.length - 1);
  if (block.presentation === "process")
    return (
      <div className="investigation-cycle">
        <div
          className="cycle-steps"
          role="group"
          aria-label={T("Investigation steps", "ஆய்வுப் படிகள்")}
        >
          {items.map((item, i) => (
            <button
              key={i}
              aria-pressed={step === i}
              onClick={() => setActive(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {item.heading}
            </button>
          ))}
        </div>
        <div className="cycle-detail" aria-live="polite">
          <span className="cycle-number">
            {String(step + 1).padStart(2, "0")}
          </span>
          <div>
            <h3>{items[step]?.heading}</h3>
            <p>{items[step]?.body}</p>
          </div>
        </div>
        <button
          className="cycle-next"
          onClick={() => setActive((step + 1) % items.length)}
        >
          {step === items.length - 1
            ? T("↻ Return to observation", "↻ அவதானிப்பிற்கு மீள்க")
            : T("Next step →", "அடுத்த படி →")}
        </button>
        <p className="cycle-note">
          {T(
            "Evidence can send you back to an earlier step. Science is iterative.",
            "சான்றுகள் உங்களை முந்தைய படிக்கு மீண்டும் அழைத்துச் செல்லலாம். விஞ்ஞானம் மீளாய்வுடன் தொடர்கிறது.",
          )}
        </p>
      </div>
    );
  return (
    <div className={"concept-grid visual-" + block.presentation}>
      {items.map((item, i) => (
        <section className="concept-tile" key={i}>
          <ConceptArt blockKey={block.key} index={i} />
          <span className="concept-number">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3>{item.heading}</h3>
          <p>{item.body}</p>
        </section>
      ))}
    </div>
  );
}
