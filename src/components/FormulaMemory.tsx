import { VectorText } from "./VectorText";
import { useState } from "react";
import { useApp } from "../state";

export function FormulaMemory({ formula }: { formula: string }) {
  const { T } = useApp();
  const [hidden, setHidden] = useState(false);
  return (
    <section
      className="formula-memory"
      aria-label={T("Formula memory card", "சூத்திர நினைவட்டை")}
    >
      <div className="formula-memory-heading">
        <span>ƒx · {T("REMEMBER THIS", "நினைவில் கொள்க")}</span>
        <button aria-pressed={hidden} onClick={() => setHidden(!hidden)}>
          {hidden
            ? T("Reveal formulas", "சூத்திரங்களைக் காட்டு")
            : T("Test my recall", "நினைவைச் சோதி")}
        </button>
      </div>
      {hidden ? (
        <p className="formula-recall" role="status">
          {T(
            "Can you write the formula, name its quantities and state when it applies? Reveal it to check.",
            "சூத்திரத்தை எழுதி, கணியங்களைப் பெயரிட்டு, அது எப்போது பொருந்தும் எனக் கூற முடியுமா? திறந்து சரிபார்க்கவும்.",
          )}
        </p>
      ) : (
        <div className="formula-equations">
          {formula
            .split("\n")
            .filter(Boolean)
            .map((line, i) => (
              <div key={i}>
                <span className="formula-step">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span><VectorText text={line === "d / Δt" ? `${T("Average speed", "சராசரிக் கதி")} = d / Δt` : line.replace("instantaneous speed", T("instantaneous speed", "கணக் கதி"))} /></span>
              </div>
            ))}
        </div>
      )}
      <small>
        {T(
          "Read → explain → cover → recall",
          "வாசி → விளக்கு → மறை → நினைவுகூர்",
        )}
      </small>
    </section>
  );
}
