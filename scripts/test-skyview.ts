
import { startTrace, log, metric, flush } from '../server/lib/skyview.js';

async function testSkyView() {
    console.log('🧪 Starting SkyView Connectivity Test...');

    // 1. Generate some dummy data
    console.log('📝 Generating trace data...');
    const traceId = startTrace('TEST_CONNECTIVITY_PROBE');
    log('INFO', 'Test probe initiated', { test_id: Date.now() });
    metric('test_probe_success', 1);

    // 2. Attempt to flush
    console.log('🚀 Attempting to flush to SkyView...');
    try {
        await flush();
        console.log('✅ Flush completed (check above for HTTP status codes)');
    } catch (error) {
        console.error('❌ Flush failed with exception:', error);
    }
}

testSkyView();
