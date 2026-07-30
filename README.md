# Product Consignment Management System - Backend Server

A enterprise-grade REST API backend for the Product Consignment Management System, built with Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, and Bun.

---

## 🌟 Key Features

* **Authentication & Authorization**: JWT Authentication with Role-Based Access Control (RBAC) supporting `ADMIN`, `CONSIGNOR`, and `CONSIGNEE` roles.
* **Category & Product Management**: Full CRUD, image uploads (Multer), barcode & SKU tracking, custom commission rates, and inventory status management.
* **Consignment Workflow**: Consignors send consignments to Consignees; Consignees accept/reject; automated stock reservation and tracking.
* **Sales & Automated 3-Way Commission Split**: Consignees record sales; system automatically calculates and allocates revenue split between Consignor, Consignee, and System/Admin.
* **Payouts & Payments**: Payout tracking for Consignors with balance calculations and payment status updates.
* **Returns & Inventory Adjustments**: Product return workflow and stock movement audit log (`StockMovement`).
* **Reports & Dashboards**: Summary metrics tailored for Admin, Consignor, and Consignee roles, plus sales and inventory reports.
* **Notifications & Audit Logging**: Real-time action notifications and complete activity logs (`ActivityLog`).

---

## 🏗 System Architecture

```text
Express REST API
    │
    ├── src/config/        # Environment, Prisma client, Winston logger
    ├── src/middleware/    # Auth (JWT), RBAC, Zod Validator, Upload (Multer), Error Handler
    ├── src/validators/    # Zod schemas for input validation
    ├── src/services/      # Business logic & Prisma ORM queries
    ├── src/controllers/   # HTTP request/response handlers
    ├── src/routes/        # Express REST route definitions
    └── prisma/            # Prisma Schema & Seed script
```

---

## 🛠 Tech Stack

* **Runtime**: Bun / Node.js
* **Framework**: Express.js 5
* **Language**: TypeScript
* **Database & ORM**: PostgreSQL & Prisma ORM
* **Authentication**: JWT & bcryptjs
* **Validation**: Zod
* **Logger**: Winston & Morgan
* **Security**: Helmet, CORS

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your PostgreSQL `DATABASE_URL` and `JWT_SECRET`.

### 3. Generate Prisma Client & Run Database Migrations

```bash
bun run prisma:generate
bun run prisma:push
```

### 4. Seed Initial Data (Optional)

```bash
bun run seed
```

Default accounts created:
- **Admin**: `admin@consignment.com` / `Password123!`
- **Consignor**: `consignor@consignment.com` / `Password123!`
- **Consignee**: `consignee@consignment.com` / `Password123!`

### 5. Run Development Server

```bash
bun run dev
```

Server starts on `http://localhost:5000`.

---

## 📡 API Endpoints Summary

### Auth (`/api/auth`)
* `POST /api/auth/register` - Register user (`ADMIN`, `CONSIGNOR`, `CONSIGNEE`)
* `POST /api/auth/login` - Login & receive JWT token
* `GET /api/auth/me` - Get current user profile
* `PUT /api/auth/profile` - Update user profile details & banking info
* `PUT /api/auth/change-password` - Change account password

### Users (`/api/users`) - Admin Only
* `GET /api/users` - List users with filtering & pagination
* `GET /api/users/:id` - Get user details
* `PUT /api/users/:id/status` - Update user status (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
* `PUT /api/users/:id/role` - Update user role
* `DELETE /api/users/:id` - Delete user

### Categories (`/api/categories`)
* `GET /api/categories` - List categories
* `POST /api/categories` - Create category (Admin)
* `PUT /api/categories/:id` - Update category (Admin)
* `DELETE /api/categories/:id` - Delete category (Admin)

### Products (`/api/products`)
* `GET /api/products` - List products with filter, search, & pagination
* `GET /api/products/:id` - Get product details
* `POST /api/products` - Create product with optional image upload
* `PUT /api/products/:id` - Update product
* `DELETE /api/products/:id` - Delete product
* `POST /api/products/:id/images` - Upload additional product image

### Consignments (`/api/consignments`)
* `POST /api/consignments` - Create consignment to a consignee
* `GET /api/consignments` - List user consignments
* `GET /api/consignments/:id` - View consignment details
* `PUT /api/consignments/:id/status` - Accept/Reject consignment (Consignee)

### Sales (`/api/sales`)
* `POST /api/sales` - Record sale & auto-calculate commission split
* `GET /api/sales` - List sales history
* `GET /api/sales/:id` - Get sale invoice/receipt

### Payments & Payouts (`/api/payments`)
* `POST /api/payments` - Initiate payout (Admin)
* `GET /api/payments` - List payment transactions
* `PUT /api/payments/:id/status` - Update payment status (`PAID`, `FAILED`)

### Commissions (`/api/commissions`)
* `GET /api/commissions` - List commission breakdown per transaction
* `GET /api/commissions/summary` - Summary of total earnings, payouts, & balance

### Returns (`/api/returns`)
* `POST /api/returns` - Create product return request
* `GET /api/returns` - List return requests
* `PUT /api/returns/:id/status` - Approve/Reject return & restock inventory

### Inventory (`/api/inventory`)
* `GET /api/inventory/overview` - Inventory stock metrics
* `GET /api/inventory/movements` - Stock movement audit log
* `POST /api/inventory/:id/adjust` - Manual stock adjustment

### Reports (`/api/reports`)
* `GET /api/reports/dashboard` - Role-customized dashboard metrics
* `GET /api/reports/sales` - Comprehensive sales report (Admin)

### Notifications & Activity Logs
* `GET /api/notifications` - Get notifications
* `PUT /api/notifications/read-all` - Mark notifications as read
* `GET /api/activity-logs` - View system activity audit log (Admin)
