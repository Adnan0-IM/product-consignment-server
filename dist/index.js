import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './config/logger.js';
import { env } from './config/env.js';
const app = express();
// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
// Static folder for uploaded product images
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
// Health check endpoint
app.get('/healthz', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'Product Consignment Management API',
        timestamp: new Date().toISOString(),
    });
});
app.get('/', (_req, res) => {
    res.status(200).json({
        message: 'Welcome to the Product Consignment Management API',
        timestamp: new Date().toISOString(),
    });
});
// Mount REST API routes
app.use('/api', routes);
// Global Error Handler
app.use(errorHandler);
if (process.env.NODE_ENV !== 'test') {
    app.listen(env.PORT, () => {
        logger.info(`🚀 Product Consignment Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
}
export default app;
