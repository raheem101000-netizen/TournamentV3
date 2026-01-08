
import { db } from "./server/db";
import { tournaments, matches, teams } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateSingleEliminationBracket } from "./server/bracket-generator";

async function startTournament() {
    try {
        console.log("Starting tournament 'Deep Dive Cup'...");

        // 1. Find the tournament
        const results = await db.select().from(tournaments).where(eq(tournaments.name, "Deep Dive Cup"));
        if (results.length === 0) {
            console.error("Tournament not found");
            process.exit(1);
        }
        const tournament = results[0];

        // Check if already started
        if (tournament.status === 'in_progress') {
            console.log("Tournament already in progress.");
            await listMatches(tournament.id);
            process.exit(0);
        }

        // 2. Fetch Teams
        const tournamentTeams = await db.select().from(teams).where(eq(teams.tournamentId, tournament.id));
        if (tournamentTeams.length < 2) {
            console.error("Not enough teams to start tournament (need at least 2). Found:", tournamentTeams.length);
            process.exit(1);
        }

        // 3. Generate Bracket
        console.log("Generating bracket...");
        const { matches: newMatches } = generateSingleEliminationBracket(tournament.id, tournamentTeams);

        if (newMatches.length > 0) {
            await db.insert(matches).values(newMatches);
            console.log(`Inserted ${newMatches.length} matches.`);
        }

        // 4. Update Status
        await db.update(tournaments)
            .set({ status: "in_progress" })
            .where(eq(tournaments.id, tournament.id));

        console.log("Tournament started.");

        // 5. List Matches
        await listMatches(tournament.id);

        process.exit(0);
    } catch (error) {
        console.error("Error starting tournament:", error);
        process.exit(1);
    }
}

async function listMatches(tournamentId: string) {
    const allMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
    console.log(`Matches generated: ${allMatches.length}`);

    const allTeams = await db.select().from(teams).where(eq(teams.tournamentId, tournamentId));
    const teamMap = new Map(allTeams.map(t => [t.id, t.name]));

    allMatches.sort((a, b) => a.round - b.round);

    allMatches.forEach(m => {
        const t1 = m.team1Id ? teamMap.get(m.team1Id) || m.team1Id : "Bye/TBD";
        const t2 = m.team2Id ? teamMap.get(m.team2Id) || m.team2Id : "Bye/TBD";
        console.log(`Round ${m.round}: ${t1} vs ${t2} (Status: ${m.status}, ID: ${m.id})`);
    });
}

startTournament();
