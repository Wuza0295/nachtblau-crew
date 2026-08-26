/** Verkäufer-Compliance (DSA Art. 30 / DDG) + PIN für Verkaufsaktionen. */

export type SellerKind = "private" | "trader";

/** Ident-/Auth-Methoden, die wir als Plattform einsetzen dürfen (kein QES-Zwang). */
export type IdAuthMethod =
  | "personalausweis"
  | "reisepass"
  | "eid_online"
  | "videoident";

export const ID_AUTH_METHODS: {
  id: IdAuthMethod;
  label: string;
  legalNote: string;
}[] = [
  {
    id: "personalausweis",
    label: "Personalausweis (Scan/Foto)",
    legalNote:
      "Kopie des Ausweises gemäß Art. 30 Abs. 1 lit. b DSA – Speicherung nur zur Händlerprüfung.",
  },
  {
    id: "reisepass",
    label: "Reisepass (Scan/Foto)",
    legalNote: "Alternative Identitätskopie nach DSA Art. 30 Abs. 1 lit. b.",
  },
  {
    id: "eid_online",
    label: "Online-Ausweis / eID (eIDAS)",
    legalNote:
      "Elektronische Identifizierung i. S. v. Art. 3 eIDAS-VO – in Produktion über zertifizierten Anbieter.",
  },
  {
    id: "videoident",
    label: "VideoIdent (zugelassener Anbieter)",
    legalNote:
      "Identifizierung über regulierten Dienstleister – Referenzcode hinterlegen.",
  },
];

export type SellerComplianceStatus =
  | "incomplete"
  | "pending_review"
  | "approved"
  | "rejected";

export interface SellerCompliance {
  userId: number;
  kind: SellerKind;
  legalFullName: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  isAdultConfirmed: boolean;
  /** Privat: nur Gelegenheitsverkauf, kein Gewerbe */
  privateOccasionalOnly: boolean;
  /** Gewerblich: Zahlungskonto (IBAN oder PayPal) */
  paymentAccount: string;
  tradeRegister: string;
  tradeRegisterNumber: string;
  vatId: string;
  /** DSA Art. 30 Abs. 1 lit. e Selbstbescheinigung */
  selfCertification: boolean;
  idMethod: IdAuthMethod | "";
  /** Kurzreferenz / letzte Zeichen / VideoIdent-Code – kein voller Ausweistext nötig */
  idReference: string;
  /** Optional: komprimiertes Bild als data-URL */
  idDocumentDataUrl?: string;
  pinSalt: string;
  pinHash: string;
  pinSetAt: string;
  status: SellerComplianceStatus;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

type StoreState = Record<string, SellerCompliance>;

const KEY = "autic-seller-compliance-v1";
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeSellerCompliance(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSellerComplianceVersion() {
  return version;
}

function read(): StoreState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoreState) : {};
  } catch {
    return {};
  }
}

function write(state: StoreState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getSellerCompliance(
  userId: number | undefined | null
): SellerCompliance | null {
  if (!userId) return null;
  return read()[String(userId)] ?? null;
}

export function isAdultFromDob(dateOfBirth: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return false;
  const [y, m, d] = dateOfBirth.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return false;
  let age = now.getFullYear() - birth.getFullYear();
  const md = now.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 18;
}

export function hasPinSet(c: SellerCompliance | null | undefined): boolean {
  return Boolean(c?.pinHash && c?.pinSalt);
}

/** Mindestangaben für Privatverkäufer (Geschäftsfähigkeit + Nachvollziehbarkeit). */
export function privateRequirementsMet(c: SellerCompliance): string[] {
  const missing: string[] = [];
  if (c.legalFullName.trim().length < 3) missing.push("Vollständiger Name");
  if (c.street.trim().length < 3) missing.push("Straße");
  if (!/^\d{4,5}$/.test(c.zip.trim())) missing.push("PLZ");
  if (c.city.trim().length < 2) missing.push("Ort");
  if (c.country.trim().length < 2) missing.push("Land");
  if (c.phone.trim().length < 6) missing.push("Telefon");
  if (!c.email.includes("@")) missing.push("E-Mail");
  if (!isAdultFromDob(c.dateOfBirth) || !c.isAdultConfirmed) {
    missing.push("Volljährigkeit (18+)");
  }
  if (!c.privateOccasionalOnly) missing.push("Privatverkauf-Erklärung");
  if (!c.idMethod) missing.push("Ident-Methode");
  if (c.idReference.trim().length < 4 && !c.idDocumentDataUrl) {
    missing.push("Ausweis-Referenz oder Scan");
  }
  if (!hasPinSet(c)) missing.push("6-stellige PIN");
  return missing;
}

/** DSA Art. 30 Pflichtfelder für Unternehmer. */
export function traderRequirementsMet(c: SellerCompliance): string[] {
  const missing = privateRequirementsMet(c).filter(
    (m) => m !== "Privatverkauf-Erklärung"
  );
  if (c.paymentAccount.trim().length < 6) missing.push("Zahlungskonto (IBAN/PayPal)");
  if (!c.selfCertification) missing.push("DSA-Selbstbescheinigung");
  // Handelsregister nur wenn angegeben – wenn Feld „eingetragen“ leer, ok
  return missing;
}

export function getComplianceGaps(c: SellerCompliance | null): string[] {
  if (!c) return ["Verkäufer-Freigabe fehlt"];
  if (c.kind === "trader") return traderRequirementsMet(c);
  return privateRequirementsMet(c);
}

export function canSell(userId: number | undefined | null): boolean {
  const c = getSellerCompliance(userId);
  if (!c || c.status !== "approved") return false;
  return getComplianceGaps(c).length === 0;
}

export function sellerCompliancePath(returnTo = "/verkaufen") {
  return `/verkaeufer-freigabe?next=${encodeURIComponent(returnTo)}`;
}

function emptyDraft(userId: number, email: string): SellerCompliance {
  const now = new Date().toISOString();
  return {
    userId,
    kind: "private",
    legalFullName: "",
    street: "",
    zip: "",
    city: "",
    country: "DE",
    phone: "",
    email,
    dateOfBirth: "",
    isAdultConfirmed: false,
    privateOccasionalOnly: false,
    paymentAccount: "",
    tradeRegister: "",
    tradeRegisterNumber: "",
    vatId: "",
    selfCertification: false,
    idMethod: "",
    idReference: "",
    pinSalt: "",
    pinHash: "",
    pinSetAt: "",
    status: "incomplete",
    createdAt: now,
    updatedAt: now,
  };
}

export function ensureSellerDraft(userId: number, email: string): SellerCompliance {
  const existing = getSellerCompliance(userId);
  if (existing) return existing;
  const draft = emptyDraft(userId, email);
  const state = read();
  state[String(userId)] = draft;
  write(state);
  return draft;
}

export type SellerComplianceInput = Partial<
  Omit<
    SellerCompliance,
    "userId" | "pinSalt" | "pinHash" | "pinSetAt" | "createdAt" | "updatedAt"
  >
>;

export function updateSellerCompliance(
  userId: number,
  email: string,
  patch: SellerComplianceInput & {
    pinSalt?: string;
    pinHash?: string;
    pinSetAt?: string;
  }
): SellerCompliance {
  const state = read();
  const current = state[String(userId)] ?? emptyDraft(userId, email);
  const next: SellerCompliance = {
    ...current,
    ...patch,
    userId,
    email: ((patch.email ?? current.email) || email).trim(),
    updatedAt: new Date().toISOString(),
  };
  if (next.status !== "rejected") {
    const gaps =
      next.kind === "trader" ? traderRequirementsMet(next) : privateRequirementsMet(next);
    if (gaps.length === 0 && hasPinSet(next)) {
      next.status = "approved";
      next.approvedAt = next.approvedAt ?? new Date().toISOString();
    } else {
      next.status = "incomplete";
      next.approvedAt = undefined;
    }
  }
  state[String(userId)] = next;
  write(state);
  return next;
}

export async function setSellerPin(userId: number, email: string, pin: string) {
  if (!/^\d{6}$/.test(pin)) throw new Error("PIN muss genau 6 Ziffern haben");
  const salt = randomSalt();
  const hash = await sha256(`${salt}:${pin}`);
  return updateSellerCompliance(userId, email, {
    pinSalt: salt,
    pinHash: hash,
    pinSetAt: new Date().toISOString(),
  });
}

export async function verifySellerPin(
  userId: number | undefined | null,
  pin: string
): Promise<boolean> {
  const c = getSellerCompliance(userId);
  if (!c?.pinHash || !c.pinSalt) return false;
  if (!/^\d{6}$/.test(pin)) return false;
  const hash = await sha256(`${c.pinSalt}:${pin}`);
  return hash === c.pinHash;
}

export function publicTraderInfo(userId: number): {
  legalFullName: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  tradeRegister?: string;
  tradeRegisterNumber?: string;
  selfCertification: boolean;
  kind: SellerKind;
} | null {
  const c = getSellerCompliance(userId);
  if (!c || c.status !== "approved") return null;
  return {
    legalFullName: c.legalFullName,
    street: c.street,
    zip: c.zip,
    city: c.city,
    country: c.country,
    phone: c.phone,
    email: c.email,
    tradeRegister: c.tradeRegister || undefined,
    tradeRegisterNumber: c.tradeRegisterNumber || undefined,
    selfCertification: c.selfCertification,
    kind: c.kind,
  };
}
