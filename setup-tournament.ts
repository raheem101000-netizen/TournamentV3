
import { db } from "./server/db";
import { tournaments, teams } from "@shared/schema";
import { eq } from "drizzle-orm";

async function setupTournament() {
    try {
        console.log("Setting up tournament...");

        // 1. Find the tournament
        const results = await db.select().from(tournaments).where(eq(tournaments.name, "Deep Dive Cup"));

        if (results.length === 0) {
            console.error("Tournament 'Deep Dive Cup' not found.");
            process.exit(1);
        }

        const tournament = results[0];
        console.log(`Found tournament: ${tournament.name} (${tournament.id})`);

        // 2. Configure settings (Single Elimination)
        await db.update(tournaments)
            .set({
                format: "single_elimination",
                totalTeams: 4, // Set to 4 to match our dummy teams
                status: "upcoming"
            })
            .where(eq(tournaments.id, tournament.id));

        console.log("Updated tournament settings to Single Elimination, 4 Teams.");

        // 3. Add Teams
        const dummyTeams = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"];

        // Check existing teams to avoid duplicates if run multiple times
        const existingTeams = await db.select().from(teams).where(eq(teams.tournamentId, tournament.id));
        const existingNames = new Set(existingTeams.map(t => t.name));

        for (const teamName of dummyTeams) {
            if (!existingNames.has(teamName)) {
                await db.insert(teams).values({
                    name: teamName,
                    tournamentId: tournament.id,
                    game: tournament.game || "General",
                    wins: 0,
                    losses: 0,
                    points: 0
                });
                console.log(`Added team: ${teamName}`);
            } else {
                console.log(`Team ${teamName} already exists.`);
            }
        }

        console.log("Tournament setup complete.");
        process.exit(0);

    } catch (error) {
        console.error("Error setting up tournament:", error);
        process.exit(1);
    }
}

setupTournament();
