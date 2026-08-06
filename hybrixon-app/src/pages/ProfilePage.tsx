import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { apiGetProfile, apiOpenDm, apiUpdateProfile, type PublicProfile } from "../lib/api";
import { useAuth } from "../lib/auth";

export function ProfilePage() {
  const { username: routeUser } = useParams();
  const { user, logout, refresh } = useAuth();
  const username = routeUser || user?.username || "";
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(true);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    if (!username) {
      setBusy(false);
      return;
    }
    setBusy(true);
    void apiGetProfile(username)
      .then((d) => {
        setProfile(d.profile);
        setError("");
      })
      .catch((e: Error) => {
        setProfile(null);
        setError(e.message);
      })
      .finally(() => setBusy(false));
  }, [username]);

  if (!routeUser && !user) return <Navigate to="/login" replace />;

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.currentTarget);
    fd.set("userId", String(profile.id));
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const res = await apiUpdateProfile(fd);
      setProfile(res.profile);
      setEdit(false);
      setInfo("Profil gespeichert.");
      if (user && user.id === profile.id) await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  if (busy && !profile) {
    return <div className="muted center pad">Profil laden…</div>;
  }
  if (!profile) {
    return (
      <section className="panel-card">
        <h1>Profil nicht gefunden</h1>
        {error ? <div className="flash error">{error}</div> : null}
        <Link className="btn btn-ghost" to="/">
          Zum Feed
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="profile-hero">
        <div
          className="profile-banner"
          style={
            profile.bannerUrl
              ? { backgroundImage: `url(${profile.bannerUrl})` }
              : undefined
          }
        />
        <div className="profile-hero-main">
          <div className="profile-avatar-wrap">
            {profile.avatarUrl ? (
              <img className="profile-avatar" src={profile.avatarUrl} alt="" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-hero-text">
            <h1>{profile.displayName}</h1>
            <p className="muted">
              @{profile.username}
              {profile.isBrand ? " · Offizielles Profil" : ""}
            </p>
            {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
            <div className="profile-meta">
              {profile.location ? <span>{profile.location}</span> : null}
              {profile.website ? (
                <a href={profile.website} target="_blank" rel="noreferrer">
                  Website
                </a>
              ) : null}
              {profile.instagram ? (
                <a
                  href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              ) : null}
              {profile.facebook ? (
                <a
                  href={`https://facebook.com/${profile.facebook.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              ) : null}
              {profile.tiktok ? (
                <a
                  href={`https://tiktok.com/@${profile.tiktok.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  TikTok
                </a>
              ) : null}
              {profile.x ? (
                <a
                  href={`https://x.com/${profile.x.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  X
                </a>
              ) : null}
            </div>
            <div className="hero-actions pad-sm">
              {user && user.username !== profile.username ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    void apiOpenDm(profile.username)
                      .then((r) => {
                        window.location.href = r.url;
                      })
                      .catch((e: Error) => setError(e.message))
                  }
                >
                  Nachricht schreiben
                </button>
              ) : null}
              {!user ? (
                <Link className="btn btn-sm btn-ghost" to="/login">
                  Anmelden für PN
                </Link>
              ) : null}
              {profile.canEdit ? (
                <button type="button" className="btn btn-sm" onClick={() => setEdit((v) => !v)}>
                  {edit ? "Abbrechen" : "Profil bearbeiten"}
                </button>
              ) : null}
              {user && user.username === profile.username ? (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => void logout()}>
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="flash error">{error}</div> : null}
      {info ? <div className="flash">{info}</div> : null}

      {edit && profile.canEdit ? (
        <section className="panel-card">
          <h2>Profil bearbeiten</h2>
          <form className="form" encType="multipart/form-data" onSubmit={(e) => void onSave(e)}>
            <label>
              Anzeigename
              <input name="display_name" maxLength={48} defaultValue={profile.displayName} />
            </label>
            <label>
              Bio
              <textarea name="bio" maxLength={500} rows={4} defaultValue={profile.bio} />
            </label>
            <label>
              Ort
              <input name="location" maxLength={80} defaultValue={profile.location} />
            </label>
            <label>
              Website
              <input name="website" maxLength={240} defaultValue={profile.website} placeholder="https://" />
            </label>
            <label>
              Instagram
              <input name="instagram" maxLength={120} defaultValue={profile.instagram} />
            </label>
            <label>
              Facebook
              <input name="facebook" maxLength={120} defaultValue={profile.facebook} />
            </label>
            <label>
              TikTok
              <input name="tiktok" maxLength={120} defaultValue={profile.tiktok} />
            </label>
            <label>
              X / Twitter
              <input name="x" maxLength={120} defaultValue={profile.x} />
            </label>
            <label>
              Profilbild
              <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
            <label className="check">
              <input name="remove_avatar" type="checkbox" value="1" />
              <span>Profilbild entfernen</span>
            </label>
            <label>
              Banner
              <input name="banner" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
            <label className="check">
              <input name="remove_banner" type="checkbox" value="1" />
              <span>Banner entfernen</span>
            </label>
            <button className="btn btn-block" disabled={busy}>
              Speichern
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
