import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await register({
        username: String(fd.get("username") || ""),
        email: String(fd.get("email") || ""),
        password: String(fd.get("password") || ""),
        birthdate: String(fd.get("birthdate") || ""),
        legalOk: fd.get("legalOk") === "on",
      });
      nav("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrierung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel-card">
      <h1>Registrieren</h1>
      <p className="muted">Mindestalter 16. Soft-18+ später freischaltbar.</p>
      {error ? <div className="flash error">{error}</div> : null}
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          Benutzername
          <input name="username" required minLength={3} autoComplete="username" />
        </label>
        <label>
          E-Mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Geburtstag
          <input name="birthdate" type="date" required />
        </label>
        <label className="check">
          <input name="legalOk" type="checkbox" required />
          <span>
            Ich akzeptiere <a href="/terms.php">Nutzungsbedingungen</a> und{" "}
            <a href="/privacy.php">Datenschutz</a>.
          </span>
        </label>
        <button className="btn btn-block" disabled={busy}>
          {busy ? "…" : "Konto erstellen"}
        </button>
      </form>
      <p className="muted center pad-sm">
        Schon dabei? <Link to="/login">Anmelden</Link>
      </p>
    </section>
  );
}
