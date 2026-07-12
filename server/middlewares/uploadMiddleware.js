const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Prepend UUID to original name to avoid collision while keeping original name
        const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${uuidv4()}_${safeOriginalName}`);
    }
});

// File filter (PDF only)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Hanya file PDF yang diperbolehkan!'), false);
    }
};

// Limit: 20MB
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB
    }
});

// Middleware to handle Multer errors
const uploadMiddleware = (req, res, next) => {
    // Expected fields from register form: cvFile and portfolioFile
    const multerUpload = upload.fields([
        { name: 'cvFile', maxCount: 1 },
        { name: 'portfolioFile', maxCount: 1 }
    ]);

    multerUpload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ success: false, message: 'Upload error: ' + err.message, errors: [] });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ success: false, message: err.message, errors: [] });
        }
        
        // Everything went fine.
        next();
    });
};

module.exports = uploadMiddleware;
