/**
 * Transfer all tournaments from one user to another.
 * Usage: npx tsx --env-file=.env scripts/transfer-all-tournaments.ts
 */

import { db } from "../server/db.js";
import { tournaments, users } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    const fromEmail = "raheem101000@gmail.com";
    const toEmail = "admin@test.com";

    console.log(`🔄 Transferring all tournaments from ${fromEmail} to ${toEmail}...`);

    const [fromUser] = await db.select().from(users).where(eq(users.email, fromEmail));
    const [toUser] = await db.select().from(users).where(eq(users.email, toEmail));

    if (!fromUser || !toUser) {
        console.error("❌ One of the users not found");
        process.exit(1);
    }

    await db.update(tournaments).set({
        organizerId: toUser.id,
        organizerName: toUser.username
    }).where(eq(tournaments.organizerId, fromUser.id));

    console.log(`✅ All tournaments transferred from ${fromUser.username} to ${toUser.username}!`);
    process.exit(0);
}

main().catch(console.error);
