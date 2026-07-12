<?php
require_once '../includes/header.php';

// Handle Status Update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $candidate_id = $_POST['candidate_id'];
    $status = $_POST['status'];
    
    $stmt = $pdo->prepare("UPDATE candidates SET status = ? WHERE id = ?");
    if ($stmt->execute([$status, $candidate_id])) {
        echo "<script>alert('Status berhasil diubah!'); window.location.href='index.php';</script>";
        exit;
    }
}

$stmt = $pdo->query("SELECT * FROM candidates ORDER BY created_at DESC");
$candidates = $stmt->fetchAll();
?>
<script>
    document.getElementById('page-title').innerText = 'Data Pelamar';
</script>

<div class="card-custom bg-white p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="fw-bold mb-0">Daftar Pelamar</h5>
    </div>

    <div class="table-responsive">
        <table class="table table-hover align-middle">
            <thead class="table-light">
                <tr>
                    <th>No</th>
                    <th>Nama Lengkap</th>
                    <th>Posisi</th>
                    <th>File CV / Portofolio</th>
                    <th>Status</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php $no=1; foreach($candidates as $c): ?>
                <tr>
                    <td><?php echo $no++; ?></td>
                    <td>
                        <div class="fw-bold"><?php echo htmlspecialchars($c['name']); ?></div>
                        <div class="small text-muted"><i class="fa-solid fa-envelope me-1"></i><?php echo htmlspecialchars($c['email']); ?></div>
                        <div class="small text-muted"><i class="fa-brands fa-whatsapp me-1"></i><?php echo htmlspecialchars($c['phone']); ?></div>
                    </td>
                    <td><?php echo htmlspecialchars($c['position']); ?></td>
                    <td>
                        <a href="<?php echo base_url('assets/uploads/'.$c['cv_file']); ?>" target="_blank" class="btn btn-sm btn-outline-primary mb-1"><i class="fa-solid fa-file-pdf me-1"></i> CV</a>
                        <?php if($c['portfolio_file']): ?>
                            <a href="<?php echo base_url('assets/uploads/'.$c['portfolio_file']); ?>" target="_blank" class="btn btn-sm btn-outline-info mb-1"><i class="fa-solid fa-file-image me-1"></i> Portofolio</a>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if($c['status'] == 'pending'): ?>
                            <span class="badge badge-pending">Pending</span>
                        <?php elseif($c['status'] == 'evaluated'): ?>
                            <span class="badge badge-evaluated">Evaluated</span>
                        <?php elseif($c['status'] == 'accepted'): ?>
                            <span class="badge badge-accepted">Accepted</span>
                        <?php else: ?>
                            <span class="badge badge-rejected">Rejected</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <!-- Update Status Modal Trigger -->
                        <button type="button" class="btn btn-sm btn-light border" data-bs-toggle="modal" data-bs-target="#statusModal<?php echo $c['id']; ?>">
                            Ubah Status
                        </button>

                        <!-- Modal -->
                        <div class="modal fade" id="statusModal<?php echo $c['id']; ?>" tabindex="-1">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">Ubah Status Pelamar</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <form method="POST">
                                        <div class="modal-body">
                                            <input type="hidden" name="candidate_id" value="<?php echo $c['id']; ?>">
                                            <p>Pelamar: <strong><?php echo htmlspecialchars($c['name']); ?></strong></p>
                                            <div class="mb-3">
                                                <label class="form-label">Status Baru</label>
                                                <select name="status" class="form-select">
                                                    <option value="pending" <?php echo $c['status']=='pending'?'selected':''; ?>>Pending</option>
                                                    <option value="evaluated" <?php echo $c['status']=='evaluated'?'selected':''; ?>>Evaluated (Sudah Dinilai)</option>
                                                    <option value="accepted" <?php echo $c['status']=='accepted'?'selected':''; ?>>Accepted (Diterima)</option>
                                                    <option value="rejected" <?php echo $c['status']=='rejected'?'selected':''; ?>>Rejected (Ditolak)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                                            <button type="submit" name="update_status" class="btn btn-primary-custom">Simpan Perubahan</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($candidates)): ?>
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">Belum ada data pelamar.</td>
                </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
