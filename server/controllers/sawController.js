const pool = require('../config/db');

const calculateSAW = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Ambil kriteria aktif
        const [criteriaRows] = await conn.query('SELECT * FROM criteria');
        if (criteriaRows.length === 0) {
            throw new Error('Kriteria belum diatur.');
        }

        // 2. Ambil pelamar yang statusnya 'evaluated'
        const [candidatesRows] = await conn.query('SELECT id, full_name, expected_honor FROM candidates WHERE status = "evaluated"');
        if (candidatesRows.length === 0) {
            throw new Error('Tidak ada pelamar yang siap dihitung (belum dievaluasi).');
        }

        // 3. Ambil data nilai evaluasi
        const [evaluationsRows] = await conn.query('SELECT * FROM evaluations');

        // Struktur data raw score: candidate_id -> { criteria_id -> value }
        const rawScores = {};
        candidatesRows.forEach(c => {
            rawScores[c.id] = {};
            // Inisialisasi default 0 jika ada yang terlewat
            criteriaRows.forEach(cr => { rawScores[c.id][cr.id] = 0; });
        });

        evaluationsRows.forEach(ev => {
            if (rawScores[ev.candidate_id]) {
                rawScores[ev.candidate_id][ev.criteria_id] = ev.value;
            }
        });

        // 4. Cari Max / Min untuk normalisasi
        const minMax = {};
        criteriaRows.forEach(cr => {
            let values = candidatesRows.map(c => rawScores[c.id][cr.id]);
            if (cr.type === 'benefit') {
                minMax[cr.id] = Math.max(...values);
            } else {
                minMax[cr.id] = Math.min(...values);
            }
            // Mencegah division by zero
            if (minMax[cr.id] === 0) minMax[cr.id] = 1;
        });

        // 5. Normalisasi
        const normalizedScores = {};
        candidatesRows.forEach(c => {
            normalizedScores[c.id] = {};
            criteriaRows.forEach(cr => {
                let val = rawScores[c.id][cr.id];
                if (cr.type === 'benefit') {
                    normalizedScores[c.id][cr.id] = val / minMax[cr.id];
                } else {
                    normalizedScores[c.id][cr.id] = minMax[cr.id] / val;
                }
            });
        });

        // 6. Hitung Bobot Preferensi
        const finalResults = [];
        
        // Hapus hasil perhitungan lama sebelum menyimpan yang baru
        await conn.query('DELETE FROM saw_results');

        for (const c of candidatesRows) {
            let finalScore = 0;
            const detailWeighted = {};

            for (const cr of criteriaRows) {
                // Konversi weight dari persentase (misal 30) ke desimal (0.3)
                const weightDec = parseFloat(cr.weight) / 100;
                const weightedVal = normalizedScores[c.id][cr.id] * weightDec;
                
                finalScore += weightedVal;
                detailWeighted[cr.id] = weightedVal;
            }

            finalResults.push({
                candidate_id: c.id,
                full_name: c.full_name,
                expected_honor: c.expected_honor,
                raw: rawScores[c.id],
                normalized: normalizedScores[c.id],
                weighted: detailWeighted,
                final_score: finalScore.toFixed(4)
            });

            // 7. Simpan ke saw_results
            await conn.query(
                'INSERT INTO saw_results (candidate_id, final_score) VALUES (?, ?) ON DUPLICATE KEY UPDATE final_score = ?',
                [c.id, finalScore, finalScore]
            );
        }

        // 8. Urutkan berdasarkan skor akhir tertinggi (Ranking)
        finalResults.sort((a, b) => b.final_score - a.final_score);

        // Tambahkan atribut rank
        finalResults.forEach((res, idx) => {
            res.rank = idx + 1;
        });

        await conn.commit();
        
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, 'Melakukan perhitungan SAW dan Ranking', req.ip]
        );

        res.json({
            success: true,
            message: 'Perhitungan SAW berhasil dilakukan',
            data: {
                criteria: criteriaRows,
                results: finalResults
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('SAW Error:', error);
        res.status(500).json({ success: false, message: 'Gagal melakukan perhitungan SAW', errors: [error.message] });
    } finally {
        conn.release();
    }
};

module.exports = { calculateSAW };
