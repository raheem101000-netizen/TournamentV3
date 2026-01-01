import { sleep } from 'k6';
import { getThresholds } from '../config/thresholds.js';
import authFlow from '../scripts/auth-flow.js';
import tournamentOps from '../scripts/tournament-ops.js';
import matchOps from '../scripts/match-ops.js';

/**
 * Load Test - Normal expected load
 * 
 * Purpose: Test sustained performance under expected user load
 * Duration: 10 minutes
 * Users: Ramps up to 50-100 concurrent users
 */

export const options = {
    stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 100 },  // Ramp up to 100 users
        { duration: '2m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 0 },    // Ramp down to 0 users
    ],
    thresholds: getThresholds(),
};

export default function () {
    // Mix of different operations
    const scenario = Math.random();

    if (scenario < 0.4) {
        // 40% authentication flow
        authFlow();
    } else if (scenario < 0.7) {
        // 30% tournament operations
        tournamentOps();
    } else {
        // 30% match operations
        matchOps();
    }

    sleep(1);
}

export function handleSummary(data) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Load Test Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const metrics = data.metrics;

    console.log('📊 Summary:');
    console.log(`   Total Requests: ${metrics.http_reqs?.values.count || 0}`);
    console.log(`   Request Rate: ${(metrics.http_reqs?.values.rate || 0).toFixed(2)}/s`);
    console.log(`   Avg Response Time: ${(metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms`);
    console.log(`   p(95) Response Time: ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms`);
    console.log(`   Failed Requests: ${((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`);
    console.log(`   Checks Passed: ${((metrics.checks?.values.rate || 0) * 100).toFixed(2)}%\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
        'stdout': JSON.stringify(data, null, 2),
    };
}
