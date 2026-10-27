const { query, one, transaction } = require('../../db/connection');

module.exports = {
  // All messages of a conversation; the ones sent to `readerId` are marked as read.
  findByConversation: async (conversationId, readerId) => {
    await query(
      'UPDATE chat_messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id <> ? AND NOT is_read',
      [conversationId, readerId]
    );
    return query('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY sent_at, message_id', [conversationId]);
  },

  create: ({ conversation_id, sender_id, message_text }) => transaction(async (db) => {
    const { insertId } = await query(
      'INSERT INTO chat_messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)',
      [conversation_id, sender_id, message_text], db
    );
    const message = await one('SELECT * FROM chat_messages WHERE message_id = ?', [insertId], db);
    await query('UPDATE chat_conversations SET last_message_at = ? WHERE conversation_id = ?', [message.sent_at, conversation_id], db);
    return message;
  }),
};
