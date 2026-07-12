const pool = require('../config/db');
const { sendEmail } = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

// Registration API
const register = async (req, res) => {
    try {
        const {
            fullName, dob, gender, address, education, currentJob, expectedHonor,
            whatsapp, email, instagram, expEvent, expPhoto, skills, vehicle, camera
        } = req.body;

        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM candidates WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar', errors: [] });
        }

        // Get file paths
        let cvFile = '';
        let portfolioFile = null;

        if (req.files) {
            if (req.files.cvFile && req.files.cvFile.length > 0) {
                cvFile = req.files.cvFile[0].filename;
            }
            if (req.files.portfolioFile && req.files.portfolioFile.length > 0) {
                portfolioFile = req.files.portfolioFile[0].filename;
            }
        }

        if (!cvFile) {
            return res.status(400).json({ success: false, message: 'CV wajib diunggah', errors: [] });
        }
        
        // Handle skills (could be array or string)
        let skillsStr = '';
        if (Array.isArray(skills)) {
            skillsStr = skills.join(', ');
        } else {
            skillsStr = skills || '';
        }

        // Insert to DB
        const [result] = await pool.query(
            `INSERT INTO candidates (
                full_name, dob, gender, address, education, current_job, expected_honor,
                whatsapp, email, instagram, exp_event, exp_photo, skills, has_vehicle, has_camera,
                cv_file, portfolio_file
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fullName, dob, gender, address, education, currentJob || null, expectedHonor,
                whatsapp, email, instagram, expEvent, expPhoto, skillsStr, vehicle, camera,
                cvFile, portfolioFile
            ]
        );

        // Add to status history
        await pool.query(
            'INSERT INTO status_history (candidate_id, status, notes) VALUES (?, ?, ?)',
            [result.insertId, 'pending', 'Pendaftaran berhasil dikirim.']
        );

        res.json({ success: true, message: 'Pendaftaran berhasil', data: { id: result.insertId } });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat pendaftaran', errors: [error.message] });
    }
};

// Check Status
const checkStatus = async (req, res) => {
    try {
        const { email, whatsapp } = req.body;
        if (!email || !whatsapp) return res.status(400).json({ success: false, message: 'Email dan Nomor HP dibutuhkan', errors: [] });

        const [candidates] = await pool.query('SELECT id, full_name, status, created_at FROM candidates WHERE email = ? AND whatsapp = ?', [email, whatsapp]);
        if (candidates.length === 0) {
            return res.status(404).json({ success: false, message: 'Data pelamar tidak ditemukan. Pastikan Email dan Nomor HP sesuai.', errors: [] });
        }

        const candidate = candidates[0];

        const [history] = await pool.query('SELECT status, notes, created_at FROM status_history WHERE candidate_id = ? ORDER BY created_at DESC', [candidate.id]);

        res.json({
            success: true,
            message: 'Status ditemukan',
            data: {
                candidate: {
                    name: candidate.full_name,
                    currentStatus: candidate.status,
                    lastUpdate: history[0]?.created_at || candidate.created_at
                },
                history: history
            }
        });
    } catch (error) {
        console.error('Check status error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', errors: [error.message] });
    }
};

// Admin: Get all applicants
const getAllApplicants = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, 
            (SELECT COUNT(*) FROM evaluations e WHERE e.candidate_id = c.id) as ev_count 
            FROM candidates c 
            WHERE c.status NOT IN ('accepted', 'rejected')
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, message: 'Data berhasil diambil', data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data', errors: [error.message] });
    }
};

// Admin: Get single applicant
const getApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM candidates WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pelamar tidak ditemukan', errors: [] });
        
        const [history] = await pool.query('SELECT status, notes, created_at FROM status_history WHERE candidate_id = ? ORDER BY created_at ASC', [id]);
        
        res.json({ success: true, message: 'Data berhasil diambil', data: rows[0], history: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data', errors: [error.message] });
    }
};

// Admin: Delete applicant
const deleteApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM candidates WHERE id = ?', [id]);
        
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, `Menghapus data pelamar ID ${id}`, req.ip]
        );

        res.json({ success: true, message: 'Pelamar berhasil dihapus', data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus data', errors: [error.message] });
    }
};

// Admin: Update applicant status
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        // Ensure status is valid
        if (!['pending', 'evaluated', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status tidak valid', errors: [] });
        }

        const [candidateRes] = await pool.query('SELECT full_name, email FROM candidates WHERE id = ?', [id]);
        if (candidateRes.length === 0) return res.status(404).json({ success: false, message: 'Pelamar tidak ditemukan', errors: [] });

        await pool.query('UPDATE candidates SET status = ? WHERE id = ?', [status, id]);
        
        // Save to status_history
        const historyNotes = notes || `Status diubah menjadi ${status}`;
        await pool.query(
            'INSERT INTO status_history (candidate_id, status, notes) VALUES (?, ?, ?)',
            [id, status, historyNotes]
        );
        
        const candidateName = candidateRes[0].full_name;
        const candidateEmail = candidateRes[0].email;
        let actionStr = `Mengubah status pelamar ${candidateName} menjadi ${status}`;
        if (status === 'evaluated') actionStr = `Meloloskan administrasi pelamar ${candidateName}`;
        if (status === 'rejected') actionStr = `Menolak administrasi pelamar ${candidateName}`;

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, actionStr, req.ip]
        );

        // Send Email Notification
        if (status === 'evaluated') {
            const subject = 'Selamat! Anda Lolos Seleksi Administrasi PotraCrew';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #0ea5e9;">Selamat, ${candidateName}! 🎉</h2>
                    <p>Terima kasih atas ketertarikan Anda untuk bergabung dengan Potra Photobooth Bali.</p>
                    <p>Kami dengan senang hati memberitahukan bahwa Anda telah <strong>Lolos Seleksi Administrasi</strong>.</p>
                    <p>Tahap selanjutnya adalah proses wawancara. Berikut adalah detail jadwal wawancara Anda:</p>
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; white-space: pre-line; border-left: 4px solid #0ea5e9;">
                        ${notes || 'Tim kami akan segera menghubungi Anda melalui WhatsApp untuk detail wawancara.'}
                    </div>
                    <p>Harap persiapkan diri Anda dan pastikan portofolio Anda siap untuk ditunjukkan jika diperlukan.</p>
                    <br/>
                    <p>Salam hangat,</p>
                    <p><strong>Tim Rekrutmen PotraCrew</strong></p>
                </div>
            `;
            // Fitur pengiriman email dinonaktifkan sementara untuk pengembangan tahap 2
            // Fire and forget, don't wait for email to finish
            // sendEmail(candidateEmail, subject, html).catch(console.error);
            console.log(`[Tahap 2] Simulasi email lolos administrasi ke ${candidateEmail}`);
        } else if (status === 'rejected') {
            const subject = 'Pemberitahuan Hasil Seleksi Administrasi PotraCrew';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2>Halo, ${candidateName}.</h2>
                    <p>Terima kasih telah melamar dan meluangkan waktu untuk mendaftar sebagai bagian dari tim Potra Photobooth Bali.</p>
                    <p>Setelah meninjau kualifikasi dan pengalaman yang Anda kirimkan, dengan berat hati kami sampaikan bahwa saat ini kami <strong>belum dapat melanjutkan lamaran Anda</strong> ke tahap wawancara.</p>
                    <p>Meskipun demikian, kami sangat menghargai antusiasme Anda. Kami akan menyimpan data Anda dan mungkin akan menghubungi Anda di masa mendatang jika ada posisi yang lebih sesuai dengan profil Anda.</p>
                    <br/>
                    <p>Sukses selalu untuk perjalanan karir Anda selanjutnya.</p>
                    <br/>
                    <p>Salam hangat,</p>
                    <p><strong>Tim Rekrutmen PotraCrew</strong></p>
                </div>
            `;
            // Fitur pengiriman email dinonaktifkan sementara untuk pengembangan tahap 2
            // Fire and forget
            // sendEmail(candidateEmail, subject, html).catch(console.error);
            console.log(`[Tahap 2] Simulasi email ditolak administrasi ke ${candidateEmail}`);
        }

        res.json({ success: true, message: 'Status pelamar berhasil diperbarui', data: { status } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui status', errors: [error.message] });
    }
};

// Admin: Get archived applicants
const getArchivedApplicants = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, 
            (SELECT created_at FROM status_history sh WHERE sh.candidate_id = c.id AND sh.status IN ('accepted', 'rejected') ORDER BY created_at DESC LIMIT 1) as decision_date
            FROM candidates c 
            WHERE c.status IN ('accepted', 'rejected')
            ORDER BY decision_date DESC
        `);
        res.json({ success: true, message: 'Data arsip berhasil diambil', data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data arsip', errors: [error.message] });
    }
};

// Admin: Cleanup expired archives (> 14 days)
const cleanupExpiredArchives = async (req, res) => {
    try {
        // Find all archived candidates
        const [expiredRows] = await pool.query(`
            SELECT c.id, c.cv_file, c.portfolio_file, c.full_name
            FROM candidates c
            WHERE c.status IN ('accepted', 'rejected') 
        `);

        if (expiredRows.length === 0) {
            return res.json({ success: true, message: 'Tidak ada arsip yang perlu dibersihkan', data: { deleted_count: 0 } });
        }

        let deletedCount = 0;
        for (const candidate of expiredRows) {
            // Delete physical files
            if (candidate.cv_file) {
                const cvPath = path.join(__dirname, '..', '..', 'uploads', 'cv', candidate.cv_file);
                if (fs.existsSync(cvPath)) fs.unlinkSync(cvPath);
            }
            if (candidate.portfolio_file) {
                const portfolioPath = path.join(__dirname, '..', '..', 'uploads', 'portfolio', candidate.portfolio_file);
                if (fs.existsSync(portfolioPath)) fs.unlinkSync(portfolioPath);
            }

            // Delete from DB (status_history and evaluations will cascade if FK is set, but we manually delete to be safe)
            await pool.query('DELETE FROM status_history WHERE candidate_id = ?', [candidate.id]);
            await pool.query('DELETE FROM evaluations WHERE candidate_id = ?', [candidate.id]);
            await pool.query('DELETE FROM candidates WHERE id = ?', [candidate.id]);
            deletedCount++;
        }

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, `Membersihkan ${deletedCount} arsip (Hard Delete)`, req.ip]
        );

        res.json({ success: true, message: `Berhasil menghapus ${deletedCount} arsip beserta file fisiknya.`, data: { deleted_count: deletedCount } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal membersihkan arsip', errors: [error.message] });
    }
};

module.exports = { register, checkStatus, getAllApplicants, getApplicant, deleteApplicant, updateStatus, getArchivedApplicants, cleanupExpiredArchives };
