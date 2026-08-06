import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiCreatePost } from "../lib/api";
import { useAuth } from "../lib/auth";

export function ComposePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (adult) fd.set("isAdult", "1");
    if (adult && fd.get("policyOk") === "on") fd.set("policyOk", "1");
    setBusy(true);
    setError("");
    try {
      await apiCreatePost(fd);
      nav("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel-card">
      <h1>Neuen Beitrag</h1>
      <p className="muted">
        Soft-18+ nur mit Freigabe — kein 18++ / Porno / Gewalt.{" "}
        <a href="/rules.php">Regeln</a>
      </p>
      {error ? <div className="flash error">{error}</div> : null}
      <form className="form" encType="multipart/form-data" onSubmit={(e) => void onSubmit(e)}>
        <label>
          Dein Text
          <textarea name="body" maxLength={4000} placeholder="Was gibt's Neues?" />
        </label>
        {user.ageVerified ? (
          <>
            <label className="check">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />
              <span>Als Soft-18+ markieren</span>
            </label>
            {adult ? (
              <>
                <label>
                  Bild (optional, nur Soft-18+)
                  <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
                </label>
                <label className="check">
                  <input name="policyOk" type="checkbox" required={adult} />
                  <span>Ich halte die Soft-18+-Inhaltsregeln ein.</span>
                </label>
              </>
            ) : null}
          </>
        ) : null}
        <button className="btn btn-block" disabled={busy}>
          {busy ? "…" : "Veröffentlichen"}
        </button>
      </form>
    </section>
  );
}
