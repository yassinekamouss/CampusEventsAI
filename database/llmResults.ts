import * as SQLite from "expo-sqlite";

import { AiActionType } from "@/services/llm";

export type LLMResult = {
  id?: string;
  eventId?: string | null;
  userId?: string;
  type: AiActionType;
  inputText: string;
  outputText: string;
  createdAt?: string;
};

type LlmResultRow = {
  id: string;
  eventId: string | null;
  userId: string;
  type: AiActionType;
  inputText: string;
  outputText: string;
  createdAt: string;
};

const CACHE_USER_ID = "etudiant@campus.ma";

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

export async function getCachedResult(type: AiActionType, inputText: string) {
  const database = await getDb();
  return database.getFirstAsync<LlmResultRow>(
    `SELECT id, eventId, userId, type, inputText, outputText, createdAt
     FROM llm_results
     WHERE type = ? AND inputText = ? AND userId = ?
     ORDER BY createdAt DESC
     LIMIT 1`,
    [type, inputText, CACHE_USER_ID],
  );
}

export async function saveLlmResult(result: LLMResult) {
  const database = await getDb();

  const id = result.id ?? uuidv4();
  const createdAt = result.createdAt ?? new Date().toISOString();
  const userId = result.userId ?? CACHE_USER_ID;

  await database.runAsync(
    "INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      result.eventId ?? null,
      userId,
      result.type,
      result.inputText,
      result.outputText,
      createdAt,
    ],
  );

  return id;
}
