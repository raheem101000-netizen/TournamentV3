
import { db } from "./server/db";
import { tournaments } from "@shared/schema";
import { eq } from "drizzle-orm";

async function listTournaments() {
    try {
        const allTournaments = await db.select().from(tournaments);
        console.log("Tournaments found:", allTournaments.length);
        allTournaments.forEach(t => {
            console.log(`ID: ${t.id}, Name: ${t.name}, CreatedAt: ${t.createdAt}`);
        });
        process.exit(0);
    } catch (error) {
        console.error("Error listing tournaments:", error);
        process.exit(1);
    }
}

listTournaments();
