import * as SQLite from "expo-sqlite";

export type EventRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  startDateTime: string;
  endDateTime: string | null;
  locationName: string;
  locationAddress: string | null;
  organizerName: string;
  capacity: number | null;
  registeredCount: number;
  imageUrl: string | null;
  tags: string | null;
  createdAt: string;
};

export type EventInput = {
  id?: string;
  title: string;
  description: string;
  category: string;
  startDateTime: string;
  endDateTime?: string | null;
  locationName: string;
  locationAddress?: string | null;
  organizerName: string;
  capacity?: number | null;
  imageUrl?: string | null;
  tags?: string[] | null;
  createdAt?: string;
};

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("campusevents.db");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  return db;
}

function uuidv4(): string {
  const cryptoObj = globalThis.crypto as
    | {
        randomUUID?: () => string;
        getRandomValues?: (array: Uint8Array) => Uint8Array;
      }
    | undefined;

  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();

  const bytes = new Uint8Array(16);
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1)
      bytes[i] = Math.floor(Math.random() * 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}

function toTagsJson(tags?: string[] | null) {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

export async function getAllEvents() {
  const database = await getDb();
  return database.getAllAsync<EventRow>(
    "SELECT * FROM events ORDER BY startDateTime DESC",
    [],
  );
}

export async function getEventById(id: string) {
  const database = await getDb();
  return database.getFirstAsync<EventRow>("SELECT * FROM events WHERE id = ?", [
    id,
  ]);
}

export async function addEvent(event: EventInput) {
  const database = await getDb();

  const id = event.id ?? uuidv4();
  const createdAt = event.createdAt ?? new Date().toISOString();

  await database.runAsync(
    "INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      event.title,
      event.description,
      event.category,
      event.startDateTime,
      event.endDateTime ?? null,
      event.locationName,
      event.locationAddress ?? null,
      event.organizerName,
      event.capacity ?? null,
      0,
      event.imageUrl ?? null,
      toTagsJson(event.tags),
      createdAt,
    ],
  );

  return id;
}

const UPDATABLE_COLUMNS = [
  "title",
  "description",
  "category",
  "startDateTime",
  "endDateTime",
  "locationName",
  "locationAddress",
  "organizerName",
  "capacity",
  "imageUrl",
  "tags",
] as const;

const UPDATABLE_SET = new Set<string>(UPDATABLE_COLUMNS);

type UpdateKey = (typeof UPDATABLE_COLUMNS)[number];

export async function updateEvent(id: string, updates: Partial<EventInput>) {
  const database = await getDb();

  const setParts: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!UPDATABLE_SET.has(key as UpdateKey)) continue;

    if (key === "tags") {
      setParts.push("tags = ?");
      values.push(toTagsJson(value as string[] | null | undefined));
      continue;
    }

    setParts.push(`${key} = ?`);
    values.push(value ?? null);
  }

  if (setParts.length === 0) return;

  await database.runAsync(
    `UPDATE events SET ${setParts.join(", ")} WHERE id = ?`,
    [...values, id],
  );
}

export async function deleteEvent(id: string) {
  const database = await getDb();

  await database.withTransactionAsync(async () => {
    // Safety: schema may not enforce ON DELETE CASCADE; delete dependents explicitly.
    await database.runAsync("DELETE FROM registrations WHERE eventId = ?", [
      id,
    ]);
    await database.runAsync("DELETE FROM favorites WHERE eventId = ?", [id]);
    await database.runAsync("DELETE FROM events WHERE id = ?", [id]);
  });
}
