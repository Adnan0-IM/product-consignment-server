

## Final Year Project Title

**Design and Implementation of a Product Consignment Management System**

---

# Technology Stack

## Frontend

* React.js (Vite)
* React Router DOM
* Tailwind CSS
* Axios
* Zod (Validation)
* TanStack Query (React Query)
* React Hot Toast
* Lucide React Icons
* Chart.js
* date-fns

---

## Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT Authentication
* bcrypt
* Express Validator or Zod
* Multer (Product Images)
* Winston (Logging)
* Helmet
* CORS
* Morgan

---

## Database

* PostgreSQL
* Prisma ORM

---

## Development Tools

* VS Code
* Git
* GitHub
* Postman
* pgAdmin
* Prisma Studio

---

# Software Architecture

We will use a **3-Tier Architecture**.

```text
Frontend (React + Tailwind)

        │
Axios REST API
        │

Backend (Express API)

        │
Prisma ORM
        │

PostgreSQL Database
```

This architecture keeps the frontend, business logic, and data layers separate, making the application easier to maintain and extend.

---

# System Users

## Administrator

Can

* Manage users
* Manage categories
* Approve consignors
* View reports
* Manage inventory
* View sales
* Manage payments
* Manage commissions
* View analytics

---

## Consignor

Can

* Register
* Login
* Add products
* View products
* Track consignments
* View sales
* View earnings
* Request payout

---

## Consignee

Can

* Login
* Accept consignments
* Record sales
* Return products
* View commission
* Manage inventory

---

# Modules

## Authentication Module

* Register
* Login
* Logout
* Forgot Password
* Reset Password
* JWT Authentication
* Role Based Access

---

## Product Module

* Categories
* Products
* Images
* Barcode
* SKU
* Price
* Quantity

---

## Consignment Module

* Create Consignment
* Approve Consignment
* Receive Stock
* Transfer Products
* Update Status

---

## Sales Module

* Sell Product
* Sales History
* Invoice
* Receipt

---

## Inventory Module

* Available Stock
* Sold Stock
* Returned Stock
* Damaged Stock

---

## Payment Module

* Payment History
* Outstanding Balance
* Earnings

---

## Commission Module

Automatic calculation

```
Sale Amount

↓

Commission

↓

Consignee Earnings

↓

Consignor Earnings
```

---

## Reports Module

* Daily Sales
* Monthly Sales
* Product Report
* Inventory Report
* Payment Report
* Commission Report

---

# Roles

```text
Admin

Consignor

Consignee
```

---

# Authentication

JWT

```text
User Login

↓

Generate JWT

↓

Store Token

↓

Protected Routes

↓

Authorized API
```

---

# Folder Structure

## Frontend

```text
client/
│
├── public/
├── src/
│
├── api/
├── assets/
├── components/
│   ├── common/
│   ├── forms/
│   ├── dashboard/
│   ├── tables/
│   ├── cards/
│   └── charts/
│
├── context/
├── hooks/
├── layouts/
├── pages/
│
│   ├── auth/
│   ├── admin/
│   ├── consignor/
│   ├── consignee/
│
├── routes/
├── services/
├── utils/
├── validations/
├── App.jsx
└── main.jsx
```

---

## Backend

```text
server/
│
├── prisma/
│
├── src/
│
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── repositories/
├── validators/
├── utils/
├── uploads/
├── logs/
├── prisma/
├── app.js
└── server.js
```

---

# Database Tables

We'll design a fully normalized PostgreSQL database with the following tables:

```
roles

users

categories

products

product_images

consignments

consignment_items

sales

sale_items

payments

commissions

returns

notifications

activity_logs
```

This structure supports a scalable and maintainable application.

---

# Prisma Models

Each table will have its own Prisma model with:

* Primary Keys
* Foreign Keys
* One-to-One Relations
* One-to-Many Relations
* Many-to-Many Relations (where appropriate)
* Indexes
* Constraints
* Cascading Deletes
* Cascading Updates

---

# Frontend Pages

## Public

* Home
* Login
* Register
* About
* Contact

---

## Admin

* Dashboard
* Users
* Products
* Categories
* Consignments
* Sales
* Payments
* Reports
* Settings

---

## Consignor

* Dashboard
* Products
* Create Product
* My Consignments
* Sales
* Earnings
* Profile

---

## Consignee

* Dashboard
* Assigned Products
* Inventory
* Sales
* Returns
* Commission
* Profile

---

# REST API

The backend will expose RESTful endpoints such as:

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/products
POST   /api/products

GET    /api/categories

POST   /api/consignments

POST   /api/sales

POST   /api/payments

POST   /api/returns

GET    /api/reports
```

Each endpoint will include request validation, authentication, authorization, and standardized error responses.

---

# Security Features

* JWT Authentication
* Role-Based Access Control (RBAC)
* Password hashing with bcrypt
* Input validation (Zod)
* Helmet security headers
* CORS configuration
* Rate limiting
* Centralized error handling
* Activity logging
* Prisma parameterized queries to help prevent SQL injection

---

# Development Roadmap

### Phase 1

* Requirements gathering
* Use case analysis
* System architecture
* Database design
* ER diagram

### Phase 2

* Initialize React, Express, PostgreSQL, and Prisma
* Configure authentication
* Create database schema

### Phase 3

* Develop Admin module
* Develop Consignor module
* Develop Consignee module

### Phase 4

* Implement sales, inventory, payments, and commission modules

### Phase 5

* Reporting and analytics
* Testing
* Documentation
* Deployment

---

# Project Folder (Monorepo)

```text
product-consignment-system/
│
├── client/              # React + Tailwind
│
├── server/              # Express + Prisma
│
├── docs/
│
├── database/
│
├── .gitignore
├── README.md
└── docker-compose.yml   # Optional for PostgreSQL
```

## Recommendation

I suggest we build this project as a **professional, industry-style application** rather than a simple academic project. We will follow:

* Feature-based architecture
* Clean Architecture principles
* MVC pattern on the backend
* Repository and service layers
* Prisma ORM with PostgreSQL
* JWT authentication with refresh tokens
* Role-Based Access Control (Admin, Consignor, Consignee)
* Reusable React components
* Consistent REST API design
* Comprehensive API documentation
* Git workflow with meaningful commits

This will give you a project that is suitable for your final-year defense and also serves as a strong portfolio project for internships or junior software engineering roles.


