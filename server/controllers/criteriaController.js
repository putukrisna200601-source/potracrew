const pool = require('../config/db');

// --- CRITERIA CRUD ---

const getAllCriteria = async (req, res) => {
    try {
        const [criteria] = await pool.query('SELECT * FROM criteria');
        const [subCriteria] = await pool.query('SELECT * FROM sub_criteria');
        
        // Map subcriteria to criteria
        const criteriaWithSubs = criteria.map(c => {
            return {
                ...c,
                sub_criteria: subCriteria.filter(sc => sc.criteria_id === c.id)
            };
        });

        res.json({ success: true, message: 'Data kriteria berhasil diambil', data: criteriaWithSubs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil kriteria', errors: [error.message] });
    }
};

const createCriteria = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { code, name, weight, type, sub_criteria } = req.body;
        
        await conn.beginTransaction();

        const [result] = await conn.query(
            'INSERT INTO criteria (code, name, weight, type) VALUES (?, ?, ?, ?)',
            [code, name, weight, type]
        );

        const criteriaId = result.insertId;

        if (sub_criteria && Array.isArray(sub_criteria)) {
            for (const sub of sub_criteria) {
                await conn.query(
                    'INSERT INTO sub_criteria (criteria_id, name, value) VALUES (?, ?, ?)',
                    [criteriaId, sub.name, sub.value]
                );
            }
        }

        await conn.commit();
        
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, `Menambahkan kriteria baru: ${code} - ${name}`, req.ip]
        );

        res.json({ success: true, message: 'Kriteria berhasil ditambahkan', data: { id: criteriaId } });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, message: 'Gagal menambahkan kriteria', errors: [error.message] });
    } finally {
        conn.release();
    }
};

const updateCriteria = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params;
        const { code, name, weight, type, sub_criteria } = req.body;
        
        await conn.beginTransaction();

        await conn.query(
            'UPDATE criteria SET code = ?, name = ?, weight = ?, type = ? WHERE id = ?',
            [code, name, weight, type, id]
        );

        // Delete old sub criteria and insert new
        if (sub_criteria && Array.isArray(sub_criteria)) {
            await conn.query('DELETE FROM sub_criteria WHERE criteria_id = ?', [id]);
            for (const sub of sub_criteria) {
                await conn.query(
                    'INSERT INTO sub_criteria (criteria_id, name, value) VALUES (?, ?, ?)',
                    [id, sub.name, sub.value]
                );
            }
        }

        await conn.commit();
        
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, `Mengubah kriteria: ${code}`, req.ip]
        );

        res.json({ success: true, message: 'Kriteria berhasil diperbarui', data: {} });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, message: 'Gagal memperbarui kriteria', errors: [error.message] });
    } finally {
        conn.release();
    }
};

const deleteCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM criteria WHERE id = ?', [id]);
        
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, `Menghapus kriteria ID ${id}`, req.ip]
        );

        res.json({ success: true, message: 'Kriteria berhasil dihapus', data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus kriteria', errors: [error.message] });
    }
};

// --- INTERVIEW SCORE INPUT ---

const submitInterviewScore = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        // req.body.scores = { criteria_id_1: value, criteria_id_2: value }
        const { candidate_id, scores } = req.body;
        
        await conn.beginTransaction();

        // Remove old scores if exist
        await conn.query('DELETE FROM evaluations WHERE candidate_id = ?', [candidate_id]);

        // Insert new scores
        for (const [criteria_id, value] of Object.entries(scores)) {
            await conn.query(
                'INSERT INTO evaluations (candidate_id, criteria_id, value) VALUES (?, ?, ?)',
                [candidate_id, criteria_id, value]
            );
        }

        // Update candidate status to evaluated
        await conn.query('UPDATE candidates SET status = ? WHERE id = ?', ['evaluated', candidate_id]);
        
        await conn.query(
            'INSERT INTO status_history (candidate_id, status, notes, created_by) VALUES (?, ?, ?, ?)',
            [candidate_id, 'evaluated', 'Kandidat telah dievaluasi dan dinilai.', req.user.id]
        );

        await conn.commit();
        
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, `Input nilai interview pelamar ID ${candidate_id}`, req.ip]
        );

        res.json({ success: true, message: 'Nilai evaluasi berhasil disimpan', data: {} });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, message: 'Gagal menyimpan nilai', errors: [error.message] });
    } finally {
        conn.release();
    }
};

const getCandidateScores = async (req, res) => {
    try {
        const { id } = req.params;
        const [scores] = await pool.query('SELECT * FROM evaluations WHERE candidate_id = ?', [id]);
        res.json({ success: true, message: 'Nilai berhasil diambil', data: scores });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil nilai', errors: [error.message] });
    }
};

module.exports = { getAllCriteria, createCriteria, updateCriteria, deleteCriteria, submitInterviewScore, getCandidateScores };
