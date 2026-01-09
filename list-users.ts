
import { db } from "./server/db";
import { users } from "./shared/schema";

async function listUsers() {
    try {
        const allUsers = await db.select().from(users);
        console.log("Found " + allUsers.length + " users:");
        allUsers.forEach(u => {
            console.log(`- Username: ${u.username}, ID: ${u.id}`);
        });
        process.exit(0);
    } catch (error) {
        console.error("Error listing users:", error);
        process.exit(1);
    }
}

listUsers();
