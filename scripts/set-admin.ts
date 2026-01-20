/**
 * Set a user as admin by their email address.
 * 
 * Usage: npx tsx --env-file=.env scripts/set-admin.ts <email>
 * Example: npx tsx --env-file=.env scripts/set-admin.ts admin@test.com
 */

import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error("❌ Usage: npx tsx --env-file=.env scripts/set-admin.ts <email>");
        console.error("   Example: npx tsx --env-file=.env scripts/set-admin.ts admin@test.com");
        process.exit(1);
    }

    console.log(`🔍 Looking for user with email: ${email}`);

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        console.error(`❌ User not found with email: ${email}`);
        process.exit(1);
    }

    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);
    console.log(`   Current isAdmin: ${user.isAdmin}`);

    // Set as admin
    await db
        .update(users)
        .set({ isAdmin: 1 })
        .where(eq(users.id, user.id));

    console.log(`✅ Admin privileges granted to ${user.username}!`);
    process.exit(0);
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
