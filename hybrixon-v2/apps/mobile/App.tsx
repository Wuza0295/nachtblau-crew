import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import {
  setVideoCacheSizeAsync,
  VideoView,
  useVideoPlayer,
} from "expo-video";
import type { ApiMedia, ApiPost, ApiUser } from "@hybrixon/contracts";
import {
  api,
  enqueuePost,
  processUploadQueue,
  type QueuedFile,
} from "./src/api";
import { registerUploadTask } from "./src/background";
import { readFeedCache, refreshFeedCache } from "./src/feed-cache";
import { registerPush } from "./src/push";

type Tab = "feed" | "compose" | "profile";

function PostMedia({ media }: { media: ApiMedia }) {
  const videoUri = media.kind === "video"
    ? (media.playbackUrl ?? media.originalUrl ?? "")
    : "";
  const player = useVideoPlayer(
    videoUri ? { uri: videoUri, useCaching: true } : null,
    (instance) => { instance.loop = false; },
  );
  if (media.kind === "image") {
    return <Image source={{ uri: media.originalUrl ?? media.posterUrl ?? "" }} style={styles.media} />;
  }
  return (
    <View style={styles.mediaWrap}>
      <VideoView player={player} style={styles.media} nativeControls contentFit="contain" />
      {media.status !== "ready" ? <Text style={styles.processing}>Vorschau wird erstellt…</Text> : null}
    </View>
  );
}

function warmFeedImages(posts: ApiPost[]): void {
  const urls = posts
    .flatMap((post) => post.media)
    .map((media) => media.posterUrl ?? (media.kind === "image" ? media.originalUrl : null))
    .filter((url): url is string => !!url)
    .slice(0, 12);
  void Promise.allSettled(urls.map((url) => Image.prefetch(url)));
}

function PostCard({ post }: { post: ApiPost }) {
  return (
    <View style={styles.card}>
      <View style={styles.postHead}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{post.author.displayName[0]?.toUpperCase()}</Text></View>
        <View style={styles.grow}>
          <Text style={styles.strong}>{post.author.displayName}</Text>
          <Text style={styles.muted}>@{post.author.username}</Text>
        </View>
        {post.isAdult ? <Text style={styles.badge}>18+</Text> : null}
      </View>
      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      <View style={post.media.length > 1 ? styles.mediaGrid : undefined}>
        {post.media.map((media) => <PostMedia key={media.id} media={media} />)}
      </View>
      <View style={styles.actions}>
        <Text style={styles.muted}>♥ {post.likeCount}</Text>
        <Text style={styles.muted}>💬 {post.commentCount}</Text>
      </View>
    </View>
  );
}

function Auth({ onDone }: { onDone(user: ApiUser): void }) {
  const [register, setRegister] = useState(false);
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const result = register
        ? await api.register({ username: login, email, birthdate, password })
        : await api.login(login, password);
      onDone(result.user);
      void registerPush();
    } catch (error) {
      Alert.alert("Anmeldung fehlgeschlagen", error instanceof Error ? error.message : "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView style={styles.auth} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.logo}><Text style={styles.logoText}>H</Text></View>
      <Text style={styles.title}>Hybrixon</Text>
      <Text style={styles.muted}>Closer. Freer.</Text>
      <TextInput style={styles.input} value={login} onChangeText={setLogin} placeholder="Benutzername oder E-Mail" placeholderTextColor="#71827d" autoCapitalize="none" />
      {register ? (
        <>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="E-Mail" placeholderTextColor="#71827d" autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} value={birthdate} onChangeText={setBirthdate} placeholder="Geburtsdatum: JJJJ-MM-TT" placeholderTextColor="#71827d" />
        </>
      ) : null}
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Passwort" placeholderTextColor="#71827d" secureTextEntry />
      <Pressable style={styles.primary} onPress={() => void submit()} disabled={busy}>
        {busy ? <ActivityIndicator color="#07100f" /> : <Text style={styles.primaryText}>{register ? "Registrieren" : "Anmelden"}</Text>}
      </Pressable>
      <Pressable onPress={() => setRegister((value) => !value)}>
        <Text style={styles.link}>{register ? "Schon registriert? Anmelden" : "Konto erstellen"}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function Compose({ onDone }: { onDone(): void }) {
  const [body, setBody] = useState("");
  const [adult, setAdult] = useState(false);
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: 15,
      quality: 1,
    });
    if (result.canceled) return;
    const dir = `${FileSystem.documentDirectory}pending-uploads/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const persisted: QueuedFile[] = [];
    for (const asset of result.assets.slice(0, 15)) {
      const name = asset.fileName ?? `${Date.now()}-${persisted.length}.${asset.type === "video" ? "mp4" : "jpg"}`;
      const uri = `${dir}${Date.now()}-${persisted.length}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      await FileSystem.copyAsync({ from: asset.uri, to: uri });
      persisted.push({
        uri,
        name,
        mime: asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"),
        size: asset.fileSize ?? 0,
      });
    }
    setFiles(persisted);
  };
  const publish = async () => {
    if (!body.trim() && !files.length) return;
    setBusy(true);
    try {
      await enqueuePost({
        id: `${Date.now()}`,
        body,
        isAdult: adult,
        visibility: "public",
        files,
        createdAt: new Date().toISOString(),
      });
      await registerUploadTask();
      await processUploadQueue(setProgress);
      setBody("");
      setFiles([]);
      onDone();
    } catch (error) {
      Alert.alert("Upload vorgemerkt", "Der Upload wird automatisch fortgesetzt, sobald die Verbindung stabil ist.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.compose}>
      <Text style={styles.heading}>Beitrag erstellen</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={body}
        onChangeText={setBody}
        placeholder="Was möchtest du teilen?"
        placeholderTextColor="#71827d"
        multiline
        maxLength={4_000}
      />
      <Pressable style={styles.secondary} onPress={() => void pick()}>
        <Text style={styles.secondaryText}>Bilder/Videos wählen ({files.length}/15)</Text>
      </Pressable>
      <View style={styles.switchRow}>
        <Text style={styles.strong}>Soft-18+</Text>
        <Switch value={adult} onValueChange={setAdult} trackColor={{ true: "#2de4c3" }} />
      </View>
      {busy ? <Text style={styles.muted}>Upload {progress}% · läuft auch im Hintergrund weiter</Text> : null}
      <Pressable style={styles.primary} onPress={() => void publish()} disabled={busy}>
        {busy ? <ActivityIndicator color="#07100f" /> : <Text style={styles.primaryText}>Veröffentlichen</Text>}
      </Pressable>
    </ScrollView>
  );
}

export default function App() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [tab, setTab] = useState<Tab>("feed");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const cached = await readFeedCache();
    if (cached.length) {
      setPosts(cached);
      warmFeedImages(cached);
    }
    try {
      const fresh = await refreshFeedCache();
      setPosts(fresh);
      warmFeedImages(fresh);
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    api.me().then((result) => {
      setUser(result.user);
      void registerPush();
    }).catch(() => undefined);
    void load();
    void registerUploadTask();
    void setVideoCacheSizeAsync(384 * 1024 * 1024);
  }, []);
  useEffect(() => {
    const openDeepLink = (incoming: string) => {
      try {
        const outer = new URL(incoming);
        const nested = outer.protocol === "hybrixon:" && outer.hostname === "open"
          ? outer.searchParams.get("url")
          : null;
        const destination = new URL(nested || incoming, "https://hybrixon.com");
        const path = destination.pathname.toLowerCase();
        if (
          path.includes("post-create")
          || path.includes("compose")
          || path.includes("create-post")
        ) {
          setTab("compose");
        } else if (
          path.includes("profile")
          || path.includes("settings")
          || path.endsWith("/u.php")
        ) {
          setTab("profile");
        } else {
          setTab("feed");
        }
      } catch (error) {
        console.warn("Ignored invalid deep link", error);
      }
    };
    void Linking.getInitialURL().then((url) => {
      if (url) openDeepLink(url);
    });
    const subscription = Linking.addEventListener("url", ({ url }) => openDeepLink(url));
    return () => subscription.remove();
  }, []);
  if (!user) return <SafeAreaView style={styles.safe}><Auth onDone={setUser} /><StatusBar style="light" /></SafeAreaView>;
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}><Text style={styles.headerTitle}>Hybrixon</Text><Text style={styles.muted}>Closer. Freer.</Text></View>
      <View style={styles.grow}>
        {tab === "feed" ? (
          <FlatList
            data={posts}
            keyExtractor={(post) => String(post.id)}
            renderItem={({ item }) => <PostCard post={item} />}
            refreshing={loading}
            onRefresh={() => void load()}
            contentContainerStyle={styles.feed}
          />
        ) : tab === "compose" ? (
          <Compose onDone={() => { setTab("feed"); void load(); }} />
        ) : (
          <View style={styles.profile}>
            <View style={[styles.avatar, styles.profileAvatar]}><Text style={styles.profileLetter}>{user.displayName[0]?.toUpperCase()}</Text></View>
            <Text style={styles.heading}>{user.displayName}</Text>
            <Text style={styles.muted}>@{user.username}</Text>
            <Text style={styles.body}>{user.bio || "Noch keine Bio."}</Text>
            <Pressable style={styles.secondary} onPress={() => void api.logout().then(() => setUser(null))}><Text style={styles.secondaryText}>Abmelden</Text></Pressable>
          </View>
        )}
      </View>
      <View style={styles.tabs}>
        {(["feed", "compose", "profile"] as Tab[]).map((item) => (
          <Pressable key={item} style={[styles.tab, tab === item && styles.tabActive]} onPress={() => setTab(item)}>
            <Text style={tab === item ? styles.tabTextActive : styles.muted}>{item === "feed" ? "⌂ Feed" : item === "compose" ? "＋ Post" : "◎ Profil"}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const colors = {
  bg: "#07100f",
  panel: "#111b18",
  line: "rgba(141,255,225,0.13)",
  text: "#eef8f4",
  muted: "#9cafaa",
  teal: "#2de4c3",
  gold: "#f3bc35",
};
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  grow: { flex: 1 },
  header: { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  feed: { padding: 8, paddingBottom: 24 },
  card: { marginBottom: 10, overflow: "hidden", borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.panel },
  postHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  avatar: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: colors.teal },
  avatarText: { color: colors.bg, fontWeight: "900" },
  strong: { color: colors.text, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 12 },
  badge: { color: "#ff858b", fontWeight: "900" },
  body: { color: colors.text, paddingHorizontal: 12, paddingBottom: 12, fontSize: 16, lineHeight: 23 },
  mediaGrid: { gap: 4 },
  mediaWrap: { position: "relative" },
  media: { width: "100%", height: 320, backgroundColor: "#000" },
  processing: { position: "absolute", bottom: 8, left: 8, color: colors.text, padding: 5, backgroundColor: "#07100fdd", borderRadius: 8 },
  actions: { flexDirection: "row", gap: 20, padding: 12 },
  auth: { flex: 1, justifyContent: "center", padding: 24, gap: 14 },
  logo: { width: 64, height: 64, alignSelf: "center", alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: colors.teal },
  logoText: { color: colors.bg, fontSize: 30, fontWeight: "900" },
  title: { color: colors.text, fontSize: 32, textAlign: "center", fontWeight: "900" },
  heading: { color: colors.text, fontSize: 24, fontWeight: "900" },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, color: colors.text, backgroundColor: "#030706" },
  textarea: { minHeight: 150, textAlignVertical: "top" },
  primary: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.teal },
  primaryText: { color: colors.bg, fontWeight: "900", fontSize: 16 },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 14 },
  secondaryText: { color: colors.teal, fontWeight: "800" },
  link: { color: colors.teal, textAlign: "center", padding: 10 },
  compose: { padding: 16, gap: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tabs: { flexDirection: "row", paddingBottom: Platform.OS === "android" ? 6 : 0, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: "#07100ff5" },
  tab: { flex: 1, alignItems: "center", padding: 14 },
  tabActive: { backgroundColor: "#2de4c315" },
  tabTextActive: { color: colors.teal, fontWeight: "800" },
  profile: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  profileAvatar: { width: 92, height: 92, borderRadius: 46 },
  profileLetter: { color: colors.bg, fontSize: 36, fontWeight: "900" },
});
