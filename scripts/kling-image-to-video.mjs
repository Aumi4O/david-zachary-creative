#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  isConfigured,
  loadDotenv,
  run,
  uploadLocalFile,
} from "./muapi-client.mjs";

const FALLBACK_ENDPOINT = "kling-v3.0-standard-image-to-video";
const DEFAULT_OUTPUT_DIR = "public/generated/videos";

await loadDotenv();

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return 0;
  }

  const dryRun = Boolean(args["dry-run"]);
  const scenes = args.manifest
    ? await readManifest(args.manifest)
    : [sceneFromArgs(args)];

  if (!dryRun && !isConfigured()) {
    throw new Error("MUAPI_API_KEY is not configured in .env.local, .env, or the environment.");
  }

  for (const [index, scene] of scenes.entries()) {
    const normal = normalizeScene(scene, index);
    await runScene(normal, { dryRun });
  }

  return 0;
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = camelToKebab(rawKey);
    if (["dry-run", "help"].includes(key)) {
      parsed[key] = true;
      continue;
    }

    const value = inlineValue ?? argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    parsed[key] = value;
    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return parsed;
}

function sceneFromArgs(args) {
  return {
    name: args.name,
    image: args.image,
    prompt: args.prompt,
    output: args.output,
    endpoint: args.endpoint,
    duration: args.duration,
    aspect_ratio: args["aspect-ratio"],
    negative_prompt: args["negative-prompt"],
    payload: parseJsonOption(args.payload, "--payload"),
  };
}

async function readManifest(path) {
  const absolutePath = resolve(path);
  const data = JSON.parse(await readFile(absolutePath, "utf8"));
  if (!Array.isArray(data.scenes)) {
    throw new Error(`Manifest must contain a top-level "scenes" array: ${absolutePath}`);
  }
  return data.scenes;
}

function normalizeScene(scene, index) {
  if (!scene.image) {
    throw new Error(`Scene ${index + 1} is missing "image".`);
  }
  if (!scene.prompt) {
    throw new Error(`Scene ${index + 1} is missing "prompt".`);
  }

  const name = scene.name || `kling-scene-${index + 1}`;
  const output =
    scene.output || `${DEFAULT_OUTPUT_DIR}/${slugify(name)}-${timestamp()}.mp4`;

  return {
    name,
    image: resolve(scene.image),
    prompt: scene.prompt,
    output: resolve(output),
    endpoint: scene.endpoint || process.env.MUAPI_KLING_ENDPOINT || FALLBACK_ENDPOINT,
    duration: parseDuration(scene.duration),
    aspectRatio: scene.aspect_ratio || scene.aspectRatio || "16:9",
    negativePrompt: scene.negative_prompt || scene.negativePrompt,
    payload: scene.payload || {},
  };
}

async function runScene(scene, { dryRun }) {
  const payload = {
    prompt: scene.prompt,
    duration: scene.duration,
    aspect_ratio: scene.aspectRatio,
    ...scene.payload,
  };

  if (scene.negativePrompt) {
    payload.negative_prompt = scene.negativePrompt;
  }

  console.log(`\n${scene.name}`);
  console.log(`  endpoint: ${scene.endpoint}`);
  console.log(`  image:    ${scene.image}`);
  console.log(`  output:   ${scene.output}`);

  if (dryRun) {
    console.log("  dry-run payload:");
    console.log(indent(JSON.stringify({ ...payload, image_url: "<uploaded image url>" }, null, 2)));
    return;
  }

  const startedAt = Date.now();
  console.log("  uploading image...");
  const imageUrl = await uploadLocalFile(scene.image);

  console.log("  submitting Kling job...");
  const result = await run(
    scene.endpoint,
    { ...payload, image_url: imageUrl },
    {
      kind: "video",
      onStatus: (status) => console.log(`  status: ${status}`),
    },
  );

  await mkdir(dirname(scene.output), { recursive: true });
  await writeFile(scene.output, result.bytes);

  const metadataPath = `${scene.output}.json`;
  await writeFile(
    metadataPath,
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        elapsed_seconds: Math.round((Date.now() - startedAt) / 1000),
        endpoint: scene.endpoint,
        request_id: result.requestId,
        input_image: scene.image,
        uploaded_image_url: imageUrl,
        output_url: result.outputUrl,
        output_file: scene.output,
        prompt: scene.prompt,
        duration: scene.duration,
        aspect_ratio: scene.aspectRatio,
        negative_prompt: scene.negativePrompt || null,
        payload_overrides: scene.payload,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`  wrote ${scene.output} (${result.bytes.length.toLocaleString()} bytes)`);
  console.log(`  wrote ${metadataPath}`);
}

function parseJsonOption(value, label) {
  if (!value) {
    return {};
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error.message}`);
  }
}

function camelToKebab(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function indent(value) {
  return value
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
}

function printHelp() {
  console.log(`Usage:
  npm run video:kling -- --image preview/media/dzc-work-port-page-07.png --prompt "slow editorial camera push-in" --output public/generated/videos/intro.mp4
  npm run video:kling -- --manifest scripts/kling-scenes.example.json

Options:
  --image             Local first-frame image for image-to-video
  --prompt            Motion prompt
  --output            Output MP4 path
  --duration          Seconds, default 5
  --aspect-ratio      16:9, 9:16, or 1:1; default 16:9
  --negative-prompt   Optional negative prompt
  --endpoint          MuAPI endpoint, default ${process.env.MUAPI_KLING_ENDPOINT || FALLBACK_ENDPOINT}
  --payload           Extra JSON merged into the MuAPI payload
  --manifest          Batch manifest with { "scenes": [...] }
  --dry-run           Print payloads without calling MuAPI
`);
}

function parseDuration(value) {
  const duration = Number(value || 5);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`duration must be a positive number, got: ${value}`);
  }
  return duration;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(`\n${error.message}`);
    process.exitCode = 1;
  },
);
