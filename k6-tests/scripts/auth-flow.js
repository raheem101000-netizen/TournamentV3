import http from 'k6/http';
import { sleep } from 'k6';
import {
    BASE_URL,
    randomUsername,
    randomEmail,
    checkResponse,
    extractSessionCookie,
    createAuthHeaders,
    randomSleep
} from '../utils/helpers.js';

/**
 * Test authentication flow: registration, login, authenticated requests, logout
 */
export default function () {
    const username = randomUsername();
    const email = randomEmail();
    const password = 'TestPassword123!';

    // 1. Register new user
    const registerPayload = JSON.stringify({
        username: username,
        email: email,
        password: password,
    });

    const registerRes = http.post(
        `${BASE_URL}/api/auth/register`,
        registerPayload,
        { headers: { 'Content-Type': 'application/json' } }
    );

    const registerSuccess = checkResponse(registerRes, 200, 'register');

    if (!registerSuccess) {
        console.error('Registration failed:', registerRes.body);
        return;
    }

    sleep(randomSleep(0.5, 1));

    // 2. Login
    const loginPayload = JSON.stringify({
        username: username,
        password: password,
    });

    const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        loginPayload,
        { headers: { 'Content-Type': 'application/json' } }
    );

    const loginSuccess = checkResponse(loginRes, 200, 'login');

    if (!loginSuccess) {
        console.error('Login failed:', loginRes.body);
        return;
    }

    // Extract session cookie
    const sessionCookie = extractSessionCookie(loginRes);

    if (!sessionCookie) {
        console.error('No session cookie received');
        return;
    }

    sleep(randomSleep(0.5, 1));

    // 3. Get user profile (authenticated request)
    const profileRes = http.get(
        `${BASE_URL}/api/user`,
        { headers: createAuthHeaders(sessionCookie) }
    );

    checkResponse(profileRes, 200, 'get profile');

    sleep(randomSleep(1, 2));

    // 4. Update profile
    const updatePayload = JSON.stringify({
        bio: 'This is my test bio',
    });

    const updateRes = http.patch(
        `${BASE_URL}/api/user`,
        updatePayload,
        { headers: createAuthHeaders(sessionCookie) }
    );

    checkResponse(updateRes, 200, 'update profile');

    sleep(randomSleep(0.5, 1));

    // 5. Logout
    const logoutRes = http.post(
        `${BASE_URL}/api/logout`,
        null,
        { headers: createAuthHeaders(sessionCookie) }
    );

    checkResponse(logoutRes, 200, 'logout');

    sleep(randomSleep(1, 2));
}
