/**
 * Sprint 13 — Purchase Order (PO) PDF Generator
 * Generates a formal PO document for a confirmed order.
 * Uploads to S3 and returns the CDN URL.
 */
import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '@nirmalmandi/shared';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const BUCKET = process.env.S3_BUCKET_NAME || 'nirmalmandi-assets';
const CDN = process.env.CLOUDFRONT_URL || `https://${BUCKET}.s3.amazonaws.com`;

export interface PoData {
  poNumber: string;
  poDate: string;
  orderId: string;
  orderNumber: string;

  buyerName: string;
  buyerGstin?: string;
  buyerAddress: string;
  buyerContact?: string;

  sellerName: string;
  sellerGstin?: string;
  sellerAddress: string;

  item: {
    description: string;
    hsn: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  };

  deliveryAddress?: string;
  paymentTerms?: string;
  deliveryDate?: string;
  notes?: string;
}

export async function generatePurchaseOrder(data: PoData): Promise<string> {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const W = 495; // usable width after margins
  const COL = { left: 50, mid: 300, right: 545 };

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.fillColor('#1d4ed8').rect(50, 50, W, 40).fill();
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
    .text('PURCHASE ORDER', 60, 63);
  doc.fillColor('#93c5fd').fontSize(10).font('Helvetica')
    .text('NirmalMandi — B2B Dead Inventory Marketplace', COL.mid, 68);

  // ── PO meta ──────────────────────────────────────────────────────────────────
  doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
  doc.text(`PO Number: ${data.poNumber}`, COL.left, 105);
  doc.text(`PO Date: ${data.poDate}`, COL.left, 118);
  doc.text(`Order Ref: ${data.orderNumber}`, COL.left, 131);
  if (data.deliveryDate) doc.text(`Expected Delivery: ${data.deliveryDate}`, COL.left, 144);

  // ── Buyer / Seller boxes ───────────────────────────────────────────────────
  const BOX_Y = 165;
  doc.rect(COL.left, BOX_Y, 215, 90).strokeColor('#d1d5db').lineWidth(1).stroke();
  doc.rect(COL.mid, BOX_Y, 215, 90).strokeColor('#d1d5db').stroke();

  doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold').text('BUYER (Bill To)', COL.left + 8, BOX_Y + 8);
  doc.font('Helvetica').fontSize(8).fillColor('#111827')
    .text(data.buyerName, COL.left + 8, BOX_Y + 20, { width: 200 })
    .text(data.buyerAddress, COL.left + 8, BOX_Y + 32, { width: 200 });
  if (data.buyerGstin) doc.text(`GSTIN: ${data.buyerGstin}`, COL.left + 8, BOX_Y + 56);
  if (data.buyerContact) doc.text(data.buyerContact, COL.left + 8, BOX_Y + 68);

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151').text('SELLER (Ship From)', COL.mid + 8, BOX_Y + 8);
  doc.font('Helvetica').fontSize(8).fillColor('#111827')
    .text(data.sellerName, COL.mid + 8, BOX_Y + 20, { width: 200 })
    .text(data.sellerAddress, COL.mid + 8, BOX_Y + 32, { width: 200 });
  if (data.sellerGstin) doc.text(`GSTIN: ${data.sellerGstin}`, COL.mid + 8, BOX_Y + 56);

  // ── Delivery address ─────────────────────────────────────────────────────────
  if (data.deliveryAddress) {
    const DA_Y = BOX_Y + 98;
    doc.rect(COL.left, DA_Y, W, 30).strokeColor('#d1d5db').stroke();
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151').text('Delivery Address:', COL.left + 8, DA_Y + 8);
    doc.font('Helvetica').fillColor('#111827').text(data.deliveryAddress, COL.left + 90, DA_Y + 8, { width: 380 });
  }

  // ── Line items table ──────────────────────────────────────────────────────────
  const TABLE_Y = (data.deliveryAddress ? BOX_Y + 138 : BOX_Y + 100);
  const cols = { desc: COL.left, hsn: 280, qty: 340, unit: 380, price: 420, total: 465 };

  // Header row
  doc.fillColor('#f3f4f6').rect(COL.left, TABLE_Y, W, 18).fill();
  doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold');
  doc.text('Description', cols.desc + 4, TABLE_Y + 5);
  doc.text('HSN', cols.hsn, TABLE_Y + 5);
  doc.text('Qty', cols.qty, TABLE_Y + 5);
  doc.text('Unit', cols.unit, TABLE_Y + 5);
  doc.text('Unit Price', cols.price, TABLE_Y + 5);
  doc.text('Total', cols.total, TABLE_Y + 5);

  // Item row
  const ROW_Y = TABLE_Y + 18;
  doc.rect(COL.left, ROW_Y, W, 24).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  doc.text(data.item.description, cols.desc + 4, ROW_Y + 8, { width: 230 });
  doc.text(data.item.hsn, cols.hsn, ROW_Y + 8);
  doc.text(String(data.item.quantity), cols.qty, ROW_Y + 8);
  doc.text(data.item.unit, cols.unit, ROW_Y + 8);
  doc.text(`₹${data.item.unitPrice.toLocaleString('en-IN')}`, cols.price, ROW_Y + 8);
  doc.text(`₹${data.item.totalPrice.toLocaleString('en-IN')}`, cols.total, ROW_Y + 8);

  // Total row
  const TOT_Y = ROW_Y + 26;
  doc.fillColor('#f9fafb').rect(COL.left, TOT_Y, W, 20).fill();
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827');
  doc.text('ORDER TOTAL', cols.unit, TOT_Y + 5);
  doc.fillColor('#1d4ed8').text(`₹${data.item.totalPrice.toLocaleString('en-IN')}`, cols.total, TOT_Y + 5);

  // ── Terms ─────────────────────────────────────────────────────────────────────
  const TERMS_Y = TOT_Y + 35;
  if (data.paymentTerms) {
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8).text('Payment Terms:', COL.left, TERMS_Y);
    doc.font('Helvetica').fillColor('#111827').text(data.paymentTerms, COL.left + 85, TERMS_Y);
  }
  if (data.notes) {
    const N_Y = TERMS_Y + (data.paymentTerms ? 14 : 0);
    doc.font('Helvetica-Bold').fillColor('#374151').fontSize(8).text('Notes:', COL.left, N_Y);
    doc.font('Helvetica').fillColor('#111827').text(data.notes, COL.left + 45, N_Y, { width: W - 45 });
  }

  // ── Signature block ───────────────────────────────────────────────────────────
  const SIG_Y = doc.page.height - 120;
  doc.rect(COL.left, SIG_Y, 200, 50).strokeColor('#d1d5db').stroke();
  doc.rect(COL.mid, SIG_Y, 215, 50).strokeColor('#d1d5db').stroke();
  doc.fontSize(7).font('Helvetica').fillColor('#6b7280');
  doc.text('Authorised Signatory (Buyer)', COL.left + 8, SIG_Y + 38);
  doc.text('For NirmalMandi Platform', COL.mid + 8, SIG_Y + 38);

  // ── Footer ────────────────────────────────────────────────────────────────────
  doc.fillColor('#1d4ed8').rect(50, doc.page.height - 55, W, 25).fill();
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica')
    .text('This is a computer-generated document. NirmalMandi acts as a marketplace and is not a party to this transaction.',
      60, doc.page.height - 47, { width: W - 20 });

  // Wait for all data events before concatenating (PDFKit streams async)
  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
  const key = `purchase-orders/${data.orderId}/PO-${data.poNumber}.pdf`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }));
    return `${CDN}/${key}`;
  } catch (err) {
    logger.warn('S3 upload failed, returning base64 PDF', { error: (err as Error).message });
    return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  }
}
