import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiBrandAccounts, apiCreatePost, type BrandAccount } from "../lib/api";
import { useAuth } from "../lib/auth";

export function ComposePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [brands, setBrands] = useState<BrandAccount[]>([]);
  const [asUserId, setAsUserId] = useState(0);

  useEffect(() => {
    if (!user?.isAdmin) return;
    void apiBrandAccounts()
      .then((d) => setBrands(d.accounts))
      .catch(() => setBrands([]));
  }, [user?.isAdmin]);

  if (!user) return <Navigate to="/login" replace />;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (adult) fd.set("isAdult", "1");
    if (adult && fd.get("policyOk") === "on") fd.set("policyOk", "1");
    if (asUserId > 0) fd.set("asUserId", String(asUserId));
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const res = await apiCreatePost(fd);
      if (res.pendingReview) {
        setInfo(
          "Beitrag eingereicht. Soft-18+-Inhalt / Bild wird geprüft und erscheint erst nach Freigabe öffentlich."
        );
        window.setTimeout(() => nav("/"), 1200);
      } else {
        nav("/");
      }
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
        Soft-18+ nur mit Freigabe — kein 18++ / Porno / Gewalt. Bilder werden automatisch geprüft.{" "}
        <a href="/rules.php">Regeln</a>
      </p>
      {error ? <div className="flash error">{error}</div> : null}
      {info ? <div className="flash">{info}</div> : null}

      {user.isAdult && !user.ageVerified ? (
        <div className="age-card" style={{ marginBottom: "1rem" }}>
          <h2>Soft-18+ noch nicht freigeschaltet</h2>
          <p>
            {user.agePending
              ? "Dein Antrag wird geprüft. Normale Beiträge gehen immer."
              : "Für Soft-18+ / Bilder: Gesichtsprüfung oder Soft-Antrag."}
          </p>
          {!user.agePending ? (
            <a className="btn btn-sm" href="/age-verify.php">
              Altersprüfung öffnen
            </a>
          ) : null}
        </div>
      ) : null}

      <form className="form" encType="multipart/form-data" onSubmit={(e) => void onSubmit(e)}>
        {user.isAdmin && brands.length > 0 ? (
          <label>
            Posten als
            <select value={asUserId} onChange={(e) => setAsUserId(Number(e.target.value))}>
              <option value={0}>@{user.username} (du)</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayName} (@{b.username})
                </option>
              ))}
            </select>
          </label>
        ) : null}
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
                  Bild (optional, nur Soft-18+ — Prüfung vor Veröffentlichung)
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
