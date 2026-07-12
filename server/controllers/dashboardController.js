const pool = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        // 1. Total Applicants (Administrasi)
        const [totalRes] = await pool.query('SELECT COUNT(*) as count FROM candidates');
        const total_applicants = totalRes[0].count;

        // 2. Shortlisted (Evaluated + Accepted + Rejected from interview)
        // For simplicity, let's say Shortlisted is anyone with an evaluation
        const [shortlistRes] = await pool.query('SELECT COUNT(DISTINCT candidate_id) as count FROM evaluations');
        const shortlisted = shortlistRes[0].count;

        // 3. SAW Finished (Exists in saw_results)
        const [sawRes] = await pool.query('SELECT COUNT(*) as count FROM saw_results');
        const saw_finished = sawRes[0].count;

        // 4. Accepted
        const [acceptedRes] = await pool.query('SELECT COUNT(*) as count FROM candidates WHERE status = "accepted"');
        const accepted = acceptedRes[0].count;

        // Monthly Trend
        // Get the last 7 months of data (or all months if less)
        const [trendRes] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%b') as month, 
                MONTH(created_at) as month_num,
                YEAR(created_at) as year_num,
                COUNT(*) as count 
            FROM candidates 
            GROUP BY year_num, month_num, month
            ORDER BY year_num ASC, month_num ASC
            LIMIT 12
        `);

        // Format trend data for Chart.js
        const labels = trendRes.map(item => item.month);
        const data = trendRes.map(item => item.count);

        // Recent Activities
        // Fetch from activity_logs joined with users
        const [activityRes] = await pool.query(`
            SELECT a.action, a.created_at, u.name as user_name 
            FROM activity_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT 5
        `);
        
        // Top Candidates
        const [topCandidatesRes] = await pool.query(`
            SELECT c.full_name, c.email, s.final_score 
            FROM saw_results s
            JOIN candidates c ON s.candidate_id = c.id
            ORDER BY s.final_score DESC
            LIMIT 5
        `);

        // If activityRes is empty, we can supply some dummy data or just return empty
        // The frontend will handle it. We will map to a generic format
        const activities = activityRes.map(item => ({
            time: item.created_at,
            content: `<strong>${item.user_name || 'System'}</strong>: ${item.action}`
        }));

        // Notifications (Mapped from activities for simplicity, but can be customized)
        const notificationsData = activityRes.map((item, index) => {
            let title = 'Informasi';
            let icon = 'fa-info-circle';
            const actionLower = item.action.toLowerCase();
            
            if (actionLower.includes('mendaftar') || actionLower.includes('pelamar baru')) {
                title = 'Pelamar Baru';
                icon = 'fa-user-plus';
            } else if (actionLower.includes('saw') || actionLower.includes('perhitungan')) {
                title = 'Sistem';
                icon = 'fa-calculator';
            } else if (actionLower.includes('wawancara') || actionLower.includes('nilai')) {
                title = 'Penilaian';
                icon = 'fa-star';
            }

            return {
                id: index + 1,
                title: title,
                text: item.action,
                time: item.created_at, // Send raw timestamp, JS will format it
                read: false,
                icon: icon
            };
        });

        res.json({
            success: true,
            data: {
                funnel: {
                    total_applicants,
                    shortlisted,
                    saw_finished,
                    accepted
                },
                trend: {
                    labels: labels.length > 0 ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
                    data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0]
                },
                recent_activities: activities,
                notifications: notificationsData,
                top_candidates: topCandidatesRes
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat memuat data dashboard' });
    }
};
