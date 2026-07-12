const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// All routes here will be prefixed with /api/dashboard
router.get('/stats', dashboardController.getStats);

router.get('/test-email', async (req, res) => {
    const nodemailer = require('nodemailer');
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: parseInt(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
        });
        const info = await transporter.sendMail({
            from: `"PotraCrew Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: 'Test Railway Connection',
            html: '<b>Ini adalah tes dari Railway</b>'
        });
        res.send(`<h1>SUKSES MENGIRIM EMAIL!</h1><p>Message ID: ${info.messageId}</p>`);
    } catch (err) {
        res.send(`<h1>GAGAL MENGIRIM EMAIL</h1><pre>${err.stack}</pre>`);
    }
});

module.exports = router;
