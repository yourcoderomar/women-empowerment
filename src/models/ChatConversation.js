const { many, one } = require('../db');

module.exports = {
  // Returns the existing conversation between the two, or starts one.
  open: (customerId, providerId) => one(
    `INSERT INTO chat_conversations (customer_id, provider_id) VALUES ($1, $2)
     ON CONFLICT (customer_id, provider_id) DO UPDATE SET customer_id = EXCLUDED.customer_id RETURNING *`,
    [customerId, providerId]
  ),

  // The user's conversations, newest activity first, with the number of unread messages.
  findForUser: (user) => many(
    `SELECT cc.*, sp.store_name, u.full_name AS customer_name,
       (SELECT COUNT(*)::int FROM chat_messages m
        WHERE m.conversation_id = cc.conversation_id AND NOT m.is_read AND m.sender_id <> $3) AS unread_count
     FROM chat_conversations cc
     JOIN service_providers sp ON sp.provider_id = cc.provider_id
     JOIN customers c ON c.customer_id = cc.customer_id JOIN users u ON u.user_id = c.user_id
     WHERE cc.customer_id = $1 OR cc.provider_id = $2
     ORDER BY COALESCE(cc.last_message_at, cc.created_at) DESC`,
    [user.customer_id, user.provider_id, user.user_id]
  ),

  // Returns undefined if the user is not part of the conversation.
  findOneForUser: (user, id) => one(
    'SELECT * FROM chat_conversations WHERE conversation_id = $1 AND (customer_id = $2 OR provider_id = $3)',
    [id, user.customer_id, user.provider_id]
  ),
};
