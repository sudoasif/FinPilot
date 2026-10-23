import { promises as fs } from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import { get, put } from "@vercel/blob";
import { createSeedDatabase } from "@/lib/seed";
import type { Database } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "finpilot.json");
const BLOB_PATHNAME = "finpilot/v1/database.json";

const useBlob =
  Boolean(process.env.BLOB_READ_WRITE_TOKEN) &&
  process.env.FINPILOT_STORAGE !== "file";

let queue: Promise<unknown> = Promise.resolve();

async function readFromBlob(): Promise<Database | null> {
  const result = await get(BLOB_PATHNAME, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200) return null;
  const raw = await new Response(result.stream).text();
  return JSON.parse(raw) as Database;
}

async function writeToBlob(db: Database) {
  await put(BLOB_PATHNAME, JSON.stringify(db, null, 2), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

async function readFromFile(): Promise<Database | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeToFile(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

async function loadDatabase(): Promise<Database> {
  if (useBlob) {
    const existing = await readFromBlob();
    if (existing) return existing;

    const seeded = createSeedDatabase();
    await writeToBlob(seeded);
    return seeded;
  }

  const existing = await readFromFile();
  if (existing) return existing;

  const seeded = createSeedDatabase();
  await writeToFile(seeded);
  return seeded;
}

async function saveDatabase(db: Database) {
  if (useBlob) {
    await writeToBlob(db);
    return;
  }
  await writeToFile(db);
}

export async function readDb(): Promise<Database> {
  await connection();
  return loadDatabase();
}

export async function mutateDb<T>(
  mutator: (db: Database) => T | Promise<T>,
): Promise<T> {
  const run = async () => {
    const db = await loadDatabase();
    const result = await mutator(db);
    await saveDatabase(db);
    return result;
  };

  const next = queue.then(run, run);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function resetDb(): Promise<Database> {
  return mutateDb((db) => {
    const seeded = createSeedDatabase();
    Object.assign(db, seeded);
    return db;
  });
}
