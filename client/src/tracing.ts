// Frontend Tracing for SkyView - Lazy loaded to avoid Rollup build issues

export async function initTracing() {
    const OTEL_ENDPOINT = import.meta.env.VITE_OTEL_ENDPOINT;
    const API_KEY = import.meta.env.VITE_SKYVIEW_API_KEY;

    if (!OTEL_ENDPOINT || !API_KEY) {
        console.warn('⚠️ Frontend OpenTelemetry disabled: Missing VITE_OTEL_ENDPOINT or VITE_SKYVIEW_API_KEY');
        return;
    }

    try {
        // Import modules - access default or named exports correctly
        const traceWebModule = await import('@opentelemetry/sdk-trace-web');
        const traceBaseModule = await import('@opentelemetry/sdk-trace-base');
        const exporterModule = await import('@opentelemetry/exporter-trace-otlp-http');
        const contextModule = await import('@opentelemetry/context-zone');
        const fetchModule = await import('@opentelemetry/instrumentation-fetch');
        const instrumentationModule = await import('@opentelemetry/instrumentation');
        const resourcesModule = await import('@opentelemetry/resources');

        const WebTracerProvider = traceWebModule.WebTracerProvider;
        const SimpleSpanProcessor = traceBaseModule.SimpleSpanProcessor;
        const OTLPTraceExporter = exporterModule.OTLPTraceExporter;
        const ZoneContextManager = contextModule.ZoneContextManager;
        const FetchInstrumentation = fetchModule.FetchInstrumentation;
        const registerInstrumentations = instrumentationModule.registerInstrumentations;
        const Resource = resourcesModule.Resource;

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
