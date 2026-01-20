/**
 * Reassign tournament ownership to a different user.
 * 
 * Usage: npx tsx --env-file=.env scripts/reassign-tournament.ts <tournament-name> <new-owner-email>
 * Example: npx tsx --env-file=.env scripts/reassign-tournament.ts "SUMMER" admin@test.com
 */

import { db } from "../server/db.js";
import { tournaments, users } from "../shared/schema.js";
import { eq, ilike } from "drizzle-orm";

async function main() {
    const tournamentName = process.argv[2];
    const newOwnerEmail = process.argv[3];

    if (!tournamentName || !newOwnerEmail) {
        console.error("❌ Usage: npx tsx --env-file=.env scripts/reassign-tournament.ts <tournament-name> <new-owner-email>");
        console.error("   Example: npx tsx --env-file=.env scripts/reassign-tournament.ts \"SUMMER\" admin@test.com");
        process.exit(1);
    }

    console.log(`🔍 Looking for tournament: "${tournamentName}"`);

    // Find tournament
    const [tournament] = await db.select().from(tournaments).where(ilike(tournaments.name, tournamentName));
    if (!tournament) {
        console.error(`❌ Tournament not found: ${tournamentName}`);
        // List available tournaments
        const allTournaments = await db.select({ name: tournaments.name, id: tournaments.id }).from(tournaments);
        console.log("\nAvailable tournaments:");
        allTournaments.forEach(t => console.log(`   - "${t.name}" (${t.id})`));
        process.exit(1);
    }

    console.log(`✅ Found tournament: ${tournament.name} (ID: ${tournament.id})`);
    console.log(`   Current owner ID: ${tournament.organizerId || 'null'}`);

    // Find new owner
    const [newOwner] = await db.select().from(users).where(eq(users.email, newOwnerEmail));
    if (!newOwner) {
        console.error(`❌ User not found with email: ${newOwnerEmail}`);
        process.exit(1);
    }

    console.log(`✅ Found new owner: ${newOwner.username} (${newOwner.id})`);

    // Reassign
    await db
        .update(tournaments)
        .set({
            organizerId: newOwner.id,
            organizerName: newOwner.username,
        })
        .where(eq(tournaments.id, tournament.id));

    console.log(`✅ Tournament "${tournament.name}" is now owned by ${newOwner.username}!`);
    process.exit(0);
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
