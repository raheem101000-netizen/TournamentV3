import { sleep } from 'k6';
import { getThresholds } from '../config/thresholds.js';
import authFlow from '../scripts/auth-flow.js';
import tournamentOps from '../scripts/tournament-ops.js';

/**
 * Spike Test - Sudden traffic spike
 * 
 * Purpose: Test system elasticity and recovery from sudden load
 * Duration: 5 minutes
 * Users: Rapid increase from 10 to 200 users
 */

export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Normal load
        { duration: '30s', target: 200 },  // Sudden spike!
        { duration: '2m', target: 200 },   // Sustained spike
        { duration: '1m', target: 10 },    // Recovery
        { duration: '1m', target: 10 },    // Stabilization
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500', 'p(99)<3000'],
        http_req_failed: ['rate<0.05'],
        checks: ['rate>0.90'],
    },
};

export default function () {
    // Simpler operations for spike test
    const scenario = Math.random();

    if (scenario < 0.6) {
        authFlow();
    } else {
        tournamentOps();
    }

    sleep(0.5);
}

export function handleSummary(data) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚡ Spike Test Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const metrics = data.metrics;

    console.log('📊 Spike Performance:');
    console.log(`   Total Requests: ${metrics.http_reqs?.values.count || 0}`);
    console.log(`   Request Rate: ${(metrics.http_reqs?.values.rate || 0).toFixed(2)}/s`);
    console.log(`   Avg Response Time: ${(metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms`);
    console.log(`   p(95) Response Time: ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms`);
    console.log(`   Failed Requests: ${((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`);
    console.log(`   Checks Passed: ${((metrics.checks?.values.rate || 0) * 100).toFixed(2)}%\n`);

    // Spike-specific analysis
    const failRate = (metrics.http_req_failed?.values.rate || 0) * 100;
    const p95 = metrics.http_req_duration?.values['p(95)'] || 0;

    console.log('🔍 Spike Handling:');
    if (failRate < 2 && p95 < 1000) {
        console.log('   ✅ Excellent - System handled spike gracefully');
    } else if (failRate < 5 && p95 < 1500) {
        console.log('   ✅ Good - Minor degradation during spike');
    } else {
        console.log('   ⚠️  System struggled with sudden load increase');
        console.log('   Consider:');
        console.log('   - Implementing auto-scaling');
        console.log('   - Adding request queuing');
        console.log('   - Increasing rate limits gradually');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
        'stdout': JSON.stringify(data, null, 2),
    };
}
