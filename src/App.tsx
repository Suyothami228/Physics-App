import { ExamPrep } from "./components/ExamPrep";
import { useEffect, useRef, useState } from "react";
import { parseRoute, link } from "./model";
import { useApp } from "./state";
import { API_ENABLED, request } from "./api";
import {
  Home,
  Explorer,
  ChapterPage,
  Outline,
  Progress,
} from "./components/Pages";
import { Icon, Heading } from "./components/UI";
import { Simulation } from "./components/Simulation";
import { Practice } from "./components/Practice";
import { ManagedLesson } from "./components/ManagedLesson";
import { InstrumentHub } from "./components/InstrumentHub";
export default function App() {
  const {
    T,
    language,
    setLanguage,
    saved,
    setSaved,
    setLast,
    storageOK,
    account,
  } = useApp();
  const [hash, setHash] = useState(location.hash);
  const main = useRef<HTMLElement>(null);
  const route = parseRoute(hash);
  const lessonId = route.type === "lesson" ? route.lesson.id : null;
  useEffect(() => {
    const changed = () => {
      setHash(location.hash);
      main.current?.focus();
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = T("Iyal · Physics Lab", "இயல் · பௌதிகவியல்");
  }, [language]);
  useEffect(() => {
    if (lessonId) setLast(lessonId);
  }, [lessonId]);
  const nav = [
    ["home", T("Home", "முகப்பு")],
    ["chapters", T("Chapters", "அத்தியாயங்கள்")],
    ["practice", T("Exam prep", "தேர்வுப் பயிற்சி")],
    ["progress", T("Progress", "முன்னேற்றம்")],
  ];
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        {T("Skip to content", "உள்ளடக்கத்திற்குச் செல்க")}
      </a>
      <aside className="sidebar">
        <a className="wordmark" href="#/home">
          <span className="brand-symbol">இ</span>
          <span>
            இயல்<small>PHYSICS LAB</small>
          </span>
        </a>
        <div className="nav-caption">
          {T("YOUR WORKSPACE", "உங்கள் கற்றலிடம்")}
        </div>
        <nav aria-label={T("Main navigation", "முதன்மை வழிசெலுத்தல்")}>
          {nav.map(([id, label]) => (
            <a
              key={id}
              href={"#/" + id}
              className={
                "nav-link " +
                (route.type === id ||
                (id === "chapters" &&
                  ["chapter", "lesson"].includes(route.type))
                  ? "active"
                  : "")
              }
              aria-current={route.type === id ? "page" : undefined}
            >
              <Icon name={id} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-course">
            <span>A/L</span>
            <div>
              {T("Physics", "பௌதிகவியல்")}
              <small>{T("Sri Lankan curriculum", "இலங்கை பாடத்திட்டம்")}</small>
            </div>
          </div>
          <p>
            {T(
              "A little curiosity, every day.",
              "ஒவ்வொரு நாளும் சிறிது ஆர்வம்.",
            )}
          </p>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <span className="top-crumb">
            {T("Your learning space", "உங்கள் கற்றல் வெளி")} / A/L Physics
          </span>
          <div className="top-actions">
            <span className="beta">PROTOTYPE</span>
            {account && (
              <button
                onClick={async () => {
                  try {
                    await request("session", "DELETE");
                    location.reload();
                  } catch {
                    alert(
                      T(
                        "Could not sign out. Please retry.",
                        "வெளியேற முடியவில்லை. மீண்டும் முயலவும்.",
                      ),
                    );
                  }
                }}
              >
                {account.username} · {T("Sign out", "வெளியேறு")}
              </button>
            )}
            <button
              onClick={() => setLanguage(language === "ta" ? "en" : "ta")}
            >
              {language === "ta" ? "English ↗" : "தமிழ் ↗"}
            </button>
          </div>
        </header>
        <main id="main" ref={main} tabIndex={-1}>
          {!storageOK && (
            <p role="alert">
              {T(
                "Browser storage unavailable. Progress may not survive a reload.",
                "உலாவிச் சேமிப்பு கிடைக்கவில்லை. முன்னேற்றம் மீளேற்றத்தில் இழக்கப்படலாம்.",
              )}
            </p>
          )}
          {route.type === "home" ? (
            <Home />
          ) : route.type === "chapters" ? (
            <Explorer />
          ) : route.type === "chapter" ? (
            <ChapterPage chapter={route.chapter} />
          ) : route.type === "progress" ? (
            <Progress />
          ) : route.type === "practice" ? (
            <ExamPrep
              chapter={route.chapter}
              kind={route.kind}
              adaptive={route.adaptive}
              section={route.section}
            />
          ) : route.type === "lesson" ? (
            <>
              <a className="breadcrumb" href={link(route.chapter.id)}>
                ← {route.chapter[language]}
              </a>
              {route.lesson.edit_url && (
                <a
                  className="admin-edit-link"
                  href={route.lesson.edit_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {T("Edit this lesson ↗", "இந்தப் பாடத்தைத் திருத்துக ↗")}
                </a>
              )}
              <div className="lesson-heading">
                <div>
                  <h1>{route.lesson[language]}</h1>
                  <span
                    className={
                      "pill " +
                      (route.lesson.available ? "pill-live" : "pill-outline")
                    }
                  >
                    {route.lesson.available
                      ? T("Learning lesson", "கற்றல் பாடம்")
                      : T("Lesson outline", "பாட வரைவு")}
                  </span>
                </div>
                <button
                  className={
                    "save-button " +
                    (saved.includes(route.lesson.id) ? "is-saved" : "")
                  }
                  aria-pressed={saved.includes(route.lesson.id)}
                  onClick={() =>
                    setSaved((s) =>
                      s.includes(route.lesson.id)
                        ? s.filter((id) => id !== route.lesson.id)
                        : [...s, route.lesson.id],
                    )
                  }
                >
                  <Icon name="bookmark" />
                  {saved.includes(route.lesson.id)
                    ? T("Saved", "சேமிக்கப்பட்டது")
                    : T("Save lesson", "பாடத்தைச் சேமி")}
                </button>
              </div>
              {route.lesson.id === "01/instruments" ? (
                <InstrumentHub
                  lesson={route.lesson}
                  instrument={route.instrument}
                />
              ) : route.lesson.id === "02/projectile" &&
                route.lesson.available ? (
                <>
                  <ManagedLesson
                    key={route.lesson.id}
                    lesson={route.lesson}
                    hideEmpty
                  />
                  <div className="lesson-ui">
                    <Simulation />
                    <Practice />
                  </div>
                </>
              ) : (
                <ManagedLesson key={route.lesson.id} lesson={route.lesson} />
              )}
            </>
          ) : (
            <Heading
              kicker="404"
              title={T("Page not found", "பக்கம் கிடைக்கவில்லை")}
              description={T(
                "Use the chapter explorer to continue.",
                "அத்தியாயப் பட்டியலைப் பயன்படுத்தவும்.",
              )}
            />
          )}
        </main>
        <footer className="app-footer">
          <span>
            {T("Explore. Understand.", "ஆராயுங்கள். புரிந்துகொள்ளுங்கள்.")}
          </span>
          <span>
            {T(
              API_ENABLED
                ? "Tamil content: educator review pending · Practice saved to your account"
                : "Tamil content: educator review pending · Progress stored on this browser",
              API_ENABLED
                ? "தமிழ்: ஆசிரியர் மீளாய்வு நிலுவையில் · பயிற்சி உங்கள் கணக்கில் சேமிக்கப்படுகிறது"
                : "தமிழ்: ஆசிரியர் மீளாய்வு நிலுவையில் · முன்னேற்றம் இந்த உலாவியில் சேமிக்கப்படுகிறது",
            )}
          </span>
        </footer>
      </div>
    </>
  );
}
