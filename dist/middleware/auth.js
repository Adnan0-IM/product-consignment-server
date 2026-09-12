import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Authentication token required'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return next(new UnauthorizedError('Invalid or expired token'));
    }
};
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('User unauthenticated'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError('You do not have permission to access this resource'));
        }
        next();
    };
};
