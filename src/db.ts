import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const rootDir = process.cwd();

// Ensure data dir exists
const dataDir = path.join(rootDir, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'database.sqlite');
export const db = new DatabaseSync(dbPath);

export function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            customer_name TEXT,
            base_amount INTEGER,
            unique_code INTEGER,
            total_amount INTEGER,
            qris_payload TEXT,
            proof_image_path TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function runQuery(sql: string, params: any[] = []): Promise<any> {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
}

export async function getQuery<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T | undefined;
}

export async function allQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
}
