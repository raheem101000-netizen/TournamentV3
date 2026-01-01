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
 * Test match operations: create matches, update scores, chat
 */
export default function () {
    // Setup: Create user and authenticate
    const username = randomUsername();
    const email = randomEmail();
    const password = 'TestPassword123!';

    const registerRes = http.post(
        `${BASE_URL}/api/register`,
        JSON.stringify({ username, email, password }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (!checkResponse(registerRes, 200, 'register')) return;

    const loginRes = http.post(
        `${BASE_URL}/api/login`,
        JSON.stringify({ username, password }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (!checkResponse(loginRes, 200, 'login')) return;

    const sessionCookie = extractSessionCookie(loginRes);
    if (!sessionCookie) return;

    const authHeaders = createAuthHeaders(sessionCookie);

    sleep(randomSleep(0.5, 1));

    // Create a tournament first
    const tournamentPayload = JSON.stringify({
        name: randomTournamentName(),
        description: 'Match testing tournament',
        game: 'Test Game',
        format: 'single-elimination',
        maxTeams: 8,
        teamSize: 5,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
        isPublic: true,
    });

    const createTournamentRes = http.post(
        `${BASE_URL}/api/tournaments`,
        tournamentPayload,
        { headers: authHeaders }
    );

    if (!checkResponse(createTournamentRes, 201, 'create tournament')) return;

    const tournament = JSON.parse(createTournamentRes.body);
    const tournamentId = tournament.id;

    sleep(randomSleep(0.5, 1));

    // Create two teams
    const team1Payload = JSON.stringify({
        name: randomTeamName(),
        tournamentId: tournamentId,
    });

    const createTeam1Res = http.post(
        `${BASE_URL}/api/teams`,
        team1Payload,
        { headers: authHeaders }
    );

    if (!checkResponse(createTeam1Res, 201, 'create team 1')) return;
    const team1 = JSON.parse(createTeam1Res.body);

    sleep(randomSleep(0.3, 0.5));

    const team2Payload = JSON.stringify({
        name: randomTeamName(),
        tournamentId: tournamentId,
    });

    const createTeam2Res = http.post(
        `${BASE_URL}/api/teams`,
        team2Payload,
        { headers: authHeaders }
    );

    if (!checkResponse(createTeam2Res, 201, 'create team 2')) return;
    const team2 = JSON.parse(createTeam2Res.body);

    sleep(randomSleep(0.5, 1));

    // 1. Create a match
    const matchPayload = JSON.stringify({
        tournamentId: tournamentId,
        team1Id: team1.id,
        team2Id: team2.id,
        round: 1,
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
    });

    const createMatchRes = http.post(
        `${BASE_URL}/api/matches`,
        matchPayload,
        { headers: authHeaders }
    );

    if (!checkResponse(createMatchRes, 201, 'create match')) {
        console.error('Failed to create match:', createMatchRes.body);
        return;
    }

    const match = JSON.parse(createMatchRes.body);
    const matchId = match.id;

    sleep(randomSleep(0.5, 1));

    // 2. Get match details
    const getMatchRes = http.get(
        `${BASE_URL}/api/matches/${matchId}`,
        { headers: authHeaders }
    );

    checkResponse(getMatchRes, 200, 'get match');

    sleep(randomSleep(0.5, 1));

    // 3. Update match score
    const scorePayload = JSON.stringify({
        team1Score: 10,
        team2Score: 5,
        status: 'in-progress',
    });

    const updateScoreRes = http.patch(
        `${BASE_URL}/api/matches/${matchId}`,
        scorePayload,
        { headers: authHeaders }
    );

    checkResponse(updateScoreRes, 200, 'update match score');

    sleep(randomSleep(0.5, 1));

    // 4. Send a chat message in the match
    const chatPayload = JSON.stringify({
        message: 'Good game! Testing match chat.',
    });

    const sendChatRes = http.post(
        `${BASE_URL}/api/matches/${matchId}/chat`,
        chatPayload,
        { headers: authHeaders }
    );

    checkResponse(sendChatRes, 201, 'send match chat');

    sleep(randomSleep(0.5, 1));

    // 5. Get match chat messages
    const getChatRes = http.get(
        `${BASE_URL}/api/matches/${matchId}/chat`,
        { headers: authHeaders }
    );

    checkResponse(getChatRes, 200, 'get match chat');

    sleep(randomSleep(0.5, 1));

    // 6. Complete the match
    const completePayload = JSON.stringify({
        team1Score: 15,
        team2Score: 10,
        status: 'completed',
        winnerId: team1.id,
    });

    const completeMatchRes = http.patch(
        `${BASE_URL}/api/matches/${matchId}`,
        completePayload,
        { headers: authHeaders }
    );

    checkResponse(completeMatchRes, 200, 'complete match');

    sleep(randomSleep(1, 2));

    // Cleanup
    http.del(`${BASE_URL}/api/tournaments/${tournamentId}`, null, { headers: authHeaders });

    sleep(randomSleep(1, 2));
}
