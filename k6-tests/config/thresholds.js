/**
 * Performance thresholds for k6 tests
 * These define what "success" looks like for your application
 */

export const defaultThresholds = {
    // HTTP request duration
    http_req_duration: [
        'p(95)<500',  // 95% of requests should complete in less than 500ms
        'p(99)<1000', // 99% of requests should complete in less than 1s
    ],

    // HTTP request failed rate
    http_req_failed: [
        'rate<0.01', // Less than 1% of requests should fail
    ],

    // Custom error rate
    errors: [
        'rate<0.05', // Less than 5% error rate
    ],

    // Checks (assertions) pass rate
    checks: [
        'rate>0.95', // More than 95% of checks should pass
    ],
};

export const strictThresholds = {
    http_req_duration: [
        'p(95)<300',  // Stricter: 95% under 300ms
        'p(99)<800',  // 99% under 800ms
    ],
    http_req_failed: ['rate<0.005'], // Less than 0.5% failure
    errors: ['rate<0.01'], // Less than 1% error rate
    checks: ['rate>0.98'], // More than 98% checks pass
};

export const relaxedThresholds = {
    http_req_duration: [
        'p(95)<1000', // More relaxed: 95% under 1s
        'p(99)<2000', // 99% under 2s
    ],
    http_req_failed: ['rate<0.05'], // Less than 5% failure
    errors: ['rate<0.10'], // Less than 10% error rate
    checks: ['rate>0.90'], // More than 90% checks pass
};

// Use environment variable to select threshold level
export function getThresholds() {
    const level = __ENV.THRESHOLD_LEVEL || 'default';

    switch (level) {
        case 'strict':
            return strictThresholds;
        case 'relaxed':
            return relaxedThresholds;
        default:
            return defaultThresholds;
    }
}
