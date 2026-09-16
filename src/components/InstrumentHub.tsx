import { useApp } from "../state";
import type { Lesson } from "../model";
import { instruments } from "../domain/instruments";
import { ManagedLesson } from "./ManagedLesson";
import "../styles/instruments.css";
export function InstrumentHub({
  lesson,
  instrument,
}: {
  lesson: Lesson;
  instrument?: string;
}) {
  const { T } = useApp();
  const selected = instruments.find((i) => i.slug === instrument);
  if (selected)
    return (
      <section>
        <a className="breadcrumb" href="#/chapter/01/instruments">
          ← {T("All measuring instruments", "அனைத்து அளவீட்டுக் கருவிகள்")}
        </a>
        <div className="instrument-intro">
          <span className="instrument-symbol" aria-hidden="true">
            {selected.symbol}
          </span>
          <div>
            <h2>{T(selected.en, selected.ta)}</h2>
            <p>{T(selected.use, selected.useTa)}</p>
          </div>
        </div>
        <ManagedLesson
          key={selected.slug}
          lesson={lesson}
          instrument={selected.slug}
        />
      </section>
    );
  return (
    <section>
      <div className="instrument-overview">
        <span className="eyebrow">
          {T(
            "UNDERSTAND · CHOOSE YOUR INSTRUMENT",
            "புரிதல் · கருவியைத் தேர்க",
          )}
        </span>
        <h2>{T("What are you measuring?", "எதை அளவிடப் போகிறீர்கள்?")}</h2>
        <p>
          {T(
            "Choose by the quantity, object shape, measuring range and required resolution. Check zero, use the correct measuring faces, and consider uncertainty. A finer scale alone does not guarantee a more accurate result.",
            "கணியம், பொருளின் வடிவம், அளவீட்டு வீச்சு, தேவையான பிரிதிறன் ஆகியவற்றுக்கேற்ப தேர்க. பூச்சியத்தைச் சோதித்து, சரியான அளவிடும் முகங்களைப் பயன்படுத்தி நிச்சயமின்மையைக் கருத்தில் கொள்க. நுண்ணிய அளவுகோல் மட்டும் அதிகச் செம்மையை உறுதிப்படுத்தாது.",
          )}
        </p>
        <p>
          {T(
            "Open an instrument to learn how it works, explore it and check your understanding.",
            "கருவி இயங்கும் முறையைக் கற்று, ஆராய்ந்து, புரிதலைச் சோதிக்க ஒரு கருவியைத் திறக்கவும்.",
          )}
        </p>
      </div>
      <div className="instrument-grid">
        {instruments.map((i) => (
          <a
            key={i.slug}
            className="instrument-card"
            href={`#/chapter/01/instruments/${i.slug}`}
          >
            <span className="instrument-symbol" aria-hidden="true">
              {i.symbol}
            </span>
            <h3>{T(i.en, i.ta)}</h3>
            <p>{T(i.use, i.useTa)}</p>
            <span className="instrument-card-link">
              {T("Open instrument →", "கருவியைத் திறக்க →")}
            </span>
            {i.slug === "vernier" && (
              <small>
                {T("3D measurement lab", "3D அளவீட்டுப் பயிற்சியகம்")}
              </small>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
