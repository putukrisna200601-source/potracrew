const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Check for token in headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token tidak ditemukan.',
            errors: []
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user payload to request
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak valid atau sudah kedaluwarsa.',
            errors: [err.message]
        });
    }
};

module.exports = authMiddleware;
