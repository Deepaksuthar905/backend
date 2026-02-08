const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ message: "Access Denied: No Token Provided!" });
    }

    try {
        const verified = jwt.verify(
            token, 
            process.env.JWT_SECRET || "default_secret_key_change_in_production"
        );
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token" });
    }
};

// Call after verifyToken - only admin can access
exports.requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Admin only." });
};
