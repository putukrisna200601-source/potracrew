/**
 * Phase 8: Master Kriteria & Bobot
 * Real-time validation, syncing, and state management.
 */

const defaultCriteria = [
    { id: 'c1', name: 'Attitude', desc: 'Menilai sikap, etika kerja, dan profesionalisme kru.', weight: 25, type: 'benefit' },
    { id: 'c2', name: 'Kemampuan Komunikasi', desc: 'Kelancaran dalam berkomunikasi dengan tim dan klien.', weight: 20, type: 'benefit' },
    { id: 'c3', name: 'Pengalaman Event', desc: 'Jam terbang dan pengalaman di event serupa.', weight: 20, type: 'benefit' },
    { id: 'c4', name: 'Kemampuan Mengoperasikan Kamera', desc: 'Pemahaman teknis dasar kamera photobooth.', weight: 15, type: 'benefit' },
    { id: 'c5', name: 'Fleksibilitas Waktu', desc: 'Ketersediaan jadwal kerja saat weekend/hari libur.', weight: 10, type: 'benefit' },
    { id: 'c6', name: 'Honor per Event', desc: 'Ekspektasi bayaran per event.', weight: 10, type: 'cost' }
];

let currentCriteria = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('adminToken');
        const apiBase = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:3000' : '';
        const res = await fetch(`${apiBase}/api/criteria`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            currentCriteria = data.data.map(c => ({
                ...c,
                weight: parseInt(c.weight, 10) || 0
            }));
        } else {
            currentCriteria = JSON.parse(JSON.stringify(defaultCriteria));
        }
    } catch (err) {
        currentCriteria = JSON.parse(JSON.stringify(defaultCriteria));
    }
    
    renderCriteria();
    updateSummary();
});

function renderCriteria() {
    const container = document.getElementById('criteriaContainer');
    if (!container) return;

    container.innerHTML = '';

    currentCriteria.forEach((crit, index) => {
        const isBenefit = crit.type === 'benefit';
        const isCost = crit.type === 'cost';

        const card = document.createElement('div');
        card.className = 'col-12 col-md-6 col-xl-4';
        
        card.innerHTML = `
            <div class="s-card criteria-card p-4">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge bg-muted text-dark">C${index + 1}</span>
                            <h3 class="s-card-title m-0" style="font-size: 1.1rem;">${crit.name}</h3>
                        </div>
                        <p class="text-xs text-muted m-0 mt-2">${crit.desc || ''}</p>
                    </div>
                </div>

                <div class="mt-auto pt-3 border-top">
                    <!-- Type Selection -->
                    <div class="mb-3">
                        <label class="text-xs font-semibold text-muted text-uppercase letter-spacing-1 mb-2 d-block">Jenis Kriteria</label>
                        <div class="type-radio-group">
                            <label class="type-radio-label">
                                <input type="radio" name="type_${crit.id}" value="benefit" ${isBenefit ? 'checked' : ''} onchange="updateType('${crit.id}', 'benefit')">
                                <span class="type-radio-text"><i class="fa-solid fa-arrow-trend-up me-1"></i> Benefit</span>
                            </label>
                            <label class="type-radio-label">
                                <input type="radio" name="type_${crit.id}" value="cost" ${isCost ? 'checked' : ''} onchange="updateType('${crit.id}', 'cost')">
                                <span class="type-radio-text"><i class="fa-solid fa-arrow-trend-down me-1"></i> Cost</span>
                            </label>
                        </div>
                    </div>

                    <!-- Weight Slider -->
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <label class="text-xs font-semibold text-muted text-uppercase letter-spacing-1 m-0">Bobot (%)</label>
                            <div class="input-group" style="width: 100px;">
                                <input type="number" class="s-input bobot-input" id="num_${crit.id}" value="${crit.weight}" min="0" max="100" step="1" oninput="syncInput('${crit.id}', 'num')">
                                <span class="input-group-text bg-muted border-0 text-xs">%</span>
                            </div>
                        </div>
                        <input type="range" class="s-slider mt-2" id="slider_${crit.id}" min="0" max="100" step="1" value="${crit.weight}" oninput="syncInput('${crit.id}', 'slider')">
                        <div class="d-flex justify-content-between text-xs text-muted mt-1 opacity-50">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function syncInput(id, source) {
    const numInput = document.getElementById(`num_${id}`);
    const sliderInput = document.getElementById(`slider_${id}`);
    
    let val = 0;
    if (source === 'slider') {
        val = parseInt(sliderInput.value) || 0;
        numInput.value = val;
    } else {
        val = parseInt(numInput.value) || 0;
        if (val > 100) val = 100;
        if (val < 0) val = 0;
        sliderInput.value = val;
    }

    // Update state array
    const idx = currentCriteria.findIndex(c => c.id === id);
    if (idx > -1) {
        currentCriteria[idx].weight = val;
    }

    updateSummary();
}

function updateType(id, type) {
    const idx = currentCriteria.findIndex(c => c.id === id);
    if (idx > -1) {
        currentCriteria[idx].type = type;
    }
    updateSummary();
}

function updateSummary() {
    let totalWeight = 0;
    let benefitCount = 0;
    let costCount = 0;

    currentCriteria.forEach(crit => {
        totalWeight += parseInt(crit.weight, 10) || 0;
        if (crit.type === 'benefit') benefitCount++;
        if (crit.type === 'cost') costCount++;
    });

    const summaryTotal = document.getElementById('summaryTotal');
    const summaryBenefit = document.getElementById('summaryBenefit');
    const summaryCost = document.getElementById('summaryCost');
    const summaryStatusBadge = document.getElementById('summaryStatusBadge');
    const btnSave = document.getElementById('btnSave');
    const panel = document.getElementById('summaryPanel');
    
    if(!summaryTotal) return; // Prevent error if not on page

    // Update numbers
    summaryTotal.textContent = `${totalWeight}%`;
    summaryBenefit.textContent = benefitCount;
    summaryCost.textContent = costCount;

    // Validation styling
    if (totalWeight === 100) {
        summaryTotal.classList.remove('invalid');
        panel.classList.remove('invalid-state');
        
        summaryStatusBadge.className = 's-badge s-badge-success';
        summaryStatusBadge.innerHTML = '<i class="fa-solid fa-check me-1"></i> Valid';
        
        btnSave.disabled = false;
        btnSave.innerHTML = 'Simpan Perubahan';
    } else {
        summaryTotal.classList.add('invalid');
        panel.classList.add('invalid-state');
        
        summaryStatusBadge.className = 's-badge s-badge-warning';
        summaryStatusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> Tidak Valid';
        
        btnSave.disabled = true;
        
        let diff = 100 - totalWeight;
        if (diff > 0) {
            btnSave.innerHTML = `Kurang ${diff}%`;
        } else {
            btnSave.innerHTML = `Kelebihan ${Math.abs(diff)}%`;
        }
    }
}

function resetConfig() {
    if(confirm('Anda yakin ingin mengembalikan konfigurasi ke setelan awal?')) {
        currentCriteria = JSON.parse(JSON.stringify(defaultCriteria));
        renderCriteria();
        updateSummary();
    }
}

async function saveConfig() {
    const btn = document.getElementById('btnSave');
    const originalText = btn.innerHTML;
    
    // Loading State
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Menyimpan...';

    const token = localStorage.getItem('adminToken');
    const apiBase = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:3000' : '';

    try {
        // Save each criteria one by one using the existing API
        for (const crit of currentCriteria) {
            await fetch(`${apiBase}/api/criteria/${crit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: crit.code || crit.id,
                    name: crit.name,
                    weight: crit.weight,
                    type: crit.type
                })
            });
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        showToast('Konfigurasi kriteria & bobot berhasil disimpan!');
    } catch (error) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('Terjadi kesalahan saat menyimpan kriteria.');
    }
}

function showToast(message) {
    let toast = document.getElementById('kriteriaToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'kriteriaToast';
        toast.className = 's-toast';
        toast.innerHTML = `
            <div class="text-success fs-5"><i class="fa-solid fa-circle-check"></i></div>
            <div class="fw-medium text-sm" id="kriteriaToastMsg"></div>
        `;
        document.body.appendChild(toast);
    }
    
    document.getElementById('kriteriaToastMsg').textContent = message;
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    });
}
