const express = require('express');
const router = express.Router();
const { register, checkStatus, getAllApplicants, getApplicant, deleteApplicant, updateStatus, getArchivedApplicants, cleanupExpiredArchives } = require('../controllers/applicantController');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', uploadMiddleware, register);
router.post('/status', checkStatus);

// Protected routes (Admin only)
router.get('/', authMiddleware, getAllApplicants);
router.get('/archive', authMiddleware, getArchivedApplicants);
router.delete('/cleanup', authMiddleware, cleanupExpiredArchives);
router.get('/:id', authMiddleware, getApplicant);
router.put('/:id/status', authMiddleware, updateStatus);
router.delete('/:id', authMiddleware, deleteApplicant);

module.exports = router;
