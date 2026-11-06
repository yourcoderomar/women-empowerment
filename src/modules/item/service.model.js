const ItemModel = require('./item.model');

class DomesticServiceModel extends ItemModel {
  constructor() {
    super('domestic_services', 'service_id', [
      'category_id', 'title', 'description', 'hourly_rate', 'hours_needed',
    ], 'hourly_rate');
  }

  // A service costs its hourly rate times the hours it needs (overrides ItemModel.unitPrice).
  unitPrice(row) {
    return row.hourly_rate * row.hours_needed;
  }
}

module.exports = new DomesticServiceModel();
