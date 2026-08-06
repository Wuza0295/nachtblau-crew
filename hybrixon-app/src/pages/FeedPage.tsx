import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFeed, apiLike, timeAgo, type Post } from "../lib/api";
import { useAuth } from "../lib/auth";

export function FeedPage() {
  const { user, brand } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    try {
      const data = await apiFeed();
      setPosts(data.posts);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feed konnte nicht geladen werden.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  return (
    <>
      <section className="hero-card">
        <h1>{brand.name}</h1>
        <p>{brand.tagline}</p>
        <div className="hero-actions">
          {user ? (
            <Link className="btn" to="/compose">
              Neuen Beitrag schreiben
            </Link>
          ) : (
            <>
              <Link className="btn" to="/register">
                Registrieren
              </Link>
              <Link className="btn btn-ghost" to="/login">
                Anmelden
              </Link>
            </>
          )}
        </div>
      </section>

      {user && user.isAdult && !user.ageVerified ? (
        <section className="age-card">
          <h2>Soft-18+ freischalten</h2>
          <p>
            {user.agePending
              ? "Dein Antrag wird geprüft."
              : "Für Soft-18+: Altersprüfung starten (ohne Ausweis)."}
          </p>
          {!user.agePending ? (
            <a className="btn btn-sm" href="/age-verify.php">
              Altersprüfung starten
            </a>
          ) : null}
        </section>
      ) : null}

      {error ? <div className="flash error">{error}</div> : null}

      <section className="feed">
        {busy ? <div className="muted center pad">Beiträge laden…</div> : null}
        {!busy && posts.length === 0 ? (
          <div className="empty">
            <p>Noch keine Beiträge.</p>
            {user ? (
              <Link className="btn btn-sm" to="/compose">
                Ersten Post schreiben
              </Link>
            ) : null}
          </div>
        ) : null}
        {posts.map((post) => (
          <article key={post.id} className={`post-card ${post.isAdult ? "adult" : ""}`}>
            <div className="post-meta">
              <div>
                <strong>@{post.username}</strong>
                <span className="muted"> · {timeAgo(post.createdAt)}</span>
              </div>
              {post.isAdult ? <span className="badge-18">18+</span> : null}
            </div>
            {post.body ? <p className="post-body">{post.body}</p> : null}
            {post.imageUrl ? (
              <div className="post-image">
                <img src={post.imageUrl} alt="" loading="lazy" />
              </div>
            ) : null}
            <div className="post-actions">
              {user ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    void apiLike(post.id)
                      .then(load)
                      .catch((e: Error) => setError(e.message))
                  }
                >
                  ♥ {post.likeCount}
                </button>
              ) : (
                <span className="muted">♥ {post.likeCount}</span>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
