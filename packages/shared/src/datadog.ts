/**
 * Sprint 16 — Datadog APM Initialisation
 * Must be imported at the very top of each service's index.ts BEFORE any other imports.
 *
 * Usage in service index.ts:
 *   import '../../../packages/shared/src/datadog'; // or from @nirmalmandi/shared/datadog
 *
 * In production (NODE_ENV=production + DD_API_KEY set), this initialises:
 *   - APM traces (dd-trace)
 *   - Runtime metrics
 *   - Log injection (correlate logs with traces)
 * In dev/test, it's a no-op.
 */

const DD_ENABLED = process.env.NODE_ENV === 'production' && !!process.env.DD_API_KEY;

if (DD_ENABLED) {
  // dd-trace must be the first require
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tracer = require('dd-trace');
  tracer.init({
    service:     process.env.DD_SERVICE ?? 'nirmalmandi-service',
    env:         process.env.DD_ENV ?? 'production',
    version:     process.env.DD_VERSION ?? '1.0.0',
    hostname:    process.env.DD_AGENT_HOST ?? 'localhost',
    port:        parseInt(process.env.DD_TRACE_AGENT_PORT ?? '8126', 10),
    logInjection: true,       // inject trace_id into winston logs
    runtimeMetrics: true,     // CPU, memory, event loop lag
    profiling: false,         // enable separately if needed
    analytics: true,
  });
  // eslint-disable-next-line no-console
  console.info('[Datadog] APM tracer initialised');
}

export {};
