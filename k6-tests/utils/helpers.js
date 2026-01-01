import { check } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Base URL - can be overridden with BASE_URL environment variable
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

/**
 * Generate random username
 */
export function randomUsername() {
  return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate random email
 */
export function randomEmail() {
  return `${randomUsername()}@test.com`;
}

/**
 * Generate random tournament name
 */
export function randomTournamentName() {
  const adjectives = ['Epic', 'Ultimate', 'Grand', 'Supreme', 'Elite', 'Pro', 'Master'];
  const nouns = ['Championship', 'Tournament', 'League', 'Cup', 'Battle', 'Showdown'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]} ${Date.now()}`;
}

/**
 * Generate random team name
 */
export function randomTeamName() {
  const prefixes = ['Team', 'Squad', 'Crew', 'Guild', 'Clan'];
  const suffixes = ['Warriors', 'Champions', 'Legends', 'Heroes', 'Titans'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
}

/**
 * Check response and track errors
 */
export function checkResponse(response, expectedStatus = 200, name = 'request') {
  const success = check(response, {
    [`${name}: status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name}: response time < 500ms`]: (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  return success;
}

/**
 * Parse session cookie from response
 */
export function extractSessionCookie(response) {
  const cookies = response.headers['Set-Cookie'];
  if (!cookies) return null;
  
  // Handle both string and array of cookies
  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
  
  for (const cookie of cookieArray) {
    if (cookie.includes('connect.sid=')) {
      // Extract just the session ID part
      const match = cookie.match(/connect\.sid=([^;]+)/);
      return match ? match[0] : null;
    }
  }
  
  return null;
}

/**
 * Sleep for a random duration between min and max seconds
 */
export function randomSleep(min = 1, max = 3) {
  const duration = min + Math.random() * (max - min);
  return duration;
}

/**
 * Create headers with session cookie
 */
export function createAuthHeaders(sessionCookie) {
  return {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie,
  };
}

/**
 * Log error details
 */
export function logError(response, context = '') {
  console.error(`Error ${context}:`, {
    status: response.status,
    body: response.body ? response.body.substring(0, 200) : 'no body',
    url: response.url,
  });
}
