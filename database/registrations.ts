import * as SQLite from "expo-sqlite";

import { EventRow } from "@/database/events";

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

export async function registerForEvent(eventId: string, userId: string) {
  const database = await getDb();

  let created = false;

  await database.withTransactionAsync(async () => {
    const existing = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations WHERE eventId = ? AND userId = ?",
      [eventId, userId],
    );

    if (Number(existing?.count ?? 0) > 0) {
      created = false;
      return;
    }

    const event = await database.getFirstAsync<{
      capacity: number | null;
      registeredCount: number;
    }>("SELECT capacity, registeredCount FROM events WHERE id = ?", [eventId]);

    if (!event) {
      throw new Error("Événement introuvable.");
    }

    if (
      event.capacity !== null &&
      Number(event.registeredCount) >= Number(event.capacity)
    ) {
      throw new Error("Événement complet.");
    }

    await database.runAsync(
      "INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)",
      [uuidv4(), eventId, userId, new Date().toISOString(), "confirmed"],
    );

    await database.runAsync(
      "UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?",
      [eventId],
    );

    created = true;
  });

  return created;
}

export async function cancelRegistration(eventId: string, userId: string) {
  const database = await getDb();

  let deleted = false;

  await database.withTransactionAsync(async () => {
    const result = await database.runAsync(
      "DELETE FROM registrations WHERE eventId = ? AND userId = ?",
      [eventId, userId],
    );

    deleted = Number(result.changes ?? 0) > 0;

    if (!deleted) return;

    await database.runAsync(
      "UPDATE events SET registeredCount = MAX(registeredCount - 1, 0) WHERE id = ?",
      [eventId],
    );
  });

  return deleted;
}

export async function getRegistrations(userId: string) {
  const database = await getDb();
  return database.getAllAsync<EventRow>(
    `SELECT e.*
     FROM registrations r
     INNER JOIN events e ON e.id = r.eventId
     WHERE r.userId = ?
     ORDER BY r.createdAt DESC`,
    [userId],
  );
}

export async function checkIsRegisteredForEvent(
  eventId: string,
  userId: string,
) {
  const database = await getDb();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM registrations WHERE eventId = ? AND userId = ?",
    [eventId, userId],
  );
  return Number(row?.count ?? 0) > 0;
}
