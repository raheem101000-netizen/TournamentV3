import http from 'k6/http';
import { sleep } from 'k6';
import {
    BASE_URL,
    randomUsername,
    randomEmail,
    randomTournamentName,
    randomTeamName,
    checkResponse,
    extractSessionCookie,
    createAuthHeaders,
    randomSleep
} from '../utils/helpers.js';

/**
 * Test tournament operations: create, list, update, manage teams
 */
export default function () {
    // First, authenticate
    const username = randomUsername();
    const email = randomEmail();
    const password = 'TestPassword123!';

    // Register
    const registerRes = http.post(
        `${BASE_URL}/api/register`,
        JSON.stringify({ username, email, password }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (!checkResponse(registerRes, 200, 'register')) {
        return;
    }

    // Login
    const loginRes = http.post(
        `${BASE_URL}/api/login`,
        JSON.stringify({ username, password }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (!checkResponse(loginRes, 200, 'login')) {
        return;
    }

    const sessionCookie = extractSessionCookie(loginRes);
    if (!sessionCookie) return;

    const authHeaders = createAuthHeaders(sessionCookie);

    sleep(randomSleep(0.5, 1));

    // 1. Create a tournament
    const tournamentPayload = JSON.stringify({
        name: randomTournamentName(),
        description: 'This is a test tournament for load testing',
        game: 'Test Game',
        format: 'single-elimination',
        maxTeams: 16,
        teamSize: 5,
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        rules: 'Standard tournament rules apply',
        prizePool: '1000',
        isPublic: true,
    });

    const createTournamentRes = http.post(
        `${BASE_URL}/api/tournaments`,
        tournamentPayload,
        { headers: authHeaders }
    );

    if (!checkResponse(createTournamentRes, 201, 'create tournament')) {
        console.error('Failed to create tournament:', createTournamentRes.body);
        return;
    }

    const tournament = JSON.parse(createTournamentRes.body);
    const tournamentId = tournament.id;

    sleep(randomSleep(0.5, 1));

    // 2. Get tournament details
    const getTournamentRes = http.get(
        `${BASE_URL}/api/tournaments/${tournamentId}`,
        { headers: authHeaders }
    );

    checkResponse(getTournamentRes, 200, 'get tournament');

    sleep(randomSleep(0.5, 1));

    // 3. List all tournaments
    const listTournamentsRes = http.get(
        `${BASE_URL}/api/tournaments`,
        { headers: authHeaders }
    );

    checkResponse(listTournamentsRes, 200, 'list tournaments');

    sleep(randomSleep(0.5, 1));

    // 4. Update tournament
    const updatePayload = JSON.stringify({
        description: 'Updated description for load testing',
        prizePool: '2000',
    });

    const updateTournamentRes = http.patch(
        `${BASE_URL}/api/tournaments/${tournamentId}`,
        updatePayload,
        { headers: authHeaders }
    );

    checkResponse(updateTournamentRes, 200, 'update tournament');

    sleep(randomSleep(0.5, 1));

    // 5. Create a team for the tournament
    const teamPayload = JSON.stringify({
        name: randomTeamName(),
        tournamentId: tournamentId,
    });

    const createTeamRes = http.post(
        `${BASE_URL}/api/teams`,
        teamPayload,
        { headers: authHeaders }
    );

    if (checkResponse(createTeamRes, 201, 'create team')) {
        const team = JSON.parse(createTeamRes.body);
        const teamId = team.id;

        sleep(randomSleep(0.5, 1));

        // 6. Get team details
        const getTeamRes = http.get(
            `${BASE_URL}/api/teams/${teamId}`,
            { headers: authHeaders }
        );

        checkResponse(getTeamRes, 200, 'get team');
    }

    sleep(randomSleep(1, 2));

    // 7. Delete tournament (cleanup)
    const deleteTournamentRes = http.del(
        `${BASE_URL}/api/tournaments/${tournamentId}`,
        null,
        { headers: authHeaders }
    );

    checkResponse(deleteTournamentRes, 200, 'delete tournament');

    sleep(randomSleep(1, 2));
}
