/**
 * Admin Dashboard Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic Greeting based on Time
    const greetingElement = document.getElementById('greetingText');
    if (greetingElement) {
        const currentHour = new Date().getHours();
        let greeting = 'Halo';
        
        if (currentHour >= 4 && currentHour < 11) {
            greeting = 'Halo, Selamat Pagi';
        } else if (currentHour >= 11 && currentHour < 15) {
            greeting = 'Halo, Selamat Siang';
        } else if (currentHour >= 15 && currentHour < 18) {
            greeting = 'Halo, Selamat Sore';
        } else {
            greeting = 'Halo, Selamat Malam';
        }
        
        greetingElement.textContent = greeting;
    }

    // 2. Set Current Date in Header
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('id-ID', options);
    }

    // 2. Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('d-none');
        };

        mobileMenuBtn.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // 3. Initialize Chart.js & Dashboard Stats
    const chartCanvas = document.getElementById('applicantsChart');
    if (chartCanvas && typeof Chart !== 'undefined') {
        const ctx = chartCanvas.getContext('2d');
        
        // Define PotraCrew theme colors
        const primaryColor = '#2563EB'; // tailwind blue-600
        const primaryColorLight = 'rgba(37, 99, 235, 0.1)';
        const gridColor = '#F1F5F9'; // slate-100
        const textColor = '#64748B'; // slate-500

        // Create empty chart first
        const applicantsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Pelamar',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: primaryColor,
                    backgroundColor: primaryColorLight,
                    borderWidth: 2,
                    tension: 0.4, // smooth curves
                    fill: true,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: primaryColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend for clean look
                    },
                    tooltip: {
                        backgroundColor: '#0F172A',
                        padding: 12,
                        titleFont: { family: 'Inter', size: 13 },
                        bodyFont: { family: 'Inter', size: 13 },
                        displayColors: false,
                        cornerRadius: 8,
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            font: { family: 'Inter', size: 11 },
                            color: textColor
                        }
                    },
                    y: {
                        grid: {
                            color: gridColor,
                            drawBorder: false,
                            borderDash: [5, 5]
                        },
                        ticks: {
                            font: { family: 'Inter', size: 11 },
                            color: textColor,
                            stepSize: 20
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                }
            }
        });

        // Fetch Real Data
        const apiBase = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:3000' : '';
        const token = localStorage.getItem('adminToken');
        fetch(`${apiBase}/api/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if(data.success && data.data) {
                    // Update Chart
                    applicantsChart.data.labels = data.data.trend.labels;
                    applicantsChart.data.datasets[0].data = data.data.trend.data;
                    applicantsChart.update();

                    // Update Funnel
                    const funnel = data.data.funnel;
                    const realTotal = funnel.total_applicants || 0;
                    const divisor = realTotal > 0 ? realTotal : 1; // avoid div by 0 for percentages

                    const p1 = Math.round((realTotal / divisor) * 100) || 0;
                    const p2 = Math.round((funnel.shortlisted / divisor) * 100) || 0;
                    const p3 = Math.round((funnel.saw_finished / divisor) * 100) || 0;
                    const p4 = Math.round((funnel.accepted / divisor) * 100) || 0;

                    document.getElementById('funnelPercent1').textContent = `${realTotal} (${p1}%)`;
                    document.getElementById('funnelBar1').style.width = `${p1}%`;

                    document.getElementById('funnelPercent2').textContent = `${funnel.shortlisted} (${p2}%)`;
                    document.getElementById('funnelBar2').style.width = `${p2}%`;

                    document.getElementById('funnelPercent3').textContent = `${funnel.saw_finished} (${p3}%)`;
                    document.getElementById('funnelBar3').style.width = `${p3}%`;

                    document.getElementById('funnelPercent4').textContent = `${funnel.accepted} (${p4}%)`;
                    document.getElementById('funnelBar4').style.width = `${p4}%`;



                    // Update Top Candidates Table
                    const topCandidates = data.data.top_candidates;
                    const tableBody = document.querySelector('.s-table tbody');
                    if (tableBody && topCandidates) {
                        tableBody.innerHTML = '';
                        if (topCandidates.length === 0) {
                            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Belum ada data perhitungan SAW</td></tr>';
                        } else {
                            topCandidates.forEach((cand, index) => {
                                const rankClass = index === 0 ? 'text-primary font-bold' : 'text-muted font-bold';
                                const initials = cand.full_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                                let badgeHTML = '';
                                
                                if (cand.final_score >= 0.8) {
                                    badgeHTML = '<span class="s-badge s-badge-success">Direkomendasikan</span>';
                                } else if (cand.final_score >= 0.75) {
                                    badgeHTML = '<span class="s-badge s-badge-primary">Pertimbangkan</span>';
                                } else {
                                    badgeHTML = '<span class="s-badge s-badge-default">Standar</span>';
                                }
                                
                                const html = `
                                    <tr>
                                        <td class="${rankClass}">#${index + 1}</td>
                                        <td>
                                            <div class="cand-info">
                                                <div class="cand-avatar">${initials}</div>
                                                <div>
                                                    <div class="cand-name">${cand.full_name}</div>
                                                    <div class="cand-email">${cand.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="font-medium">${Number(cand.final_score).toFixed(3)}</td>
                                        <td>${badgeHTML}</td>
                                    </tr>
                                `;
                                tableBody.insertAdjacentHTML('beforeend', html);
                            });
                        }
                    }

                }
            })
            .catch(err => console.error('Error fetching dashboard stats:', err));
    }
});

// Initial badge check
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadData();
});

// ==========================================
// API INTEGRATION LOGIC
// ==========================================

async function checkAuthAndLoadData() {
    // Abaikan auth check di halaman login
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('forgot.html')) {
        return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load admin profile data
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const avatarEl = document.querySelector('.profile-avatar');
    if (avatarEl && adminData.username) {
        avatarEl.textContent = adminData.username.charAt(0).toUpperCase();
        avatarEl.title = adminData.username;
    }
    
    // Set up logout button
    const logoutBtn = document.querySelector('a.sidebar-nav-item.text-danger');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = 'login.html';
        });
    }

    // Jika di Dashboard (index.html)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/')) {
        await loadDashboardStats(token);
    }
}

async function loadDashboardStats(token) {
    try {
        const res = await fetch('/api/decision/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            window.location.href = 'login.html';
            return;
        }

        const data = await res.json();
        
        if (data.success) {
            const stats = data.data;
            
            // Update KPI
            const elTotal = document.getElementById('kpiTotal');
            const elEval = document.getElementById('kpiEvaluated');
            const elAcc = document.getElementById('kpiAccepted');
            const elRej = document.getElementById('kpiRejected');
            
            if (elTotal) elTotal.textContent = stats.total;
            if (elEval) elEval.textContent = stats.evaluated;
            if (elAcc) elAcc.textContent = stats.accepted;
            if (elRej) elRej.textContent = stats.rejected;
            
            // Update Top 5 Table
            const tbody = document.querySelector('.s-table tbody');
            if (tbody) {
                tbody.innerHTML = '';
                
                if (stats.topCandidates.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Belum ada kandidat yang dihitung SAW</td></tr>`;
                } else {
                    stats.topCandidates.forEach((cand, idx) => {
                        let badgeClass = 's-badge-default';
                        let badgeText = 'Standar';
                        
                        if (cand.status === 'Accepted') {
                            badgeClass = 's-badge-success';
                            badgeText = 'Diterima';
                        } else if (cand.status === 'Rejected') {
                            badgeClass = 's-badge-danger';
                            badgeText = 'Ditolak';
                        } else if (idx < 2) { // Top 2 automatically recommended (visual only)
                            badgeClass = 's-badge-success';
                            badgeText = 'Direkomendasikan';
                        }
                        
                        let initial = cand.full_name.charAt(0).toUpperCase();
                        
                        tbody.innerHTML += `
                            <tr>
                                <td class="font-bold text-muted">#${idx + 1}</td>
                                <td>
                                    <div class="cand-info">
                                        <div class="cand-avatar">${initial}</div>
                                        <div>
                                            <div class="cand-name">${cand.full_name}</div>
                                            <div class="cand-email">${cand.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="font-medium">${Number(cand.saw_score || cand.final_score || 0).toFixed(3)}</td>
                                <td><span class="s-badge ${badgeClass}">${badgeText}</span></td>
                            </tr>
                        `;
                    });
                }
            }

            // Update Recent Activities
            // Update Recent Activities
            const timeline = document.getElementById('recentActivitiesTimeline');
            if (timeline && stats.activities) {
                timeline.innerHTML = '';
                if (stats.activities.length === 0) {
                    timeline.innerHTML = `<div class="text-center text-muted py-4">Belum ada aktivitas.</div>`;
                } else {
                    stats.activities.forEach(act => {
                        const dateObj = new Date(act.created_at);
                        const timeStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
                        timeline.innerHTML += `
                            <div class="timeline-item">
                                <div class="timeline-time">${timeStr}</div>
                                <div class="timeline-content"><strong>${act.name || 'System'}</strong>: ${act.action}</div>
                            </div>
                        `;
                    });
                }
            }
        }
    } catch (err) {
        console.error("Failed to load dashboard:", err);
    }
}

// Logic untuk Data Pelamar
if (window.location.pathname.endsWith('data_pelamar.html')) {
    document.addEventListener('DOMContentLoaded', loadApplicantsData);
}

async function loadApplicantsData() {
    const token = localStorage.getItem('adminToken');
    if(!token) return;
    
    try {
        const res = await fetch('/api/applicants', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const applicants = data.data;
            const tbody = document.getElementById('tableBody');
            const emptyState = document.getElementById('emptyState');
            
            // KPI mapping based on status
            let total = applicants.length;
            let waiting = applicants.filter(a => a.status === 'Pending').length;
            let passed = applicants.filter(a => a.status === 'Interviewed').length;
            let failed = applicants.filter(a => a.status === 'Rejected').length;
            
            if(document.getElementById('val-total')) document.getElementById('val-total').textContent = total;
            if(document.getElementById('val-waiting')) document.getElementById('val-waiting').textContent = waiting;
            if(document.getElementById('val-passed')) document.getElementById('val-passed').textContent = passed;
            if(document.getElementById('val-failed')) document.getElementById('val-failed').textContent = failed;
            
            if (applicants.length === 0) {
                if(tbody) tbody.innerHTML = '';
                if(emptyState) emptyState.classList.remove('d-none');
            } else {
                if(emptyState) emptyState.classList.add('d-none');
                if(tbody) {
                    tbody.innerHTML = '';
                    applicants.forEach(app => {
                        let badgeClass, badgeText;
                        if(app.status === 'Pending') { badgeClass = 's-badge-warning'; badgeText = 'Menunggu'; }
                        else if(app.status === 'Interviewed') { badgeClass = 's-badge-success'; badgeText = 'Sudah Wawancara'; }
                        else if(app.status === 'Evaluated') { badgeClass = 's-badge-indigo'; badgeText = 'Sudah SAW'; }
                        else if(app.status === 'Accepted') { badgeClass = 's-badge-success'; badgeText = 'Diterima'; }
                        else if(app.status === 'Rejected') { badgeClass = 's-badge-danger'; badgeText = 'Ditolak'; }
                        else { badgeClass = 's-badge-default'; badgeText = app.status; }
                        
                        let initial = app.full_name.charAt(0).toUpperCase();
                        let honor = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(app.expected_honor);
                        
                        // Parse age from dob
                        let dob = new Date(app.dob);
                        let ageDifMs = Date.now() - dob.getTime();
                        let ageDate = new Date(ageDifMs);
                        let age = Math.abs(ageDate.getUTCFullYear() - 1970);
                        
                        let dateApplied = new Date(app.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

                        tbody.innerHTML += `
                            <tr>
                                <td data-label="Kandidat">
                                    <div class="cand-info">
                                        <div class="cand-avatar">${initial}</div>
                                        <div>
                                            <div class="cand-name font-medium">${app.full_name}</div>
                                            <div class="cand-email text-xs text-muted">${app.email} <br> ${app.whatsapp}</div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Umur">${age} Tahun</td>
                                <td data-label="Pendidikan">${app.education}</td>
                                <td data-label="Honor per Event" class="font-medium">${honor}</td>
                                <td data-label="Tanggal Melamar" class="text-muted">${dateApplied}</td>
                                <td data-label="Status"><span class="s-badge ${badgeClass}"><span class="status-dot"></span> ${badgeText}</span></td>
                                <td class="text-end">
                                    <button class="s-btn s-btn-outline s-btn-sm" onclick="window.location.href='detail_pelamar.html?id=${app.id}'">Lihat Detail</button>
                                </td>
                            </tr>
                        `;
                    });
                }
            }
        }
    } catch(err) {
        console.error(err);
    }
}

// Logic untuk Penilaian Wawancara (Daftar Pelamar yg Lolos Admin)
if (window.location.pathname.endsWith('penilaian.html')) {
    document.addEventListener('DOMContentLoaded', loadPenilaianData);
}

async function loadPenilaianData() {
    const token = localStorage.getItem('adminToken');
    if(!token) return;
    
    try {
        const res = await fetch('/api/applicants', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const applicants = data.data.filter(a => a.status === 'Interviewed' || a.status === 'Evaluated');
            const tbody = document.getElementById('tableBody');
            const emptyState = document.getElementById('emptyState');
            
            if (applicants.length === 0) {
                if(tbody) tbody.innerHTML = '';
                if(emptyState) emptyState.classList.remove('d-none');
            } else {
                if(emptyState) emptyState.classList.add('d-none');
                if(tbody) {
                    tbody.innerHTML = '';
                    applicants.forEach(app => {
                        let badgeClass, badgeText, btnHtml;
                        
                        if(app.status === 'Interviewed') { 
                            badgeClass = 's-badge-indigo'; 
                            badgeText = 'Menunggu Interview'; 
                            btnHtml = `<a href="penilaian_interview.html?id=${app.id}" class="s-btn s-btn-primary s-btn-sm d-inline-flex align-items-center gap-2"><i class="fa-solid fa-clipboard-user"></i> Nilai</a>`;
                        }
                        else if(app.status === 'Evaluated') { 
                            badgeClass = 's-badge-success'; 
                            badgeText = 'Penilaian Selesai'; 
                            btnHtml = `<button class="s-btn s-btn-outline s-btn-sm d-inline-flex align-items-center gap-2" disabled><i class="fa-solid fa-check"></i> Selesai</button>`;
                        }
                        
                        let initial = app.full_name.charAt(0).toUpperCase();
                        let honor = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(app.expected_honor);
                        
                        let dob = new Date(app.dob);
                        let ageDifMs = Date.now() - dob.getTime();
                        let ageDate = new Date(ageDifMs);
                        let age = Math.abs(ageDate.getUTCFullYear() - 1970);
                        
                        let dateApplied = new Date(app.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

                        tbody.innerHTML += `
                            <tr>
                                <td data-label="Kandidat">
                                    <div class="cand-info">
                                        <div class="cand-avatar">${initial}</div>
                                        <div>
                                            <div class="cand-name font-medium">${app.full_name}</div>
                                            <div class="cand-email text-xs text-muted">${app.email} <br> ${app.whatsapp}</div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Umur">${age} Tahun</td>
                                <td data-label="Pendidikan">${app.education}</td>
                                <td data-label="Honor per Event" class="font-medium">${honor}</td>
                                <td data-label="Tanggal Melamar" class="text-muted">${dateApplied}</td>
                                <td data-label="Status"><span class="s-badge ${badgeClass}"><span class="status-dot"></span> ${badgeText}</span></td>
                                <td class="text-end">${btnHtml}</td>
                            </tr>
                        `;
                    });
                }
            }
        }
    } catch(err) {
        console.error(err);
    }
}
