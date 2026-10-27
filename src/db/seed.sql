-- Demo data. WARNING: wipes every table first, then fills them. Run with: npm run seed
-- Every account's password is: password123

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE chat_messages; TRUNCATE TABLE chat_conversations; TRUNCATE TABLE reviews;
TRUNCATE TABLE payment_transactions; TRUNCATE TABLE order_items; TRUNCATE TABLE orders;
TRUNCATE TABLE appointment_slots; TRUNCATE TABLE domestic_services; TRUNCATE TABLE craft_items;
TRUNCATE TABLE food_items; TRUNCATE TABLE categories; TRUNCATE TABLE user_addresses;
TRUNCATE TABLE verification_documents; TRUNCATE TABLE service_providers; TRUNCATE TABLE customers;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users: 1 admin, 4 providers (users 2-4 accepted, 9 pending), 4 customers (users 5-8)
INSERT INTO users (full_name, email, password, phone_number, user_type) VALUES
  ('Site Admin',    'admin@example.com', '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01000000000', 'admin'),
  ('Mona Ali',      'mona@example.com',  '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01011111111', 'provider'),
  ('Hoda Mahmoud',  'hoda@example.com',  '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01022222222', 'provider'),
  ('Salma Youssef', 'salma@example.com', '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01033333333', 'provider'),
  ('Sara Hassan',   'sara@example.com',  '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01144444444', 'customer'),
  ('Omar Khaled',   'omar@example.com',  '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01155555555', 'customer'),
  ('Laila Adel',    'laila@example.com', '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01166666666', 'customer'),
  ('Karim Fathy',   'karim@example.com', '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01177777777', 'customer'),
  ('Nour Samir',    'nour@example.com',  '$2b$10$SwooKBNYTmLCe84//FsAvOtENzZT.Jwv53B8XAnqagMhhXl5uMda.', '01288888888', 'provider');

INSERT INTO customers (user_id, loyalty_points) VALUES (5, 44), (6, 22), (7, 40), (8, 0);

INSERT INTO service_providers (user_id, store_name, national_id, rating, verification_status) VALUES
  (2, 'Mona''s Kitchen',       '29001011234567', 5.0, 'accepted'),
  (3, 'Hoda Handmade',         '29102021234567', 0,   'accepted'),
  (4, 'Salma Home Services',   '28803031234567', 4.0, 'accepted'),
  (9, 'Nour Sweets',           '29504041234567', 0,   'pending');

INSERT INTO verification_documents (provider_id, document_type, file_url) VALUES
  (1, 'id_card',         'https://example.com/docs/mona-id.jpg'),
  (1, 'criminal_record', 'https://example.com/docs/mona-record.pdf'),
  (2, 'id_card',         'https://example.com/docs/hoda-id.jpg'),
  (3, 'id_card',         'https://example.com/docs/salma-id.jpg'),
  (3, 'criminal_record', 'https://example.com/docs/salma-record.pdf'),
  (4, 'id_card',         'https://example.com/docs/nour-id.jpg');

INSERT INTO user_addresses (user_id, street_address, city, district, building_number, floor) VALUES
  (5, '12 Nile Street',        'Cairo',      'Maadi',      '12', '3'),
  (6, '45 Tahrir Street',      'Giza',       'Dokki',      '45', '7'),
  (7, '8 El Horreya Road',     'Alexandria', 'Sporting',   '8',  '2'),
  (8, '21 Abbas El Akkad St',  'Cairo',      'Nasr City',  '21', '5');

INSERT INTO categories (category_name, description, parent_category_id) VALUES
  ('Homemade Food',      'Homemade meals and desserts',          NULL),
  ('Handmade Products',  'Crafts and handmade items',            NULL),
  ('Household Services', 'Cleaning and other services at home',  NULL),
  ('Cakes & Desserts',   'Cakes, sweets and oriental desserts',  1),
  ('Main Dishes',        'Traditional home-cooked meals',        1),
  ('Knitting & Crochet', 'Bags, blankets and clothes',           2),
  ('Accessories',        'Jewelry and small gifts',              2),
  ('Cleaning',           'Apartment and kitchen cleaning',       3);

-- stock_quantity NULL = made to order
INSERT INTO food_items (provider_id, category_id, title, description, price, stock_quantity, is_available, preparation_time_min, nutrition_facts) VALUES
  (1, 4, 'Chocolate cake',      'Rich homemade chocolate cake, 1kg',     150, 3,    true,  180, '350 kcal per slice'),
  (1, 5, 'Molokhia with rice',  'Family meal for 4 with chicken',          90, NULL, true,  90,  '600 kcal per portion'),
  (1, 4, 'Basbousa tray',       'Semolina cake with syrup, 20 pieces',    120, 9,    true,  120, '250 kcal per piece'),
  (1, 5, 'Stuffed vine leaves', 'Mahshi warak enab, 1kg',                 140, NULL, false, 150, NULL);

INSERT INTO craft_items (provider_id, category_id, title, description, price, stock_quantity, customizable, material_used) VALUES
  (2, 6, 'Knitted tote bag',  'Hand-knitted shoulder bag',            200, 2,    true,  'Cotton yarn'),
  (2, 6, 'Crochet blanket',   'Baby blanket, 80×100 cm',              450, 1,    true,  'Soft acrylic yarn'),
  (2, 7, 'Beaded bracelet',   'Made to order in your colors',          60, NULL, true,  'Glass beads');

INSERT INTO domestic_services (provider_id, category_id, title, description, hourly_rate, hours_needed) VALUES
  (3, 8, 'Full apartment cleaning', 'Up to 3 rooms, including bathrooms', 100, 4),
  (3, 8, 'Kitchen deep clean',      'Cabinets, oven and fridge',          120, 2);

INSERT INTO appointment_slots (service_id, slot_date, start_time, end_time, is_booked) VALUES
  (1, '2026-11-01', '09:00', '13:00', true),
  (1, '2026-11-02', '09:00', '13:00', false),
  (1, '2026-11-04', '14:00', '18:00', false),
  (2, '2026-11-01', '14:00', '16:00', false),
  (2, '2026-11-03', '10:00', '12:00', false);

-- Orders in every status. Totals = sum of lines + 20 delivery for food/craft orders.
INSERT INTO orders (customer_id, provider_id, delivery_address_id, special_instruction, status, sub_total_amount, delivery_fee, total_amount, order_date) VALUES
  (1, 1, 1, 'Please write "Happy Birthday" on the cake', 'completed',   420, 20, 440, '2026-10-10 12:00:00'),
  (2, 2, 2, NULL,                                          'in_progress', 200, 20, 220, '2026-10-18 15:30:00'),
  (3, 3, 3, 'There is a cat at home',                      'completed',   400, 0,  400, '2026-10-15 09:00:00'),
  (1, 2, 1, 'Blue and white beads please',                 'pending',     180, 20, 200, '2026-10-22 18:45:00'),
  (4, 1, 4, NULL,                                          'cancelled',    90, 20, 110, '2026-10-20 13:10:00'),
  (2, 1, 2, 'Less sugar if possible',                      'accepted',    120, 20, 140, '2026-10-22 10:00:00');

INSERT INTO order_items (order_id, item_type, food_item_id, craft_item_id, service_id, slot_id, unit_price, quantity, sub_total) VALUES
  (1, 'food',    1,    NULL, NULL, NULL, 150, 2, 300),
  (1, 'food',    3,    NULL, NULL, NULL, 120, 1, 120),
  (2, 'craft',   NULL, 1,    NULL, NULL, 200, 1, 200),
  (3, 'service', NULL, NULL, 1,    1,    400, 1, 400),
  (4, 'craft',   NULL, 3,    NULL, NULL,  60, 3, 180),
  (5, 'food',    2,    NULL, NULL, NULL,  90, 1,  90),
  (6, 'food',    3,    NULL, NULL, NULL, 120, 1, 120);

INSERT INTO payment_transactions (order_id, user_id, amount, payment_method, payment_status) VALUES
  (1, 5, 440, 'cash', 'success'),
  (2, 6, 220, 'card', 'success'),
  (3, 7, 400, 'cash', 'success'),
  (4, 5, 200, 'card', 'pending'),
  (6, 6, 140, 'card', 'failed');

-- Matches service_providers.rating above (Mona 5.0, Salma 4.0).
INSERT INTO reviews (order_id, customer_id, provider_id, rating, comment) VALUES
  (1, 1, 1, 5, 'Best chocolate cake I have ever had!'),
  (3, 3, 3, 4, 'Very clean and on time, slightly late start.');

INSERT INTO chat_conversations (customer_id, provider_id, last_message_at) VALUES
  (1, 1, '2026-10-09 20:05:00'),
  (2, 2, '2026-10-19 11:20:00'),
  (3, 3, '2026-10-14 18:00:00');

INSERT INTO chat_messages (conversation_id, sender_id, message_text, is_read, sent_at) VALUES
  (1, 5, 'Hi! Can you make the cake eggless?',                 true,  '2026-10-09 20:00:00'),
  (1, 2, 'Yes of course, same price.',                          true,  '2026-10-09 20:05:00'),
  (2, 6, 'Is the tote bag available in green?',                 true,  '2026-10-19 11:00:00'),
  (2, 3, 'Yes, I will knit it in green for you.',               false, '2026-10-19 11:20:00'),
  (3, 7, 'Do I need to provide cleaning products?',             true,  '2026-10-14 17:50:00'),
  (3, 4, 'No, I bring everything with me.',                     true,  '2026-10-14 18:00:00');
