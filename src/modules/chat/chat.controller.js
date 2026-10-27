const ChatConversation = require('./conversation.model');
const ChatMessage = require('./message.model');

// Middleware: loads the conversation and checks the logged-in user is part of it.
exports.loadOwn = async (req, res, next) => {
  req.conversation = await ChatConversation.findOneForUser(req.user, req.params.id);
  if (!req.conversation) return res.status(404).json({ message: 'Conversation not found' });
  next();
};

exports.list = async (req, res) => res.json(await ChatConversation.findForUser(req.user));

// Customer starts (or reopens) a chat with a provider. Body: provider_id
exports.open = async (req, res) => {
  res.status(201).json(await ChatConversation.open(req.user.customer_id, req.body.provider_id));
};

// Reading the messages marks the other person's messages as read.
exports.messages = async (req, res) => {
  res.json(await ChatMessage.findByConversation(req.conversation.conversation_id, req.user.user_id));
};

// Body: message_text
exports.send = async (req, res) => {
  res.status(201).json(await ChatMessage.create({
    conversation_id: req.conversation.conversation_id, sender_id: req.user.user_id, message_text: req.body.message_text,
  }));
};
