-- Tables follow the ERD (docs/requirements.md §7). Runs on every server start; IF NOT EXISTS makes it safe to re-run.

CREATE TABLE IF NOT EXISTS users (
  user_id      SERIAL PRIMARY KEY,
  full_name    TEXT NOT NULL CHECK (full_name <> ''),
  email        TEXT NOT NULL UNIQUE CHECK (email ~ '^\S+@\S+\.\S+$'),
  password     TEXT NOT NULL, -- bcrypt hash, never returned by the API
  phone_number TEXT,
  user_type    TEXT NOT NULL CHECK (user_type IN ('customer', 'provider', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id    SERIAL PRIMARY KEY,
  user_id        INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  loyalty_points INT NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0)
);

CREATE TABLE IF NOT EXISTS service_providers (
  provider_id         SERIAL PRIMARY KEY,
  user_id             INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  store_name          TEXT NOT NULL CHECK (store_name <> ''),
  national_id         TEXT UNIQUE,
  rating              NUMERIC(2, 1) NOT NULL DEFAULT 0, -- average of reviews, kept in sync by the reviews route
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'accepted', 'rejected'))
);

CREATE TABLE IF NOT EXISTS verification_documents (
  document_id   SERIAL PRIMARY KEY,
  provider_id   INT NOT NULL REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'criminal_record', 'birth_certificate')),
  file_url      TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_addresses (
  address_id      SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  street_address  TEXT NOT NULL,
  city            TEXT NOT NULL,
  district        TEXT,
  building_number TEXT,
  floor           TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  category_id        SERIAL PRIMARY KEY,
  category_name      TEXT NOT NULL UNIQUE,
  description        TEXT,
  parent_category_id INT REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS food_items (
  food_item_id         SERIAL PRIMARY KEY,
  provider_id          INT NOT NULL REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  category_id          INT REFERENCES categories(category_id) ON DELETE SET NULL,
  title                TEXT NOT NULL CHECK (title <> ''),
  description          TEXT,
  price                NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity       INT CHECK (stock_quantity >= 0), -- NULL = made to order, no stock limit
  is_available         BOOLEAN NOT NULL DEFAULT true,
  preparation_time_min INT CHECK (preparation_time_min > 0),
  nutrition_facts      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS craft_items (
  craft_item_id  SERIAL PRIMARY KEY,
  provider_id    INT NOT NULL REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  category_id    INT REFERENCES categories(category_id) ON DELETE SET NULL,
  title          TEXT NOT NULL CHECK (title <> ''),
  description    TEXT,
  price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INT CHECK (stock_quantity >= 0), -- NULL = made to order, no stock limit
  customizable   BOOLEAN NOT NULL DEFAULT false,
  material_used  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domestic_services (
  service_id   SERIAL PRIMARY KEY,
  provider_id  INT NOT NULL REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  category_id  INT REFERENCES categories(category_id) ON DELETE SET NULL,
  title        TEXT NOT NULL CHECK (title <> ''),
  description  TEXT,
  hourly_rate  NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  hours_needed NUMERIC(4, 1) NOT NULL DEFAULT 1 CHECK (hours_needed > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointment_slots (
  slot_id    SERIAL PRIMARY KEY,
  service_id INT NOT NULL REFERENCES domestic_services(service_id) ON DELETE CASCADE,
  slot_date  DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL CHECK (end_time > start_time),
  is_booked  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS orders (
  order_id            SERIAL PRIMARY KEY,
  customer_id         INT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  provider_id         INT NOT NULL REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  delivery_address_id INT REFERENCES user_addresses(address_id) ON DELETE SET NULL,
  special_instruction TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  sub_total_amount    NUMERIC(10, 2) NOT NULL,
  delivery_fee        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(10, 2) NOT NULL,
  order_date          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One line of an order: exactly one of food / craft / service, matching item_type.
-- The item ids become NULL if the item is later deleted; prices stay, so order history survives.
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id      INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  item_type     TEXT NOT NULL CHECK (item_type IN ('food', 'craft', 'service')),
  food_item_id  INT REFERENCES food_items(food_item_id) ON DELETE SET NULL,
  craft_item_id INT REFERENCES craft_items(craft_item_id) ON DELETE SET NULL,
  service_id    INT REFERENCES domestic_services(service_id) ON DELETE SET NULL,
  slot_id       INT REFERENCES appointment_slots(slot_id) ON DELETE SET NULL, -- booked slot, for services
  unit_price    NUMERIC(10, 2) NOT NULL,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  sub_total     NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  transaction_id SERIAL PRIMARY KEY,
  order_id       INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  user_id        INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount         NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id   SERIAL PRIMARY KEY,
  order_id    INT NOT NULL UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE, -- one review per order
  customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  provider_id INT NOT NULL REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  conversation_id SERIAL PRIMARY KEY,
  customer_id     INT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  provider_id     INT NOT NULL REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  UNIQUE (customer_id, provider_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id      SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
  sender_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message_text    TEXT NOT NULL CHECK (message_text <> ''),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Starting categories from the project scope; admins can add more.
INSERT INTO categories (category_name, description) VALUES
  ('Homemade Food', 'Homemade meals and desserts'),
  ('Handmade Products', 'Crafts and handmade items'),
  ('Household Services', 'Cleaning and other services at home')
ON CONFLICT (category_name) DO NOTHING;
