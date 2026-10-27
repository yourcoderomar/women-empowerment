const item = require('./item.model');

module.exports = item('domestic_services', 'service_id', [
  'category_id', 'title', 'description', 'hourly_rate', 'hours_needed',
], 'hourly_rate');
