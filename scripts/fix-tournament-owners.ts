/**
 * One-time migration script to fix tournaments with null organizerId.
 * 
 * Usage: npx tsx scripts/fix-tournament-owners.ts <your-user-id>
 * Example: npx tsx scripts/fix-tournament-owners.ts 86adab7f-be08-4289-98f2-651a9a8b126f
 */

import { db } from "../server/db.js";
import { tournaments, users } from "../shared/schema.js";
import { eq, isNull } from "drizzle-orm";

async function main() {
    const userId = process.argv[2];

    if (!userId) {
        console.error("❌ Usage: npx tsx scripts/fix-tournament-owners.ts <your-user-id>");
        console.error("   Example: npx tsx scripts/fix-tournament-owners.ts 86adab7f-be08-4289-98f2-651a9a8b126f");
        process.exit(1);
    }

    console.log(`🔍 Looking for user: ${userId}`);

    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
        console.error(`❌ User not found: ${userId}`);
        process.exit(1);
    }

    console.log(`✅ Found user: ${user.username}`);

    // Find tournaments with null organizerId
    const orphanedTournaments = await db
        .select()
        .from(tournaments)
        .where(isNull(tournaments.organizerId));

    if (orphanedTournaments.length === 0) {
        console.log("✅ No orphaned tournaments found. All tournaments have owners.");
        process.exit(0);
    }

    console.log(`🔧 Found ${orphanedTournaments.length} tournaments without an owner:`);
    orphanedTournaments.forEach(t => console.log(`   - ${t.name} (${t.id})`));

    // Update all orphaned tournaments
    const result = await db
        .update(tournaments)
        .set({
            organizerId: userId,
            organizerName: user.username,
        })
        .where(isNull(tournaments.organizerId));

    console.log(`✅ Successfully assigned ${orphanedTournaments.length} tournaments to ${user.username}`);
    process.exit(0);
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
