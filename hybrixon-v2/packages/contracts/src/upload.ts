import {
  MULTIPART_PARALLELISM,
  MULTIPART_PART_BYTES,
  type ApiMedia,
  type MediaKind,
} from "@hybrixon/contracts";

export interface UploadSource {
  name: string;
  type: string;
  size: number;
  slice(start: number, end: number): Blob;
}

export interface MultipartUploadOptions {
  apiBaseUrl: string;
  accessToken: string;
  source: UploadSource;
  kind: MediaKind;
  signal?: AbortSignal;
  parallelism?: number;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
}

type InitiatedUpload = {
  media: ApiMedia;
  uploadId: string;
  partSize: number;
};

async function apiJson<T>(
  url: string,
  accessToken: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !body) {
    throw new Error(body?.error ?? `Upload-API: HTTP ${response.status}`);
  }
  return body;
}

async function retry<T>(operation: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (signal?.aborted) throw new DOMException("Upload abgebrochen", "AbortError");
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upload fehlgeschlagen");
}

export async function uploadMediaMultipart(
  options: MultipartUploadOptions,
): Promise<ApiMedia> {
  const {
    apiBaseUrl,
    accessToken,
    source,
    kind,
    signal,
    onProgress,
  } = options;
  const base = apiBaseUrl.replace(/\/+$/, "");
  const initiated = await apiJson<InitiatedUpload>(
    `${base}/media/multipart`,
    accessToken,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: source.name,
        mime: source.type || "application/octet-stream",
        size: source.size,
        kind,
      }),
    },
  );

  const partSize = initiated.partSize || MULTIPART_PART_BYTES;
  const count = Math.ceil(source.size / partSize);
  const completed = new Array<{ partNumber: number; etag: string }>(count);
  const uploadedByPart = new Array<number>(count).fill(0);
  let next = 0;

  const worker = async () => {
    while (next < count) {
      const index = next;
      next += 1;
      const partNumber = index + 1;
      const start = index * partSize;
      const end = Math.min(source.size, start + partSize);
      const blob = source.slice(start, end);
      const signed = await apiJson<{ url: string }>(
        `${base}/media/${initiated.media.id}/parts/${partNumber}`,
        accessToken,
        { method: "POST", signal },
      );

      const etag = await retry(async () => {
        const response = await fetch(signed.url, {
          method: "PUT",
          body: blob,
          signal,
          headers: { "Content-Type": source.type || "application/octet-stream" },
        });
        if (!response.ok) throw new Error(`Teil ${partNumber}: HTTP ${response.status}`);
        uploadedByPart[index] = blob.size;
        onProgress?.(
          uploadedByPart.reduce((sum, bytes) => sum + bytes, 0),
          source.size,
        );
        const value = response.headers.get("etag")?.replaceAll('"', "");
        if (!value) throw new Error(`Teil ${partNumber}: ETag fehlt`);
        return value;
      }, signal);
      completed[index] = { partNumber, etag };
    }
  };

  try {
    await Promise.all(
      Array.from(
        { length: Math.min(count, options.parallelism ?? MULTIPART_PARALLELISM) },
        worker,
      ),
    );
    const result = await apiJson<{ media: ApiMedia }>(
      `${base}/media/${initiated.media.id}/complete`,
      accessToken,
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts: completed }),
      },
    );
    return result.media;
  } catch (error) {
    void fetch(`${base}/media/${initiated.media.id}/abort`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => undefined);
    throw error;
  }
}
