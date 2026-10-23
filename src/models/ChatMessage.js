const { many, one, transaction } = require('../db');

module.exports = {
  // All messages of a conversation; the ones sent to `readerId` are marked as read.
  findByConversation: async (conversationId, readerId) => {
    await one(
      'UPDATE chat_messages SET is_read = true WHERE conversation_id = $1 AND sender_id <> $2 AND NOT is_read',
      [conversationId, readerId]
    );
    return many('SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY sent_at, message_id', [conversationId]);
  },

  create: ({ conversation_id, sender_id, message_text }) => transaction(async (db) => {
    const message = await one(
      'INSERT INTO chat_messages (conversation_id, sender_id, message_text) VALUES ($1, $2, $3) RETURNING *',
      [conversation_id, sender_id, message_text], db
    );
    await db.query('UPDATE chat_conversations SET last_message_at = $1 WHERE conversation_id = $2', [message.sent_at, conversation_id]);
    return message;
  }),
};
