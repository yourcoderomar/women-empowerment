# Women Empowerment Multi-Service Platform — Requirements & Database Design

## 1. Introduction
A mobile platform that connects skilled women who work from home with customers looking for homemade products and household services. Providers showcase their skills, offer products or services, and earn income from home.

## 2. Problem Statement
Skilled women often can't enter the traditional job market for family, financial or personal reasons. They rely on Facebook groups, WhatsApp and word of mouth, which lack organization, discovery, order management and trust. This platform puts all of that in one place.

## 3. Scope
Three kinds of offerings:
- **Food** — homemade food and desserts
- **Craft items** — handmade products
- **Domestic services** — cleaning and household services, booked into appointment slots

In scope: registration and login, customer and provider profiles, provider verification, addresses, categories, search and filtering, orders, payments (recorded), ratings and reviews, customer–provider chat.
Out of scope for now: a real card payment gateway, file upload (documents are stored as URLs), push notifications, loyalty point rules.

## 4. Users (Actors)
| Actor | Description |
|---|---|
| Guest | Browses categories, providers and items |
| Customer | Orders items and services, pays, reviews, chats with providers |
| Service provider | Uploads verification documents; once accepted, sells food, crafts and services and handles orders |
| Admin | Verifies providers and manages categories |

## 5. Functional Requirements
| ID | Requirement |
|---|---|
| FR1 | Users register as a customer or a provider and log in (JWT). Admin accounts need a secret key. |
| FR2 | Users view and edit their profile and can delete their account. |
| FR3 | Customers manage several delivery addresses. |
| FR4 | Providers upload verification documents (ID card, criminal record, birth certificate). |
| FR5 | Admins list pending providers, review their documents and accept or reject them. Only accepted providers can sell. |
| FR6 | Admins create, update and delete categories (with optional parent category). |
| FR7 | Providers create, update and delete food items, craft items and domestic services. |
| FR8 | Providers publish appointment slots for their services. |
| FR9 | Anyone searches items by text and filters by category, provider and price range, with sorting. |
| FR10 | Customers place an order of one or more items from one provider; stock is reduced and service slots are booked. |
| FR11 | Order status flow: provider accepts (or cancels) → in progress → completed. Customers can cancel while pending; cancelling restores stock and frees slots. |
| FR12 | Customers record a payment (cash or card) for an order; the provider confirms success or failure. |
| FR13 | Customers review a completed order once (rating 1–5 + comment); the provider's average rating updates automatically. |
| FR14 | Customers start a chat with a provider; both exchange messages and see unread counts. |

## 6. Non-Functional Requirements
- **Security:** passwords hashed with bcrypt and never returned; protected routes need a JWT; users can only change their own data; national IDs are not shown publicly.
- **Data integrity:** enforced by database constraints (CHECK, NOT NULL, UNIQUE, FOREIGN KEY); orders are saved in a single transaction (all or nothing).
- **Validation:** invalid input returns `400` with a clear message; duplicates return `409`.
- **Usability:** REST JSON API that a mobile app can consume.
- **Maintainability:** models / routes / middleware structure, automated end-to-end test, Postman collection.

## 7. Database Design (PostgreSQL)
The full SQL is in [`src/schema.sql`](../src/schema.sql). Tables are created automatically when the server starts.

```
users 1 ── 0..1 customers
users 1 ── 0..1 service_providers
users 1 ── * user_addresses
service_providers 1 ── * verification_documents
service_providers 1 ── * food_items / craft_items / domestic_services
categories 1 ── * food_items / craft_items / domestic_services   (categories can have a parent category)
domestic_services 1 ── * appointment_slots
customers 1 ── * orders * ── 1 service_providers
orders 1 ── * order_items   (each line is one food item, craft item or service [+ slot])
orders 1 ── * payment_transactions
orders 1 ── 0..1 reviews
customers 1 ── * chat_conversations * ── 1 service_providers
chat_conversations 1 ── * chat_messages
```

### users
| Column | Type | Constraints |
|---|---|---|
| user_id | SERIAL | PK |
| full_name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE, valid format |
| password | TEXT | bcrypt hash |
| phone_number | TEXT | |
| user_type | TEXT | customer \| provider \| admin |
| created_at | TIMESTAMPTZ | default now() |

### customers
| Column | Type | Constraints |
|---|---|---|
| customer_id | SERIAL | PK |
| user_id | INT | FK → users, UNIQUE |
| loyalty_points | INT | default 0, ≥ 0 |

### service_providers
| Column | Type | Constraints |
|---|---|---|
| provider_id | SERIAL | PK |
| user_id | INT | FK → users, UNIQUE |
| store_name | TEXT | NOT NULL |
| national_id | TEXT | UNIQUE |
| rating | NUMERIC(2,1) | average of reviews, auto-updated |
| verification_status | TEXT | pending \| accepted \| rejected |

### verification_documents
| Column | Type | Constraints |
|---|---|---|
| document_id | SERIAL | PK |
| provider_id | INT | FK → service_providers |
| document_type | TEXT | id_card \| criminal_record \| birth_certificate |
| file_url | TEXT | NOT NULL |
| uploaded_at | TIMESTAMPTZ | default now() |

### user_addresses
| Column | Type | Constraints |
|---|---|---|
| address_id | SERIAL | PK |
| user_id | INT | FK → users |
| street_address, city | TEXT | NOT NULL |
| district, building_number, floor | TEXT | |

### categories
| Column | Type | Constraints |
|---|---|---|
| category_id | SERIAL | PK |
| category_name | TEXT | NOT NULL, UNIQUE |
| description | TEXT | |
| parent_category_id | INT | FK → categories (self) |

### food_items
| Column | Type | Constraints |
|---|---|---|
| food_item_id | SERIAL | PK |
| provider_id | INT | FK → service_providers |
| category_id | INT | FK → categories |
| title | TEXT | NOT NULL |
| description | TEXT | |
| price | NUMERIC(10,2) | ≥ 0 |
| stock_quantity | INT | ≥ 0, NULL = made to order |
| is_available | BOOLEAN | default true |
| preparation_time_min | INT | > 0 |
| nutrition_facts | TEXT | |

### craft_items
| Column | Type | Constraints |
|---|---|---|
| craft_item_id | SERIAL | PK |
| provider_id | INT | FK → service_providers |
| category_id | INT | FK → categories |
| title | TEXT | NOT NULL |
| description | TEXT | |
| price | NUMERIC(10,2) | ≥ 0 |
| stock_quantity | INT | ≥ 0, NULL = made to order |
| customizable | BOOLEAN | default false |
| material_used | TEXT | |

### domestic_services
| Column | Type | Constraints |
|---|---|---|
| service_id | SERIAL | PK |
| provider_id | INT | FK → service_providers |
| category_id | INT | FK → categories |
| title | TEXT | NOT NULL |
| description | TEXT | |
| hourly_rate | NUMERIC(10,2) | ≥ 0 |
| hours_needed | NUMERIC(4,1) | > 0, default 1 |

### appointment_slots
| Column | Type | Constraints |
|---|---|---|
| slot_id | SERIAL | PK |
| service_id | INT | FK → domestic_services |
| slot_date | DATE | NOT NULL |
| start_time, end_time | TIME | end_time > start_time |
| is_booked | BOOLEAN | set by orders |

### orders
| Column | Type | Constraints |
|---|---|---|
| order_id | SERIAL | PK |
| customer_id | INT | FK → customers |
| provider_id | INT | FK → service_providers |
| delivery_address_id | INT | FK → user_addresses |
| special_instruction | TEXT | |
| status | TEXT | pending \| accepted \| in_progress \| completed \| cancelled |
| sub_total_amount | NUMERIC(10,2) | sum of lines |
| delivery_fee | NUMERIC(10,2) | 20 if the order has food/craft items |
| total_amount | NUMERIC(10,2) | subtotal + delivery fee |
| order_date | TIMESTAMPTZ | default now() |

### order_items
| Column | Type | Constraints |
|---|---|---|
| order_item_id | SERIAL | PK |
| order_id | INT | FK → orders |
| item_type | TEXT | food \| craft \| service |
| food_item_id / craft_item_id / service_id | INT | FK, the one matching item_type |
| slot_id | INT | FK → appointment_slots (services) |
| unit_price | NUMERIC(10,2) | price at order time (service: hourly_rate × hours_needed) |
| quantity | INT | ≥ 1 |
| sub_total | NUMERIC(10,2) | unit_price × quantity |

### payment_transactions
| Column | Type | Constraints |
|---|---|---|
| transaction_id | SERIAL | PK |
| order_id | INT | FK → orders |
| user_id | INT | FK → users (payer) |
| amount | NUMERIC(10,2) | order total |
| payment_method | TEXT | cash \| card |
| payment_status | TEXT | pending \| success \| failed |
| created_at | TIMESTAMPTZ | default now() |

### reviews
| Column | Type | Constraints |
|---|---|---|
| review_id | SERIAL | PK |
| order_id | INT | FK → orders, UNIQUE (one review per order) |
| customer_id | INT | FK → customers |
| provider_id | INT | FK → service_providers |
| rating | INT | 1–5 |
| comment | TEXT | |
| created_at | TIMESTAMPTZ | default now() |

### chat_conversations
| Column | Type | Constraints |
|---|---|---|
| conversation_id | SERIAL | PK |
| customer_id | INT | FK → customers |
| provider_id | INT | FK → service_providers |
| created_at | TIMESTAMPTZ | default now() |
| last_message_at | TIMESTAMPTZ | updated on each message |
| | | UNIQUE (customer_id, provider_id) |

### chat_messages
| Column | Type | Constraints |
|---|---|---|
| message_id | SERIAL | PK |
| conversation_id | INT | FK → chat_conversations |
| sender_id | INT | FK → users |
| message_text | TEXT | NOT NULL |
| is_read | BOOLEAN | default false |
| sent_at | TIMESTAMPTZ | default now() |

**Small additions to the ERD:** `users.password` and `created_at` (needed for login); `verification_documents.file_url` (where the document is); `order_items.slot_id` (which slot a service order books). `OrderItem.UserID` from the ERD is left out because the order already links the customer.

## 8. API Endpoints
Base URL: `/api`. 🔒 = needs `Authorization: Bearer <token>`. Role in brackets.

| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Register (`user_type`: customer / provider / admin) |
| POST | /auth/login | Login → token |
| GET 🔒 | /auth/me | My profile |
| GET 🔒 | /users?user_type=&verification_status= | List users [admin] |
| PATCH 🔒 | /users/me | Update my profile |
| DELETE 🔒 | /users/me | Delete my account |
| GET / POST / PATCH / DELETE 🔒 | /addresses, /addresses/:id | My addresses |
| GET | /categories, /categories/:id | Categories |
| POST / PATCH / DELETE 🔒 | /categories, /categories/:id | Manage categories [admin] |
| GET | /providers?q= | Verified providers |
| GET | /providers/:id | Provider profile + everything they sell |
| PATCH 🔒 | /providers/me | Update my store [provider] |
| PATCH 🔒 | /providers/:id/verification | Accept / reject [admin] |
| GET 🔒 | /documents?provider_id= | Documents [provider: own, admin: all] |
| POST / DELETE 🔒 | /documents, /documents/:id | Upload / delete document [provider] |
| GET | /foods, /crafts, /services `?q=&category_id=&provider_id=&min_price=&max_price=&sort=` | Search (`sort`: price, -price, -rating) |
| GET | /foods/:id, /crafts/:id, /services/:id | Item details |
| POST / PATCH / DELETE 🔒 | /foods, /crafts, /services (/:id) | Manage own items [verified provider] |
| GET | /slots?service_id=&is_booked= | Slots of a service |
| POST / PATCH / DELETE 🔒 | /slots, /slots/:id | Manage slots of own services [provider] |
| POST 🔒 | /orders | Place order [customer] |
| GET 🔒 | /orders?status= | My orders |
| GET 🔒 | /orders/:id | Order with its items |
| PATCH 🔒 | /orders/:id/status | Change status |
| GET 🔒 | /payments?order_id= | Payments of an order |
| POST 🔒 | /payments | Pay for an order [customer] |
| PATCH 🔒 | /payments/:id/status | Confirm success / failed [provider] |
| GET | /reviews?provider_id= | Reviews of a provider |
| POST / PATCH / DELETE 🔒 | /reviews, /reviews/:id | My reviews [customer] |
| GET / POST 🔒 | /conversations | My chats / start a chat [customer] |
| GET / POST 🔒 | /conversations/:id/messages | Read / send messages |
