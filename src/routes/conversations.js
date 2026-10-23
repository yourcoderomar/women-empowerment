const router = require('express').Router();
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const { auth, role } = require('../middleware/auth');

router.use(auth, role('customer', 'provider'));

// Loads the conversation and checks the logged-in user is part of it.
async function mine(req, res, next) {
  req.conversation = await ChatConversation.findOneForUser(req.user, req.params.id);
  if (!req.conversation) return res.status(404).json({ message: 'Conversation not found' });
  next();
}

router.get('/', async (req, res) => res.json(await ChatConversation.findForUser(req.user)));

// Customer starts (or reopens) a chat with a provider. Body: provider_id
router.post('/', role('customer'), async (req, res) => {
  res.status(201).json(await ChatConversation.open(req.user.customer_id, req.body.provider_id));
});

// Reading the messages marks the other person's messages as read.
router.get('/:id/messages', mine, async (req, res) => {
  res.json(await ChatMessage.findByConversation(req.conversation.conversation_id, req.user.user_id));
});

// Body: message_text
router.post('/:id/messages', mine, async (req, res) => {
  res.status(201).json(await ChatMessage.create({
    conversation_id: req.conversation.conversation_id, sender_id: req.user.user_id, message_text: req.body.message_text,
  }));
});

module.exports = router;
