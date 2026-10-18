# COMP 3123 – Assignment 1: Secure Employee Management REST API

**Student:** Ishan Sood (101539944)  
**GitHub:** `https://github.com/Ishannsood/101539944_COMP3123_Assignment1 
**Deployed API (Vercel):** [`https://<your-project>.vercel.app`](https://101539944-comp-3123-assignment1.vercel.app)

## 1. Project

A secure RESTful backend for managing employees. Users register and log in, receive a **JWT**, and can then create and manage **only the employees they created**.

**Technologies:** Node.js, Express, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Helmet, `express-rate-limit`, `express-validator`, Winston (logging).  
**Database name:** `comp3123_assignment1`

### Project structure

```
api/            Vercel serverless entry point
config/         environment config + MongoDB connection
controllers/    request handlers (business logic)
middleware/     auth (JWT), validate, rate limiters, request logger, error handler
models/         Mongoose models (User, Employee)
routes/         Express routers
utils/          logger, AppError, asyncHandler
validators/     express-validator rule sets
logs/           local log files (app.log, error.log) + sample log
postman/        exported Postman collection
app.js          Express app (middleware + routes)
server.js       local server start-up
```

## 2. Installation

1. **Clone:** `git clone https://github.com/<your-username>/<Student#>_COMP3123_Assignment1.git && cd <Student#>_COMP3123_Assignment1`
2. **Install:** `npm install`
3. **Configure:** `cp .env.example .env` and edit values (see §3).
4. **Start MongoDB:** local `mongod` (default `mongodb://127.0.0.1:27017`) or a MongoDB Atlas cluster.
5. **Run:** `npm start` (or `npm run dev` for auto-reload). Server: `http://localhost:3000`
6. **Test:** import `postman/COMP3123_Assignment1.postman_collection.json` into Postman, set `baseUrl`, and run the folders in order (each request has automatic status-code tests).

## 3. Configuration (environment variables)

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/comp3123_assignment1` |
| `JWT_SECRET` | Secret used to sign JWTs (**required**, keep private) | long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |
| `AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_MIN` | Login/signup limit | `10` / `15` |
| `API_RATE_LIMIT_MAX` / `API_RATE_LIMIT_WINDOW_MIN` | General API limit | `100` / `15` |

The real `.env` is git-ignored; only `.env.example` (no secrets) is committed.

## 4. API Endpoints

Base paths: `/api/v1/user`, `/api/v1/emp`

| # | Method | Endpoint | Auth | Success | Purpose |
|---|---|---|---|---|---|
| 1 | POST | `/api/v1/user/signup` | No | 201 | Register a user |
| 2 | POST | `/api/v1/user/login` | No | 200 | Login (username **or** email + password) → JWT |
| 3 | GET | `/api/v1/emp/employees` | Yes | 200 | List the authenticated user's employees |
| 4 | POST | `/api/v1/emp/employees` | Yes | 201 | Create an employee owned by the authenticated user |
| 5 | GET | `/api/v1/emp/employees/{eid}` | Yes | 200 | Get one owned employee |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | Yes | 200 | Update one owned employee |
| 7 | DELETE | `/api/v1/emp/employees?eid=xxx` | Yes | 204 | Delete one owned employee |
| – | GET | `/health` | No | 200 | Health check |

**Signup body:** `{ "username": "alice", "email": "alice@example.com", "password": "Passw0rd1" }`  
**Login body:** `{ "username": "alice", "password": "Passw0rd1" }` or `{ "email": "alice@example.com", "password": "Passw0rd1" }`  
**Employee body:** `{ "first_name", "last_name", "email", "position", "salary", "date_of_joining", "department" }`  
**Error shape:** `{ "status": "fail", "message": "Validation failed", "errors": [{ "field": "email", "message": "email format is invalid" }] }`

### Status codes used

| Code | When |
|---|---|
| 200 OK | Successful login / read / update |
| 201 Created | Successful signup / employee creation |
| 204 No Content | Successful delete (no body) |
| 400 Bad Request | Validation failure, invalid ObjectId, malformed JSON |
| 401 Unauthorized | Missing/invalid/expired JWT, invalid login credentials |
| 403 Forbidden | Employee exists but belongs to another user |
| 404 Not Found | Employee or route does not exist |
| 409 Conflict | Duplicate username/email |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected error (generic message, details only in logs) |

## 5. Authentication

1. **Signup** – validates input, hashes the password, stores the user.
2. **Login** – finds the user by username or email, compares the password with the stored hash, and returns a signed JWT (`sub` = user id, HS256, expires per `JWT_EXPIRES_IN`).
3. **Use the token** on protected routes with the header `Authorization: Bearer <jwt>`.
4. **Protected endpoints** – all `/api/v1/emp/*` routes pass through `middleware/auth.js`, which rejects missing/malformed headers, invalid signatures, and expired tokens (401), then loads the user from the database and sets `req.user`.

## 6. Authorization (users only see their own employees)

* Each `Employee` has a required `user` field (`ObjectId` → `User`) – the owner.
* The owner is set on creation from `req.user` (the verified JWT) – **never from the request body**. A `user` value sent by a client is ignored (field whitelist).
* Every read/update/delete query includes the owner: `Employee.findOne({ _id: eid, user: req.user._id })`, and the list uses `Employee.find({ user: req.user._id })`. Changing `eid` in the URL/query therefore cannot expose another user's data.
* If the id exists but belongs to someone else → **403**; if it does not exist → **404**. Both are logged.

## 7. Security

* **Password hashing:** bcrypt (cost 12) in a Mongoose `pre('save')` hook. `password` is `select: false` and removed in `toJSON`, so it is never returned.
* **JWT:** signed with `JWT_SECRET` from the environment; verified with an explicit algorithm allow-list; expiry enforced.
* **Helmet:** sets security headers (e.g. `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, hides `X-Powered-By`) to mitigate clickjacking, MIME sniffing, and some XSS/information-leak risks.
* **Rate limiting:** limits how many requests a client (IP) may make in a time window, to slow brute-force and abuse.
  * `POST /api/v1/user/login` and `POST /api/v1/user/signup`: **10 requests / 15 min** each (configurable).
  * All `/api/*` routes: **100 requests / 15 min**.
  * When exceeded: **HTTP 429** with `{"status":"fail","message":"Too many requests..."}` and a `Retry-After` header; the event is logged.
* **Input validation:** `express-validator` on every route (required fields, types, lengths, email format, positive numeric salary, valid ISO dates, valid ObjectIds). Type checks (`isString`) also block NoSQL-operator injection such as `{"username": {"$ne": 1}}`. Body size limited to 10 KB.
* **Environment variables:** secrets and DB credentials live in `.env` (git-ignored); `.env.example` documents them.
* **Error handling:** centralized in `middleware/errorHandler.js`; consistent JSON; no stack traces/secrets in responses.

## 8. Logging

* **Where:** `logs/app.log` (all events) and `logs/error.log` (errors only), JSON lines with timestamps. Generated logs are git-ignored; `logs/sample-app-log.txt` is a sample. On Vercel (read-only filesystem) logs go to the console / Vercel logs.
* **What is logged:** server start-up, every request (method, path, status, duration, IP), login success/failure, signup duplicates, validation failures, authentication failures, authorization (ownership) failures, rate-limit hits, CRUD operations, and errors.
* **Intentionally excluded:** passwords, request bodies, JWTs / `Authorization` headers, `JWT_SECRET`, database credentials.

## 9. Health check

`GET /health` →

```json
{ "status": "ok", "message": "API is running", "uptimeSeconds": 42, "timestamp": "2026-10-17T20:00:00.000Z", "database": "connected" }
```

`database` is `connected`, `connecting`, `disconnecting` or `disconnected`.

## 10. Test credentials for marking

Created by running the Postman collection (random suffix per run), e.g. `usera_<runId>` / `usera_<runId>@example.com`, password `Passw0rd1`. (Non-sensitive test data only.)
