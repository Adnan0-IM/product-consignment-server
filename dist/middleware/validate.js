import { ZodError } from 'zod';
import { BadRequestError } from '../utils/errors.js';
export const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return next(new BadRequestError('Validation failed', formattedErrors));
            }
            next(error);
        }
    };
};
