import { prisma } from '../config/prisma.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
export class CategoryService {
    static async getCategories() {
        return prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
    }
    static async getCategoryById(id) {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        return category;
    }
    static async createCategory(data) {
        const existing = await prisma.category.findUnique({
            where: { name: data.name },
        });
        if (existing) {
            throw new ConflictError('Category with this name already exists');
        }
        return prisma.category.create({
            data: {
                name: data.name,
                description: data.description,
            },
        });
    }
    static async updateCategory(id, data) {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        if (data.name && data.name !== category.name) {
            const existing = await prisma.category.findUnique({
                where: { name: data.name },
            });
            if (existing) {
                throw new ConflictError('Category with this name already exists');
            }
        }
        return prisma.category.update({
            where: { id },
            data,
        });
    }
    static async deleteCategory(id) {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        await prisma.category.delete({ where: { id } });
        return { message: 'Category deleted successfully' };
    }
}
