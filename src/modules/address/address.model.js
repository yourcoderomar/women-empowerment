const crud = require('../../utils/crud.factory');

module.exports = crud('user_addresses', 'address_id', ['street_address', 'city', 'district', 'building_number', 'floor'], ['user_id']);
