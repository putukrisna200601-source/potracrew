/**
 * Phase 9: Perhitungan SAW (Explainable AI) - INTEGRATED
 */

let apiData = null;

document.addEventListener('DOMContentLoaded', () => {
    //
});

async function startCalculation() {
    const btnStart = document.getElementById('btnStartSAW');
    const btnRecompute = document.getElementById('btnRecompute');
    const initialState = document.getElementById('initialState');
    const overlay = document.getElementById('loadingOverlay');
    const results = document.getElementById('resultsContainer');
    
    // UI Reset
    if(btnStart) { 
        btnStart.disabled = true; 
        btnStart.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Memproses...'; 
    }
    if(btnRecompute) { 
        btnRecompute.disabled = true; 
        btnRecompute.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Memproses...'; 
    }
    if(initialState) initialState.classList.add('d-none');
    results.classList.add('d-none');
    overlay.classList.remove('d-none');
    
    // Reset steps UI
    for (let i = 1; i <= 7; i++) {
        const el = document.getElementById(`step${i}`);
        if(el) {
            el.classList.remove('active', 'completed');
            el.querySelector('i').className = 'fa-regular fa-circle';
        }
    }

    try {
        const token = localStorage.getItem('adminToken');
        if(!token) throw new Error("Akses ditolak. Token tidak ditemukan.");
        
        const apiBase = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501') ? 'http://localhost:3000' : '';

        const res = await fetch(`${apiBase}/api/saw/calculate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        
        if(!json.success) throw new Error(json.message || "Gagal menghitung SAW");
        
        apiData = json.data;
        
        let currentStep = 1;
        const interval = setInterval(() => {
            if (currentStep > 1) {
                const prev = document.getElementById(`step${currentStep - 1}`);
                if(prev) {
                    prev.classList.remove('active');
                    prev.classList.add('completed');
                    prev.querySelector('i').className = 'fa-solid fa-circle-check text-success';
                }
            }
            
            if (currentStep <= 7) {
                const curr = document.getElementById(`step${currentStep}`);
                if(curr) {
                    curr.classList.add('active');
                    curr.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin text-primary';
                }
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    overlay.classList.add('d-none');
                    renderAllTables();
                    results.classList.remove('d-none');
                    if(btnRecompute) { 
                        btnRecompute.classList.remove('d-none'); 
                        btnRecompute.disabled = false; 
                        btnRecompute.innerHTML = '<i class="fa-solid fa-rotate me-2"></i> Hitung Ulang'; 
                    }
                }, 500); 
            }
        }, 500); 
    } catch(err) {
        showToast(err.message, 'danger');
        if(btnStart) { 
            btnStart.disabled = false; 
            btnStart.innerHTML = '<i class="fa-solid fa-calculator me-2"></i> Mulai Perhitungan SAW'; 
        }
        if(btnRecompute) { 
            btnRecompute.disabled = false; 
            btnRecompute.innerHTML = '<i class="fa-solid fa-rotate me-2"></i> Hitung Ulang'; 
        }
        overlay.classList.add('d-none');
        if(initialState) initialState.classList.remove('d-none');
    }
}

function showToast(message, type = 'primary') {
    // Remove existing toast if any
    const existing = document.querySelector('.realtime-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'realtime-toast';
    
    // Change border color based on type
    if (type === 'danger') toast.style.borderLeftColor = 'var(--destructive)';
    if (type === 'success') toast.style.borderLeftColor = 'var(--success)';
    if (type === 'warning') toast.style.borderLeftColor = 'var(--warning)';

    toast.innerHTML = `
        <div class="toast-icon text-${type}">
            <i class="fa-solid ${type === 'danger' ? 'fa-circle-exclamation' : 'fa-info-circle'} fa-lg"></i>
        </div>
        <div class="toast-content flex-grow-1">
            <h4 class="font-bold text-sm mb-1">Informasi Sistem</h4>
            <p class="text-xs text-muted m-0">${message}</p>
        </div>
        <button class="icon-btn btn-micro" onclick="this.parentElement.classList.remove('show'); setTimeout(() => this.parentElement.remove(), 400)">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

function renderAllTables() {
    if(!apiData) return;
    
    const kriteria = apiData.criteria;
    const results = apiData.results; // array of { candidate_id, full_name, expected_honor, raw, normalized, weighted, final_score, rank }
    
    document.getElementById('resTotalPelamar').textContent = results.length;
    document.getElementById('resTotalKriteria').textContent = kriteria.length;
    document.getElementById('resBenefit').textContent = kriteria.filter(k => k.type === 'benefit').length;
    document.getElementById('resCost').textContent = kriteria.filter(k => k.type === 'cost').length;
    document.getElementById('resTanggal').textContent = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    const buildThead = () => {
        let html = `<th width="40">No</th><th>Nama Kandidat</th>`;
        kriteria.forEach(k => { html += `<th class="text-center">${k.code}</th>`; });
        return html;
    };

    // 1. Matriks (Raw)
    document.getElementById('theadMatriks').innerHTML = buildThead();
    let xHtml = '';
    results.forEach((c, i) => {
        xHtml += `<tr><td>${i+1}</td><td class="font-medium">${c.full_name}</td>`;
        kriteria.forEach(k => { 
            const val = c.raw[k.id] || 0;
            xHtml += `<td class="text-center">${val > 1000 ? (val/1000)+'k' : val}</td>`; 
        });
        xHtml += `</tr>`;
    });
    document.getElementById('tbodyMatriks').innerHTML = xHtml;

    // 2. Normalisasi
    document.getElementById('theadNormalisasi').innerHTML = buildThead();
    let rHtml = '';
    results.forEach((c, i) => {
        rHtml += `<tr><td>${i+1}</td><td class="font-medium">${c.full_name}</td>`;
        kriteria.forEach(k => { 
            const val = c.normalized[k.id] || 0;
            rHtml += `<td class="text-center">${val.toFixed(3)}</td>`; 
        });
        rHtml += `</tr>`;
    });
    document.getElementById('tbodyNormalisasi').innerHTML = rHtml;

    // 3. Bobot Preferensi
    document.getElementById('theadBobot').innerHTML = buildThead();
    let yHtml = '';
    results.forEach((c, i) => {
        yHtml += `<tr><td>${i+1}</td><td class="font-medium">${c.full_name}</td>`;
        kriteria.forEach(k => { 
            const val = c.weighted[k.id] || 0;
            yHtml += `<td class="text-center">${val.toFixed(3)}</td>`; 
        });
        yHtml += `</tr>`;
    });
    document.getElementById('tbodyBobot').innerHTML = yHtml;

    // 4. Ranking
    let vHtml = '';
    results.forEach((c) => {
        const rank = c.rank;
        let badge = rank === 1 ? `<span class="s-badge s-badge-success"><i class="fa-solid fa-star me-1"></i> Rekomendasi</span>` : 
                    rank === 2 ? `<span class="s-badge" style="background: var(--muted); color: var(--foreground)">Alternatif</span>` : 
                    `<span class="text-muted text-sm">-</span>`;
        
        let rankMedal = rank === 1 ? `<div class="rank-circle bg-warning text-white font-bold mx-auto" style="width: 28px; height: 28px; display:flex; align-items:center; justify-content:center; border-radius:50%">1</div>` :
                        rank === 2 ? `<div class="rank-circle bg-muted text-dark font-bold mx-auto" style="width: 28px; height: 28px; display:flex; align-items:center; justify-content:center; border-radius:50%">2</div>` :
                        `<div class="text-center text-muted">${rank}</div>`;

        vHtml += `
            <tr class="${rank === 1 ? 'bg-primary-subtle' : ''}">
                <td class="text-center">${rankMedal}</td>
                <td class="font-bold">${c.full_name}</td>
                <td class="text-end font-bold text-primary">${c.final_score}</td>
                <td class="text-center">${badge}</td>
            </tr>
        `;
    });
    document.getElementById('tbodyRanking').innerHTML = vHtml;

    if(results.length > 0) {
        const winner = results[0];
        document.getElementById('winnerAvatar').textContent = winner.full_name.charAt(0);
        document.getElementById('winnerName').textContent = winner.full_name;
        document.getElementById('winnerScore').textContent = winner.final_score;
        document.getElementById('winnerReason').innerHTML = `<b>${winner.full_name}</b> direkomendasikan karena berhasil meraih <b>Nilai Akhir tertinggi (${winner.final_score})</b>. Sistem menyimpulkan kandidat ini paling unggul dan stabil di berbagai kriteria.`;
    } else {
        document.getElementById('winnerName').textContent = "Belum Ada Data";
        document.getElementById('winnerScore').textContent = "0";
        document.getElementById('winnerReason').textContent = "Belum ada data evaluasi untuk dianalisis.";
    }
}

function showRumusModal(type) {
    const title = document.getElementById('rumusTitle');
    const body = document.getElementById('rumusBody');
    
    if (type === 'matriks') {
        title.innerHTML = '<i class="fa-solid fa-table text-primary me-2"></i> Konsep Matriks Keputusan';
        body.innerHTML = `
            <div class="math-formula-box mb-4 p-4 text-center border rounded" style="background: var(--background);">
                <div class="font-math text-2xl">X = [ X<sub>ij</sub> ]</div>
            </div>
            <div class="text-sm text-muted mb-4">
                <ul class="ps-3 mb-0" style="text-align: left;">
                    <li class="mb-2"><b>X</b> = Matriks Keputusan</li>
                    <li class="mb-2"><b>i</b> = Baris (menunjukkan alternatif / pelamar ke-i)</li>
                    <li><b>j</b> = Kolom (menunjukkan kriteria ke-j)</li>
                </ul>
            </div>
            <div class="rounded p-3 text-sm" style="background: var(--muted); color: var(--foreground);">
                Tahap pertama dalam SAW adalah menyusun nilai-nilai evaluasi mentah dari setiap pelamar ke dalam bentuk matriks dua dimensi. Tidak ada operasi aritmatika yang terjadi pada langkah ini.
            </div>
        `;
    } else if (type === 'bobot') {
        title.innerHTML = '<i class="fa-solid fa-xmark text-primary me-2"></i> Rumus Perkalian Bobot';
        body.innerHTML = `
            <div class="math-formula-box mb-4 p-4 text-center border rounded" style="background: var(--background);">
                <div class="font-math text-2xl">Y<sub>ij</sub> = W<sub>j</sub> &times; R<sub>ij</sub></div>
            </div>
            <div class="text-sm text-muted mb-4">
                <ul class="ps-3 mb-0" style="text-align: left;">
                    <li class="mb-2"><b>Y<sub>ij</sub></b> = Nilai matriks ternormalisasi yang terbobot</li>
                    <li class="mb-2"><b>W<sub>j</sub></b> = Bobot referensi dari kriteria ke-j (dalam desimal)</li>
                    <li><b>R<sub>ij</sub></b> = Nilai normalisasi matriks untuk pelamar ke-i pada kriteria ke-j</li>
                </ul>
            </div>
            <div class="rounded p-3 text-sm" style="background: var(--muted); color: var(--foreground);">
                <b>Contoh Kasus:</b><br>
                Jika bobot C1 adalah 25% (0.25) dan nilai R pada C1 adalah 0.944.<br>
                Maka Y = 0.25 &times; 0.944 = <b>0.236</b>
            </div>
        `;
    } else if (type === 'normalisasi') {
        title.innerHTML = '<i class="fa-solid fa-square-root-variable text-primary me-2"></i> Rumus Normalisasi';
        body.innerHTML = `
            <div class="math-formula-box mb-4 p-4 border rounded" style="background: var(--background);">
                <div class="mb-3">
                    <span class="s-badge s-badge-success mb-2">Benefit</span>
                    <div class="font-math text-lg d-flex align-items-center">R<sub>ij</sub> &nbsp;=&nbsp; 
                        <div class="d-inline-flex flex-column text-center align-items-center" style="vertical-align: middle;">
                            <span style="border-bottom: 1px solid var(--foreground); padding: 0 4px;">X<sub>ij</sub></span>
                            <span>Max(X<sub>ij</sub>)</span>
                        </div>
                    </div>
                    <p class="text-sm text-muted mt-2">Untuk kriteria Benefit (keuntungan), nilai pelamar dibagi dengan nilai tertinggi dari seluruh pelamar.</p>
                </div>
                <div class="border-top pt-3">
                    <span class="s-badge s-badge-danger mb-2">Cost</span>
                    <div class="font-math text-lg d-flex align-items-center">R<sub>ij</sub> &nbsp;=&nbsp; 
                        <div class="d-inline-flex flex-column text-center align-items-center" style="vertical-align: middle;">
                            <span style="border-bottom: 1px solid var(--foreground); padding: 0 4px;">Min(X<sub>ij</sub>)</span>
                            <span>X<sub>ij</sub></span>
                        </div>
                    </div>
                    <p class="text-sm text-muted mt-2">Untuk kriteria Cost (biaya), nilai terendah dari seluruh pelamar dibagi dengan nilai pelamar.</p>
                </div>
            </div>
        `;
    } else if (type === 'preferensi') {
        title.innerHTML = '<i class="fa-solid fa-trophy text-warning me-2"></i> Rumus Nilai Preferensi';
        body.innerHTML = `
            <div class="math-formula-box mb-4 p-4 text-center border rounded" style="background: var(--background);">
                <div class="font-math text-2xl">V<sub>i</sub> = &sum; (W<sub>j</sub> &times; R<sub>ij</sub>)</div>
            </div>
            <div class="text-sm text-muted mb-4">
                <ul class="ps-3 mb-0" style="text-align: left;">
                    <li class="mb-2"><b>V<sub>i</sub></b> = Nilai akhir (preferensi) untuk pelamar ke-i</li>
                    <li class="mb-2"><b>W<sub>j</sub></b> = Bobot kriteria ke-j (persentase)</li>
                    <li><b>R<sub>ij</sub></b> = Nilai normalisasi matriks untuk pelamar ke-i pada kriteria ke-j</li>
                </ul>
            </div>
            <div class="rounded p-3 text-sm" style="background: var(--muted); color: var(--foreground);">
                Nilai akhir merupakan total penjumlahan dari setiap kriteria (setelah dikalikan bobotnya). Pelamar dengan nilai akhir terbesar otomatis menempati peringkat pertama.
            </div>
        `;
    }
    
    document.getElementById('modalRumus').classList.add('active');
}

window.showRumusModal = showRumusModal;
window.startCalculation = startCalculation;
window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
};
