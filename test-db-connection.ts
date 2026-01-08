
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
});

async function main() {
    try {
        console.log("Attempting to connect to DB...");
        const client = await pool.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT NOW()');
        console.log("Query Result:", res.rows[0]);
        client.release();
        await pool.end();
        console.log("Pool closed.");
    } catch (err: any) {
        console.error("Connection Failed (Full Error):", err);
        process.exit(1);
    }
}

main();
