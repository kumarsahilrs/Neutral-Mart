import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@nirmalmandi/shared';
import { authRouter } from './routes/auth';
import { profileRouter } from './routes/profile';
import { adminUsersRouter } from './routes/adminUsers';
import { adminKycRouter } from './routes/adminKyc';
import { consentRouter } from './routes/consent';
import { docusignRouter } from './routes/docusign';

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'] }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/admin/users', adminUsersRouter);
app.use('/admin/kyc', adminKycRouter);
app.use('/consent', consentRouter);
app.use('/esign', docusignRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.get('/secret-hint', (_req, res) => {
  const s = (process.env.INTERNAL_SERVICE_SECRET || 'nm-jwt-secret-2026').replace(/['"]/g, '').trim();
  res.json({ hint: s.slice(0, 6) + '***' + s.slice(-4), len: s.length });
});

app.listen(PORT, () => {
  const s = (process.env.INTERNAL_SERVICE_SECRET || 'nm-jwt-secret-2026').replace(/['"]/g, '').trim();
  logger.info(`Auth service running on :${PORT} — secret hint: ${s.slice(0,4)}***${s.slice(-3)} (len ${s.length})`);
});
export default app;
