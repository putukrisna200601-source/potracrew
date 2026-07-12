<?php
require_once '../includes/header.php';

$stmt = $pdo->query("SELECT * FROM criteria ORDER BY code ASC");
$criteria = $stmt->fetchAll();
?>
<script>
    document.getElementById('page-title').innerText = 'Data Kriteria SAW';
</script>

<div class="card-custom bg-white p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="fw-bold mb-0">Kriteria & Bobot</h5>
        <!-- <button class="btn btn-primary-custom btn-sm"><i class="fa-solid fa-plus me-1"></i> Tambah Kriteria</button> -->
    </div>

    <div class="table-responsive mb-5">
        <table class="table table-bordered">
            <thead class="table-light">
                <tr>
                    <th width="10%">Kode</th>
                    <th>Nama Kriteria</th>
                    <th width="15%">Atribut (Tipe)</th>
                    <th width="15%">Bobot (%)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($criteria as $c): ?>
                <tr>
                    <td class="fw-bold"><?php echo htmlspecialchars($c['code']); ?></td>
                    <td><?php echo htmlspecialchars($c['name']); ?></td>
                    <td>
                        <?php if($c['type'] == 'benefit'): ?>
                            <span class="badge bg-success bg-opacity-10 text-success border border-success">Benefit</span>
                        <?php else: ?>
                            <span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Cost</span>
                        <?php endif; ?>
                    </td>
                    <td class="fw-bold"><?php echo htmlspecialchars($c['weight']); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <h5 class="fw-bold mb-4">Sub-Kriteria (Nilai)</h5>
    <div class="row">
        <?php foreach($criteria as $c): ?>
            <div class="col-md-6 mb-4">
                <div class="border rounded p-3 bg-light h-100">
                    <h6 class="fw-bold mb-3"><?php echo htmlspecialchars($c['code'] . ' - ' . $c['name']); ?></h6>
                    <table class="table table-sm table-borderless">
                        <thead>
                            <tr>
                                <th>Keterangan</th>
                                <th width="20%">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $stmt_sub = $pdo->prepare("SELECT * FROM sub_criteria WHERE criteria_id = ? ORDER BY value DESC");
                            $stmt_sub->execute([$c['id']]);
                            $subs = $stmt_sub->fetchAll();
                            foreach($subs as $s):
                            ?>
                            <tr>
                                <td><?php echo htmlspecialchars($s['name']); ?></td>
                                <td><span class="badge bg-secondary"><?php echo $s['value']; ?></span></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
