import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@nirmalmandi/shared';
import { ordersRouter } from './routes/orders';
import { cartRouter } from './routes/cart';
import { adminOrdersRouter } from './routes/adminOrders';
import { adminDisputesRouter } from './routes/adminDisputes';
import { negotiationRouter } from './services/negotiation';
import { initAuctionWebSocket } from './services/auction';

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3003;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'] }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }));
app.use('/orders', ordersRouter);
app.use('/cart', cartRouter);
app.use('/negotiations', negotiationRouter);
app.use('/admin/transactions', adminOrdersRouter);
app.use('/admin/disputes', adminDisputesRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error in order-service', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Use HTTP server so WebSocket auction server can share the same port
const server = http.createServer(app);
initAuctionWebSocket(server);

server.listen(PORT, () => logger.info(`Order service running on :${PORT} (WebSocket auction at /ws/auction)`));
export default app;
