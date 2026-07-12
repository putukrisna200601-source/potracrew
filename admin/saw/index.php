<?php
require_once '../includes/header.php';

// 1. Ambil data kriteria
$stmt = $pdo->query("SELECT * FROM criteria ORDER BY code ASC");
$criteria = $stmt->fetchAll();

// 2. Ambil data pelamar yang sudah dievaluasi
$stmt = $pdo->query("SELECT c.id, c.name, c.position FROM candidates c WHERE c.status IN ('evaluated', 'accepted', 'rejected') ORDER BY c.id ASC");
$candidates = $stmt->fetchAll();

// Jika belum ada pelamar yang dievaluasi
$has_data = count($candidates) > 0 && count($criteria) > 0;

$matrix_x = [];
$matrix_r = [];
$results_v = [];
$max_min = [];

if ($has_data) {
    // 3. Matriks Keputusan (X)
    foreach ($candidates as $cand) {
        $stmt_eval = $pdo->prepare("SELECT criteria_id, value FROM evaluations WHERE candidate_id = ?");
        $stmt_eval->execute([$cand['id']]);
        $evals = $stmt_eval->fetchAll(PDO::FETCH_KEY_PAIR); // [criteria_id => value]
        
        foreach ($criteria as $crit) {
            $matrix_x[$cand['id']][$crit['id']] = $evals[$crit['id']] ?? 0;
        }
    }

    // Cari nilai Max / Min per kriteria
    foreach ($criteria as $crit) {
        $values = array_column($matrix_x, $crit['id']);
        if (!empty($values)) {
            $max_min[$crit['id']]['max'] = max($values);
            $max_min[$crit['id']]['min'] = min($values) == 0 ? 1 : min($values); // avoid division by zero
        } else {
            $max_min[$crit['id']]['max'] = 1;
            $max_min[$crit['id']]['min'] = 1;
        }
    }

    // 4. Matriks Normalisasi (R) & 5. Nilai Preferensi (V)
    foreach ($candidates as $cand) {
        $v_total = 0;
        foreach ($criteria as $crit) {
            $x_val = $matrix_x[$cand['id']][$crit['id']];
            if ($x_val == 0) {
                $r_val = 0;
            } else {
                if ($crit['type'] == 'benefit') {
                    $r_val = $x_val / $max_min[$crit['id']]['max'];
                } else { // cost
                    $r_val = $max_min[$crit['id']]['min'] / $x_val;
                }
            }
            $matrix_r[$cand['id']][$crit['id']] = $r_val;
            
            // Hitung V
            $weight = $crit['weight'] / 100; // Normalisasi bobot jika total 100, opsional. Kita asumsikan total bobot 100
            $v_total += ($r_val * $crit['weight']); // Bisa juga $r_val * weight
        }
        $results_v[] = [
            'candidate_id' => $cand['id'],
            'name' => $cand['name'],
            'position' => $cand['position'],
            'score' => round($v_total, 4)
        ];
        
        // Simpan ke DB saw_results (Upsert)
        $stmt_saw = $pdo->prepare("INSERT INTO saw_results (candidate_id, final_score) VALUES (?, ?) ON DUPLICATE KEY UPDATE final_score = ?");
        $stmt_saw->execute([$cand['id'], $v_total, $v_total]);
    }

    // 6. Urutkan berdasarkan nilai tertinggi (Ranking)
    usort($results_v, function($a, $b) {
        return $b['score'] <=> $a['score'];
    });
}
?>
<script>
    document.getElementById('page-title').innerText = 'Hasil Perhitungan SAW';
</script>

<?php if (!$has_data): ?>
    <div class="alert alert-warning">Belum ada data pelamar yang dievaluasi. Silakan lakukan penilaian di menu Evaluasi terlebih dahulu.</div>
<?php else: ?>

    <ul class="nav nav-tabs mb-4" id="sawTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active fw-bold" id="ranking-tab" data-bs-toggle="tab" data-bs-target="#ranking" type="button" role="tab">Hasil Akhir (Ranking)</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link text-muted" id="matrix-x-tab" data-bs-toggle="tab" data-bs-target="#matrix-x" type="button" role="tab">Matriks Keputusan (X)</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link text-muted" id="matrix-r-tab" data-bs-toggle="tab" data-bs-target="#matrix-r" type="button" role="tab">Matriks Normalisasi (R)</button>
        </li>
    </ul>

    <div class="tab-content" id="sawTabsContent">
        <!-- Tab Ranking -->
        <div class="tab-pane fade show active" id="ranking" role="tabpanel">
            <div class="card-custom bg-white p-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold mb-0">Peringkat Pelamar Teratas</h5>
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.print()"><i class="fa-solid fa-print me-1"></i> Cetak</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-primary">
                            <tr>
                                <th>Peringkat</th>
                                <th>Nama Pelamar</th>
                                <th>Posisi</th>
                                <th>Nilai Preferensi (V)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $rank = 1; foreach($results_v as $res): ?>
                            <tr class="<?php echo $rank <= 3 ? 'table-success' : ''; ?>">
                                <td>
                                    <?php if($rank == 1): ?>
                                        <i class="fa-solid fa-medal text-warning fs-5 me-1"></i>
                                    <?php elseif($rank == 2): ?>
                                        <i class="fa-solid fa-medal text-secondary fs-5 me-1"></i>
                                    <?php elseif($rank == 3): ?>
                                        <i class="fa-solid fa-medal fs-5 me-1" style="color: #cd7f32;"></i>
                                    <?php endif; ?>
                                    <span class="fw-bold"><?php echo $rank++; ?></span>
                                </td>
                                <td class="fw-bold"><?php echo htmlspecialchars($res['name']); ?></td>
                                <td><?php echo htmlspecialchars($res['position']); ?></td>
                                <td class="fw-bold text-primary"><?php echo number_format($res['score'], 4); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab Matrix X -->
        <div class="tab-pane fade" id="matrix-x" role="tabpanel">
            <div class="card-custom bg-white p-4">
                <h5 class="fw-bold mb-4">Matriks Keputusan (X)</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Pelamar / Kriteria</th>
                                <?php foreach($criteria as $c): ?>
                                    <th><?php echo htmlspecialchars($c['code']); ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($candidates as $cand): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($cand['name']); ?></td>
                                <?php foreach($criteria as $c): ?>
                                    <td><?php echo $matrix_x[$cand['id']][$c['id']]; ?></td>
                                <?php endforeach; ?>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab Matrix R -->
        <div class="tab-pane fade" id="matrix-r" role="tabpanel">
            <div class="card-custom bg-white p-4">
                <h5 class="fw-bold mb-4">Matriks Normalisasi (R)</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Pelamar / Kriteria</th>
                                <?php foreach($criteria as $c): ?>
                                    <th><?php echo htmlspecialchars($c['code']); ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($candidates as $cand): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($cand['name']); ?></td>
                                <?php foreach($criteria as $c): ?>
                                    <td><?php echo number_format($matrix_r[$cand['id']][$c['id']], 4); ?></td>
                                <?php endforeach; ?>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

<?php endif; ?>

<?php require_once '../includes/footer.php'; ?>
