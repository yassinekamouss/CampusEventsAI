import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("campusevents.db");
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

  // RFC 4122 version 4
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

export async function initDatabase() {
  const database = await getDb();

  await database.execAsync(`CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, startDateTime TEXT NOT NULL, endDateTime TEXT, locationName TEXT NOT NULL, locationAddress TEXT, organizerName TEXT NOT NULL, capacity INTEGER, registeredCount INTEGER DEFAULT 0, imageUrl TEXT, tags TEXT, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY, eventId TEXT NOT NULL, userId TEXT NOT NULL, createdAt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'confirmed', FOREIGN KEY (eventId) REFERENCES events(id)
);
CREATE TABLE IF NOT EXISTS favorites (
  eventId TEXT NOT NULL, userId TEXT NOT NULL, createdAt TEXT NOT NULL, PRIMARY KEY (eventId, userId), FOREIGN KEY (eventId) REFERENCES events(id)
);
CREATE TABLE IF NOT EXISTS llm_results (
  id TEXT PRIMARY KEY, eventId TEXT, userId TEXT NOT NULL, type TEXT NOT NULL, inputText TEXT NOT NULL, outputText TEXT NOT NULL, createdAt TEXT NOT NULL
);`);
}

export async function seedDatabaseIfEmpty() {
  const database = await getDb();

  const countRow = await database.getFirstAsync<Record<string, unknown>>(
    "SELECT COUNT(*) FROM events",
  );
  const existingCount = Number(countRow?.["COUNT(*)"] ?? 0);

  if (existingCount > 0) return;

  const now = new Date();
  const createdAt = now.toISOString();

  const startWorkshop = new Date(now);
  startWorkshop.setDate(startWorkshop.getDate() + 7);
  startWorkshop.setHours(14, 0, 0, 0);

  const endWorkshop = new Date(startWorkshop);
  endWorkshop.setHours(endWorkshop.getHours() + 3);

  const startTalk = new Date(now);
  startTalk.setDate(startTalk.getDate() + 14);
  startTalk.setHours(18, 30, 0, 0);

  const endTalk = new Date(startTalk);
  endTalk.setHours(endTalk.getHours() + 2);

  const startClub = new Date(now);
  startClub.setDate(startClub.getDate() + 30);
  startClub.setHours(9, 0, 0, 0);

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      "INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        uuidv4(),
        "Workshop React Native",
        "Atelier pratique : construire un écran Expo Router, gérer l'état UI (Loading/Error/Empty/Result) et intégrer SQLite local-first.",
        "Workshop",
        startWorkshop.toISOString(),
        endWorkshop.toISOString(),
        "Salle Informatique B-204",
        "Bâtiment B, 2e étage, Campus Universitaire",
        "Département Informatique",
        40,
        0,
        null,
        JSON.stringify(["react", "mobile", "expo", "sqlite"]),
        createdAt,
      ],
    );

    await database.runAsync(
      "INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        uuidv4(),
        "Conférence IA Générative",
        "Panorama des LLM en 2026 : usages, limites, sécurité (OWASP), et bonnes pratiques pour des sorties JSON fiables en production.",
        "Talk",
        startTalk.toISOString(),
        endTalk.toISOString(),
        "Amphi A",
        "Bâtiment Principal, Entrée Nord",
        "Laboratoire IA & Données",
        300,
        0,
        null,
        JSON.stringify(["ia", "llm", "security", "campus"]),
        createdAt,
      ],
    );

    await database.runAsync(
      "INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        uuidv4(),
        "Sortie Club Photo",
        "Balade photo au lever du jour : composition, réglages manuels et mini-défi “architecture & nature”. Matériel conseillé : appareil/phone + batterie.",
        "Club",
        startClub.toISOString(),
        null,
        "Point de rendez-vous : Entrée Bibliothèque",
        "Allée Centrale, Campus",
        "Club Photo",
        25,
        0,
        null,
        JSON.stringify(["photo", "club", "outdoor", "campus"]),
        createdAt,
      ],
    );
  });
}
