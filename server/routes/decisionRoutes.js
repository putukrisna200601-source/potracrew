const express = require('express');
const router = express.Router();
const { makeDecision, getDashboardStats, getDecisions } = require('../controllers/decisionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/make', makeDecision);
router.get('/dashboard', getDashboardStats);
router.get('/list', getDecisions);

module.exports = router;
