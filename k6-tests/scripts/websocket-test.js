import { check } from 'k6';
import ws from 'k6/ws';
import { sleep } from 'k6';
import http from 'k6/http';
import {
    BASE_URL,
    randomUsername,
    randomEmail,
    extractSessionCookie,
    randomSleep
} from '../utils/helpers.js';

/**
 * Test WebSocket connections for real-time updates
 * Note: k6 WebSocket support is available but may have limitations
 */
export default function () {
    // First authenticate to get session
    const username = randomUsername();
    const email = randomEmail();
    const password = 'TestPassword123!';

    const registerRes = http.post(
        `${BASE_URL}/api/register`,
        JSON.stringify({ username, email, password }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (registerRes.status !== 200) {
        console.error('Registration failed');
        return;
    }

    const loginRes = http.post(
        `${BASE_URL}/api/login`,
        JSON.stringify({ username, password }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (loginRes.status !== 200) {
        console.error('Login failed');
        return;
    }

    const sessionCookie = extractSessionCookie(loginRes);
    if (!sessionCookie) {
        console.error('No session cookie');
        return;
    }

    sleep(randomSleep(0.5, 1));

    // Construct WebSocket URL
    const wsUrl = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

    const params = {
        headers: {
            'Cookie': sessionCookie,
        },
    };

    // Connect to WebSocket
    const response = ws.connect(`${wsUrl}/ws`, params, function (socket) {
        socket.on('open', function () {
            console.log('WebSocket connected');

            // Send a test message
            socket.send(JSON.stringify({
                type: 'ping',
                timestamp: Date.now(),
            }));
        });

        socket.on('message', function (data) {
            console.log('Message received:', data);

            check(data, {
                'message received': (d) => d !== null && d !== undefined,
            });
        });

        socket.on('error', function (e) {
            console.error('WebSocket error:', e);
        });

        socket.on('close', function () {
            console.log('WebSocket disconnected');
        });

        // Keep connection open for a bit
        sleep(5);

        // Send another message before closing
        socket.send(JSON.stringify({
            type: 'test',
            message: 'Load testing WebSocket',
        }));

        sleep(2);

        socket.close();
    });

    check(response, {
        'WebSocket connection established': (r) => r && r.status === 101,
    });

    sleep(randomSleep(1, 2));
}
