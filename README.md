# AssetFlow – Enterprise Asset Management

AssetFlow is a comprehensive, production-grade enterprise asset management system. It allows organizations to track physical and digital assets across their lifecycle, handle resource bookings, manage allocations, schedule maintenance, and conduct detailed compliance audits.

## 🌟 Key Features

- **Asset Lifecycle Management**: Import, categorize, and track assets from acquisition to retirement.
- **Resource Bookings**: Prevent scheduling conflicts with robust room and equipment booking functionality.
- **Allocations & Transfers**: Assign assets to users or departments, track transfer history, and mandate condition checks upon return.
- **Maintenance Operations**: Schedule preventive maintenance and log breakdown requests seamlessly.
- **Audit & Compliance**: Perform digital audits, verify asset existence by location, and generate discrepancy reports.
- **Role-Based Access Control**: Secure platform with granular permissions (Admin, Asset Manager, Standard User).

---

## 🏗 Architecture & Tech Stack

The system is built on a clean, scalable three-layer architecture with independent frontend and backend services.

### Backend (Node.js & Express)
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg` driver)
- **Authentication**: JWT-based HttpOnly cookies (for enhanced XSS protection)
- **Design Pattern**: Controller-Service-Model architecture with paginated API responses.

### Frontend (Next.js 15 App Router)
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS with custom branding and glassmorphic UI elements.
- **Data Fetching**: Server Actions & Server Components (zero unnecessary client-side JavaScript).
- **API Client**: Centralized `lib/api.ts` ensuring type-safe access to backend paginated envelopes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL (v12 or higher)

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   # Database Settings
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=assetflow
   DB_PORT=5432

   # Security
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Setup Database & Seed Data:
   Ensure your PostgreSQL instance is running and you have created the `assetflow` database. Run the following to structure the tables and populate test data:
   ```bash
   npm run db:setup
   npm run db:seed
   ```
5. Start the Backend Server:
   ```bash
   npm run dev
   ```
   *The backend will be available at `http://localhost:5000`.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   *(Note: Due to a Next.js 15 React versioning requirement with Recharts, if you encounter peer dependency issues, run `npm install --legacy-peer-deps`)*
3. Configure Environment Variables:
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. Start the Frontend Server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

---

## 📖 API Structure Overview

The backend uses a structured API design. Most list-based endpoints (`GET /assets`, `GET /users`, etc.) return a **paginated envelope** instead of a raw array:

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

The Next.js frontend handles these via the centralized `api.ts` module, which extracts the relevant arrays before passing them to the Server Components.

## 🛠 Available Scripts

**Backend:**
- `npm run dev`: Starts the server with Nodemon for hot-reloading.
- `npm run start`: Starts the production server.
- `npm run db:setup`: Initializes the PostgreSQL schema.
- `npm run db:seed`: Populates the database with initial dummy data.

**Frontend:**
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the production Next.js server.
- `npm run lint`: Runs ESLint for code quality checks.

---

*AssetFlow — Streamlining enterprise resources with precision.*
