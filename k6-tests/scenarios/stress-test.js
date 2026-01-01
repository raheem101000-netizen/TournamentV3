import { sleep } from 'k6';
import { getThresholds } from '../config/thresholds.js';
import authFlow from '../scripts/auth-flow.js';
import tournamentOps from '../scripts/tournament-ops.js';
import matchOps from '../scripts/match-ops.js';

/**
 * Stress Test - Beyond capacity testing
 * 
 * Purpose: Find the breaking point and test system recovery
 * Duration: 15 minutes
 * Users: Ramps up to 200-500 concurrent users
 */

export const options = {
    stages: [
        { duration: '2m', target: 100 },  // Warm up
        { duration: '3m', target: 200 },  // Approaching limits
        { duration: '3m', target: 300 },  // Beyond normal capacity
        { duration: '2m', target: 400 },  // High stress
        { duration: '2m', target: 500 },  // Maximum stress
        { duration: '3m', target: 0 },    // Recovery
    ],
    thresholds: {
        // Relaxed thresholds for stress test
        http_req_duration: ['p(95)<2000', 'p(99)<5000'],
        http_req_failed: ['rate<0.10'], // Allow up to 10% failure
        checks: ['rate>0.80'], // 80% checks pass
    },
};

export default function () {
    const scenario = Math.random();

    if (scenario < 0.4) {
        authFlow();
    } else if (scenario < 0.7) {
        tournamentOps();
    } else {
        matchOps();
    }

    sleep(0.5); // Shorter sleep to increase pressure
}

export function handleSummary(data) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Stress Test Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const metrics = data.metrics;

    console.log('📊 Performance Under Stress:');
    console.log(`   Total Requests: ${metrics.http_reqs?.values.count || 0}`);
    console.log(`   Peak Request Rate: ${(metrics.http_reqs?.values.rate || 0).toFixed(2)}/s`);
    console.log(`   Avg Response Time: ${(metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms`);
    console.log(`   p(95) Response Time: ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms`);
    console.log(`   p(99) Response Time: ${(metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms`);
    console.log(`   Max Response Time: ${(metrics.http_req_duration?.values.max || 0).toFixed(2)}ms`);
    console.log(`   Failed Requests: ${((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`);
    console.log(`   Checks Passed: ${((metrics.checks?.values.rate || 0) * 100).toFixed(2)}%\n`);

    // Analysis
    const failRate = (metrics.http_req_failed?.values.rate || 0) * 100;
    const p95 = metrics.http_req_duration?.values['p(95)'] || 0;

    console.log('🔍 Analysis:');
    if (failRate < 5 && p95 < 1000) {
        console.log('   ✅ System handled stress well');
    } else if (failRate < 10 && p95 < 2000) {
        console.log('   ⚠️  System showed degradation under stress');
    } else {
        console.log('   ❌ System struggled under high load');
    }

    console.log('\n   Recommendations:');
    if (p95 > 1000) {
        console.log('   - Consider optimizing slow endpoints');
        console.log('   - Review database query performance');
    }
    if (failRate > 5) {
        console.log('   - Investigate error causes');
        console.log('   - Consider scaling resources');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
        'stdout': JSON.stringify(data, null, 2),
    };
}
