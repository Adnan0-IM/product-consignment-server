import { ActivityLogService } from '../services/activityLog.service.js';
import { sendSuccess } from '../utils/response.js';
export class ActivityLogController {
    static async getActivityLogs(req, res, next) {
        try {
            const result = await ActivityLogService.getActivityLogs(req.query);
            return sendSuccess(res, 'Activity logs retrieved', result.logs, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
}
