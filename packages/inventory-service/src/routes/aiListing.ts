import { Router, Request, Response } from 'express';
import { successResponse, errorResponse, logger } from '@nirmalmandi/shared';

export const aiListingRouter = Router();

const SECTOR_LIST = ['automobiles', 'clothing', 'furniture', 'fmcg', 'pharma', 'software', 'machinery', 'electronics', 'construction', 'agriculture'];

const SYSTEM_PROMPT = `You are NirmalMandi's AI listing assistant for B2B dead-stock liquidation. Sellers describe their unsold inventory in Hindi, English, or Hinglish.

Your job:
1. Detect the sector from: ${SECTOR_LIST.join(', ')}
2. Extract all listing fields you can from their description
3. If confidence < 0.7, ask ONE clarifying question
4. Always respond in the same language the seller used

Return ONLY this JSON (no markdown, no extra text):
{
  "conversational_response": "Your warm, brief reply to the seller",
  "extracted_fields": {
    "title": "",
    "description": "",
    "dead_stock_type": "",
    "condition_grade": "",
    "total_quantity": null,
    "unit": "",
    "asking_price": null,
    "mrp": null,
    "state": "",
    "city": ""
  },
  "detected_sector": "",
  "confidence": 0.0,
  "questions": []
}

dead_stock_type must be one of: excess, near_expiry, obsolete, seasonal, returns, damaged_packaging
condition_grade must be one of: A, B, C, D
unit must be one of: pieces, kg, boxes, cartons, pallets, units, meters, sets, bags, strips, bottles, liters`;

// GET /ai/listing/health
aiListingRouter.get('/listing/health', (_req, res: Response) => {
  const hasKey = !!process.env.OPENAI_API_KEY;
  res.json({ ok: true, openai_configured: hasKey });
});

// POST /ai/listing/prompt — natural language → structured listing fields
aiListingRouter.post('/listing/prompt', async (req: Request, res: Response) => {
  const body = req.body as {
    seller_prompt?: string;
    message?: string;
    conversation_history?: Array<{ role: string; content: string }>;
  };
  const seller_prompt = (body.seller_prompt ?? body.message ?? '').trim();
  const conversation_history = body.conversation_history ?? [];

  if (!seller_prompt) {
    return res.status(400).json(errorResponse('message is required'));
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(503).json(errorResponse('AI service not configured', 'AI_UNAVAILABLE'));
  }

  try {
    // Lazy import — prevents crash if openai module has issues at startup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: OpenAI } = require('openai') as { default: new (opts: { apiKey: string }) => {
      chat: { completions: { create: (opts: Record<string, unknown>) => Promise<{ choices: Array<{ message: { content: string } }> }> } }
    }};

    const client = new OpenAI({ apiKey: key });

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversation_history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: seller_prompt },
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1024,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { conversational_response: raw }; }

    return res.json(successResponse({
      conversational_response: parsed.conversational_response ?? 'Please describe your inventory.',
      extracted_fields: parsed.extracted_fields ?? {},
      detected_sector: parsed.detected_sector ?? null,
      confidence: parsed.confidence ?? 0.5,
      questions: parsed.questions ?? [],
    }));
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Unknown error';
    logger.error('AI listing prompt error', { error: msg });
    return res.status(500).json(errorResponse(`AI error: ${msg}`, 'AI_ERROR'));
  }
});
