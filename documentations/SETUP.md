# 🔧 Complete Setup Guide - ZenithStore Online

Complete documentation for installing and configuring the ZenithStore Online **monorepo** project with backend (Node.js + TypeScript + Express) and frontend (Next.js).

## 🏗️ Project Structure (Monorepo)

This project is organized as a **monorepo** with separated backend and frontend:

```
profession-ai-web-development-sistema-notifiche-ecommerce/
├── backend/                    # Backend Express + TypeScript
│   ├── src/                    # Backend source code
│   ├── .env                    # Backend environment variables
│   ├── package.json            # Backend dependencies
│   └── tsconfig.json           # Backend TypeScript config
├── frontend/                   # Frontend Next.js
│   ├── app/                    # Next.js App Router
│   ├── components/             # Reusable React components
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/                    # Utilities and configurations
│   ├── public/                 # Static assets (manifest, service worker, icons)
│   ├── stores/                 # Zustand stores for state management
│   ├── types/                  # TypeScript type definitions
│   ├── proxy.ts                # Proxy configuration for WebSocket
│   ├── .env                    # Frontend environment variables
│   ├── package.json            # Frontend dependencies
│   └── tsconfig.json           # Frontend TypeScript config
├── documentations/             # Documentation and DB scripts
├── docker-compose.yml          # Docker orchestration (MySQL + MongoDB)
├── .prettierrc                 # Prettier configuration
├── .gitignore                  # Git ignore patterns
└── README.md                   # Main readme
```

## 📋 System Requirements

### Software Requirements
- **Node.js** (version 18.x or higher) - [Download](https://nodejs.org/)
- **npm** (package manager, included with Node.js)
- **Docker Desktop** (for MySQL and MongoDB databases) - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** (for version control) - [Download](https://git-scm.com/)

### Development Tools (Recommended)
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **Postman** (API testing) - [Download](https://www.postman.com/)
- **MySQL Workbench** (optional, for database management)

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended for smooth Docker operation)
- **Storage**: At least 2GB free space
- **Network**: Internet connection for dependency downloads

## 🎯 Technologies Used

### Backend Technologies

#### Core Dependencies
- **Node.js** - JavaScript runtime environment
- **TypeScript** (v5.9.3) - Typed superset of JavaScript
- **Express.js** (v5.1.0) - Web application framework
- **MySQL** - Relational database management system (structured data)
- **TypeORM** (v0.3.27) - Object-Relational Mapping library
- **mysql2** (v3.15.2) - MySQL client for Node.js
- **MongoDB** (v6.21.0) - NoSQL database (reviews, questions, activity logs)
- **Mongoose** (v8.20.1) - MongoDB object modeling library

#### Security & Authentication
- **jsonwebtoken** (v9.0.2) - JWT token generation and verification
- **bcrypt** (v6.0.0) - Password hashing
- **helmet** (v8.1.0) - Security headers middleware
- **cors** (v2.8.5) - Cross-Origin Resource Sharing middleware
- **express-rate-limit** (v8.1.0) - Rate limiting middleware

#### Real-time & Logging
- **socket.io** (v4.8.1) - WebSocket library for real-time communication
- **morgan** (v1.10.1) - HTTP request logger

#### Configuration & Utilities
- **dotenv** (v17.2.3) - Environment variables loader
- **reflect-metadata** (v0.2.2) - Metadata reflection API (required for TypeORM decorators)

#### Development Dependencies
- **typescript** (v5.9.3) - TypeScript compiler
- **ts-node** (v10.9.2) - TypeScript execution engine
- **ts-node-dev** (v2.0.0) - Development server with auto-restart
- **nodemon** (v3.1.10) - File watcher for auto-restart
- **@types/*** - TypeScript type definitions for various libraries

### Frontend Technologies

#### Core Framework
- **Next.js** (v16.1.1) - React framework with App Router
- **React** (v19.2.3) - UI library
- **React DOM** (v19.2.3) - React rendering for web
- **TypeScript** (v5.x) - Typed superset of JavaScript

#### Authentication & API
- **NextAuth.js** (v5.0.0-beta.30) - Authentication for Next.js
- **@auth/core** (v0.41.0) - Core authentication library
- **@tanstack/react-query** (v5.90.16) - Data fetching and caching
- **jsonwebtoken** (v9.0.3) - JWT token handling

#### State Management & Forms
- **Zustand** (v5.0.9) - Lightweight state management
- **React Hook Form** (v7.71.0) - Form validation and management
- **@hookform/resolvers** (v5.2.2) - Form validation resolvers
- **Zod** (v4.3.5) - TypeScript-first schema validation

#### UI Components & Styling
- **Tailwind CSS** (v4.x) - Utility-first CSS framework
- **Radix UI** - Headless UI components library:
  - @radix-ui/react-dialog (v1.1.15)
  - @radix-ui/react-dropdown-menu (v2.1.16)
  - @radix-ui/react-select (v2.2.6)
  - @radix-ui/react-checkbox (v1.3.3)
  - @radix-ui/react-radio-group (v1.3.8)
  - @radix-ui/react-switch (v1.2.6)
  - @radix-ui/react-tabs (v1.1.13)
  - @radix-ui/react-slider (v1.3.6)
  - @radix-ui/react-progress (v1.1.8)
  - @radix-ui/react-separator (v1.1.8)
  - @radix-ui/react-label (v2.1.8)
  - @radix-ui/react-slot (v1.2.4)
- **Lucide React** (v0.562.0) - Icon library
- **Phosphor React** (v1.4.1) - Additional icon library
- **class-variance-authority** (v0.7.1) - CSS variant utilities
- **clsx** (v2.1.1) - Utility for constructing className strings
- **tailwind-merge** (v3.4.0) - Merge Tailwind CSS classes

#### Real-time & Notifications
- **socket.io-client** (v4.8.3) - WebSocket client for real-time updates
- **Sonner** (v2.0.7) - Toast notification library

#### Utilities
- **date-fns** (v4.1.0) - Modern JavaScript date utility library

#### Development Dependencies
- **ESLint** (v9.x) - JavaScript/TypeScript linter
- **eslint-config-next** (v16.1.1) - Next.js ESLint configuration
- **@tailwindcss/postcss** (v4.x) - PostCSS plugin for Tailwind CSS

## 📦 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd profession-ai-web-development-sistema-notifiche-ecommerce
```

### 2. Setup Databases with Docker Compose
```bash
# Start MySQL and MongoDB containers with automatic initialization
docker-compose up -d

# Check logs to ensure databases are ready

docker-compose logs -f mysql
# Wait until you see: "mysqld: ready for connections"
# Press Ctrl+C to exit logs

docker-compose logs -f mongodb
# Wait until you see: "Waiting for connections"
# Press Ctrl+C to exit logs
```

The `docker-compose.yml` configuration automatically:
- Creates MySQL container (port 3306) for structured data
- Creates MongoDB container (port 27018) for unstructured data
- Creates the `zenithstore` MySQL database
- Executes `ddl.sql` to create MySQL tables
- Executes `dml.sql` to insert sample data
- Executes `mongo-init.js` to initialize MongoDB
- Sets up persistent volumes for both databases

### 3. Setup Backend
```bash
cd backend
npm install
```

### 4. Configure Backend Environment Variables
The backend uses `backend/.env` file for configuration.

**Default configuration** (works with Docker Compose):
```env
# Environment
NODE_ENV=development
#NODE_ENV=production

# Server
PORT=3000

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=rootpassword
DB_DATABASE=zenithstore
SYNC=true
LOGGING=false

# MongoDB Database
MONGODB_URI=mongodb://admin:adminpassword@localhost:27018/zenithstore?authSource=admin

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=9h

# Security Configuration
ALLOWED_DOMAIN=localhost
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
ACCESS_LOG_FILE_NAME=access.log
ERROR_LOG_FILE_NAME=errors.log

# Cart Cleanup Job Configuration
CART_CLEANUP_INTERVAL_MINUTES=10    # Cleanup job execution interval
CART_EXPIRATION_HOURS=24            # CART orders expiration
RESERVED_EXPIRATION_HOURS=3         # RESERVED orders expiration
CART_GRACE_PERIOD_MINUTES=15        # Grace period to prevent race conditions
```

**Important**: Change `JWT_SECRET` in production!

### 5. Start Backend Development Server
```bash
# From backend/ directory
npm run dev
```

### 6. Verify Installation
- Open browser: `http://localhost:3000`
- Check health endpoint: `http://localhost:3000/health`
- Check API docs: `http://localhost:3000/api/docs`

### 7. Setup Frontend
```bash
cd ..
cd frontend
npm install
```

### 8. Configure Frontend Environment Variables
The frontend uses `frontend/.env` file for configuration.

**Default configuration** (works with Docker Compose):
```env
# Environment
NODE_ENV=development
#NODE_ENV=production

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=generate-a-random-secret-min-32-chars-for-nextauth-change-in-production
AUTH_SESSION_MAX_AGE_HOURS=9

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=9h

# CART orders expiration
NEXT_PUBLIC_CART_EXPIRATION_HOURS=24

# Debug Logging (set to 'true' to enable debug logs)
NEXT_PUBLIC_DEBUG_LOGS=false
# Info Logging (set to 'true' to enable info logs)
NEXT_PUBLIC_INFO_LOGS=true

# Google OAuth (mock for POC)
GOOGLE_CLIENT_ID=mock-google-client-id
GOOGLE_CLIENT_SECRET=mock-google-client-secret
```

**Important**: Change `NEXTAUTH_SECRET` and `JWT_SECRET` in production!

### 9. Start Frontend Development Server
```bash
# From frontend/ directory
npm run dev
```

Frontend will be available at `http://localhost:3001`

## 🧪 Testing

### Backend Testing
```bash
# Test with curl
curl http://localhost:3000/health
```

### Frontend Testing
```bash
# Open http://localhost:3001
```

## 🐳 Docker Compose Commands

### Essential Commands

```bash
# Start all services in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data (including volumes)
docker-compose down -v

# View logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View only MySQL logs
docker-compose logs -f mysql

# View only MongoDB logs
docker-compose logs -f mongodb

# Restart services
docker-compose restart

# Check service status
docker-compose ps

# Execute commands in MySQL container
docker-compose exec mysql mysql -u root -prootpassword zenithstore
```

### Troubleshooting

**Problem**: Database not ready when starting the app
```bash
# Check if MySQL is healthy
docker-compose ps

# Wait for healthy status, then restart app
npm run dev
```

**Problem**: Need to reset database
```bash
# Stop and remove containers with volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

**Problem**: Port 3306 already in use
```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :3306

# Stop conflicting service or change port in docker-compose.yml
```

## 🔧 Alternative: Manual Docker Setup

If you prefer manual control over the database setup:

```bash
# Start MySQL container
docker run --name mysql-zenithstore -e MYSQL_ROOT_PASSWORD=rootpassword -p 3306:3306 -d mysql:latest

# Create database
docker exec -it mysql-zenithstore mysql -u root -prootpassword -e "CREATE DATABASE zenithstore;"

# Execute DDL script to create tables
docker cp documentations/ddl.sql mysql-zenithstore:/tmp/ddl.sql
docker exec -it mysql-zenithstore bash -c "mysql -u root -prootpassword --database=zenithstore < /tmp/ddl.sql"

# (Optional) Execute DML script for sample data
docker cp documentations/dml.sql mysql-zenithstore:/tmp/dml.sql
docker exec -it mysql-zenithstore bash -c "mysql -u root -prootpassword --database=zenithstore < /tmp/dml.sql"
```

## 🛠️ Available NPM Scripts

### Backend Scripts

Run these commands from the `backend/` directory:

#### Development Scripts

##### `npm run dev`
Starts the backend development server with auto-restart on file changes.
- Uses `ts-node-dev` for fast TypeScript compilation
- `--respawn`: Restarts on crashes
- `--transpile-only`: Skips type checking for faster startup
- Backend runs on `http://localhost:3000`

##### `npm run dev:watch`
Enhanced development mode with explicit watch on `src` folder.
- Same as `dev` but with explicit `--watch src` flag
- Useful for ensuring all file changes are detected

##### `npm run dev:inspect`
Starts backend development server with debugging enabled on port 9229.
- Allows attaching a debugger (Chrome DevTools, VS Code)
- Use with VS Code debugger configurations (see below)

##### `npm run start:ts`
Runs the TypeScript code directly without watch mode.
- Single execution without auto-restart
- Useful for one-time testing

#### Production Scripts

##### `npm run build`
Compiles TypeScript to JavaScript in the `dist/` folder.
- Uses `tsc` (TypeScript compiler)
- Output configured in `tsconfig.json`

##### `npm run start`
Runs the compiled JavaScript from `dist/server.js`.
- Use after `npm run build`
- Production-ready execution

##### `npm test`
Placeholder for test execution (not yet implemented).

### Frontend Scripts

Run these commands from the `frontend/` directory:

#### Development Scripts

##### `npm run dev`
Starts the Next.js development server.
- Runs on `http://localhost:3001`
- Enables hot module replacement (HMR)
- Automatically compiles pages on demand

#### Production Scripts

##### `npm run build`
Creates an optimized production build of the Next.js application.
- Compiles and bundles all pages and assets
- Generates static HTML where possible
- Optimizes images and creates production bundles
- Required before running `npm run start`

##### `npm run start`
Starts the Next.js production server.
- Runs on `http://localhost:3001`
- Serves the optimized production build
- Use after `npm run build`

#### Code Quality Scripts

##### `npm run lint`
Runs ESLint to check code quality and style.
- Checks TypeScript and React code for errors
- Uses Next.js ESLint configuration
- Reports potential issues and style violations

## 🐛 VS Code Debugging

The `.vscode/launch.json` file contains debugger configurations for backend, frontend, and full stack debugging.

### Backend Debugging Configurations

#### Configuration 1: Backend: Launch
**Type**: Node Launch
- Launches the backend with `npm run dev:inspect` from `backend/` directory
- Automatically starts the backend server with debugging enabled on port 9229
- Opens integrated terminal for output
- **How to use**: Press F5 or go to Run and Debug panel → Select "Backend: Launch" → Start Debugging

#### Configuration 2: Backend: Attach
**Type**: Node Attach
- Attaches to an already running backend `dev:inspect` process
- Connects to port 9229
- Auto-restarts debugger when the server restarts
- **How to use**: First run `npm run dev:inspect` manually from `backend/`, then attach the debugger from VS Code

### Frontend Debugging Configurations

#### Configuration 3: Frontend: Launch
**Type**: Node Terminal
- Launches the Next.js frontend with `npm run dev` from `frontend/` directory
- Runs on `http://localhost:3001`
- Automatically opens Chrome debugger when server is ready
- **How to use**: Select "Frontend: Launch" from Run and Debug panel → Start Debugging

#### Configuration 4: Frontend: Attach
**Type**: Chrome
- Attaches Chrome debugger to running Next.js application
- Connects to `http://localhost:3001`
- Enables debugging React components and client-side code
- Includes source map support for TypeScript debugging
- **How to use**: First run `npm run dev` manually from `frontend/`, then select "Frontend: Attach" from Run and Debug panel

### Full Stack Debugging Configurations (Compound)

#### Configuration 5: Full Stack: Launch
**Type**: Compound
- Launches **both** backend and frontend simultaneously
- Starts backend debugging on port 9229
- Starts frontend debugging with Chrome
- **How to use**: Select "Full Stack: Launch" from Run and Debug panel → Start Debugging
- **Best for**: Starting the entire application stack with debugging enabled

#### Configuration 6: Full Stack: Attach
**Type**: Compound
- Attaches debuggers to **both** running backend and frontend processes
- Connects to backend on port 9229
- Connects to frontend on `http://localhost:3001` with Chrome
- **How to use**: First start both `npm run dev:inspect` (backend) and `npm run dev` (frontend) manually, then select "Full Stack: Attach"
- **Best for**: Debugging both backend and frontend when services are already running

### Debugging Tips
- **Breakpoints**: Click left of line numbers in VS Code to set breakpoints
- **Debug Console**: Evaluate expressions and inspect variables during debugging
- **Backend**: Use VS Code debugger for Node.js server-side code
- **Frontend**: Use Chrome DevTools integration for React components and browser code
- **Source Maps**: TypeScript files are automatically mapped for debugging
- **Skip Files**: `skipFiles` configuration ignores Node.js internals for cleaner debugging
- **Full Stack**: Use compound configurations to debug backend API calls and frontend rendering simultaneously

## 🌐 API Endpoints

### Core API Information
- `GET /` - API information and available endpoints
- `GET /health` - Health check with system status
- `GET /api/docs` - Complete API documentation
- `GET /user-interface` - User interface page

### API Endpoints by Resource

#### Users (Technical Users - Admin Functions)
- `GET /api/users` - List all active users
- `GET /api/users/search` - Advanced user search with filters
- `POST /api/users` - Create new technical user
- `POST /api/users/login` - User login with JWT
- `PATCH /api/users/:id/password` - Update password
- `POST /api/users/:id/reset-password` - Force password reset
- `POST /api/users/profile/logout` - Logout and blacklist JWT
- `POST /api/users/:id/block` - Block user temporarily
- `POST /api/users/:id/unblock` - Unblock user
- `DELETE /api/users/:id` - Delete user (soft delete)

#### Customers (End Customers)
- `GET /api/customers` - List all active customers
- `GET /api/customers/search` - Advanced customer search
- `GET /api/customers/profile` - Get customer profile
- `POST /api/customers` - Create new customer
- `POST /api/customers/login` - Customer login with JWT
- `PATCH /api/customers/password` - Update password
- `POST /api/customers/reset-password` - Force password reset
- `POST /api/customers/profile/logout` - Logout and blacklist JWT
- `POST /api/customers/:id/block` - Block customer
- `POST /api/customers/:id/unblock` - Unblock customer
- `DELETE /api/customers/profile` - Delete customer profile

#### Products & Inventory
- `GET /api/products` - List all active products with inventory
- `GET /api/products/search` - Advanced product search
- `GET /api/products/:productCode` - Get specific product details
- `POST /api/products` - Create new product
- `PATCH /api/products/:productCode` - Update product
- `PATCH /api/products/:productCode/inventory` - Update inventory quantity
- `DELETE /api/products/:productCode` - Delete product (soft delete)
- `POST /api/products/:productCode/restore` - Restore deleted product

#### Categories
- `GET /api/categories` - List all active categories ordered by display_order
- `GET /api/categories/:slug` - Get category details by slug
- `GET /api/categories/:slug/products` - Get products by category slug with pagination
- `POST /api/categories` - Create new category (admin)
- `PATCH /api/categories/:slug` - Update category (admin)
- `DELETE /api/categories/:slug` - Soft delete category (admin)
- `POST /api/categories/:slug/restore` - Restore deleted category (admin)

#### Orders Management
- `POST /api/orders/checkout` - Create order from FE cart, validate & reserve inventory
- `POST /api/orders/:id/shipping` - Add shipping address to RESERVED order
- `GET /api/orders/:id` - Get order details with items
- `GET /api/orders/search` - Advanced order search
- `PATCH /api/orders/:id/process` - Process order (NEW → PROCESSING)
- `POST /api/orders/:id/ship` - Create shipment for order
- `PATCH /api/orders/:id/ship/sent` - Mark shipment as sent

#### Payments
- `POST /api/payments` - Initiate payment for reserved order
- `POST /api/payments/webhook` - Payment webhook from provider

#### Shipments
- `GET /api/shipments` - Get shipments with filtering
- `POST /api/shipments/webhook` - Shipment webhook from provider

#### Wishlist
- `GET /api/wishlist` - Get customer wishlist with product details
- `POST /api/wishlist` - Add product to wishlist
- `DELETE /api/wishlist/:productCode` - Remove product from wishlist

#### Notifications
- `GET /api/notifications` - Get notifications with filters and pagination
- `GET /api/notifications/unread-count` - Get unread notification count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all notifications as read
- `POST /api/notifications/broadcast` - Send broadcast notification to all customers (admin)
- `POST /api/notifications/wishlist/:productCode` - Send notification to wishlist customers (admin)

#### Reviews & Questions (MongoDB)
- `POST /api/products/:productCode/reviews` - Create product review
- `GET /api/products/:productCode/reviews` - Get product reviews
- `PATCH /api/reviews/:id/approve` - Approve review (admin)
- `PATCH /api/reviews/:id/reject` - Reject review (admin)
- `PATCH /api/reviews/:id/helpful` - Mark review helpful
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/pending` - Get pending reviews (admin)
- `GET /api/customers/me/reviews` - Get my reviews
- `POST /api/products/:productCode/questions` - Create question
- `GET /api/products/:productCode/questions` - Get product questions
- `PATCH /api/questions/:id/answer` - Answer question (admin)
- `PATCH /api/questions/:id/hide` - Hide question (admin)
- `PATCH /api/questions/:id/helpful` - Mark question helpful
- `DELETE /api/questions/:id` - Delete question
- `GET /api/questions/pending` - Get pending questions (admin)
- `GET /api/customers/me/questions` - Get my questions

---

✅ **Setup complete!** The project is ready for development.