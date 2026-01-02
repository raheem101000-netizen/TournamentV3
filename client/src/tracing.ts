// Frontend Tracing for SkyView - Lazy loaded to avoid Rollup build issues

export async function initTracing() {
    const OTEL_ENDPOINT = import.meta.env.VITE_OTEL_ENDPOINT;
    const API_KEY = import.meta.env.VITE_SKYVIEW_API_KEY;

    if (!OTEL_ENDPOINT || !API_KEY) {
        console.warn('⚠️ Frontend OpenTelemetry disabled: Missing VITE_OTEL_ENDPOINT or VITE_SKYVIEW_API_KEY');
        return;
    }

    try {
        const [
            { WebTracerProvider },
            { SimpleSpanProcessor },
            { OTLPTraceExporter },
            { ZoneContextManager },
            { FetchInstrumentation },
            { registerInstrumentations },
            { Resource },
        ] = await Promise.all([
            import('@opentelemetry/sdk-trace-web'),
            import('@opentelemetry/sdk-trace-base'),
            import('@opentelemetry/exporter-trace-otlp-http'),
            import('@opentelemetry/context-zone'),
            import('@opentelemetry/instrumentation-fetch'),
            import('@opentelemetry/instrumentation'),
            import('@opentelemetry/resources'),
        ]);

        const resource = new Resource({
            'service.name': 'tournamentv3-frontend',
            'service.version': '3.0.0',
        });

        const exporter = new OTLPTraceExporter({
            url: OTEL_ENDPOINT,
            headers: { 'X-API-Key': API_KEY },
        });

        const provider = new WebTracerProvider({ resource });
        provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
        provider.register({ contextManager: new ZoneContextManager() });

        registerInstrumentations({
            instrumentations: [
                new FetchInstrumentation({
                    clearTimingResources: true,
                }),
            ],
        });

        console.log('✅ Frontend OpenTelemetry tracing started');
    } catch (error) {
        console.error('⚠️ Failed to initialize OpenTelemetry:', error);
    }
}
