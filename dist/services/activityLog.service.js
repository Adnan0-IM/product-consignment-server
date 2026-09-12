import { prisma } from '../config/prisma.js';
export class ActivityLogService {
    static async getActivityLogs(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true, role: true } },
                },
            }),
            prisma.activityLog.count(),
        ]);
        return {
            logs,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
