# Modern Library Management System

## Overview
This repository is a production-ready, full-stack Library Management System (monorepo) with three primary apps:

- frontend: public-facing React app for library members
- admin: staff/admin React dashboard for inventory, fines, and analytics
- backend: Express API and services powering both frontends

The system includes automated fine calculation, JWT-based auth, role-based access for admin features, and utilities for seed data and background jobs.

**Quick goal:** This README explains project structure, what each file/folder is for, how controllers/models/routes interact, step-by-step run instructions, and a short viva-prep Q&A so non-coders can confidently explain the project.

**Project layout (top-level)**

- **backend/**: API server (Node.js + Express)
- **frontend/**: Member-facing React app (Vite + Tailwind)
- **admin/**: Admin dashboard React app (Vite + Tailwind)
- package.json, README.md: workspace metadata and this documentation

**High-level responsibilities**

- **Controllers**: handle incoming HTTP requests, orchestrate validation and business logic, call models/services and return responses.
- **Models**: Mongoose schemas and data access logic (represent DB collections).
- **Routes**: map HTTP endpoints (URLs + verbs) to controller handlers.
- **Middleware**: reusable request/response handlers (auth, error handling).
- **Utils / Services**: background jobs, business utilities (fine calculation, overdue checks).

**Why these layers?**

- Separation of concerns makes the backend testable, maintainable, and easy to explain: Routes -> Controllers -> Models/Services.

**Detailed backend structure and purposes**

- backend/server.js: app entrypoint — configures Express, middleware, and mounts routes.
- backend/config/db.js: database connection (MongoDB) helper.
- backend/config/libraryConfig.js: project-specific constants/config.
- backend/controllers/: Express controllers (business logic for each resource)
    - adminController.js: admin-level actions (reports, administrative user actions)
    - authController.js: login, registration, token refresh, logout
    - bookController.js: book CRUD, search, availability
    - fineController.js: endpoints to review and adjust fines
    - transactionController.js: rental/return flows, history
    - userController.js: user profile and admin user management
- backend/models/: Mongoose schemas
    - Book.js: fields for title, author, copies, genres, availability
    - Reservation.js: reservation queues and statuses
    - Review.js: user reviews and ratings
    - Transaction.js: rental records, due dates, returned status
    - User.js: user profile, roles (member/admin), membership status
- backend/routes/: Express routers—connect controllers to endpoints
    - adminRoutes.js, authRoutes.js, bookRoutes.js, fineRoutes.js, transactionRoutes.js, userRoutes.js
- backend/middleware/: reusable middleware
    - authMiddleware.js: protects endpoints, extracts user from JWT, enforces roles
- backend/utils/: helper modules
    - fineCalculator.js: business rules for computing fines
    - overdueChecker.js: detect overdue items
    - fineJob.js: background job to apply fines periodically
    - generateToken.js: JWT creation (access/refresh)
- backend/seeder.js / data/: utilities to seed initial books/users for development
- backend/debug_user_fines.js / fix_data.js: ad-hoc scripts used for data fixes or migration tasks

Notes about models/controllers/routes interaction

- A client hits an endpoint declared in routes (e.g., POST /api/auth/login).
- The route calls the respective controller method (authController.login).
- The controller validates input, calls model methods or utils (e.g., User.findOne, generateToken), and returns an HTTP response.
- Controllers avoid direct DB connection details: models define schema and access patterns.

**Frontend and Admin (React) structure**

- Each React app uses Vite + Tailwind. Main files:
    - src/main.jsx: React entry, router and context providers
    - src/App.jsx: route definitions and layout
    - src/context/AuthContext.jsx: auth state, login/logout helpers
    - src/components/: shared UI components (Navbar, ProtectedRoute, Modals)
    - src/pages/: route pages (Books, BookDetails, Dashboard, Fines, Login, Register)

Purpose notes for non-coders:

- The frontend shows data and collects user actions (borrow/return/search). It calls the backend API.
- The admin app is similar but only for staff (analytics, manual fine adjustments, inventory management).

**Step-by-step: How to run this project locally**

Prerequisites:

- Node.js v18+ installed
- MongoDB running locally or a MongoDB Atlas cluster

Developer run instructions (three terminals — one per app):

1) Backend (API)

```bash
cd backend
npm install
# create a .env file or copy .env.example and fill values (see env section below)
npm run dev
```

2) Frontend (member site)

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

Notes:

- Backend typically runs on a port like 5000 (check backend .env / server.js).
- Frontends use Vite and will proxy or call the backend API base URL from environment values.

**Environment variables (common)**

- Backend (.env) — minimal recommended set:

    - `MONGO_URI` : MongoDB connection string
    - `JWT_SECRET` : secret used to sign tokens
    - `JWT_EXPIRES` : token expiry (e.g., 15m)
    - `REFRESH_TOKEN_EXPIRES` : refresh token expiry
    - `PORT` : server port (e.g., 5000)
    - `CLIENT_URL` : allowed frontend origin

- Frontend/Admin — Vite uses `VITE_` prefixed variables (e.g., `VITE_API_URL`).

Create `.env` files in each folder (backend, frontend, admin) from any `.env.example` files.

**Seeding data**

- To seed sample books and users for development, run the backend seeder (if provided):

```bash
cd backend
node seeder.js
```

**Common maintenance scripts**

- `node debug_user_fines.js` and `node fix_data.js` are ad-hoc scripts in backend used to inspect or correct production/dev data. Use cautiously and back up DB first.

**Testing & Linting**

- If tests are present, they will be in the respective package.json scripts (backend/frontend/admin). Run `npm test` in the folder.

**Deployment notes**

- The frontend(s) are static builds (Vite). Build and deploy to static hosts (Vercel, Netlify) or serve via CDN.
- The backend requires a Node process and MongoDB (Atlas recommended for production). Use process managers (PM2) or a platform (Heroku, DigitalOcean App Platform, Vercel serverless functions with tweaks) for deployment.

**Viva Preparation — short Q&A (speakable answers for non-coders)**

- Q: What is the role of the backend?
    - A: The backend exposes a secure API that stores and retrieves data (books, users, transactions), enforces rules (who can borrow, fines), and authenticates users.

- Q: What is a controller?
    - A: A controller is a module that handles an API request, runs the necessary logic, and returns a response (e.g., login a user or record a book rental).

- Q: What is a model?
    - A: A model defines how data is structured in the database (like a blueprint for a Book or User) and provides methods to read/write that data.

- Q: What is a route?
    - A: A route maps an HTTP endpoint (like GET /api/books) to a controller function.

- Q: How does authentication work here?
    - A: Users log in via the auth endpoints; the server issues JWT tokens (access and refresh). Protected endpoints require a valid token checked by middleware.

- Q: How are fines computed?
    - A: The backend has a fineCalculator utility that uses due date and configured per-day rates to compute fines. A scheduled job (fineJob) may apply fines automatically.

- Q: How would you show this app working during a viva?
    - A: Start backend and frontends, create or log in as a sample user, borrow a book (creates a Transaction), simulate a late return (change due date or wait), then show the fine applied through the fines page in either frontend or admin.

**Troubleshooting tips**

- Backend can't connect to MongoDB: verify `MONGO_URI` and that MongoDB is reachable.
- CORS issues in frontend: ensure `VITE_API_URL` points to backend and backend allows `CLIENT_URL` in CORS.

**Where to look in the code during viva**

- API endpoints and flow: [backend/controllers](backend/controllers) and [backend/routes](backend/routes)
- Data model definitions: [backend/models](backend/models)
- Fine calculation rules: [backend/utils/fineCalculator.js](backend/utils/fineCalculator.js)
- Auth flow: [backend/controllers/authController.js](backend/controllers/authController.js) and [backend/middleware/authMiddleware.js](backend/middleware/authMiddleware.js)
