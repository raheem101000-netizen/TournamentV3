import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';

const OTEL_ENDPOINT = import.meta.env.VITE_OTEL_ENDPOINT;
const API_KEY = import.meta.env.VITE_SKYVIEW_API_KEY;

if (OTEL_ENDPOINT && API_KEY) {
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
} else {
    console.warn('⚠️ Frontend OpenTelemetry disabled: Missing VITE_OTEL_ENDPOINT or VITE_SKYVIEW_API_KEY');
}
