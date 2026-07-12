# AssetFlow

AssetFlow is an enterprise-grade asset management system designed to track physical and digital assets across their lifecycle. The platform provides comprehensive tools for managing resource allocations, scheduling maintenance, processing room and equipment bookings, and conducting regulatory compliance audits.

## Key Features

- **Asset Lifecycle Management**: Import, categorize, and track assets from initial acquisition through to retirement.
- **Resource Booking**: Mitigate scheduling conflicts with robust room and equipment booking functionality.
- **Allocations and Transfers**: Assign assets to specific users or departments, maintain an immutable transfer history, and mandate condition checks upon return.
- **Maintenance Operations**: Schedule preventive maintenance and efficiently manage ad-hoc breakdown requests.
- **Audit and Compliance**: Perform digital audits, verify asset existence by physical location, and automatically generate discrepancy reports.
- **Role-Based Access Control**: Secure platform operations with granular permissions, distinguishing between Administrators, Asset Managers, and Standard Users.

## Architecture and Technology Stack

The system is constructed on a scalable three-tier architecture with strictly decoupled frontend and backend services.

### Backend Infrastructure
- **Runtime and Framework**: Node.js utilizing Express.js
- **Database**: PostgreSQL (interfacing via the `pg` driver)
- **Authentication**: Stateless JWT implementation secured via HttpOnly cookies to mitigate XSS vulnerabilities.
- **Design Pattern**: Controller-Service-Model architecture featuring standardized, paginated API responses.

### Frontend Application
- **Framework**: Next.js 15 (App Router paradigm) with React 19
- **Styling**: Tailwind CSS
- **Data Fetching Strategy**: Server Actions and Server Components utilized to minimize client-side JavaScript execution.
- **API Integration**: Centralized `lib/api.ts` client ensuring type-safe extraction of backend paginated envelopes.

## Getting Started

### System Prerequisites
- Node.js (v18.0.0 or higher recommended)
- PostgreSQL (v12.0 or higher)

### Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `backend` directory with the following parameters:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   # Database Configuration
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_NAME=assetflow
   DB_PORT=5432

   # Security
   JWT_SECRET=your_secure_jwt_secret_key
   ```

4. Database Setup and Seeding:
   Ensure your PostgreSQL instance is running and the `assetflow` database exists. Execute the following to structure the schema and populate initial test data:
   ```bash
   npm run db:setup
   npm run db:seed
   ```

5. Initialize the Server:
   ```bash
   npm run dev
   ```
   The backend service will be exposed at `http://localhost:5000`.

### Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   *Note: Due to Next.js 15 React versioning requirements with certain visualization libraries (e.g., Recharts), execute `npm install --legacy-peer-deps` if peer dependency conflicts occur.*

3. Configure Environment Variables:
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Initialize the Application:
   ```bash
   npm run dev
   ```
   The frontend interface will be accessible at `http://localhost:3000`.

## API Structure Overview

The backend employs a strictly typed, envelope-based API design. List-based endpoints (e.g., `GET /assets`, `GET /users`) return a paginated object rather than a raw array to facilitate scalable data retrieval:

```json
{
  "success": true,
  "data": {
    "assets": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  },
  "message": "Assets retrieved successfully"
}
```

The Next.js frontend processes these responses via the centralized `api.ts` module, mapping the nested arrays to corresponding Server Components to ensure runtime stability.

## Available Scripts

### Backend Operations
- `npm run dev`: Initializes the server with hot-reloading (Nodemon).
- `npm run start`: Initializes the server for production deployment.
- `npm run db:setup`: Executes SQL scripts to initialize the PostgreSQL schema.
- `npm run db:seed`: Populates the database with initial dummy data.

### Frontend Operations
- `npm run dev`: Initializes the Next.js development server.
- `npm run build`: Compiles an optimized production build.
- `npm run start`: Initializes the production Next.js server.
- `npm run lint`: Executes ESLint for code quality assurance.

---

## Docker Setup

The entire stack (PostgreSQL, Express API, Next.js) runs in Docker Compose with a single command.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Compose v2)

### Quick Start

```bash
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env and set strong secrets for production

# 2. Build images and start all services
docker compose up --build

# 3. (First run only) Seed the database with demo data
docker compose exec backend node src/database/seed.js

# 4. Open the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api/health
# PostgreSQL: localhost:5432
```

### Login Credentials (after seed)

| Email | Password | Role |
|---|---|---|
| admin@assetflow.com | Admin@1234 | Admin |
| alice@assetflow.com | Manager@1234 | Asset Manager |
| bob@assetflow.com | Head@1234 | Department Head |
| carol@assetflow.com | Employee@1234 | Employee |

### Service Architecture

```
Browser
  │
  ▼ :3000
┌──────────────┐     internal Docker network     ┌──────────────┐
│   frontend   │  ──── http://backend:5000/api ──▶│   backend    │
│  (Next.js)   │                                  │  (Express)   │
└──────────────┘                                  └──────┬───────┘
                                                         │
                                                         ▼ :5432
                                                  ┌──────────────┐
                                                  │   postgres   │
                                                  │  (PG 16)     │
                                                  └──────────────┘
```

### Common Commands

```bash
# Start (background)
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Stop (keep data)
docker compose down

# Full reset (wipe database volume)
docker compose down -v

# Rebuild a single service after code changes
docker compose up --build backend

# Open a psql shell
docker compose exec postgres psql -U assetflow -d assetflow_db

# Run migrations manually (if needed)
docker compose exec backend node src/database/migrate.js
```

### Environment Variables

All variables are documented in `.env.example`. The key ones are:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Database password |
| `JWT_ACCESS_SECRET` | JWT signing secret (≥32 chars) |
| `JWT_REFRESH_SECRET` | JWT refresh secret (≥32 chars, different from above) |
| `COOKIE_SECRET` | Cookie signing secret (≥32 chars) |
| `NEXT_PUBLIC_API_BASE_URL` | API URL baked into the Next.js build |

> **Security**: Always change the default secrets before deploying to any shared environment.

### Port Mapping

| Service | Container Port | Host Port |
|---|---|---|
| Frontend | 3000 | 3000 |
| Backend | 5000 | 5000 |
| PostgreSQL | 5432 | 5432 |
