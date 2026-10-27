// End-to-end test of the main flow. Needs MySQL running (XAMPP): it creates a throwaway database
// `women_platform_test`, runs everything against it, then drops it. Your real data is never touched.
// Run: npm test   (other server/user: set TEST_DATABASE_URL, e.g. mysql://root:secret@localhost:3306/women_platform_test)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');

const TEST_URL = process.env.TEST_DATABASE_URL || 'mysql://root:@localhost:3306/women_platform_test';
const dbName = new URL(TEST_URL).pathname.slice(1);
const serverUrl = TEST_URL.replace(/\/[^/]*$/, '/'); // same server, no database selected

let server, base, pool;

const admin = async (sql) => {
  const conn = await mysql.createConnection(serverUrl);
  await conn.query(sql);
  await conn.end();
};

before(async () => {
  await admin(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await admin(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4`);
  process.env.DATABASE_URL = TEST_URL;
  process.env.JWT_SECRET = 'test-secret';
  process.env.ADMIN_SECRET = 'admin-secret';

  const db = require('../src/db/connection');
  pool = db.pool;
  await db.init();
  server = require('../src/app').listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await pool?.end();
  await admin(`DROP DATABASE IF EXISTS \`${dbName}\``);
});

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
}

const ok = async (expected, promise) => {
  const res = await promise;
  assert.equal(res.status, expected, JSON.stringify(res.body));
  return res.body;
};

test('full flow: register → verify → sell → order → pay → review → chat', async () => {
  // Accounts
  const admin = await ok(201, call('POST', '/auth/register', { full_name: 'Admin', email: 'admin@x.com', password: 'secret1', user_type: 'admin', admin_secret: 'admin-secret' }));
  await ok(403, call('POST', '/auth/register', { full_name: 'Fake', email: 'fake@x.com', password: 'secret1', user_type: 'admin', admin_secret: 'nope' }));
  const prov = await ok(201, call('POST', '/auth/register', { full_name: 'Mona', email: 'Mona@x.com', password: 'secret1', user_type: 'provider', store_name: "Mona's Kitchen" }));
  const cust = await ok(201, call('POST', '/auth/register', { full_name: 'Sara', email: 'sara@x.com', password: 'secret1' }));
  assert.equal(prov.user.password, undefined);
  assert.equal(prov.user.verification_status, 'pending');
  assert.equal(cust.user.loyalty_points, 0);
  const A = admin.token, P = prov.token, C = cust.token;
  await ok(409, call('POST', '/auth/register', { full_name: 'Dup', email: 'mona@x.com', password: 'secret1' }));
  await ok(400, call('POST', '/auth/register', { full_name: 'Bad', email: 'nope', password: 'secret1' }));
  await ok(401, call('POST', '/auth/login', { email: 'mona@x.com', password: 'wrong' }));
  await ok(200, call('POST', '/auth/login', { email: 'mona@x.com', password: 'secret1' }));

  // Categories (seeded + admin CRUD)
  const cats = await ok(200, call('GET', '/categories'));
  const foodCat = cats.find((c) => c.category_name === 'Homemade Food').category_id;
  await ok(403, call('POST', '/categories', { category_name: 'Cakes' }, C));
  const cakes = await ok(201, call('POST', '/categories', { category_name: 'Cakes', parent_category_id: foodCat }, A));

  // Verification: provider can't sell until an admin accepts
  await ok(403, call('POST', '/foods', { title: 'X', price: 1 }, P));
  await ok(201, call('POST', '/documents', { document_type: 'id_card', file_url: 'https://example.com/id.jpg' }, P));
  await ok(400, call('POST', '/documents', { document_type: 'passport', file_url: 'x' }, P));
  assert.equal((await ok(200, call('GET', `/documents?provider_id=${prov.user.provider_id}`, null, A))).length, 1);
  assert.equal((await ok(200, call('GET', '/users?verification_status=pending', null, A))).length, 1);
  await ok(403, call('PATCH', `/providers/${prov.user.provider_id}/verification`, { verification_status: 'accepted' }, P));
  await ok(200, call('PATCH', `/providers/${prov.user.provider_id}/verification`, { verification_status: 'accepted' }, A));

  // Items
  const cake = await ok(201, call('POST', '/foods', { title: 'Chocolate cake', category_id: cakes.category_id, price: 150.5, stock_quantity: 3, provider_id: 999 }, P));
  assert.equal(cake.provider_id, prov.user.provider_id); // body can't pick another owner
  const bag = await ok(201, call('POST', '/crafts', { title: 'Knitted bag', price: 200, customizable: true }, P));
  const clean = await ok(201, call('POST', '/services', { title: 'Home cleaning', hourly_rate: 100, hours_needed: 3 }, P));
  await ok(403, call('POST', '/foods', { title: 'X', price: 1 }, C));
  await ok(400, call('POST', '/foods', { title: 'X', price: -1 }, P));
  assert.equal((await ok(200, call('GET', '/foods?q=chocolate&max_price=200'))).length, 1);
  assert.equal((await ok(200, call('GET', '/crafts?min_price=500'))).length, 0);
  assert.equal((await ok(200, call('PATCH', `/crafts/${bag.craft_item_id}`, { price: 210 }, P))).price, 210);
  await ok(403, call('PATCH', `/crafts/${bag.craft_item_id}`, { price: 1 }, C)); // customers can't edit items
  const profile = await ok(200, call('GET', `/providers/${prov.user.provider_id}`));
  assert.equal(profile.foods.length + profile.crafts.length + profile.services.length, 3);
  assert.equal(profile.national_id, undefined);

  // Slots
  const slot = await ok(201, call('POST', '/slots', { service_id: clean.service_id, slot_date: '2026-12-01', start_time: '10:00', end_time: '13:00' }, P));
  await ok(400, call('POST', '/slots', { service_id: clean.service_id, slot_date: '2026-12-01', start_time: '13:00', end_time: '10:00' }, P));
  assert.equal(slot.slot_date, '2026-12-01');

  // Addresses
  const addr = await ok(201, call('POST', '/addresses', { street_address: '12 Nile St', city: 'Cairo', district: 'Maadi' }, C));
  await ok(404, call('PATCH', `/addresses/${addr.address_id}`, { city: 'Giza' }, P)); // not hers
  await ok(200, call('PATCH', `/addresses/${addr.address_id}`, { floor: '3' }, C));

  // Orders
  await ok(400, call('POST', '/orders', { items: [{ item_type: 'food', item_id: cake.food_item_id, quantity: 9 }] }, C)); // only 3 in stock
  const order = await ok(201, call('POST', '/orders', {
    delivery_address_id: addr.address_id,
    special_instruction: 'Ring twice',
    items: [
      { item_type: 'food', item_id: cake.food_item_id, quantity: 2 },
      { item_type: 'service', item_id: clean.service_id, slot_id: slot.slot_id },
    ],
  }, C));
  assert.equal(order.sub_total_amount, 601); // 2 × 150.5 + 3h × 100
  assert.equal(order.delivery_fee, 20);
  assert.equal(order.total_amount, 621);
  assert.equal(order.items.length, 2);
  assert.equal((await ok(200, call('GET', `/foods/${cake.food_item_id}`))).stock_quantity, 1);
  await ok(400, call('POST', '/orders', { items: [{ item_type: 'service', item_id: clean.service_id, slot_id: slot.slot_id }] }, C)); // slot taken

  // Cancelling gives back stock and frees the slot
  const order2 = await ok(201, call('POST', '/orders', { items: [{ item_type: 'food', item_id: cake.food_item_id }] }, C));
  await ok(200, call('PATCH', `/orders/${order2.order_id}/status`, { status: 'cancelled' }, C));
  assert.equal((await ok(200, call('GET', `/foods/${cake.food_item_id}`))).stock_quantity, 1);

  await ok(403, call('POST', '/reviews', { order_id: order.order_id, rating: 5 }, C)); // not completed yet
  await ok(400, call('PATCH', `/orders/${order.order_id}/status`, { status: 'completed' }, P)); // must go step by step
  await ok(400, call('PATCH', `/orders/${order.order_id}/status`, { status: 'accepted' }, C)); // customer can't accept
  for (const status of ['accepted', 'in_progress', 'completed']) {
    await ok(200, call('PATCH', `/orders/${order.order_id}/status`, { status }, P));
  }
  const full = await ok(200, call('GET', `/orders/${order.order_id}`, null, P));
  assert.equal(full.items[0].title, 'Chocolate cake');
  assert.equal(full.items[1].start_time, '10:00:00');
  assert.equal(full.city, 'Cairo');
  assert.equal((await ok(200, call('GET', '/orders?status=completed', null, C))).length, 1);

  // Payments
  const pay = await ok(201, call('POST', '/payments', { order_id: order.order_id, payment_method: 'cash' }, C));
  assert.equal(pay.amount, 621);
  await ok(403, call('PATCH', `/payments/${pay.transaction_id}/status`, { payment_status: 'success' }, C));
  await ok(200, call('PATCH', `/payments/${pay.transaction_id}/status`, { payment_status: 'success' }, P));
  await ok(400, call('PATCH', `/payments/${pay.transaction_id}/status`, { payment_status: 'failed' }, P)); // already done

  // Reviews
  const review = await ok(201, call('POST', '/reviews', { order_id: order.order_id, rating: 4, comment: 'Tasty' }, C));
  await ok(409, call('POST', '/reviews', { order_id: order.order_id, rating: 5 }, C)); // one per order
  assert.equal((await ok(200, call('GET', `/providers/${prov.user.provider_id}`))).rating, 4);
  await ok(200, call('PATCH', `/reviews/${review.review_id}`, { rating: 5 }, C));
  assert.equal((await ok(200, call('GET', `/providers/${prov.user.provider_id}`))).rating, 5);
  assert.equal((await ok(200, call('GET', `/reviews?provider_id=${prov.user.provider_id}`))).length, 1);

  // Chat
  const conv = await ok(201, call('POST', '/conversations', { provider_id: prov.user.provider_id }, C));
  assert.equal((await ok(201, call('POST', '/conversations', { provider_id: prov.user.provider_id }, C))).conversation_id, conv.conversation_id);
  await ok(201, call('POST', `/conversations/${conv.conversation_id}/messages`, { message_text: 'Is the cake eggless?' }, C));
  assert.equal((await ok(200, call('GET', '/conversations', null, P)))[0].unread_count, 1);
  const msgs = await ok(200, call('GET', `/conversations/${conv.conversation_id}/messages`, null, P));
  assert.equal(msgs[0].is_read, true);
  await ok(201, call('POST', `/conversations/${conv.conversation_id}/messages`, { message_text: 'Yes!' }, P));
  await ok(403, call('GET', `/conversations/${conv.conversation_id}/messages`, null, A)); // admins can't read chats

  // Misc
  await ok(401, call('GET', '/orders'));
  await ok(404, call('GET', '/foods/not-an-id')); // MySQL finds no row for a non-number id
  await ok(204, call('DELETE', `/foods/${cake.food_item_id}`, null, P));
  assert.equal((await ok(200, call('GET', `/orders/${order.order_id}`, null, C))).items.length, 2); // history survives
  await ok(204, call('DELETE', '/users/me', null, P));
  assert.equal((await ok(200, call('GET', '/orders', null, C))).length, 0); // provider's orders went with them
});
