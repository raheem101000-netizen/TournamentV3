import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import * as resources from '@opentelemetry/resources';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const API_KEY = process.env.SKYVIEW_API_KEY;

if (!OTEL_ENDPOINT || !API_KEY) {
    console.warn('⚠️ OpenTelemetry disabled: Missing OTEL_EXPORTER_OTLP_ENDPOINT or SKYVIEW_API_KEY');
} else {
    const Resource = resources.Resource;

    const sdk = new NodeSDK({
        resource: new Resource({
            'service.name': 'tournamentv3-backend',
            'service.version': '3.0.0',
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${OTEL_ENDPOINT}/v1/traces`,
            headers: { 'X-API-Key': API_KEY },
        }),
        metricReader: new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
                url: `${OTEL_ENDPOINT}/v1/metrics`,
                headers: { 'X-API-Key': API_KEY },
            }),
            exportIntervalMillis: 30000,
        }),
        instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    console.log('✅ OpenTelemetry instrumentation started');

    // Graceful shutdown
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => console.log('OpenTelemetry SDK shut down'))
            .catch((error) => console.error('Error shutting down SDK', error))
            .finally(() => process.exit(0));
    });
}
