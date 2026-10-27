-- MySQL / MariaDB (XAMPP) schema. Tables follow the ERD (docs/requirements.md §7).
-- Runs on every server start; IF NOT EXISTS makes it safe to re-run.

CREATE TABLE IF NOT EXISTS users (
  user_id      INT AUTO_INCREMENT PRIMARY KEY,
  full_name    VARCHAR(100) NOT NULL CHECK (full_name <> ''),
  email        VARCHAR(255) NOT NULL UNIQUE CHECK (email REGEXP '^[^ @]+@[^ @]+[.][^ @]+$'),
  password     VARCHAR(255) NOT NULL, -- bcrypt hash, never returned by the API
  phone_number VARCHAR(30),
  user_type    ENUM('customer', 'provider', 'admin') NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
  customer_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL UNIQUE,
  loyalty_points INT NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_providers (
  provider_id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL UNIQUE,
  store_name          VARCHAR(150) NOT NULL CHECK (store_name <> ''),
  national_id         VARCHAR(30) UNIQUE,
  rating              DECIMAL(2, 1) NOT NULL DEFAULT 0, -- average of reviews, kept in sync by the reviews route
  verification_status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS verification_documents (
  document_id   INT AUTO_INCREMENT PRIMARY KEY,
  provider_id   INT NOT NULL,
  document_type ENUM('id_card', 'criminal_record', 'birth_certificate') NOT NULL,
  file_url      VARCHAR(500) NOT NULL,
  uploaded_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_addresses (
  address_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  street_address  VARCHAR(255) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  district        VARCHAR(100),
  building_number VARCHAR(20),
  floor           VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  category_id        INT AUTO_INCREMENT PRIMARY KEY,
  category_name      VARCHAR(100) NOT NULL UNIQUE,
  description        TEXT,
  parent_category_id INT,
  FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS food_items (
  food_item_id         INT AUTO_INCREMENT PRIMARY KEY,
  provider_id          INT NOT NULL,
  category_id          INT,
  title                VARCHAR(150) NOT NULL CHECK (title <> ''),
  description          TEXT,
  price                DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity       INT CHECK (stock_quantity >= 0), -- NULL = made to order, no stock limit
  is_available         BOOLEAN NOT NULL DEFAULT TRUE,
  preparation_time_min INT CHECK (preparation_time_min > 0),
  nutrition_facts      TEXT,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS craft_items (
  craft_item_id  INT AUTO_INCREMENT PRIMARY KEY,
  provider_id    INT NOT NULL,
  category_id    INT,
  title          VARCHAR(150) NOT NULL CHECK (title <> ''),
  description    TEXT,
  price          DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INT CHECK (stock_quantity >= 0), -- NULL = made to order, no stock limit
  customizable   BOOLEAN NOT NULL DEFAULT FALSE,
  material_used  VARCHAR(150),
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS domestic_services (
  service_id   INT AUTO_INCREMENT PRIMARY KEY,
  provider_id  INT NOT NULL,
  category_id  INT,
  title        VARCHAR(150) NOT NULL CHECK (title <> ''),
  description  TEXT,
  hourly_rate  DECIMAL(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  hours_needed DECIMAL(4, 1) NOT NULL DEFAULT 1 CHECK (hours_needed > 0),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appointment_slots (
  slot_id    INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  slot_date  DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  is_booked  BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK (end_time > start_time),
  FOREIGN KEY (service_id) REFERENCES domestic_services(service_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  order_id            INT AUTO_INCREMENT PRIMARY KEY,
  customer_id         INT NOT NULL,
  provider_id         INT NOT NULL,
  delivery_address_id INT,
  special_instruction TEXT,
  status              ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  sub_total_amount    DECIMAL(10, 2) NOT NULL,
  delivery_fee        DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(10, 2) NOT NULL,
  order_date          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE,
  FOREIGN KEY (delivery_address_id) REFERENCES user_addresses(address_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One line of an order: exactly one of food / craft / service, matching item_type.
-- The item ids become NULL if the item is later deleted; prices stay, so order history survives.
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  item_type     ENUM('food', 'craft', 'service') NOT NULL,
  food_item_id  INT,
  craft_item_id INT,
  service_id    INT,
  slot_id       INT, -- booked slot, for services
  unit_price    DECIMAL(10, 2) NOT NULL,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  sub_total     DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(food_item_id) ON DELETE SET NULL,
  FOREIGN KEY (craft_item_id) REFERENCES craft_items(craft_item_id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES domestic_services(service_id) ON DELETE SET NULL,
  FOREIGN KEY (slot_id) REFERENCES appointment_slots(slot_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL,
  user_id        INT NOT NULL,
  amount         DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  payment_method ENUM('cash', 'card') NOT NULL,
  payment_status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  review_id   INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL UNIQUE, -- one review per order
  customer_id INT NOT NULL,
  provider_id INT NOT NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chat_conversations (
  conversation_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL,
  provider_id     INT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME,
  UNIQUE (customer_id, provider_id),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id      INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id       INT NOT NULL,
  message_text    TEXT NOT NULL CHECK (message_text <> ''),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Starting categories from the project scope; admins can add more.
INSERT IGNORE INTO categories (category_name, description) VALUES
  ('Homemade Food', 'Homemade meals and desserts'),
  ('Handmade Products', 'Crafts and handmade items'),
  ('Household Services', 'Cleaning and other services at home');
