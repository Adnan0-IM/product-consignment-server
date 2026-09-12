import { AuthService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
export class AuthController {
    static async register(req, res, next) {
        try {
            const result = await AuthService.register(req.body);
            return sendSuccess(res, 'User registered successfully', result, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await AuthService.login(req.body);
            return sendSuccess(res, 'Login successful', result);
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const user = await AuthService.getProfile(req.user.userId);
            return sendSuccess(res, 'User profile fetched successfully', user);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const user = await AuthService.updateProfile(req.user.userId, req.body);
            return sendSuccess(res, 'Profile updated successfully', user);
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const result = await AuthService.changePassword(req.user.userId, req.body);
            return sendSuccess(res, result.message);
        }
        catch (error) {
            next(error);
        }
    }
}
