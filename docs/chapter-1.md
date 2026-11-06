# CHAPTER 1 — INTRODUCTION

## 1.1 Overview

Many women have real skills, such as cooking, handicrafts and household work, and could earn an income from home. Online marketplaces, smartphones and electronic payment have made it possible for anyone to sell to customers without a physical shop. The **Women Empowerment Multi-Service Platform** uses this idea to connect **home-based women providers** with **customers** who want:

- **Homemade food**: meals, desserts and baked goods
- **Handmade products (crafts)**: accessories, embroidery, decorations, etc.
- **Domestic services**: cleaning and other household services, booked in time slots

This project builds the platform's **backend**: the database, the web server and the REST APIs that a web or mobile frontend uses.

---

## 1.2 Problem Statement

Many skilled women cannot join the traditional job market for family, financial or social reasons. Today they sell through Facebook groups, WhatsApp and word of mouth. These channels have serious weaknesses:

| Problem | Effect |
|---|---|
| No central place to find providers | Customers can't easily discover or compare providers |
| No verification of providers | Customers can't be sure a provider is trustworthy |
| Orders handled by hand in chat messages | Orders get lost, stock and appointments aren't tracked |
| No reliable rating system | Good providers can't build a reputation |
| No payment records | Disputes about whether an order was paid |

---

## 1.3 Objectives

1. Give women providers **one organised place** to show and sell their products and services from home.
2. Build **trust** by requiring every provider to be **verified by an admin** (ID card, criminal record, etc.) before selling.
3. Let customers **search, filter and order** food, crafts and services, and **book appointment slots**.
4. Manage the **whole order life cycle**: placing, accepting, progress, completion, cancellation, payment and review.
5. Support **direct chat** between customers and providers.
6. Protect user data with **secure authentication** (hashed passwords, JWT) and **role-based access**.
7. Keep data correct with a **well-designed relational database** (constraints, foreign keys, transactions).

---

## 1.4 Proposed Solution

A **client–server system** made of:

| Part | Technology | Job |
|---|---|---|
| Database server | MySQL / MariaDB (XAMPP), port **3306** | Stores all data in 16 related tables |
| Web server | Node.js + Express.js, port **3000** | Receives requests, applies business rules, talks to the database |
| APIs | RESTful JSON, secured with JWT | The contract between frontend and backend |
| Client | Web / mobile frontend, Postman | Sends HTTP requests and shows the results |

```
 Client (Frontend / Postman)
        │  HTTP request (JSON + JWT)
        ▼
 Node.js / Express server  :3000
        │  SQL queries (mysql2 connection pool)
        ▼
 MySQL database (XAMPP)    :3306
        │
        ▲  rows → JSON response + status code back to client
```

---

## 1.5 Scope

**In scope**

- Registration and login (customer, provider, admin)
- Customer and provider profiles, multiple delivery addresses
- Provider verification documents and admin acceptance / rejection
- Categories, including sub-categories
- Food items, craft items, domestic services and appointment slots
- Search, filtering by category / provider / price, and sorting
- Orders with several items, automatic stock reduction and slot booking
- Payment records (cash or card) confirmed by the provider
- Ratings and reviews, with automatic average rating per provider
- Customer–provider chat with unread message counts

**Out of scope (future work)**

- A real online card payment gateway
- File upload (documents are stored as URLs)
- Push notifications
- Loyalty-point rules

---

## 1.6 System Users (Actors)

| Actor | What they can do |
|---|---|
| **Guest** | Browse categories, providers and items without logging in |
| **Customer** | Manage addresses, place orders, pay, review and chat with providers |
| **Service provider** | Upload verification documents; once accepted, sell food, crafts and services, manage slots and handle orders |
| **Admin** | Verify providers and manage categories |

---

## 1.7 Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | Users register as a customer or a provider and log in (JWT). Admin accounts need a secret key. |
| FR2 | Users view and edit their profile and can delete their account. |
| FR3 | Customers manage several delivery addresses. |
| FR4 | Providers upload verification documents (ID card, criminal record, birth certificate). |
| FR5 | Admins review pending providers and accept or reject them. Only accepted providers can sell. |
| FR6 | Admins create, update and delete categories (with an optional parent category). |
| FR7 | Providers create, update and delete food items, craft items and domestic services. |
| FR8 | Providers publish appointment slots for their services. |
| FR9 | Anyone can search items by text, filter by category, provider and price range, and sort the results. |
| FR10 | Customers place an order of one or more items from one provider; stock is reduced and service slots are booked. |
| FR11 | Order status flow: pending → accepted → in progress → completed (or cancelled). Cancelling restores stock and frees slots. |
| FR12 | Customers record a payment (cash or card); the provider confirms success or failure. |
| FR13 | Customers review a completed order once (rating 1–5 + comment); the provider's average rating updates automatically. |
| FR14 | Customers start a chat with a provider; both exchange messages and see unread counts. |

---

## 1.8 Non-Functional Requirements

| Requirement | How it is met |
|---|---|
| **Security** | Passwords hashed with bcrypt and never returned; protected routes need a JWT; users can only change their own data; national IDs are not shown publicly; parameterised queries prevent SQL injection. |
| **Data integrity** | Database constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK); orders saved in a single transaction (all or nothing). |
| **Validation** | Invalid input returns `400` with a clear message; duplicates return `409`. |
| **Usability** | Simple RESTful JSON API that any web or mobile frontend can use. |
| **Maintainability** | Feature-based structure (routes / controller / model per module), shared middleware. |
| **Testability** | Automated end-to-end test (`npm test`) and a Postman collection covering every endpoint. |
| **Language support** | `utf8mb4` character set, so Arabic text and emoji are stored correctly. |

---

## 1.9 Tools and Technologies

| Tool | Use |
|---|---|
| **XAMPP** (MySQL/MariaDB, Apache, phpMyAdmin) | Local database server and database management |
| **Node.js** | JavaScript runtime for the backend |
| **Express.js 5** | Web framework: routing, middleware, JSON |
| **mysql2** | MySQL driver with a connection pool |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT login tokens |
| **Postman** | Manual and automated API testing |
| **Visual Studio Code** | Code editor |
| **Git / GitHub** | Version control |

---

## 1.10 Main Scenario (How the System Is Used)

1. A woman **registers as a provider** and uploads her ID card and criminal record.
2. The **admin reviews** the documents and **accepts** her.
3. She adds her **food items, crafts or services**, and **appointment slots** for services.
4. A **customer searches** by category and price, picks items and **places an order** to her address.
5. The provider **accepts** the order, moves it to **in progress**, then **completed**.
6. The customer **records the payment**, and the provider **confirms** it.
7. The customer **writes a review**; the provider's **average rating** updates.
8. At any time, they can **chat** about the order.

---

## 1.11 Report Organisation

- **Chapter 1 — Introduction:** the problem, objectives, scope, users, requirements and tools.
- **Chapter 2 — System Design:** database design (ERD, tables, relationships), web server design (Node.js, XAMPP, folder structure, request flow) and API design and testing (endpoints, examples, Postman).
