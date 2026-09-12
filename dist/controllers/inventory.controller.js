import { InventoryService } from '../services/inventory.service.js';
import { sendSuccess } from '../utils/response.js';
export class InventoryController {
    static async getOverview(req, res, next) {
        try {
            const consignorId = req.user.role === 'CONSIGNOR' ? req.user.userId : undefined;
            const overview = await InventoryService.getInventoryOverview(consignorId);
            return sendSuccess(res, 'Inventory overview retrieved', overview);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStockMovements(req, res, next) {
        try {
            const result = await InventoryService.getStockMovements(req.query);
            return sendSuccess(res, 'Stock movements retrieved', result.movements, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async adjustStock(req, res, next) {
        try {
            const updated = await InventoryService.adjustStock(req.params.id, Number(req.body.quantity), req.body.reason || 'Manual Adjustment', req.user.userId);
            return sendSuccess(res, 'Stock adjusted successfully', updated);
        }
        catch (error) {
            next(error);
        }
    }
}
