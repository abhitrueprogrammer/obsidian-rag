import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";

const db = new Database(path.join(app.getPath("userData"), "vaults.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS vaults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const addVault = (vaultPath: string) => {
  return db.prepare("INSERT OR IGNORE INTO vaults (path) VALUES (?)").run(vaultPath);
};

export const getVaults = () => {
  return db.prepare("SELECT * FROM vaults").all();
};

export const removeVault = (vaultPath: string) => {
  return db.prepare("DELETE FROM vaults WHERE path = ?").run(vaultPath);
};