const { query, one } = require('../../db/connection');

module.exports = {
  // Returns the existing conversation between the two, or starts one.
  // LAST_INSERT_ID(conversation_id) makes insertId the existing row's id when the pair already exists.
  open: async (customerId, providerId) => {
    const { insertId } = await query(
      `INSERT INTO chat_conversations (customer_id, provider_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE conversation_id = LAST_INSERT_ID(conversation_id)`,
      [customerId, providerId]
    );
    return one('SELECT * FROM chat_conversations WHERE conversation_id = ?', [insertId]);
  },

  // The user's conversations, newest activity first, with the number of unread messages.
  findForUser: (user) => query(
    `SELECT cc.*, sp.store_name, u.full_name AS customer_name,
       (SELECT COUNT(*) FROM chat_messages m
        WHERE m.conversation_id = cc.conversation_id AND NOT m.is_read AND m.sender_id <> ?) AS unread_count
     FROM chat_conversations cc
     JOIN service_providers sp ON sp.provider_id = cc.provider_id
     JOIN customers c ON c.customer_id = cc.customer_id JOIN users u ON u.user_id = c.user_id
     WHERE cc.customer_id = ? OR cc.provider_id = ?
     ORDER BY COALESCE(cc.last_message_at, cc.created_at) DESC`,
    [user.user_id, user.customer_id, user.provider_id]
  ),

  // Returns undefined if the user is not part of the conversation.
  findOneForUser: (user, id) => one(
    'SELECT * FROM chat_conversations WHERE conversation_id = ? AND (customer_id = ? OR provider_id = ?)',
    [id, user.customer_id, user.provider_id]
  ),
};
