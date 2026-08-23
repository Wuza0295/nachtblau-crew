import { ENV } from "../_core/env";
import { parseKasSoapResponse } from "./soap";

const KAS_AUTH_ENDPOINT = "https://kasapi.kasserver.com/soap/KasAuth.php";
const KAS_API_ENDPOINT = "https://kasapi.kasserver.com/soap/KasApi.php";

export type KasSubdomainInfo = {
  subdomainName: string;
  domainName: string;
  subdomainPath?: string;
};

export class KasApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "KasApiError";
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function soapCall(input: {
  endpoint: string;
  namespace: string;
  soapAction: string;
  operation: string;
  paramsXml: string;
}): Promise<string> {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:tns="${input.namespace}" soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <soap:Body>
    <tns:${input.operation}>
      ${input.paramsXml}
    </tns:${input.operation}>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(input.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: input.soapAction,
    },
    body: envelope,
    signal: AbortSignal.timeout(30000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new KasApiError(`KAS HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  return text;
}

function extractAuthToken(xml: string): string {
  const fault = /<faultstring>([\s\S]*?)<\/faultstring>/.exec(xml);
  if (fault) {
    throw new KasApiError(fault[1].trim());
  }

  const result = /<return[^>]*>([\s\S]*?)<\/return>/.exec(xml);
  if (!result) {
    throw new KasApiError("KAS-Antwort ohne return-Feld");
  }

  return decodeXmlEntities(result[1].trim());
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeKasRows<T extends Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object") return [result as T];
  return [];
}

export class KasClient {
  private sessionToken: string | null = null;

  constructor(
    private readonly login = ENV.kasLogin,
    private readonly password = ENV.kasPassword
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.login && this.password);
  }

  async authenticate(): Promise<string> {
    if (!this.isConfigured) {
      throw new KasApiError("KAS-Zugangsdaten fehlen (KAS_LOGIN / KAS_PASSWORD)");
    }

    const authPayload = JSON.stringify({
      kas_login: this.login,
      kas_auth_type: "plain",
      kas_auth_data: this.password,
      session_lifetime: 600,
      session_update_lifetime: "Y",
    });

    const raw = await soapCall({
      endpoint: KAS_AUTH_ENDPOINT,
      namespace: "urn:xmethodsKasApiAuthentication",
      soapAction: "urn:xmethodsKasApiAuthentication#KasAuth",
      operation: "KasAuth",
      paramsXml: `<Params xsi:type="xsd:string">${escapeXml(authPayload)}</Params>`,
    });

    const token = extractAuthToken(raw);
    if (!token) {
      throw new KasApiError("KAS-Authentifizierung fehlgeschlagen");
    }

    this.sessionToken = token;
    return token;
  }

  private async getSessionToken(): Promise<string> {
    if (this.sessionToken) return this.sessionToken;
    return this.authenticate();
  }

  async exec<T>(action: string, params: Record<string, string | number> = {}): Promise<T> {
    const token = await this.getSessionToken();
    const requestPayload = JSON.stringify({
      kas_login: this.login,
      kas_auth_type: "session",
      kas_auth_data: token,
      kas_action: action,
      KasRequestParams: params,
    });

    const raw = await soapCall({
      endpoint: KAS_API_ENDPOINT,
      namespace: "urn:xmethodsKasApi",
      soapAction: "urn:xmethodsKasApi#KasApi",
      operation: "KasApi",
      paramsXml: `<Params xsi:type="xsd:string">${escapeXml(requestPayload)}</Params>`,
    });

    return parseKasSoapResponse(raw) as T;
  }

  async addSubdomain(input: {
    subdomainName: string;
    domainName: string;
    subdomainPath?: string;
  }): Promise<void> {
    await this.exec("add_subdomain", {
      subdomain_name: input.subdomainName,
      domain_name: input.domainName,
      subdomain_path: input.subdomainPath ?? ENV.webspaceSubdomainPath,
    });
  }

  async deleteSubdomain(subdomainName: string, domainName: string): Promise<void> {
    await this.exec("delete_subdomain", {
      subdomain_name: subdomainName,
      domain_name: domainName,
    });
  }

  async getSubdomains(): Promise<KasSubdomainInfo[]> {
    const result = await this.exec<unknown>("get_subdomains");
    const rows = normalizeKasRows<{
      subdomain_name?: string;
      domain_name?: string;
      subdomain_path?: string;
    }>(result);

    return rows
      .filter((row) => row.subdomain_name && row.domain_name)
      .map((row) => ({
        subdomainName: row.subdomain_name!,
        domainName: row.domain_name!,
        subdomainPath: row.subdomain_path,
      }));
  }
}

let kasClient: KasClient | null = null;

export function getKasClient(): KasClient {
  if (!kasClient) kasClient = new KasClient();
  return kasClient;
}

export async function provisionKasSubdomain(
  slug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ENV.kasEnabled) {
    return {
      ok: false,
      error: "KAS-API nicht konfiguriert – Subdomain nur in der Datenbank reserviert",
    };
  }

  try {
    const client = getKasClient();
    const existing = await client.getSubdomains();
    const alreadyExists = existing.some(
      (entry) =>
        entry.subdomainName === slug && entry.domainName === ENV.webspaceBaseDomain
    );

    if (!alreadyExists) {
      await client.addSubdomain({
        subdomainName: slug,
        domainName: ENV.webspaceBaseDomain,
        subdomainPath: `${ENV.webspaceSubdomainPath}${slug}/`,
      });
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter KAS-Fehler";
    return { ok: false, error: message };
  }
}
