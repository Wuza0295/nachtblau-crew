import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await login(String(fd.get("login") || ""), String(fd.get("password") || ""));
      nav("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel-card">
      <h1>Anmelden</h1>
      {error ? <div className="flash error">{error}</div> : null}
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          Benutzername oder E-Mail
          <input name="login" required autoComplete="username" />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <button className="btn btn-block" disabled={busy}>
          {busy ? "…" : "Einloggen"}
        </button>
      </form>
      <p className="muted center pad-sm">
        Noch kein Konto? <Link to="/register">Registrieren</Link>
      </p>
    </section>
  );
}
