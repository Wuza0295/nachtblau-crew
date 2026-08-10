import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { ApiPost, ApiUser } from "@hybrixon/contracts";
import { api, hasSession, uploadFiles } from "./api";
import "./HybrixonApp.css";

type Page = "feed" | "compose" | "profile";
type InstallPrompt = Event & { prompt(): Promise<void> };

function MediaGrid({ post }: { post: ApiPost }) {
  if (!post.media.length) return null;
  return (
    <div className={`media-grid ${post.media.length > 1 ? "multi" : ""}`}>
      {post.media.map((media) => (
        <figure key={media.id} className="media">
          {media.kind === "image" ? (
            <img src={media.originalUrl ?? media.posterUrl ?? ""} alt="" loading="lazy" />
          ) : (
            <video
              controls
              playsInline
              preload="metadata"
              poster={media.posterUrl ?? undefined}
              src={media.originalUrl ?? undefined}
            />
          )}
          {media.status !== "ready" ? (
            <span className="processing">Vorschau wird erstellt…</span>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function Feed({
  posts,
  busy,
  error,
  user,
  reload,
}: {
  posts: ApiPost[];
  busy: boolean;
  error: string;
  user: ApiUser | null;
  reload(): Promise<void>;
}) {
  return (
    <main className="feed" aria-busy={busy}>
      {error ? <div className="notice error">{error}</div> : null}
      {busy && !posts.length ? <div className="skeleton">Feed wird geladen…</div> : null}
      {posts.map((post) => (
        <article className="post" key={post.id}>
          <header className="post-head">
            <div className="avatar">{post.author.displayName.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{post.author.displayName}</strong>
              <span>@{post.author.username} · {new Date(post.createdAt).toLocaleString()}</span>
            </div>
            {post.isAdult ? <span className="badge">18+</span> : null}
          </header>
          {post.body ? <p className="post-body">{post.body}</p> : null}
          <MediaGrid post={post} />
          <footer className="post-actions">
            <button
              type="button"
              disabled={!user}
              className={post.likedByViewer ? "active" : ""}
              onClick={() => void api.like(post.id).then(reload)}
            >
              ♥ {post.likeCount}
            </button>
            <span>💬 {post.commentCount}</span>
            <button type="button" onClick={() => void navigator.share?.({
              title: "Hybrixon",
              url: `${location.origin}/post/${post.id}`,
            })}>Teilen</button>
          </footer>
        </article>
      ))}
    </main>
  );
}

function AuthPanel({ onAuthenticated }: { onAuthenticated(user: ApiUser): void }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = register
        ? await api.register({
            username: String(data.get("username")),
            email: String(data.get("email")),
            password: String(data.get("password")),
            birthdate: String(data.get("birthdate")),
          })
        : await api.login(String(data.get("login")), String(data.get("password")));
      onAuthenticated(result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel auth-panel">
      <h2>{register ? "Hybrixon-Konto erstellen" : "Bei Hybrixon anmelden"}</h2>
      {error ? <div className="notice error">{error}</div> : null}
      <form onSubmit={(event) => void submit(event)}>
        {register ? (
          <>
            <label>Benutzername<input name="username" required minLength={3} /></label>
            <label>E-Mail<input name="email" type="email" required /></label>
            <label>Geburtsdatum<input name="birthdate" type="date" required /></label>
          </>
        ) : <label>Benutzername oder E-Mail<input name="login" required /></label>}
        <label>Passwort<input name="password" type="password" required minLength={register ? 10 : 1} /></label>
        <button className="primary" disabled={busy}>
          {busy ? "Bitte warten…" : register ? "Registrieren" : "Anmelden"}
        </button>
      </form>
      <button className="link" onClick={() => setRegister((value) => !value)}>
        {register ? "Schon registriert? Anmelden" : "Noch kein Konto? Registrieren"}
      </button>
    </section>
  );
}

function Compose({ onCreated }: { onCreated(): Promise<void> }) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((item) => URL.revokeObjectURL(item.url)),
    [previews],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const mediaIds = files.length
        ? await uploadFiles(files, (next, nextLabel) => {
            setProgress(next);
            setLabel(nextLabel);
          })
        : [];
      await api.createPost({
        body: String(data.get("body") ?? ""),
        isAdult: data.get("adult") === "on",
        visibility: String(data.get("visibility") ?? "public") as
          | "public"
          | "followers"
          | "friends",
        mediaIds,
      });
      setFiles([]);
      await onCreated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Veröffentlichen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="panel compose">
      <h1>Beitrag erstellen</h1>
      {error ? <div className="notice error">{error}</div> : null}
      <form onSubmit={(event) => void submit(event)}>
        <label>Text<textarea name="body" maxLength={4_000} rows={5} /></label>
        <label>
          Bilder und Videos (max. 15)
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 15))}
          />
        </label>
        {previews.length ? (
          <div className="preview-strip">
            {previews.map(({ file, url }) => file.type.startsWith("video/")
              ? <video key={url} src={url} muted />
              : <img key={url} src={url} alt="" />)}
          </div>
        ) : null}
        <div className="form-row">
          <label>Sichtbarkeit<select name="visibility">
            <option value="public">Öffentlich</option>
            <option value="followers">Follower</option>
            <option value="friends">Freunde</option>
          </select></label>
          <label className="check"><input name="adult" type="checkbox" /> Soft-18+</label>
        </div>
        {busy ? (
          <div className="progress">
            <span style={{ width: `${progress}%` }} />{label} · {progress}%
          </div>
        ) : null}
        <button className="primary" disabled={busy}>
          {busy ? "Upload läuft…" : "Veröffentlichen"}
        </button>
      </form>
    </main>
  );
}

export default function HybrixonApp() {
  const [page, setPage] = useState<Page>("feed");
  const [user, setUser] = useState<ApiUser | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);

  const loadFeed = async () => {
    setBusy(true);
    try {
      const result = await api.feed();
      setPosts(result.posts);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Feed nicht erreichbar.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void loadFeed();
    if (hasSession()) api.me().then((result) => setUser(result.user)).catch(() => undefined);
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  const created = async () => {
    await loadFeed();
    setPage("feed");
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage("feed")} aria-label="Hybrixon Feed">
          <span>H</span> Hybrixon
        </button>
        <nav>
          <button className={page === "feed" ? "active" : ""} onClick={() => setPage("feed")}>⌂<small>Feed</small></button>
          <button className={page === "compose" ? "active" : ""} onClick={() => setPage("compose")}>＋<small>Post</small></button>
          <button className={page === "profile" ? "active" : ""} onClick={() => setPage("profile")}>◎<small>Profil</small></button>
        </nav>
        {installPrompt ? (
          <button className="install" onClick={() => void installPrompt.prompt()}>App installieren</button>
        ) : null}
      </header>

      {page === "feed" ? (
        <Feed posts={posts} busy={busy} error={error} user={user} reload={loadFeed} />
      ) : page === "compose" ? (
        user ? <Compose onCreated={created} /> : <AuthPanel onAuthenticated={setUser} />
      ) : user ? (
        <main className="panel profile">
          <div className="avatar large">{user.displayName.slice(0, 1).toUpperCase()}</div>
          <h1>{user.displayName}</h1>
          <p>@{user.username}</p>
          <p>{user.bio || "Noch keine Bio."}</p>
          <button onClick={() => void api.logout().then(() => setUser(null))}>Abmelden</button>
        </main>
      ) : <AuthPanel onAuthenticated={setUser} />}

      <footer className="footer">
        Hybrixon · Closer. Freer. · <span>{navigator.onLine ? "Online" : "Offline"}</span>
      </footer>
    </div>
  );
}
