# ⚡ ConsignHub — Product Consignment Backend REST API

An enterprise-grade REST API backend for the **ConsignHub Product Consignment Management System**, built with **Node.js / Bun**, **Express 5**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## 🌟 Core Features & Business Logic

- **Authentication & RBAC**: JWT-based authentication with strict Role-Based Access Control (`ADMIN`, `CONSIGNOR`, `CONSIGNEE`).
- **Cash Payment Recording**: Restricted so that **only Consignors** can log cash payments received from consignees for sold goods. Consignee accounts (`payerId`) are credited, updating overall cash paid, outstanding balance due, and account status (`PAID IN FULL`, `PARTIALLY PAID`, `UNPAID`, `ADVANCE CREDIT`).
- **Bidirectional Product Returns**: Both Consignors and Consignees can view return requests. Consignors can approve (`APPROVED`), reject (`REJECTED`), or mark returns completed (`COMPLETED`). Approved returns automatically restock product inventory in PostgreSQL via Prisma transactions and generate a `StockMovement` audit entry.
- **Automated 3-Way Commission Split**: When sales are processed, revenue is split dynamically between Consignor share, Consignee commission, and System/Admin fee.
- **Consignment Management**: Consignors dispatch products in consignment batches (`CSG-xxxx`); Consignees accept or reject incoming shipments.
- **Profile & Payout Bank Details**: Users can update account info, payout bank details (Bank Name, Account Number, Account Name), and change passwords with bcrypt hashing.
- **Audit Trails & Notifications**: Real-time action notifications and complete `ActivityLog` history.

---

## 🏗️ System Architecture

```text
Express REST API
    │
    ├── src/config/        # Database setup (Prisma client), Winston logger
    ├── src/controllers/   # HTTP request & response handlers
    ├── src/middleware/    # JWT Auth, Role authorization, Zod validation, Error handler
    ├── src/routes/        # Express route definitions
    ├── src/services/      # Business logic & Prisma ORM transaction queries
    ├── src/validators/    # Zod schemas for payload validation
    └── prisma/            # Schema definition & database migrations
```

---

## 🛠️ Tech Stack

- **Runtime**: Bun / Node.js
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma ORM v6
- **Authentication**: JWT & bcryptjs
- **Validation**: Zod
- **Logging & Security**: Winston, Morgan, Helmet, CORS

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
bun install
# or
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your PostgreSQL `DATABASE_URL` and `JWT_SECRET`.

### 3. Generate Prisma Client & Run Database Push
```bash
bun run prisma:generate
bun run prisma:push
```

### 4. Run Development Server
```bash
bun run dev
```
The server will start on `http://localhost:5000`.

### 5. Build for Production
```bash
bun run build
```

---

## 📡 Key API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`CONSIGNOR` or `CONSIGNEE`)
- `POST /api/auth/login` — Login and receive JWT access token
- `GET /api/auth/me` — Retrieve current user profile & bank details
- `PUT /api/auth/profile` — Update user profile and payout bank account details
- `PUT /api/auth/change-password` — Secure password update

### 💰 Cash Payments (`/api/payments`)
- `POST /api/payments` — **Consignor Only**: Record cash payment received from consignee (`payerId`, `amount`, `category`, `notes`)
- `GET /api/payments` — Get payment transaction history filtered by user role
- `GET /api/payments/summary` — Retrieve real-time payment summary (Total Sales Value, Total Cash Paid, Outstanding Balance, Payment Status)

### 🔄 Product Returns (`/api/returns`)
- `POST /api/returns` — Create product return request (`productId`, `quantity`, `reason`)
- `GET /api/returns` — List product returns (Role-filtered for Consignors and Consignees)
- `PUT /api/returns/:id/status` — **Consignor/Admin**: Update return status (`APPROVED`, `REJECTED`, `COMPLETED`), auto-restocking stock into product inventory

### 📦 Consignments (`/api/consignments`)
- `POST /api/consignments` — Consignor dispatches product batch to consignee
- `GET /api/consignments` — List user consignments
- `PUT /api/consignments/:id/status` — Consignee accepts or rejects consignment batch

### 🛍️ Products & Categories (`/api/products`, `/api/categories`)
- `GET /api/products` — Browse products with search & status filters
- `POST /api/products` — Create product with unit price and commission rates
- `GET /api/categories` — List product categories
