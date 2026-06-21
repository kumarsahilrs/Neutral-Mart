/**
 * Sprint 13 — In-app Voice Messages on Orders
 * Buyers and sellers can send voice notes attached to an order.
 * Audio → S3; Whisper → transcription stored in voice_messages.
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import FormData from 'form-data';
import {
  authenticate,
  query, queryOne,
  successResponse, errorResponse,
  logger,
} from '@nirmalmandi/shared';

export const voiceMessageRouter = Router();

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const BUCKET = process.env.S3_BUCKET_NAME || 'nirmalmandi-assets';
const CDN = process.env.CLOUDFRONT_URL || `https://${BUCKET}.s3.amazonaws.com`;
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// multer: memory storage, 5 MB max for voice clips
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function transcribeWithWhisper(audioBuffer: Buffer, mimeType: string): Promise<string> {
  if (!OPENAI_KEY) return '';
  try {
    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'audio.webm', contentType: mimeType });
    form.append('model', 'whisper-1');
    const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${OPENAI_KEY}` },
      timeout: 30_000,
    });
    return (res.data as { text: string }).text ?? '';
  } catch (e) {
    logger.warn('Whisper transcription failed', { error: (e as Error).message });
    return '';
  }
}

// ── POST /orders/:orderId/voice-messages ──────────────────────────────────────

voiceMessageRouter.post(
  '/:orderId/voice-messages',
  authenticate,
  upload.single('audio'),
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const order = await queryOne<{ buyer_id: string; seller_id: string }>(
      'SELECT buyer_id, seller_id FROM orders WHERE id = $1', [orderId]
    );
    if (!order) return res.status(404).json(errorResponse('Order not found'));

    const isParty = [order.buyer_id, order.seller_id].includes(req.user!.profile_id);
    if (!isParty && req.user!.role !== 'admin') return res.status(403).json(errorResponse('Forbidden'));

    if (!req.file) return res.status(400).json(errorResponse('Audio file required'));

    const audioBuffer = req.file.buffer;
    const mimeType = req.file.mimetype || 'audio/webm';
    const msgId = uuidv4();
    const s3Key = `voice-messages/orders/${orderId}/${msgId}.webm`;

    // Upload to S3
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: audioBuffer,
        ContentType: mimeType,
      }));
    } catch (e) {
      logger.warn('S3 upload failed for voice message', { error: (e as Error).message });
    }
    const audioUrl = `${CDN}/${s3Key}`;

    // Whisper transcription
    const transcription = await transcribeWithWhisper(audioBuffer, mimeType);

    // Estimate duration from file size (~8 KB/s for webm at low bitrate)
    const durationSec = Math.round(audioBuffer.byteLength / 8000);

    await query(
      `INSERT INTO voice_messages (id, sender_id, order_id, audio_url, duration_sec, transcription)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [msgId, req.user!.sub, orderId, audioUrl, durationSec, transcription || null]
    );

    logger.info('Voice message saved', { msgId, orderId });
    return res.status(201).json(successResponse({
      id: msgId,
      audioUrl,
      transcription,
      durationSec,
    }));
  }
);

// ── GET /orders/:orderId/voice-messages ───────────────────────────────────────

voiceMessageRouter.get('/:orderId/voice-messages', authenticate, async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await queryOne<{ buyer_id: string; seller_id: string }>(
    'SELECT buyer_id, seller_id FROM orders WHERE id = $1', [orderId]
  );
  if (!order) return res.status(404).json(errorResponse('Order not found'));

  const isParty = [order.buyer_id, order.seller_id].includes(req.user!.profile_id);
  if (!isParty && req.user!.role !== 'admin') return res.status(403).json(errorResponse('Forbidden'));

  const rows = await query(
    `SELECT vm.id, vm.audio_url, vm.duration_sec, vm.transcription, vm.created_at,
            u.full_name AS sender_name, u.id = $2 AS is_mine
     FROM voice_messages vm
     JOIN users u ON u.id = vm.sender_id
     WHERE vm.order_id = $1
     ORDER BY vm.created_at ASC`,
    [orderId, req.user!.sub]
  );

  return res.json(successResponse(rows));
});
