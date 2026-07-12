/**
 * Phase 10: Keputusan Rekrutmen - INTEGRATED
 */

let kriteria = [];
let kandidat = [];
let activeCandidateId = null;
let pendingAction = null; // 'terima' or 'tolak'

document.addEventListener('DOMContentLoaded', () => {
    fetchDecisions();
});

async function fetchDecisions() {
    try {
        const token = localStorage.getItem('adminToken');
        if(!token) throw new Error("Akses ditolak. Token tidak ditemukan.");

        const res = await fetch('/api/decision/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        
        if(json.success) {
            kandidat = json.data.kandidat;
            kriteria = json.data.kriteria;
            renderTable();
            updateSummary();
        } else {
            console.error(json.message);
        }
    } catch (err) {
        console.error("Error fetching decisions:", err);
    }
}

function getSawBadge(status) {
    if(status === 'Direkomendasikan') return '<span class="s-badge s-badge-success"><i class="fa-solid fa-circle-check me-1"></i> Rekomendasi</span>';
    if(status === 'Alternatif') return '<span class="s-badge" style="background: var(--muted); color: var(--foreground)"><i class="fa-solid fa-circle-dot me-1"></i> Alternatif</span>';
    return '<span class="s-badge s-badge-danger"><i class="fa-solid fa-circle-xmark me-1"></i> Tidak Disarankan</span>';
}

function getOwnerBadge(status) {
    if(status === 'Diterima') return '<span class="s-badge s-badge-success">Diterima</span>';
    if(status === 'Ditolak') return '<span class="s-badge s-badge-danger">Ditolak</span>';
    if(status === 'Email Terkirim') return '<span class="s-badge bg-primary text-white"><i class="fa-solid fa-envelope-circle-check me-1"></i> Email Terkirim</span>';
    return '<span class="s-badge text-warning" style="background: rgba(234, 179, 8, 0.1);"><i class="fa-regular fa-clock me-1"></i> Menunggu</span>';
}

function renderTable() {
    let html = '';
    kandidat.forEach((c, i) => {
        // Safe check for score since some candidates might not be evaluated yet if we select them early
        const scoreStr = c.score ? parseFloat(c.score).toFixed(4) : "0.0000";
        html += `
            <tr class="hover-bg-muted cursor-pointer transition-all" onclick="openDrawer(${c.id})">
                <td class="text-center font-bold">${i+1}</td>
                <td class="font-bold">${c.name}</td>
                <td class="text-center text-primary font-bold">${scoreStr}</td>
                <td class="text-center">${getSawBadge(c.sawStatus)}</td>
                <td class="text-center" id="status-${c.id}">${getOwnerBadge(c.ownerStatus)}</td>
                <td class="text-center">
                    <button class="s-btn s-btn-outline s-btn-sm" onclick="event.stopPropagation(); openDrawer(${c.id})">
                        Tinjau <i class="fa-solid fa-chevron-right ms-1 text-xs"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    if(kandidat.length === 0) {
        html = `<tr><td colspan="6" class="text-center text-muted py-4">Belum ada kandidat yang selesai dinilai SAW.</td></tr>`;
    }
    document.getElementById('tbodyKeputusan').innerHTML = html;
}

function updateSummary() {
    document.getElementById('sumTotal').textContent = kandidat.length;
    document.getElementById('sumRek').textContent = kandidat.filter(c => c.sawStatus === 'Direkomendasikan').length;
    document.getElementById('sumTerima').textContent = kandidat.filter(c => c.ownerStatus === 'Diterima' || c.ownerStatus === 'Email Terkirim').length;
    document.getElementById('sumTolak').textContent = kandidat.filter(c => c.ownerStatus === 'Ditolak').length;
    document.getElementById('sumTunggu').textContent = kandidat.filter(c => c.ownerStatus === 'Menunggu').length;
}

function openDrawer(id) {
    const c = kandidat.find(k => k.id === id);
    if(!c) return;
    
    activeCandidateId = id;
    const rank = kandidat.findIndex(k => k.id === id) + 1;
    
    document.getElementById('drwAvatar').textContent = c.name.charAt(0);
    document.getElementById('drwName').textContent = c.name;
    document.getElementById('drwContact').textContent = `${c.email} • ${c.phone}`;
    document.getElementById('drwSystemBadge').innerHTML = getSawBadge(c.sawStatus);
    document.getElementById('drwRank').textContent = `#${rank}`;
    document.getElementById('drwScore').textContent = c.score ? parseFloat(c.score).toFixed(4) : "0.0000";
    
    let tableHtml = '';
    kriteria.forEach(k => {
        let val = (c.values && c.values[k.id]) ? c.values[k.id] : 0;
        tableHtml += `<tr><td class="py-2 border-bottom border-muted">${k.name}</td><td class="py-2 border-bottom border-muted text-end font-bold">${val > 1000 ? 'Rp ' + (val/1000) + 'k' : val}</td></tr>`;
    });
    document.getElementById('drwInterviewTable').innerHTML = tableHtml;
    
    // Render footer buttons based on status
    let footerHtml = '';
    if(c.ownerStatus === 'Menunggu') {
        footerHtml = `
            <div class="d-flex gap-3">
                <button class="s-btn s-btn-danger flex-grow-1" onclick="previewEmail('tolak')"><i class="fa-solid fa-xmark me-2"></i> Tolak</button>
                <button class="s-btn s-btn-success flex-grow-1" onclick="previewEmail('terima')"><i class="fa-solid fa-check me-2"></i> Terima</button>
            </div>
        `;
    } else {
        footerHtml = `
            <div class="text-center font-bold py-2 ${c.ownerStatus === 'Diterima' ? 'text-success' : 'text-danger'}">
                <i class="fa-solid ${c.ownerStatus === 'Diterima' ? 'fa-check-circle' : 'fa-times-circle'} me-2"></i> 
                Keputusan telah dieksekusi: ${c.ownerStatus}
            </div>
        `;
    }
    document.getElementById('drwFooter').innerHTML = footerHtml;
    
    document.getElementById('drawerDetail').classList.add('active');
}

window.closeDrawer = function(e) {
    if(e && e.target !== document.getElementById('drawerDetail') && e.target !== e.currentTarget) return;
    document.getElementById('drawerDetail').classList.remove('active');
}

function previewEmail(action) {
    pendingAction = action;
    const c = kandidat.find(k => k.id === activeCandidateId);
    
    const title = document.getElementById('emailTitle');
    const subject = document.getElementById('emailSubject');
    const body = document.getElementById('emailBody');
    const btn = document.getElementById('btnSendEmail');
    
    if (action === 'terima') {
        title.innerHTML = '<i class="fa-solid fa-check-circle text-success me-2"></i> Konfirmasi Penerimaan';
        subject.textContent = 'Apakah Anda yakin ingin Menerima kandidat ini?';
        body.innerHTML = `<span class="text-success">${c.name}</span>`;
        btn.className = 's-btn s-btn-success flex-grow-1';
        btn.innerHTML = '<i class="fa-solid fa-check me-2"></i> Ya, Terima Kandidat';
    } else {
        title.innerHTML = '<i class="fa-solid fa-xmark-circle text-danger me-2"></i> Konfirmasi Penolakan';
        subject.textContent = 'Apakah Anda yakin ingin Menolak kandidat ini?';
        body.innerHTML = `<span class="text-danger">${c.name}</span>`;
        btn.className = 's-btn s-btn-danger flex-grow-1';
        btn.innerHTML = '<i class="fa-solid fa-xmark me-2"></i> Ya, Tolak Kandidat';
    }
    
    closeDrawer(); 
    document.getElementById('modalEmail').classList.add('active');
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
}

async function executeEmail() {
    const btn = document.getElementById('btnSendEmail');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i> Memproses...';
    
    try {
        const token = localStorage.getItem('adminToken');
        if(!token) throw new Error("Akses ditolak. Token tidak ditemukan.");

        const res = await fetch('/api/decision/make', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                candidate_id: activeCandidateId,
                decision: pendingAction === 'terima' ? 'accepted' : 'rejected'
            })
        });
        
        const json = await res.json();
        if(!json.success) throw new Error(json.message);
        
        // Success
        const c = kandidat.find(k => k.id === activeCandidateId);
        c.ownerStatus = pendingAction === 'terima' ? 'Diterima' : 'Ditolak';
        
        closeModal('modalEmail');
        renderTable();
        updateSummary();
        
        showToast(`<i class="fa-solid fa-check-circle text-success me-2"></i> Keputusan berhasil disimpan untuk <b>${c.name}</b>`);
        
    } catch(err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function showToast(message) {
    let toast = document.createElement('div');
    toast.className = 'saw-section'; // reuse slide up animation
    toast.style.cssText = 'position: fixed; bottom: 30px; right: 30px; background: var(--card); border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 1rem 1.5rem; border-radius: 8px; z-index: 10000; font-weight: 500; display: flex; align-items: center;';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
