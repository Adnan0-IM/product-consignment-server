import { ReturnService } from '../services/return.service.js';
import { sendSuccess } from '../utils/response.js';
export class ReturnController {
    static async createReturn(req, res, next) {
        try {
            const returnRecord = await ReturnService.createReturn(req.user.userId, req.body);
            return sendSuccess(res, 'Return request created successfully', returnRecord, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async getReturns(req, res, next) {
        try {
            const result = await ReturnService.getReturns({
                userId: req.user.userId,
                userRole: req.user.role,
                ...req.query,
            });
            return sendSuccess(res, 'Returns list retrieved', result.returns, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateReturnStatus(req, res, next) {
        try {
            const updated = await ReturnService.updateReturnStatus(req.params.id, req.user.userId, req.body.status);
            return sendSuccess(res, 'Return status updated', updated);
        }
        catch (error) {
            next(error);
        }
    }
}
