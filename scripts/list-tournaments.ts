/**
 * List all tournaments with their owners.
 * Usage: npx tsx --env-file=.env scripts/list-tournaments.ts
 */

import { db } from "../server/db.js";
import { tournaments, users } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    console.log("📋 All Tournaments:\n");

    const allTournaments = await db.select().from(tournaments);

    for (const t of allTournaments) {
        let ownerName = "NO OWNER (null)";
        if (t.organizerId) {
            const [owner] = await db.select().from(users).where(eq(users.id, t.organizerId));
            ownerName = owner ? `${owner.username} (${owner.email})` : `Unknown (${t.organizerId})`;
        }
        console.log(`"${t.name}" → Owner: ${ownerName}`);
    }

    // Also show raheem123's ID for reference
    const [raheem] = await db.select().from(users).where(eq(users.email, "raheem101000@gmail.com"));
    if (raheem) {
        console.log(`\n🔑 raheem123's ID: ${raheem.id}`);
    }

    process.exit(0);
}

main().catch(console.error);
