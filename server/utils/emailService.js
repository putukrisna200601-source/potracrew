const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'isi_dengan_app_password_gmail_anda') {
            console.warn('⚠️ SMTP_PASS is not configured. Email will not be sent to:', to);
            return false;
        }

        const info = await transporter.sendMail({
            from: `"PotraCrew Recruitment" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });
        
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendEmail };
