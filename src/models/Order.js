const { many, one, transaction, httpError } = require('../db');
const OrderItem = require('./OrderItem');

const DELIVERY_FEE = 20; // ponytail: flat fee for orders with food/craft items; make it per provider or by distance if needed

// How each item_type maps to its table and price.
const ITEM_TYPES = {
  food: { table: 'food_items', id: 'food_item_id', price: (row) => row.price },
  craft: { table: 'craft_items', id: 'craft_item_id', price: (row) => row.price },
  service: { table: 'domestic_services', id: 'service_id', price: (row) => row.hourly_rate * row.hours_needed },
};

const money = (n) => Math.round(n * 100) / 100;

// Orders the user is part of (as customer or as provider), with names and delivery address.
const SELECT = `SELECT o.*, cu.full_name AS customer_name, cu.phone_number AS customer_phone, sp.store_name,
    a.street_address, a.city, a.district, a.building_number, a.floor
  FROM orders o
  JOIN customers c ON c.customer_id = o.customer_id
  JOIN users cu ON cu.user_id = c.user_id
  JOIN service_providers sp ON sp.provider_id = o.provider_id
  LEFT JOIN user_addresses a ON a.address_id = o.delivery_address_id
  WHERE (o.customer_id = $1 OR o.provider_id = $2)`;

module.exports = {
  // items: [{ item_type: 'food' | 'craft' | 'service', item_id, quantity, slot_id }]
  // Checks every item, takes stock / books slots, then saves the order and its lines — all or nothing.
  create: (user, { items, delivery_address_id, special_instruction }) => transaction(async (db) => {
    if (!Array.isArray(items) || !items.length) throw httpError(400, 'items must be a non-empty array');
    if (delivery_address_id &&
        !(await one('SELECT 1 FROM user_addresses WHERE address_id = $1 AND user_id = $2', [delivery_address_id, user.user_id], db))) {
      throw httpError(400, 'delivery_address_id is not one of your addresses');
    }

    let providerId, subTotal = 0, needsDelivery = false;
    const lines = [];
    for (const { item_type, item_id, quantity = 1, slot_id } of items) {
      const type = ITEM_TYPES[item_type];
      if (!type) throw httpError(400, 'item_type must be food, craft or service');
      if (!Number.isInteger(quantity) || quantity < 1) throw httpError(400, 'quantity must be a whole number of at least 1');

      const item = await one(
        `SELECT t.*, sp.verification_status FROM ${type.table} t JOIN service_providers sp ON sp.provider_id = t.provider_id
         WHERE t.${type.id} = $1 FOR UPDATE OF t`,
        [item_id], db
      );
      if (!item || item.verification_status !== 'accepted' || item.is_available === false) {
        throw httpError(404, `${item_type} ${item_id} is not available`);
      }
      providerId ??= item.provider_id;
      if (item.provider_id !== providerId) throw httpError(400, 'All items in one order must be from the same provider');

      if (item_type === 'service') {
        if (slot_id && !(await one(
          'UPDATE appointment_slots SET is_booked = true WHERE slot_id = $1 AND service_id = $2 AND NOT is_booked RETURNING slot_id',
          [slot_id, item.service_id], db
        ))) throw httpError(400, `Slot ${slot_id} is not available for this service`);
      } else {
        needsDelivery = true;
        if (item.stock_quantity !== null) {
          if (item.stock_quantity < quantity) throw httpError(400, `Only ${item.stock_quantity} left of "${item.title}"`);
          await db.query(`UPDATE ${type.table} SET stock_quantity = stock_quantity - $1 WHERE ${type.id} = $2`, [quantity, item[type.id]]);
        }
      }

      const unitPrice = money(type.price(item));
      subTotal += unitPrice * quantity;
      lines.push({
        item_type,
        food_item_id: null, craft_item_id: null, service_id: null, [type.id]: item[type.id],
        slot_id: item_type === 'service' ? slot_id ?? null : null,
        unit_price: unitPrice, quantity, sub_total: money(unitPrice * quantity),
      });
    }

    const deliveryFee = needsDelivery ? DELIVERY_FEE : 0;
    const order = await one(
      `INSERT INTO orders (customer_id, provider_id, delivery_address_id, special_instruction, sub_total_amount, delivery_fee, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.customer_id, providerId, delivery_address_id, special_instruction, money(subTotal), deliveryFee, money(subTotal + deliveryFee)],
      db
    );
    order.items = [];
    for (const l of lines) {
      order.items.push(await OrderItem.create({ ...l, order_id: order.order_id }, db));
    }
    return order;
  }),

  findForUser: (user, status) => many(
    `${SELECT} AND ($3::text IS NULL OR o.status = $3) ORDER BY o.order_date DESC`,
    [user.customer_id, user.provider_id, status]
  ),

  // With its order lines. Returns undefined if the user is not part of the order.
  findOneForUser: async (user, orderId) => {
    const order = await one(`${SELECT} AND o.order_id = $3`, [user.customer_id, user.provider_id, orderId]);
    if (order) order.items = await OrderItem.findByOrder(order.order_id);
    return order;
  },

  // Cancelling puts the stock back and frees booked slots.
  setStatus: (orderId, status) => transaction(async (db) => {
    if (status === 'cancelled') {
      for (const { table, id } of [ITEM_TYPES.food, ITEM_TYPES.craft]) {
        await db.query(
          `UPDATE ${table} t SET stock_quantity = t.stock_quantity + oi.qty
           FROM (SELECT ${id}, SUM(quantity) AS qty FROM order_items WHERE order_id = $1 GROUP BY ${id}) oi
           WHERE t.${id} = oi.${id}`,
          [orderId]
        );
      }
      await db.query('UPDATE appointment_slots SET is_booked = false WHERE slot_id IN (SELECT slot_id FROM order_items WHERE order_id = $1)', [orderId]);
    }
    return one('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', [status, orderId], db);
  }),
};
