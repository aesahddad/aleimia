# PROJECT_MAP — Aleinia Platform

## TECH_STACK
- Runtime: Node.js 25.x Current (LTS upgrade to 24.x recommended)
- Database: MongoDB 7.0 (Docker) + Mongoose 8.0
- Backend: Express 4.18 + Socket.io 4.7
- Frontend: Vanilla JS (ES Modules) + Tailwind CSS CDN
- 3D: Three.js r160 (ESM via CDN importmap)
- Auth: JWT (access 15m + refresh 7d) + bcryptjs
- Logging: Winston 3.x (single instance at `shared/logger.js`)

## SYSTEM_FLOW
```
Browser → Express static → SPA (hash routing)
API calls → Express routes → Mongoose → MongoDB (paginated + indexed)
3D assets → Three.js (WebGL) → Canvas
Chat → Socket.io (WebSocket rooms per ad)
Auth → JWT (Bearer header) → Rate-limited login
```

## ARCHITECTURE
Monolith backend + SPA frontend (Vanilla JS):
- **Server**: `server.js` — Express app + HTTP server + Socket.io + errorHandler
- **Features**: `routes/*` + `controllers/*` per domain (auth, ads, stores, users)
- **Models**: Mongoose schemas with indexes built-in
- **Shared**: `shared/logger.js` — single Winston logger, `utils/validator.js`
- **Seed**: Single `backend/seed.js` — creates admin + sample stores/ads
- **Frontend**: Core `App.js` + managers, page modules via dynamic import

## ORPHANS & PENDING
- [x] ORPHAN: old seed scripts (4 duplicates) → consolidated into `backend/seed.js`
- [x] ORPHAN: dual loggers → deleted, single `shared/logger.js`
- [x] ORPHAN: `middleware/validate.js` (Joi not in deps) → deleted
- [x] ORPHAN: `middleware/error.js` not registered → added `app.use(errorHandler)`
- [x] PENDING: DB indexes added (email, slug, status, category, role)
- [x] PENDING: Pagination on GET /api/ads, /api/stores, /api/users (page, limit query params, X-Total-Count headers)
- [x] PENDING: .env.example cleaned, hardcoded secrets removed from code
- [x] PENDING: `--forceExit` added to jest config
- [x] PENDING: Tests fixed (auth paths, admin tokens, soft delete assertions)
- [x] PENDING: Dead deps removed (morgan, compression, helmet)
- [ ] PENDING: rateLimiter, auth refresh, checkMaintenance — already implemented

## NOTES
- Deploy via `deploy.sh` (Linux/Hostinger) or `deploy_to_server.ps1` (Windows)
- Admin login: `admin@aleinia.com` / `admin123`
- Server listens on port 3001 (dev) or 3000 (production)
- API base: `/api/*`
