import { ReportService } from '../services/report.service.js';
import { sendSuccess } from '../utils/response.js';
export class ReportController {
    static async getDashboard(req, res, next) {
        try {
            const data = await ReportService.getDashboard(req.user.userId, req.user.role);
            return sendSuccess(res, 'Dashboard metrics retrieved', data);
        }
        catch (error) {
            next(error);
        }
    }
    static async getSalesReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const data = await ReportService.getSalesReport(startDate, endDate);
            return sendSuccess(res, 'Sales report generated', data);
        }
        catch (error) {
            next(error);
        }
    }
}
