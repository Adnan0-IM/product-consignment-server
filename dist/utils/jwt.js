import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
export const comparePassword = async (password, hashed) => {
    return bcrypt.compare(password, hashed);
};
export const generateToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });
};
export const verifyToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET);
};
