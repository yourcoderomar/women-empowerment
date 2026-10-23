const { many } = require('../db');
const crud = require('./crud');

// Order lines are created by Order.create and never edited afterwards.
module.exports = {
  create: crud('order_items', 'order_item_id', [], [
    'order_id', 'item_type', 'food_item_id', 'craft_item_id', 'service_id', 'slot_id', 'unit_price', 'quantity', 'sub_total',
  ]).create,

  // Lines of one order, with the item title and booked slot time.
  findByOrder: (orderId) => many(
    `SELECT oi.*, COALESCE(f.title, cr.title, s.title) AS title, sl.slot_date, sl.start_time, sl.end_time
     FROM order_items oi
     LEFT JOIN food_items f ON f.food_item_id = oi.food_item_id
     LEFT JOIN craft_items cr ON cr.craft_item_id = oi.craft_item_id
     LEFT JOIN domestic_services s ON s.service_id = oi.service_id
     LEFT JOIN appointment_slots sl ON sl.slot_id = oi.slot_id
     WHERE oi.order_id = $1 ORDER BY oi.order_item_id`,
    [orderId]
  ),
};
