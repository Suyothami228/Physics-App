import { useEffect, useState, type ReactNode } from "react";
import { API_ENABLED, request, loadLearningData, type Account } from "../api";
import { AppProvider } from "../state";
import type { Attempt } from "../model";

export function BackendGate({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(API_ENABLED);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const session = await request<{ user: Account | null }>("session");
      if (session.user) {
        const rows = await loadLearningData();
        setHistory(rows);
        setAccount(session.user);
        setReady(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (API_ENABLED) void connect();
  }, []);
  if (!API_ENABLED) return <AppProvider>{children}</AppProvider>;
  if (ready && account)
    return (
      <AppProvider key={account.id} initialHistory={history} account={account}>
        {children}
      </AppProvider>
    );
  return (
    <div className="account-page">
      <section className="account-card">
        <span className="brand-symbol">இ</span>
        <h1>இயல் · Iyal</h1>
        <h2>Sign in · உள்நுழைக</h2>
        <p>
          Continue your physics practice with saved account progress.
          <br />
          உங்கள் கணக்கில் சேமித்த பயிற்சியைத் தொடருங்கள்.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await request("session", "POST", { username, password });
              setPassword("");
              await connect();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign-in failed");
              setBusy(false);
            }
          }}
        >
          <label htmlFor="username">Username · பயனர் பெயர்</label>
          <input
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
          />
          <label htmlFor="password">Password · கடவுச்சொல்</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <button className="btn btn-blue" disabled={busy}>
            {busy ? "Connecting… / இணைக்கிறது…" : "Sign in / உள்நுழைக"}
          </button>
        </form>
        {error && (
          <p role="alert">
            {error}{" "}
            <button onClick={() => void connect()} disabled={busy}>
              Retry / மீண்டும் முயல்க
            </button>
          </p>
        )}
        <small>
          Ask your course administrator for an account.
          <br />
          கணக்கிற்கு உங்கள் பாட நிர்வாகியை அணுகவும்.
        </small>
      </section>
    </div>
  );
}
