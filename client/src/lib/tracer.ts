/**
 * Frontend Tracer for Distributed Tracing
 * 
 * Creates a parent trace on the frontend that groups related API calls
 * using W3C Trace Context (traceparent header).
 * 
 * Usage:
 * ```typescript
 * const trace = new FrontendTracer('Load Server View');
 * await fetch('/api/servers/123', { headers: trace.getHeaders() });
 * ```
 */

const randomHex = (len: number) =>
    [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

export class FrontendTracer {
    private traceId: string;
    private spanId: string;
    private actionName: string;

    constructor(actionName: string) {
        this.actionName = actionName;
        this.traceId = randomHex(32);
        this.spanId = randomHex(16);

        // Log trace creation for debugging
        console.log(`[Trace] ${actionName} (traceId: ${this.traceId.substring(0, 8)}...)`);
    }

    /**
     * Get headers to attach to fetch requests
     * This propagates the trace context to the backend
     */
    getHeaders(): Record<string, string> {
        // W3C Trace Context format: version-traceId-parentSpanId-traceFlags
        return {
            'traceparent': `00-${this.traceId}-${this.spanId}-01`
        };
    }

    /**
     * Get the trace ID for logging/debugging
     */
    getTraceId(): string {
        return this.traceId;
    }
}

/**
 * Helper function to wrap multiple API calls with a single trace
 */
export async function withTrace<T>(
    actionName: string,
    fn: (headers: Record<string, string>) => Promise<T>
): Promise<T> {
    const trace = new FrontendTracer(actionName);
    return fn(trace.getHeaders());
}
