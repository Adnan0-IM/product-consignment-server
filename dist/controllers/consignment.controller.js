import { ConsignmentService } from '../services/consignment.service.js';
import { sendSuccess } from '../utils/response.js';
export class ConsignmentController {
    static async requestConsignment(req, res, next) {
        try {
            const consignment = await ConsignmentService.requestConsignment(req.user.userId, req.body);
            return sendSuccess(res, 'Consignment requested successfully', consignment, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async createConsignment(req, res, next) {
        try {
            const consignment = await ConsignmentService.createConsignment(req.user.userId, req.body);
            return sendSuccess(res, 'Consignment created successfully', consignment, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async getConsignments(req, res, next) {
        try {
            const result = await ConsignmentService.getConsignments({
                userId: req.user.userId,
                userRole: req.user.role,
                ...req.query,
            });
            return sendSuccess(res, 'Consignments retrieved successfully', result.consignments, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async getConsignmentById(req, res, next) {
        try {
            const consignment = await ConsignmentService.getConsignmentById(req.params.id, req.user.userId, req.user.role);
            return sendSuccess(res, 'Consignment details retrieved', consignment);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const consignment = await ConsignmentService.updateConsignmentStatus(req.params.id, req.user.userId, req.user.role, req.body.status, req.body.notes);
            return sendSuccess(res, `Consignment status updated to ${req.body.status}`, consignment);
        }
        catch (error) {
            next(error);
        }
    }
}
