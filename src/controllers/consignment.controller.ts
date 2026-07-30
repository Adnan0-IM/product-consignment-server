import { Response, NextFunction } from 'express'
import { ConsignmentService } from '../services/consignment.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class ConsignmentController {
  static async createConsignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const consignment = await ConsignmentService.createConsignment(
        req.user!.userId,
        req.body
      )
      return sendSuccess(res, 'Consignment created successfully', consignment, 201)
    } catch (error) {
      next(error)
    }
  }

  static async getConsignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ConsignmentService.getConsignments({
        userId: req.user!.userId,
        userRole: req.user!.role,
        ...req.query,
      } as any)
      return sendSuccess(
        res,
        'Consignments retrieved successfully',
        result.consignments,
        200,
        result.meta
      )
    } catch (error) {
      next(error)
    }
  }

  static async getConsignmentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const consignment = await ConsignmentService.getConsignmentById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      )
      return sendSuccess(res, 'Consignment details retrieved', consignment)
    } catch (error) {
      next(error)
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const consignment = await ConsignmentService.updateConsignmentStatus(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        req.body.status,
        req.body.notes
      )
      return sendSuccess(res, `Consignment status updated to ${req.body.status}`, consignment)
    } catch (error) {
      next(error)
    }
  }
}
