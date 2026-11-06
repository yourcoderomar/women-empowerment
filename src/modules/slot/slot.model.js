const Model = require('../../core/Model');

// is_booked is not editable: it is set when an order books the slot and cleared if that order is cancelled.
class SlotModel extends Model {
  constructor() {
    super('appointment_slots', 'slot_id', ['slot_date', 'start_time', 'end_time'], ['service_id']);
  }
}

module.exports = new SlotModel();
