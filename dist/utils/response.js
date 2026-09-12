export const sendSuccess = (res, message, data, statusCode = 200, meta) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        meta,
    });
};
export const sendError = (res, message, statusCode = 500, errors) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
