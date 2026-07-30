import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../utils/jwt.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'
import { Role } from '@prisma/client'

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token required'))
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired token'))
  }
}

export const authorize = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User unauthenticated'))
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      )
    }

    next()
  }
}
