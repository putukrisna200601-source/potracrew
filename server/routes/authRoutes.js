const express = require('express');
const router = express.Router();
const { login, forgotPassword, getMe } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', authMiddleware, getMe);

module.exports = router;
