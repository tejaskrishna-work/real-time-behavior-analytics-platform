export const cacheKeys = {
  analyticsOverview: (projectId) => `analytics:${projectId}:overview`,
  analyticsTopEvents: (projectId, limit) =>
    `analytics:${projectId}:top-events:${limit}`,
  analyticsTimeseries: (projectId, days) =>
    `analytics:${projectId}:timeseries:${days}`,
  analyticsDau: (projectId, days) => `analytics:${projectId}:dau:${days}`,
  analyticsRetention: (projectId, days) =>
    `analytics:${projectId}:retention:${days}`,
  analyticsFunnel: (projectId, funnelHash) =>
    `analytics:${projectId}:funnel:${funnelHash}`,
  analyticsSessions: (projectId) => `analytics:${projectId}:sessions`,
  analyticsProjectPrefix: (projectId) => `analytics:${projectId}:`,
};