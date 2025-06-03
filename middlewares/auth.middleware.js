const jwt = require('jsonwebtoken');
const { User, Vendor } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages=require('../enums/responseMessages.enum');

const authMiddleware = {};

authMiddleware.checkAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.error(HttpStatus.UNAUTHORIZED, false, "No token provided");
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.APP_SUPER_SECRET_KEY);
            console.log("Decoded token:", decoded);

            let user;
            if (decoded.role === 'vendor') {
                user = await Vendor.findByPk(decoded.id);
            } else {
                user = await User.findByPk(decoded.id);
            }
            
            if (!user) {
                return res.error(HttpStatus.UNAUTHORIZED, false, "User not found");
            }

            console.log("User found:", {
                id: user.id,
                role: decoded.role
            });

            req.user = user;
            req.user.role = decoded.role; // Ensure role is available
            next();
        } catch (error) {
            console.error("Token verification error:", error);
            return res.error(HttpStatus.UNAUTHORIZED, false, "Invalid token");
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, "Authentication failed");
    }
};


authMiddleware.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.error(HttpStatus.UNAUTHORIZED, false, "Authentication required");
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.error(HttpStatus.FORBIDDEN, false, "Access denied");
        }

        next();
    };
};

authMiddleware.isAdmin = (req, res, next) => {
    try {
        console.log("Checking admin privileges for user:", {
            id: req.user?.id,
            email: req.user?.email,
            role: req.user?.role
        });
        
        // Check if user is admin (accept both 'admin' and 'ADMIN')
        if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'ADMIN')) {
            console.log("Access denied: User role is not admin");
            return res.error(
                HttpStatus.FORBIDDEN,
                "false",
                "Access denied. Admin privileges required.",
                []
            );
        }
        
        console.log("Admin access granted");
        next();
    } catch (error) {
        console.error("Error checking admin privileges:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = authMiddleware;