import { CommissionService } from '../services/commission.service.js';
import { sendSuccess } from '../utils/response.js';
export class CommissionController {
    static async getCommissions(req, res, next) {
        try {
            const result = await CommissionService.getCommissions({
                userId: req.user.userId,
                userRole: req.user.role,
                ...req.query,
            });
            return sendSuccess(res, 'Commissions retrieved successfully', result.commissions, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async getSummary(req, res, next) {
        try {
            const summary = await CommissionService.getCommissionSummary(req.user.userId, req.user.role);
            return sendSuccess(res, 'Commission summary retrieved', summary);
        }
        catch (error) {
            next(error);
        }
    }
}
