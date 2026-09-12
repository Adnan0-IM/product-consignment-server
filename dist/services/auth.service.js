import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../utils/jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';
export class AuthService {
    static async register(data) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }
        if (data.phone) {
            const existingPhone = await prisma.user.findFirst({
                where: { phone: data.phone },
            });
            if (existingPhone) {
                throw new ConflictError('User with this phone number already exists');
            }
        }
        const hashedPassword = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: data.role || 'CONSIGNOR',
                profile: {
                    create: {},
                },
            },
            include: {
                profile: true,
            },
        });
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'USER_REGISTER',
                entity: 'User',
                entityId: user.id,
                details: `User registered with role ${user.role}`,
            },
        });
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    static async login(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { profile: true },
        });
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }
        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedError(`Account is currently ${user.status.toLowerCase()}`);
        }
        const isMatch = await comparePassword(data.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                entity: 'User',
                entityId: user.id,
                details: 'User logged in',
            },
        });
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    static async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async updateProfile(userId, data) {
        const { firstName, lastName, phone, gender, address, city, state, bankName, accountNumber, accountName, } = data;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone && { phone }),
                profile: {
                    upsert: {
                        create: {
                            gender,
                            address,
                            city,
                            state,
                            bankName,
                            accountNumber,
                            accountName,
                        },
                        update: {
                            ...(gender !== undefined && { gender }),
                            ...(address !== undefined && { address }),
                            ...(city !== undefined && { city }),
                            ...(state !== undefined && { state }),
                            ...(bankName !== undefined && { bankName }),
                            ...(accountNumber !== undefined && { accountNumber }),
                            ...(accountName !== undefined && { accountName }),
                        },
                    },
                },
            },
            include: { profile: true },
        });
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async changePassword(userId, data) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        const isMatch = await comparePassword(data.oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestError('Current password is incorrect');
        }
        const hashedPassword = await hashPassword(data.newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { message: 'Password changed successfully' };
    }
}
