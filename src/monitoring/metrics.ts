import client from 'prom-client';

// Create a Registry to store metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const caseReportsTotal = new client.Counter({
  name: 'case_reports_total',
  help: 'Total number of case reports submitted',
});

const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
});

const queueJobsProcessed = new client.Counter({
  name: 'queue_jobs_processed_total',
  help: 'Total number of queue jobs processed',
  labelNames: ['queue', 'status'],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(caseReportsTotal);
register.registerMetric(activeUsers);
register.registerMetric(queueJobsProcessed);

export const metrics = {
  httpRequestDuration,
  caseReportsTotal,
  activeUsers,
  queueJobsProcessed,
  register,
};