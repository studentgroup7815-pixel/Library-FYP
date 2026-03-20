# Library Management System — Viva Cheatsheet

Concise, speakable talking points, run/demo commands, and the 10 most important files to reference during a viva.

---

**Quick Start (3 terminals)**

1) Backend

```bash
cd backend
npm install
# create .env from .env.example and fill values
npm run dev
```

2) Frontend (member)

```bash
cd frontend
npm install
npm run dev
```

3) Admin dashboard

```bash
cd admin
npm install
npm run dev
```

Tips: Backend usually runs on port 5000; frontends use Vite and `VITE_API_URL` to call the backend.

---

**10 Essential Files (what to open and say)**

- `backend/server.js` — "App entry: connects middleware, routes, and error handlers. Shows configured port and central Express setup." 
- `backend/config/db.js` — "Database connection and reconnection logic for MongoDB." 
- `backend/controllers/authController.js` — "Authentication flow: login, register, tokens; shows how JWTs are issued." 
- `backend/middleware/authMiddleware.js` — "Protects routes and checks roles (member vs admin)." 
- `backend/models/User.js` — "User schema: roles, membership flags, password hashing, basic validation." 
- `backend/models/Transaction.js` — "Rental transactions: due dates, returned status — core of fine calculation." 
- `backend/utils/fineCalculator.js` — "Business logic for computing fines per day; central place for rules." 
- `backend/utils/fineJob.js` — "Scheduled job that scans overdue items and applies fines automatically." 
- `frontend/src/context/AuthContext.jsx` — "Client-side auth state and login/logout helpers; shows how tokens/local state are handled." 
- `admin/src/pages/Dashboard.jsx` (or `admin/src/App.jsx`) — "Admin entry/dashboard: shows analytics and where staff actions are performed."

When presenting, open each file and point to 2–3 lines that demonstrate the stated responsibility (e.g., `authController.login` implementation).

---

**Demo Checklist (step-by-step, 5 minutes)**

1. Start backend and both frontends.
2. Open the admin dashboard in browser and the frontend site in another tab.
3. Create or login with a sample user (use seeded user credentials if available).
4. On frontend: search for a book → click borrow/rent → this triggers a `Transaction` creation (show network panel or explain request payload).
5. On backend: open `backend/controllers/transactionController.js` and show the `createTransaction` flow.
6. Simulate a late return: either change the `dueDate` in the DB or wait, then show how `fineCalculator` computes the fine and where it's persisted (Transaction or fine record).
7. On admin: open fines/transactions page showing the fine applied and options to adjust.

Speakable lines during demo:

- "When a user borrows, the frontend sends a POST to `/api/transactions` and backend records a `Transaction` with due date." 
- "A scheduled job (`fineJob`) scans overdue `Transactions` nightly and uses `fineCalculator` to apply fines." 
- "Protected endpoints are guarded by `authMiddleware`, which validates the JWT and enforces `admin` role for sensitive operations." 

---

**Sample Viva Q&A (short answers)**

- Q: What are controllers? 
  - A: Modules that process HTTP requests, validate inputs, call models/services, and send responses.

- Q: What are models? 
  - A: Database schemas (Mongoose) defining data shape and encapsulating DB queries.

- Q: What are routes? 
  - A: URL-to-controller mappings; the Express `Router` organizes endpoints by resource.

- Q: How does authentication work? 
  - A: Users authenticate via `authController` endpoints; server issues JWTs; `authMiddleware` checks tokens for protected endpoints.

- Q: Where is business logic kept? 
  - A: Controllers orchestrate flows; deeper business logic lives in `utils` (e.g., `fineCalculator.js`) and services.

- Q: How are fines applied automatically? 
  - A: `fineJob` runs periodically (cron or scheduler), detects overdue `Transaction`s using `overdueChecker`, computes fines with `fineCalculator`, and updates records.

---

**Common Commands & Scripts**

- Seed sample data:

```bash
cd backend
node seeder.js
```

- Run one-off maintenance scripts:

```bash
node debug_user_fines.js
node fix_data.js
```

- Run tests (if present): `npm test` in respective folder.

---

**Environment Variables — Minimal Examples**

- backend/.env (example):

```env
MONGO_URI=mongodb://localhost:27017/library_db
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
PORT=5000
CLIENT_URL=http://localhost:5173
```

- frontend/.env (Vite):

```env
VITE_API_URL=http://localhost:5000/api
```

Set these files before running the apps.

---

**Troubleshooting (quick fixes)**

- MongoDB connection error: check `MONGO_URI`, run `mongod` or confirm Atlas connection.
- CORS errors: ensure `CLIENT_URL` and `VITE_API_URL` match origins and backend's CORS config allows them.
- Missing env values: copy `.env.example` to `.env` and populate.


