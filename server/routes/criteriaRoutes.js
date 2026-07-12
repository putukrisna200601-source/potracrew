const express = require('express');
const router = express.Router();
const { getAllCriteria, createCriteria, updateCriteria, deleteCriteria, submitInterviewScore, getCandidateScores } = require('../controllers/criteriaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Criteria CRUD
router.get('/', getAllCriteria);
router.post('/', createCriteria);
router.put('/:id', updateCriteria);
router.delete('/:id', deleteCriteria);

// Interview Score Input
router.get('/evaluations/:id', getCandidateScores);
router.post('/evaluations', submitInterviewScore);

module.exports = router;
