-- ============================================================
--  DATABASE: potracrew_db
--  Sistem Pendukung Keputusan Rekrutmen PotraCrew
--  Metode: Simple Additive Weighting (SAW)
-- ============================================================

CREATE DATABASE IF NOT EXISTS potracrew_db;
USE potracrew_db;


-- ============================================================
--  TABLE DEFINITIONS
-- ============================================================

-- Tabel pengguna sistem (admin & owner)
CREATE TABLE IF NOT EXISTS `users` (
    `id`         INT          AUTO_INCREMENT PRIMARY KEY,
    `name`       VARCHAR(100) NOT NULL,
    `username`   VARCHAR(50)  NOT NULL UNIQUE,
    `password`   VARCHAR(255) NOT NULL,
    `role`       ENUM('admin', 'owner') NOT NULL DEFAULT 'admin',
    `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabel data pelamar / kandidat
CREATE TABLE IF NOT EXISTS `candidates` (
    `id`             INT          AUTO_INCREMENT PRIMARY KEY,
    `full_name`      VARCHAR(150) NOT NULL,
    `dob`            DATE         NOT NULL,
    `gender`         ENUM('Laki-laki', 'Perempuan') NOT NULL,
    `address`        TEXT         NOT NULL,
    `education`      VARCHAR(50)  NOT NULL,
    `current_job`    VARCHAR(100),
    `expected_honor` VARCHAR(50)  NOT NULL,
    `whatsapp`       VARCHAR(20)  NOT NULL,
    `email`          VARCHAR(100) NOT NULL UNIQUE,
    `instagram`      VARCHAR(50)  NOT NULL,
    `exp_event`      ENUM('Ya', 'Tidak') NOT NULL,
    `exp_photo`      ENUM('Ya', 'Tidak') NOT NULL,
    `skills`         TEXT         NOT NULL,
    `has_vehicle`    ENUM('Ya', 'Tidak') NOT NULL,
    `has_camera`     ENUM('Ya', 'Tidak') NOT NULL,
    `cv_file`        VARCHAR(255) NOT NULL,
    `portfolio_file` VARCHAR(255) DEFAULT NULL,
    `status`         ENUM('pending', 'evaluated', 'accepted', 'rejected') DEFAULT 'pending',
    `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabel kriteria penilaian
CREATE TABLE IF NOT EXISTS `criteria` (
    `id`         INT          AUTO_INCREMENT PRIMARY KEY,
    `code`       VARCHAR(10)  NOT NULL UNIQUE,
    `name`       VARCHAR(100) NOT NULL,
    `weight`     DECIMAL(5,2) NOT NULL,
    `type`       ENUM('benefit', 'cost') NOT NULL,
    `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabel sub-kriteria (pilihan nilai per kriteria)
CREATE TABLE IF NOT EXISTS `sub_criteria` (
    `id`          INT          AUTO_INCREMENT PRIMARY KEY,
    `criteria_id` INT          NOT NULL,
    `name`        VARCHAR(100) NOT NULL,
    `value`       INT          NOT NULL,
    FOREIGN KEY (`criteria_id`) REFERENCES `criteria`(`id`) ON DELETE CASCADE
);

-- Tabel hasil evaluasi kandidat per kriteria
CREATE TABLE IF NOT EXISTS `evaluations` (
    `id`           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT NOT NULL,
    `criteria_id`  INT NOT NULL,
    `value`        INT NOT NULL,
    UNIQUE KEY `unique_eval` (`candidate_id`, `criteria_id`),
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`criteria_id`)  REFERENCES `criteria`(`id`)   ON DELETE CASCADE
);

-- Tabel hasil akhir perhitungan SAW
CREATE TABLE IF NOT EXISTS `saw_results` (
    `id`           INT           AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT           NOT NULL UNIQUE,
    `final_score`  DECIMAL(10,4) NOT NULL,
    `evaluated_at` TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE
);

-- Tabel log aktivitas
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id`         INT          AUTO_INCREMENT PRIMARY KEY,
    `user_id`    INT          NOT NULL,
    `action`     VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(50),
    `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Tabel histori status
CREATE TABLE IF NOT EXISTS `status_history` (
    `id`           INT          AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT          NOT NULL,
    `status`       VARCHAR(50)  NOT NULL,
    `notes`        TEXT,
    `created_by`   INT,
    `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Tabel reset token
CREATE TABLE IF NOT EXISTS `reset_tokens` (
    `id`         INT          AUTO_INCREMENT PRIMARY KEY,
    `email`      VARCHAR(100) NOT NULL,
    `token`      VARCHAR(255) NOT NULL,
    `expires_at` DATETIME     NOT NULL,
    `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
--  DEFAULT DATA
-- ============================================================

-- Kriteria default
INSERT IGNORE INTO `criteria` (`code`, `name`, `weight`, `type`) VALUES
('C1', 'Attitude', 25.00, 'benefit'),
('C2', 'Kemampuan Komunikasi', 20.00, 'benefit'),
('C3', 'Pengalaman Event', 20.00, 'benefit'),
('C4', 'Kemampuan Mengoperasikan Kamera', 15.00, 'benefit'),
('C5', 'Fleksibilitas Waktu', 10.00, 'benefit'),
('C6', 'Honor per Event', 10.00, 'cost');

-- Sub-kriteria akan diisi melalui API atau admin panel

