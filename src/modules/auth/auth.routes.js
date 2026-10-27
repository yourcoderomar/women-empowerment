const router = require('express').Router();
const { auth } = require('../../middleware/auth.middleware');
const controller = require('./auth.controller');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);

module.exports = router;
