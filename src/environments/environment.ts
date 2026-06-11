export const environment = {
  production: true,
  // Same-origin: nginx proxies /api/* to the backend container, so the app
  // works on any host/scheme it is served from (http://s03:8081 and
  // https://s03.ruffe-vega.ts.net:8443 alike).
  apiBaseUrl: '/api',
  wsUrl: '/api/ws',
};
