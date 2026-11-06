const { query, transaction } = require('../../db/connection');
const Model = require('../../core/Model');

class MessageModel extends Model {
  constructor() {
    super('chat_messages', 'message_id', [], ['conversation_id', 'sender_id', 'message_text']);
  }

  // All messages of a conversation; the ones sent to `readerId` are marked as read.
  async findByConversation(conversationId, readerId) {
    await query(
      'UPDATE chat_messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id <> ? AND NOT is_read',
      [conversationId, readerId]
    );
    return query('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY sent_at, message_id', [conversationId]);
  }

  // Saves the message and updates the conversation's last_message_at together (overrides Model.create).
  create(data) {
    return transaction(async (db) => {
      const message = await super.create(data, db);
      await query('UPDATE chat_conversations SET last_message_at = ? WHERE conversation_id = ?', [message.sent_at, message.conversation_id], db);
      return message;
    });
  }
}

module.exports = new MessageModel();
