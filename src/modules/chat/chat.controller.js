const Controller = require('../../core/Controller');
const Conversation = require('./conversation.model');
const Message = require('./message.model');

class ChatController extends Controller {
  // Middleware: loads the conversation and checks the logged-in user is part of it.
  async loadOwn(req, res, next) {
    req.conversation = await this.model.findOneForUser(req.user, req.params.id);
    if (!req.conversation) return this.notFound(res);
    next();
  }

  async list(req, res) {
    res.json(await this.model.findForUser(req.user));
  }

  // Customer starts (or reopens) a chat with a provider. Body: provider_id
  async open(req, res) {
    res.status(201).json(await this.model.open(req.user.customer_id, req.body.provider_id));
  }

  // Reading the messages marks the other person's messages as read.
  async messages(req, res) {
    res.json(await Message.findByConversation(req.conversation.conversation_id, req.user.user_id));
  }

  // Body: message_text
  async send(req, res) {
    res.status(201).json(await Message.create({
      conversation_id: req.conversation.conversation_id, sender_id: req.user.user_id, message_text: req.body.message_text,
    }));
  }
}

module.exports = new ChatController(Conversation, 'Conversation');
