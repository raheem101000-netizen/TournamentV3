import { sleep } from 'k6';
import { getThresholds } from '../config/thresholds.js';
import authFlow from '../scripts/auth-flow.js';

/**
 * Smoke Test - Minimal load to verify system functionality
 * 
 * Purpose: Quick validation that all endpoints work correctly
 * Duration: 1 minute
 * Users: 1-5 virtual users
 */

export const options = {
    stages: [
        { duration: '30s', target: 5 },  // Ramp up to 5 users
        { duration: '30s', target: 5 },  // Stay at 5 users
    ],
    thresholds: getThresholds(),
};

export default function () {
    authFlow();
    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, options = {}) {
    const indent = options.indent || '';
    const enableColors = options.enableColors || false;

    let summary = '\n';
    summary += `${indent}✓ Smoke Test Complete\n`;
    summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Metrics
    const metrics = data.metrics;

    if (metrics.http_reqs) {
        summary += `${indent}HTTP Requests:\n`;
        summary += `${indent}  Total: ${metrics.http_reqs.values.count}\n`;
        summary += `${indent}  Rate: ${metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
    }

    if (metrics.http_req_duration) {
        summary += `${indent}Response Times:\n`;
        summary += `${indent}  Avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
        summary += `${indent}  Min: ${metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
        summary += `${indent}  Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
        summary += `${indent}  p(95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
        summary += `${indent}  p(99): ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
    }

    if (metrics.http_req_failed) {
        const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
        summary += `${indent}Failed Requests: ${failRate}%\n\n`;
    }

    if (metrics.checks) {
        const passRate = (metrics.checks.values.rate * 100).toFixed(2);
        summary += `${indent}Checks Passed: ${passRate}%\n\n`;
    }

    summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return summary;
}
