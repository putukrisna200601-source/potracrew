<?php
require_once '../includes/header.php';

// Fetch Candidates
$stmt = $pdo->query("SELECT * FROM candidates ORDER BY created_at DESC");
$candidates = $stmt->fetchAll();

// Fetch Criteria
$stmt = $pdo->query("SELECT * FROM criteria ORDER BY code ASC");
$criteria = $stmt->fetchAll();

// Handle Save Evaluation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_evaluation'])) {
    $candidate_id = $_POST['candidate_id'];
    
    // Begin Transaction
    $pdo->beginTransaction();
    try {
        // Delete old evaluations for this candidate to replace
        $stmt_del = $pdo->prepare("DELETE FROM evaluations WHERE candidate_id = ?");
        $stmt_del->execute([$candidate_id]);
        
        $stmt_ins = $pdo->prepare("INSERT INTO evaluations (candidate_id, criteria_id, value) VALUES (?, ?, ?)");
        
        foreach ($criteria as $c) {
            $crit_id = $c['id'];
            if (isset($_POST['criteria'][$crit_id])) {
                $val = $_POST['criteria'][$crit_id];
                $stmt_ins->execute([$candidate_id, $crit_id, $val]);
            }
        }
        
        // Update candidate status
        $stmt_upd = $pdo->prepare("UPDATE candidates SET status = 'evaluated' WHERE id = ? AND status = 'pending'");
        $stmt_upd->execute([$candidate_id]);
        
        $pdo->commit();
        echo "<script>alert('Penilaian berhasil disimpan!'); window.location.href='index.php';</script>";
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        $error = "Terjadi kesalahan saat menyimpan penilaian: " . $e->getMessage();
    }
}
?>
<script>
    document.getElementById('page-title').innerText = 'Penilaian Wawancara / Evaluasi';
</script>

<div class="row">
    <div class="col-lg-4 mb-4">
        <div class="card-custom bg-white p-4 h-100">
            <h5 class="fw-bold mb-4">Pilih Pelamar</h5>
            <div class="list-group">
                <?php foreach($candidates as $c): ?>
                    <a href="?candidate_id=<?php echo $c['id']; ?>" class="list-group-item list-group-item-action <?php echo (isset($_GET['candidate_id']) && $_GET['candidate_id'] == $c['id']) ? 'active' : ''; ?>">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1 fw-bold"><?php echo htmlspecialchars($c['name']); ?></h6>
                            <small>
                                <?php if($c['status'] == 'pending'): ?>
                                    <span class="badge bg-warning text-dark">Pending</span>
                                <?php elseif($c['status'] == 'evaluated'): ?>
                                    <span class="badge bg-primary">Evaluated</span>
                                <?php else: ?>
                                    <span class="badge bg-secondary"><?php echo ucfirst($c['status']); ?></span>
                                <?php endif; ?>
                            </small>
                        </div>
                        <small class="text-muted"><?php echo htmlspecialchars($c['position']); ?></small>
                    </a>
                <?php endforeach; ?>
                <?php if(empty($candidates)): ?>
                    <p class="text-muted text-center">Belum ada pelamar.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="col-lg-8 mb-4">
        <div class="card-custom bg-white p-4 h-100">
            <h5 class="fw-bold mb-4">Form Penilaian</h5>
            
            <?php if(isset($error)): ?>
                <div class="alert alert-danger"><?php echo $error; ?></div>
            <?php endif; ?>
            
            <?php
            if(isset($_GET['candidate_id'])):
                $c_id = $_GET['candidate_id'];
                
                // Get candidate details
                $stmt = $pdo->prepare("SELECT * FROM candidates WHERE id = ?");
                $stmt->execute([$c_id]);
                $selected_candidate = $stmt->fetch();
                
                if($selected_candidate):
                    // Get existing evaluations
                    $stmt_eval = $pdo->prepare("SELECT criteria_id, value FROM evaluations WHERE candidate_id = ?");
                    $stmt_eval->execute([$c_id]);
                    $existing_evals = [];
                    while($row = $stmt_eval->fetch()) {
                        $existing_evals[$row['criteria_id']] = $row['value'];
                    }
            ?>
                <div class="alert alert-info mb-4">
                    Menilai pelamar: <strong><?php echo htmlspecialchars($selected_candidate['name']); ?></strong> (<?php echo htmlspecialchars($selected_candidate['position']); ?>)
                </div>
                
                <form method="POST">
                    <input type="hidden" name="candidate_id" value="<?php echo $c_id; ?>">
                    
                    <div class="row">
                        <?php foreach($criteria as $c): ?>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold"><?php echo htmlspecialchars($c['code'] . ' - ' . $c['name']); ?></label>
                                <select name="criteria[<?php echo $c['id']; ?>]" class="form-select" required>
                                    <option value="" disabled selected>Pilih Nilai</option>
                                    <?php
                                    $stmt_sub = $pdo->prepare("SELECT * FROM sub_criteria WHERE criteria_id = ? ORDER BY value DESC");
                                    $stmt_sub->execute([$c['id']]);
                                    $subs = $stmt_sub->fetchAll();
                                    foreach($subs as $s):
                                        $selected = (isset($existing_evals[$c['id']]) && $existing_evals[$c['id']] == $s['value']) ? 'selected' : '';
                                    ?>
                                        <option value="<?php echo $s['value']; ?>" <?php echo $selected; ?>>
                                            <?php echo htmlspecialchars($s['name']); ?> (Nilai: <?php echo $s['value']; ?>)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    
                    <div class="mt-4 text-end">
                        <button type="submit" name="save_evaluation" class="btn btn-primary-custom px-4">Simpan Penilaian</button>
                    </div>
                </form>
            <?php else: ?>
                <p class="text-danger">Pelamar tidak ditemukan.</p>
            <?php endif; ?>
            <?php else: ?>
                <div class="text-center text-muted py-5">
                    <i class="fa-solid fa-clipboard-user fa-4x mb-3 text-light"></i>
                    <p>Silakan pilih pelamar dari daftar di sebelah kiri untuk mulai memberikan penilaian.</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
