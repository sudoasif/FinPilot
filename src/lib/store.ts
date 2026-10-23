import { promises as fs } from "node:fs";
import path from "node:path";
import { createSeedDatabase } from "@/lib/seed";
import type { Database } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "finpilot.json");

let queue: Promise<unknown> = Promise.resolve();

async function ensureDatabase(): Promise<Database> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    const seeded = createSeedDatabase();
    await writeDatabase(seeded);
    return seeded;
  }
}

async function writeDatabase(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

export async function readDb(): Promise<Database> {
  return ensureDatabase();
}

export async function mutateDb<T>(
  mutator: (db: Database) => T | Promise<T>,
): Promise<T> {
  const run = async () => {
    const db = await ensureDatabase();
    const result = await mutator(db);
    await writeDatabase(db);
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
