/**
 * Backfill posterUrl for video steps that pre-date upload-time poster generation.
 *
 * Usage: npm run backfill:video-posters
 * Requires: ffmpeg in PATH, DATABASE_URL + BLOB_READ_WRITE_TOKEN in .env
 */

import "dotenv/config";

import { spawn } from "node:child_process";
import { writeFile, readFile, unlink, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../src/db";
import { step } from "../src/db/schema";

function runFfmpeg(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-ss",
      "0",
      "-i",
      input,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      output,
    ]);
    let stderr = "";
    ff.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

const FETCH_TIMEOUT_MS = 30_000;

async function backfillOne(stepId: string, photoUrl: string, workDir: string): Promise<string> {
  const inputPath = join(workDir, `${stepId}.mp4`);
  const outputPath = join(workDir, `${stepId}.jpg`);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(photoUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    await writeFile(inputPath, Buffer.from(await res.arrayBuffer()));

    await runFfmpeg(inputPath, outputPath);

    const jpeg = await readFile(outputPath);
    // Mirror the upload route's path scheme: memories/<userId>/posters/...
    // We don't have userId here without a join, but the blob path is cosmetic
    // since the public URL is what's stored. Use the step id for traceability.
    const blob = await put(`memories/backfill/posters/${stepId}-${Date.now()}.jpg`, jpeg, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });

    return blob.url;
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is required");

  const rows = await db
    .select({ id: step.id, photoUrl: step.photoUrl })
    .from(step)
    .where(and(eq(step.type, "video"), isNull(step.posterUrl)));

  const todo = rows.filter((r) => !!r.photoUrl);
  console.log(`Found ${todo.length} videos missing a poster.`);
  if (todo.length === 0) return;

  const workDir = await mkdtemp(join(tmpdir(), "video-poster-backfill-"));
  let ok = 0;
  let failed = 0;

  for (const row of todo) {
    const photoUrl = row.photoUrl as string;
    try {
      console.log(`[${ok + failed + 1}/${todo.length}] ${row.id} ...`);
      const posterUrl = await backfillOne(row.id, photoUrl, workDir);
      await db.update(step).set({ posterUrl }).where(eq(step.id, row.id));
      ok++;
      console.log(`  -> ok: ${posterUrl}`);
    } catch (err) {
      failed++;
      console.error(`  -> failed:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${failed} failed.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
