const { query, one, transaction, httpError } = require('../../db/connection');
const Model = require('../../core/Model');
const OrderItem = require('./order-item.model');
const FoodItem = require('../item/food.model');
const CraftItem = require('../item/craft.model');
const DomesticService = require('../item/service.model');

const DELIVERY_FEE = 20; // ponytail: flat fee for orders with food/craft items; make it per provider or by distance if needed

// Which model handles each item_type. Each one knows its table, id column and how to price an item.
const ITEM_MODELS = { food: FoodItem, craft: CraftItem, service: DomesticService };

const money = (n) => Math.round(n * 100) / 100;

// Orders the user is part of (as customer or as provider), with names and delivery address.
// Takes two values: the user's customer_id, then provider_id.
const SELECT = `SELECT o.*, cu.full_name AS customer_name, cu.phone_number AS customer_phone, sp.store_name,
    a.street_address, a.city, a.district, a.building_number, a.floor
  FROM orders o
  JOIN customers c ON c.customer_id = o.customer_id
  JOIN users cu ON cu.user_id = c.user_id
  JOIN service_providers sp ON sp.provider_id = o.provider_id
  LEFT JOIN user_addresses a ON a.address_id = o.delivery_address_id
  WHERE (o.customer_id = ? OR o.provider_id = ?)`;

class OrderModel extends Model {
  constructor() {
    super('orders', 'order_id', [], [
      'customer_id', 'provider_id', 'delivery_address_id', 'special_instruction', 'sub_total_amount', 'delivery_fee', 'total_amount',
    ]);
  }

  // items: [{ item_type: 'food' | 'craft' | 'service', item_id, quantity, slot_id }]
  // Checks every item, takes stock / books slots, then saves the order and its lines: all or nothing.
  placeOrder(user, { items, delivery_address_id, special_instruction }) {
    return transaction(async (db) => {
      if (!Array.isArray(items) || !items.length) throw httpError(400, 'items must be a non-empty array');
      if (delivery_address_id &&
          !(await one('SELECT 1 FROM user_addresses WHERE address_id = ? AND user_id = ?', [delivery_address_id, user.user_id], db))) {
        throw httpError(400, 'delivery_address_id is not one of your addresses');
      }

      let providerId, subTotal = 0, needsDelivery = false;
      const lines = [];
      for (const { item_type, item_id, quantity = 1, slot_id } of items) {
        const itemModel = ITEM_MODELS[item_type];
        if (!itemModel) throw httpError(400, 'item_type must be food, craft or service');
        if (!Number.isInteger(quantity) || quantity < 1) throw httpError(400, 'quantity must be a whole number of at least 1');
        const { table, idColumn } = itemModel;

        // FOR UPDATE locks the item row until the order is saved, so two orders can't both take the last one.
        const item = await one(
          `SELECT t.*, sp.verification_status FROM ${table} t JOIN service_providers sp ON sp.provider_id = t.provider_id
           WHERE t.${idColumn} = ? FOR UPDATE`,
          [item_id], db
        );
        if (!item || item.verification_status !== 'accepted' || item.is_available === false) {
          throw httpError(404, `${item_type} ${item_id} is not available`);
        }
        providerId ??= item.provider_id;
        if (item.provider_id !== providerId) throw httpError(400, 'All items in one order must be from the same provider');

        if (item_type === 'service') {
          if (slot_id) {
            const { affectedRows } = await query(
              'UPDATE appointment_slots SET is_booked = TRUE WHERE slot_id = ? AND service_id = ? AND NOT is_booked',
              [slot_id, item.service_id], db
            );
            if (!affectedRows) throw httpError(400, `Slot ${slot_id} is not available for this service`);
          }
        } else {
          needsDelivery = true;
          if (item.stock_quantity !== null) {
            if (item.stock_quantity < quantity) throw httpError(400, `Only ${item.stock_quantity} left of "${item.title}"`);
            await query(`UPDATE ${table} SET stock_quantity = stock_quantity - ? WHERE ${idColumn} = ?`, [quantity, item[idColumn]], db);
          }
        }

        const unitPrice = money(itemModel.unitPrice(item)); // each item model prices its own items
        subTotal += unitPrice * quantity;
        lines.push({
          item_type,
          food_item_id: null, craft_item_id: null, service_id: null, [idColumn]: item[idColumn],
          slot_id: item_type === 'service' ? slot_id ?? null : null,
          unit_price: unitPrice, quantity, sub_total: money(unitPrice * quantity),
        });
      }

      const deliveryFee = needsDelivery ? DELIVERY_FEE : 0;
      const order = await this.create({
        customer_id: user.customer_id,
        provider_id: providerId,
        delivery_address_id: delivery_address_id ?? null,
        special_instruction: special_instruction ?? null,
        sub_total_amount: money(subTotal),
        delivery_fee: deliveryFee,
        total_amount: money(subTotal + deliveryFee),
      }, db);
      order.items = [];
      for (const line of lines) {
        order.items.push(await OrderItem.create({ ...line, order_id: order.order_id }, db));
      }
      return order;
    });
  }

  findForUser(user, status) {
    return query(
      `${SELECT} AND (? IS NULL OR o.status = ?) ORDER BY o.order_date DESC, o.order_id DESC`,
      [user.customer_id, user.provider_id, status, status]
    );
  }

  // With its order lines. Returns undefined if the user is not part of the order.
  async findOneForUser(user, orderId) {
    const order = await one(`${SELECT} AND o.order_id = ?`, [user.customer_id, user.provider_id, orderId]);
    if (order) order.items = await OrderItem.findByOrder(order.order_id);
    return order;
  }

  // Cancelling puts the stock back and frees booked slots.
  setStatus(orderId, status) {
    return transaction(async (db) => {
      if (status === 'cancelled') {
        for (const { table, idColumn } of [FoodItem, CraftItem]) {
          await query(
            `UPDATE ${table} t
             JOIN (SELECT ${idColumn}, SUM(quantity) AS qty FROM order_items WHERE order_id = ? GROUP BY ${idColumn}) oi
               ON t.${idColumn} = oi.${idColumn}
             SET t.stock_quantity = t.stock_quantity + oi.qty`,
            [orderId], db
          );
        }
        await query('UPDATE appointment_slots SET is_booked = FALSE WHERE slot_id IN (SELECT slot_id FROM order_items WHERE order_id = ?)', [orderId], db);
      }
      await query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId], db);
      return this.findById(orderId, db);
    });
  }
}

module.exports = new OrderModel();
