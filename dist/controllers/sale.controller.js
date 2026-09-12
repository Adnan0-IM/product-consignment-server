import { SaleService } from '../services/sale.service.js';
import { sendSuccess } from '../utils/response.js';
export class SaleController {
    static async recordSale(req, res, next) {
        try {
            const sale = await SaleService.recordSale(req.user.userId, req.body);
            return sendSuccess(res, 'Sale recorded successfully', sale, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async getSales(req, res, next) {
        try {
            const result = await SaleService.getSales({
                userId: req.user.userId,
                userRole: req.user.role,
                ...req.query,
            });
            return sendSuccess(res, 'Sales list retrieved', result.sales, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async getSaleById(req, res, next) {
        try {
            const sale = await SaleService.getSaleById(req.params.id);
            return sendSuccess(res, 'Sale receipt retrieved', sale);
        }
        catch (error) {
            next(error);
        }
    }
}
