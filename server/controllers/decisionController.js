const pool = require('../config/db');
const { sendEmail } = require('../utils/emailService');

const makeDecision = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { candidate_id, decision } = req.body;
        
        if (!['accepted', 'rejected'].includes(decision)) {
            return res.status(400).json({ success: false, message: 'Keputusan tidak valid', errors: [] });
        }

        await conn.beginTransaction();

        // Ambil info kandidat
        const [candidates] = await conn.query('SELECT full_name, email FROM candidates WHERE id = ?', [candidate_id]);
        if (candidates.length === 0) {
            throw new Error('Kandidat tidak ditemukan');
        }
        const candidate = candidates[0];

        // Update status candidates
        await conn.query('UPDATE candidates SET status = ? WHERE id = ?', [decision, candidate_id]);

        // Catat ke status_history
        const statusNote = decision === 'accepted' ? 'Selamat! Anda telah diterima.' : 'Mohon maaf, Anda belum memenuhi kriteria kami saat ini.';
        await conn.query(
            'INSERT INTO status_history (candidate_id, status, notes, created_by) VALUES (?, ?, ?, ?)',
            [candidate_id, decision, statusNote, req.user.id]
        );

        // Catat ke activity_logs
        await conn.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, `Menetapkan keputusan ${decision} untuk kandidat ID ${candidate_id}`, req.ip]
        );

        await conn.commit();

        // Kirim email notifikasi
        let subject = req.body.subject || '';
        let htmlBody = req.body.htmlBody || '';
        
        if (!subject || !htmlBody) {
            if (decision === 'accepted') {
                subject = 'Selamat! Anda Diterima - PotraCrew Recruitment';
                htmlBody = `
                    <h2>Halo ${candidate.full_name},</h2>
                    <p>Selamat! Berdasarkan hasil seleksi dan wawancara, Anda <strong>DITERIMA</strong> untuk bergabung dengan Potra Photobooth Bali.</p>
                    <p>Tim HR kami akan segera menghubungi Anda untuk tahap *onboarding*.</p>
                    <br>
                    <p>Salam hangat,</p>
                    <p><strong>Tim Rekrutmen Potra Photobooth Bali</strong></p>
                `;
            } else {
                subject = 'Hasil Seleksi PotraCrew Recruitment';
                htmlBody = `
                    <h2>Halo ${candidate.full_name},</h2>
                    <p>Terima kasih atas partisipasi Anda dalam proses rekrutmen Potra Photobooth Bali.</p>
                    <p>Setelah melakukan evaluasi yang mendalam, dengan berat hati kami sampaikan bahwa kami <strong>BELUM BISA MELANJUTKAN</strong> proses aplikasi Anda saat ini.</p>
                    <p>Data Anda akan tetap kami simpan di database untuk peluang di masa mendatang.</p>
                    <br>
                    <p>Salam hangat,</p>
                    <p><strong>Tim Rekrutmen Potra Photobooth Bali</strong></p>
                `;
            }
        }

        // Format HTML agar lebih rapi saat diterima di Gmail (opsional, karena dari frontend sudah berupa HTML)
        htmlBody = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${htmlBody}</div>`;

        // Fitur pengiriman email dinonaktifkan sementara untuk pengembangan tahap 2
        // Jangan await sendEmail agar tidak memblokir response
        // sendEmail(candidate.email, subject, htmlBody)
        //     .then(success => {
        //         if (!success) console.warn('Failed to send decision email to', candidate.email);
        //     });
        console.log(`[Tahap 2] Simulasi pengiriman email keputusan ke ${candidate.email}`);

        res.json({ success: true, message: `Berhasil menetapkan keputusan: ${decision}`, data: {} });

    } catch (error) {
        await conn.rollback();
        console.error('Decision Error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses keputusan', errors: [error.message] });
    } finally {
        conn.release();
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const [totalApplicants] = await pool.query('SELECT COUNT(*) as count FROM candidates');
        const [evaluatedApplicants] = await pool.query('SELECT COUNT(*) as count FROM candidates WHERE status = "evaluated"');
        const [acceptedApplicants] = await pool.query('SELECT COUNT(*) as count FROM candidates WHERE status = "accepted"');
        const [rejectedApplicants] = await pool.query('SELECT COUNT(*) as count FROM candidates WHERE status = "rejected"');
        const [recentActivities] = await pool.query(`
            SELECT a.action, a.created_at, u.name 
            FROM activity_logs a 
            JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC LIMIT 10
        `);

        res.json({
            success: true,
            message: 'Data dashboard berhasil diambil',
            data: {
                total: totalApplicants[0].count,
                evaluated: evaluatedApplicants[0].count,
                accepted: acceptedApplicants[0].count,
                rejected: rejectedApplicants[0].count,
                activities: recentActivities
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard', errors: [error.message] });
    }
};

const getDecisions = async (req, res) => {
    try {
        const [candidates] = await pool.query(`
            SELECT c.id, c.full_name as name, c.email, c.whatsapp as phone, c.status, s.final_score as score
            FROM candidates c
            JOIN saw_results s ON c.id = s.candidate_id
            ORDER BY s.final_score DESC
        `);
        
        // Ambil evaluasi detail
        for(let c of candidates) {
            c.ownerStatus = c.status === 'accepted' ? 'Diterima' : (c.status === 'rejected' ? 'Ditolak' : 'Menunggu');
            
            // Tentukan SAW status
            // Jika score tertinggi direkomendasikan
            c.sawStatus = 'Alternatif';
            
            const [evals] = await pool.query(`
                SELECT e.criteria_id, e.value, cr.name
                FROM evaluations e
                JOIN criteria cr ON e.criteria_id = cr.id
                WHERE e.candidate_id = ?
            `, [c.id]);
            
            c.values = {};
            evals.forEach(e => {
                c.values[e.criteria_id] = e.value;
                c.values[e.name] = e.value;
            });
        }
        
        if(candidates.length > 0) candidates[0].sawStatus = 'Direkomendasikan';
        
        const [criteria] = await pool.query('SELECT * FROM criteria');
        
        res.json({ success: true, data: { kandidat: candidates, kriteria: criteria } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data', errors: [error.message] });
    }
};

module.exports = { makeDecision, getDashboardStats, getDecisions };
