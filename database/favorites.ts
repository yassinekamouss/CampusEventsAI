import * as SQLite from "expo-sqlite";

import { EventRow } from "@/database/events";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("campusevents.db");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  return db;
}

export async function toggleFavorite(eventId: string, userId: string) {
  const database = await getDb();

  const existing = await database.getFirstAsync<{ eventId: string }>(
    "SELECT eventId FROM favorites WHERE eventId = ? AND userId = ?",
    [eventId, userId],
  );

  if (existing) {
    await database.runAsync(
      "DELETE FROM favorites WHERE eventId = ? AND userId = ?",
      [eventId, userId],
    );
    return false;
  }

  await database.runAsync(
    "INSERT INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)",
    [eventId, userId, new Date().toISOString()],
  );
  return true;
}

export async function getFavorites(userId: string) {
  const database = await getDb();
  return database.getAllAsync<EventRow>(
    `SELECT e.*
     FROM favorites f
     INNER JOIN events e ON e.id = f.eventId
     WHERE f.userId = ?
     ORDER BY f.createdAt DESC`,
    [userId],
  );
}

export async function checkIsFavorite(eventId: string, userId: string) {
  const database = await getDb();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM favorites WHERE eventId = ? AND userId = ?",
    [eventId, userId],
  );
  return Number(row?.count ?? 0) > 0;
}
