import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4319';
const API_KEY = process.env.SKYVIEW_API_KEY || '';

if (!API_KEY) {
    console.warn('⚠️ SKYVIEW_API_KEY not set, tracing disabled');
} else {
    const resource = new Resource({
        [ATTR_SERVICE_NAME]: 'tournamentv3-backend',
        [ATTR_SERVICE_VERSION]: '3.0.0',
    });

    const sdk = new NodeSDK({
        resource,
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
        instrumentations: [getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false },
        })],
    });

    sdk.start();
    console.log('✅ OpenTelemetry instrumentation started');
}

export { };
