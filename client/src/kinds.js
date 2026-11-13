// The three things providers sell. Each has its own URL, id column and price column on the backend.
export const KINDS = {
  food: { path: '/foods', id: 'food_item_id', price: 'price', label: 'Homemade food' },
  craft: { path: '/crafts', id: 'craft_item_id', price: 'price', label: 'Handmade crafts' },
  service: { path: '/services', id: 'service_id', price: 'hourly_rate', label: 'Home services' },
};
