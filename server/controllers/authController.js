const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { sendEmail } = require('../utils/emailService');

// Seed admin if none exists
const seedAdmin = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('PotraCrew@2026!', 10);
            await pool.query(
                'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
                ['Potra Photobooth Bali', 'admin', hashedPassword, 'owner']
            );
            console.log('✅ Admin user seeded automatically.');
        }
    } catch (error) {
        console.error('Error seeding admin:', error.message);
    }
};

// Call seeder immediately
seedAdmin();

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username dan password wajib diisi', errors: [] });
        }

        // Check if user is an email (for forgot password/login flexibility) or username
        const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR username = ?', [username, 'admin']);
        // Since there is only one user based on instruction, let's just find by username
        
        const [targetUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (targetUsers.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah', errors: [] });
        }

        const user = targetUsers[0];
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Username atau password salah', errors: [] });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [user.id, 'Login ke sistem', req.ip]
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: { id: user.id, name: user.name, role: user.role, username: user.username }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal', errors: [error.message] });
    }
};

const forgotPassword = async (req, res) => {
    try {
        // According to instructions, reset email is sent to potraphotoboothbali@gmail.com
        // We will generate a token and send it.
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration
        
        const adminEmail = 'potraphotoboothbali@gmail.com';
        
        await pool.query(
            'INSERT INTO reset_tokens (email, token, expires_at) VALUES (?, ?, ?)',
            [adminEmail, resetToken, expiresAt]
        );
        
        const resetLink = `${process.env.FRONTEND_URL}/admin/reset_password.html?token=${resetToken}`;
        
        const html = `
            <h2>Reset Password Admin PotraCrew</h2>
            <p>Seseorang telah meminta reset password untuk akun admin.</p>
            <p>Silakan klik tautan di bawah ini untuk membuat password baru:</p>
            <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
            <p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>
        `;
        
        await sendEmail(adminEmail, 'Permintaan Reset Password PotraCrew', html);
        
        res.json({ success: true, message: 'Instruksi reset password telah dikirim ke email admin.', data: {} });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses reset password', errors: [error.message] });
    }
};

const getMe = async (req, res) => {
    res.json({
        success: true,
        message: 'Data user berhasil diambil',
        data: { user: req.user }
    });
};

module.exports = { login, forgotPassword, getMe };
