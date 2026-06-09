import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
const { Pool } = pg;
let pool = null;
function getDatabaseUrl() {
    const url = process.env.DATABASE_URL ?? process.env.DATABASE_PUBLIC_URL;
    if (!url) {
        throw new Error("DATABASE_URL is not set.");
    }
    return url;
}
export function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: getDatabaseUrl(),
            ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
        });
    }
    return pool;
}
export async function migrate() {
    const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await getPool().query(schema);
}
