const Model = require('../../core/Model');

class AddressModel extends Model {
  constructor() {
    super('user_addresses', 'address_id', ['street_address', 'city', 'district', 'building_number', 'floor'], ['user_id']);
  }
}

module.exports = new AddressModel();
