# ELMS Operations Guide

## Backup MongoDB

Run a local backup:

```bash
mongodump --uri="mongodb://localhost:27017/course_manager" --out ./backups/$(date +%Y%m%d)
```

Restore from backup:

```bash
mongorestore --uri="mongodb://localhost:27017/course_manager" ./backups/YYYYMMDD/course_manager
```

## Logs And Monitoring

- Backend logs every request with method, path, status code, and duration.
- Production deployments should forward container logs to the hosting provider log system.
- Monitor these endpoints:
  - `GET /api/health`
  - `GET /api/docs.json`

## Deployment Checklist

- [ ] Copy `Backend/.env.example` to `Backend/.env`.
- [ ] Replace all secrets with strong production values.
- [ ] Configure `CORS_ORIGIN` with real frontend domains.
- [ ] Start MongoDB and Redis.
- [ ] Run backend seed if this is a fresh database.
- [ ] Verify Swagger UI at `/api/docs`.
- [ ] Verify frontend login and course list.
- [ ] Test VNPAY sandbox callback.
- [ ] Confirm order auto-cancellation after 30 minutes.
- [ ] Confirm certificate verification URL.

## Docker Run

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
