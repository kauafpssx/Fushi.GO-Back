# Changelog

## [1.0.0] - 2026-06-21

### Added
- Auth (register, refresh, logout, SSE token)
- Search (session, search, viewport recommendation)
- Stops (viewport, service stops with polyline)
- Services (details, route services)
- Predictions (by stop, by service+stop, departure by date)
- SSE Vehicles (real-time tracking, 5s polling)
- SSE Predictions (real-time, 5s polling)
- Notifications (subscribe, unsubscribe, Upstash Redis with 30d TTL)
- Circuit breaker (5 failures → 30s open)
- Request deduplication
- Stale while revalidate (30s cache)
- Timeout (8s AbortSignal)
- Backpressure SSE (skip if buffer > 1KB)
- Metrics (totalRequests, cittamobiRequests, activePollers, activeSSEConnections)
- Healthcheck (/health with memory + metrics)
- Correlation ID (request.id)
- Security headers (HSTS, X-Frame-Options, nosniff)
- CORS (restrictive via env)
- JWT (access 15min + refresh 24h HttpOnly)
- Device ID validation
- Zod validation
- Graceful shutdown (SIGINT/SIGTERM)
- Error handlers (uncaughtException/unhandledRejection)
- Unit tests (17 tests: circuit, JWT, dedup, stale, metrics)
- Docker
- GitHub Actions CI (typecheck + test + build)
- OpenAPI/Swagger (/docs)
- CHANGELOG.md
