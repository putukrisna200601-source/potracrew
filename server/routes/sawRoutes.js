const express = require('express');
const router = express.Router();
const { calculateSAW } = require('../controllers/sawController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/calculate', calculateSAW);

module.exports = router;
