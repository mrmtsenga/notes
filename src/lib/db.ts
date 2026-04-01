import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load("sqlite:notes.db");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      content TEXT DEFAULT '',
      folder TEXT DEFAULT 'Notes',
      date TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  return db;
}

export type Note = {
  id: number;
  title: string;
  content: string;
  folder: string;
  date: string;
  updated_at: string;
};

export async function dbFetchNotes(folder: string): Promise<Note[]> {
  const db = await getDb();
  return db.select("SELECT * FROM notes WHERE folder = ? ORDER BY updated_at DESC", [folder]);
}

export async function dbInsertNote(title: string, content: string, folder: string, date: string): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO notes (title, content, folder, date) VALUES (?, ?, ?, ?)",
    [title, content, folder, date]
  );
  if (!result.lastInsertId) throw new Error("Insert failed");
  return result.lastInsertId;
}

export async function dbUpdateNote(id: number, title: string, content: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [title, content, id]
  );
}

export async function dbDeleteNote(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM notes WHERE id = ?", [id]);
}

export async function dbFetchFolders(): Promise<string[]> {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);
  const rows = await db.select<{ name: string }[]>("SELECT name FROM folders ORDER BY id ASC");
  return rows.map(r => r.name);
}

export async function dbCreateFolder(name: string): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT OR IGNORE INTO folders (name) VALUES (?)", [name]);
}

export async function dbDeleteFolder(name: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM folders WHERE name = ?", [name]);
  await db.execute("DELETE FROM notes WHERE folder = ?", [name]);
}