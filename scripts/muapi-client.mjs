import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const DEFAULT_API_BASE = "https://api.muapi.ai";
const DEFAULT_POLL_INTERVAL_MS = 3_000;
const DEFAULT_POLL_TIMEOUT_MS = 15 * 60_000;

export class MuapiError extends Error {
  constructor(message) {
    super(message);
    this.name = "MuapiError";
  }
}

export async function loadDotenv(cwd = process.cwd()) {
  for (const file of [".env.local", ".env"]) {
    let raw;
    try {
      raw = await readFile(resolve(cwd, file), "utf8");
    } catch {
      continue;
    }

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...parts] = trimmed.split("=");
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = parts.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

export function isConfigured() {
  return Boolean(process.env.MUAPI_API_KEY);
}

export function contentTypeForPath(path) {
  const ext = extname(path).toLowerCase();
  const types = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".wav": "audio/wav",
    ".webp": "image/webp",
  };
  return types[ext] || "application/octet-stream";
}

export async function uploadLocalFile(path) {
  const absolutePath = resolve(path);
  const data = await readFile(absolutePath);
  return uploadFile(data, basename(absolutePath), contentTypeForPath(absolutePath));
}

export async function uploadFile(data, filename, contentType) {
  const url = `${apiBase()}/api/v1/upload_file`;
  const form = new FormData();
  form.append("file", new Blob([data], { type: contentType }), filename);

  const result = await requestWithRetry("POST", url, {
    body: form,
    json: false,
    timeoutMs: 120_000,
  });

  const hostedUrl = result?.url || result?.file_url || result?.data?.url;
  if (!hostedUrl) {
    throw new MuapiError(`muapi upload_file response missing url: ${preview(result)}`);
  }

  return String(hostedUrl);
}

export async function submit(endpoint, payload) {
  const url = `${apiBase()}/api/v1/${endpoint.replace(/^\/+/, "")}`;
  const result = await requestWithRetry("POST", url, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    timeoutMs: 60_000,
  });

  const requestId = result?.request_id || result?.id || result?.data?.request_id;
  if (!requestId) {
    throw new MuapiError(`muapi submit response missing request_id: ${preview(result)}`);
  }

  return String(requestId);
}

export async function poll(
  requestId,
  {
    timeoutMs = Number(process.env.MUAPI_POLL_TIMEOUT_MS || DEFAULT_POLL_TIMEOUT_MS),
    intervalMs = Number(process.env.MUAPI_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS),
    onStatus,
  } = {},
) {
  const url = `${apiBase()}/api/v1/predictions/${requestId}/result`;
  const deadline = Date.now() + timeoutMs;
  let lastResult = {};
  let lastStatus = "";

  while (Date.now() < deadline) {
    const result = await requestWithRetry("GET", url, { timeoutMs: 60_000 });
    const status = normalizeStatus(result);
    lastResult = result;

    if (status && status !== lastStatus) {
      lastStatus = status;
      onStatus?.(status, result);
    }

    if (["completed", "succeeded", "success", "done"].includes(status)) {
      return result;
    }

    if (["failed", "error", "cancelled", "canceled"].includes(status)) {
      const message =
        result?.error || result?.message || result?.data?.error || "unknown muapi error";
      throw new MuapiError(`muapi job ${requestId} failed: ${message}`);
    }

    await sleep(intervalMs);
  }

  throw new MuapiError(
    `muapi job ${requestId} timed out after ${Math.round(timeoutMs / 1000)}s. ` +
      `Last status: ${normalizeStatus(lastResult) || "unknown"}`,
  );
}

export function extractOutputUrl(result, { kind = "video" } = {}) {
  const candidates = [];

  function urlMatchesKind(url) {
    const clean = url.toLowerCase().split("?")[0];
    if (kind === "video") {
      return /\.(mp4|mov|webm)$/.test(clean);
    }
    if (kind === "image") {
      return /\.(png|jpe?g|webp|avif)$/.test(clean);
    }
    return false;
  }

  function score(path, url) {
    const text = path.join("/").toLowerCase();
    let value = urlMatchesKind(url) ? 25 : 0;

    for (const [token, weight] of [
      ["outputs", 100],
      ["output", 100],
      ["result", 60],
      ["generated", 40],
      ["final", 40],
      ["asset", 20],
      ["url", 5],
    ]) {
      if (text.includes(token)) {
        value += weight;
      }
    }

    for (const [token, weight] of [
      ["images_list", 120],
      ["inputs", 120],
      ["input", 120],
      ["request", 90],
      ["payload", 90],
      ["param", 70],
      ["prompt", 70],
      ["source", 50],
    ]) {
      if (text.includes(token)) {
        value -= weight;
      }
    }

    return value;
  }

  function walk(node, path = []) {
    if (typeof node === "string" && /^https?:\/\//i.test(node)) {
      candidates.push({ score: score(path, node), order: candidates.length, url: node });
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, [...path, String(index)]));
      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    for (const key of ["url", "video_url", "image_url", "audio_url", "output_url"]) {
      if (typeof node[key] === "string" && /^https?:\/\//i.test(node[key])) {
        candidates.push({
          score: score([...path, key], node[key]),
          order: candidates.length,
          url: node[key],
        });
      }
    }

    for (const [key, value] of Object.entries(node)) {
      walk(value, [...path, key]);
    }
  }

  walk(result);

  if (!candidates.length) {
    throw new MuapiError(`muapi result has no recognisable ${kind} URL: ${preview(result)}`);
  }

  candidates.sort((a, b) => b.score - a.score || a.order - b.order);
  return candidates[0].url;
}

export async function download(url, { timeoutMs = 180_000 } = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new MuapiError(`download ${url} -> ${response.status}: ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function run(endpoint, payload, { kind = "video", onStatus } = {}) {
  const requestId = await submit(endpoint, payload);
  const result = await poll(requestId, { onStatus });
  const outputUrl = extractOutputUrl(result, { kind });
  const bytes = await download(outputUrl);

  return { bytes, outputUrl, requestId, result };
}

async function requestWithRetry(
  method,
  url,
  { body, headers = {}, json = true, timeoutMs = 60_000 } = {},
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "x-api-key": apiKey(),
          Accept: "application/json",
          ...headers,
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (RETRY_STATUSES.has(response.status)) {
        const waitMs = Math.min(2 ** attempt * 1000, 30_000);
        await sleep(waitMs);
        continue;
      }

      if (!response.ok) {
        throw new MuapiError(
          `muapi ${method} ${url} -> ${response.status}: ${(await response.text()).slice(0, 500)}`,
        );
      }

      if (!json) {
        return await response.json();
      }

      try {
        return await response.json();
      } catch {
        throw new MuapiError(`muapi ${method} ${url} returned non-JSON response`);
      }
    } catch (error) {
      if (error instanceof MuapiError || attempt === 4) {
        throw error;
      }
      await sleep(Math.min(2 ** attempt * 1000, 30_000));
    }
  }

  throw new MuapiError(`muapi ${method} ${url} failed after retries`);
}

function apiKey() {
  if (!process.env.MUAPI_API_KEY) {
    throw new MuapiError("MUAPI_API_KEY is not configured in .env.local, .env, or the environment.");
  }
  return process.env.MUAPI_API_KEY;
}

function apiBase() {
  return (process.env.MUAPI_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
}

function normalizeStatus(result) {
  return String(result?.status || result?.data?.status || "").toLowerCase();
}

function preview(value) {
  return JSON.stringify(value).slice(0, 400);
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
