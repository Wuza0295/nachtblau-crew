import { ENV } from "../_core/env";

const KAS_AUTH_WSDL = "https://kasapi.kasserver.com/soap/wsdl/KasAuth.wsdl";
const KAS_API_WSDL = "https://kasapi.kasserver.com/soap/wsdl/KasApi.wsdl";

type KasAuthResponse = {
  return?: string;
};

type KasApiResponse = {
  return?: string;
};

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

async function soapCall(endpoint: string, action: string, body: string): Promise<string> {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:xmethodsKASSOAP">
  <soap:Body>
    <tns:${action}>
      ${body}
    </tns:${action}>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `urn:xmethodsKASSOAP#${action}`,
    },
    body: envelope,
    signal: AbortSignal.timeout(30000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new KasApiError(`KAS HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const fault = /<faultstring>([\s\S]*?)<\/faultstring>/.exec(text);
  if (fault) {
    throw new KasApiError(fault[1].trim());
  }

  const result = /<return>([\s\S]*?)<\/return>/.exec(text);
  if (!result) {
    throw new KasApiError("KAS-Antwort ohne return-Feld");
  }

  return result[1].trim();
}

function parseKasReturn<T>(raw: string): T {
  const decoded = raw
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  try {
    return JSON.parse(decoded) as T;
  } catch {
    throw new KasApiError(`KAS JSON konnte nicht gelesen werden: ${decoded.slice(0, 200)}`);
  }
}

function unwrapKasPayload<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "Response" in payload) {
    const response = (payload as { Response: unknown }).Response;
    if (response && typeof response === "object" && "ReturnString" in response) {
      const returnString = (response as { ReturnString: unknown }).ReturnString;
      if (typeof returnString === "string") {
        return parseKasReturn<T>(returnString);
      }
    }
  }

  return payload as T;
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
    });

    const raw = await soapCall(
      KAS_AUTH_WSDL,
      "KasAuth",
      `<String>${escapeXml(authPayload)}</String>`
    );
    const parsed = parseKasReturn<KasAuthResponse>(raw);
    const token = parsed.return ?? (parsed as unknown as string);
    if (!token || typeof token !== "string") {
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

    const raw = await soapCall(
      KAS_API_WSDL,
      "KasApi",
      `<String>${escapeXml(requestPayload)}</String>`
    );

    const parsed = parseKasReturn<unknown>(raw);
    return unwrapKasPayload<T>(parsed);
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
    const result = await this.exec<{ subdomain_name?: string; domain_name?: string; subdomain_path?: string }[] | { subdomain_name?: string; domain_name?: string; subdomain_path?: string }>("get_subdomains");
    const rows = Array.isArray(result) ? result : result ? [result] : [];
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

export async function provisionKasSubdomain(slug: string): Promise<{ ok: true } | { ok: false; error: string }> {
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
