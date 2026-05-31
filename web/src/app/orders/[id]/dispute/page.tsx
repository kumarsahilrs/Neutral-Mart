'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertCircle, Upload, X, CheckCircle,
  AlertTriangle, Package, FileText, ChevronRight, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { ordersApi, disputeApi, type OrderDetail } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

type DisputeReason = {
  key: string;
  icon: string;
  label: string;
};

const REASONS: DisputeReason[] = [
  { key: 'not_received', icon: '📦', label: 'Item not received' },
  { key: 'wrong_item', icon: '❌', label: 'Wrong item delivered' },
  { key: 'damaged', icon: '💥', label: 'Item damaged' },
  { key: 'quality_mismatch', icon: '⚠️', label: 'Quality doesn\'t match description' },
  { key: 'quantity_mismatch', icon: '📊', label: 'Quantity mismatch' },
  { key: 'other', icon: '💬', label: 'Other' },
];

const MIN_DESC = 50;
const MAX_DESC = 2000;
const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadedFile {
  file: File;
  key: string;
  progress: number;
  uploading: boolean;
  done: boolean;
  error: boolean;
  preview?: string;
}

export default function DisputePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id),
    select: (res) => {
      const payload = res.data as unknown as { data?: OrderDetail } | OrderDetail;
      return (payload as { data?: OrderDetail })?.data ?? payload as OrderDetail;
    },
    enabled: !!id && isAuthenticated(),
  });

  const descLen = description.length;
  const descValid = descLen >= MIN_DESC;

  async function uploadFile(file: File) {
    const newFile: UploadedFile = {
      file,
      key: '',
      progress: 0,
      uploading: true,
      done: false,
      error: false,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };
    setUploadedFiles((prev) => [...prev, newFile]);

    try {
      const res = await disputeApi.getUploadUrl('pending', file.name, file.type);
      const payload = res.data as unknown as { data?: { uploadUrl: string; key: string } } | { uploadUrl: string; key: string };
      const { uploadUrl, key } = (payload as { data?: { uploadUrl: string; key: string } })?.data
        ?? payload as { uploadUrl: string; key: string };

      // Simulate progress then PUT
      setUploadedFiles((prev) =>
        prev.map((f) => f.file === file ? { ...f, progress: 30 } : f)
      );

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setUploadedFiles((prev) =>
        prev.map((f) => f.file === file ? { ...f, progress: 100, uploading: false, done: true, key } : f)
      );
    } catch {
      setUploadedFiles((prev) =>
        prev.map((f) => f.file === file ? { ...f, uploading: false, error: true, progress: 0 } : f)
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  }

  function handleFiles(files: FileList | File[]) {
    const fileArr = Array.from(files);
    const current = uploadedFiles.length;
    const remaining = MAX_FILES - current;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    const toUpload = fileArr.slice(0, remaining);
    for (const file of toUpload) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`${file.name} is not an image or PDF`);
        continue;
      }
      uploadFile(file);
    }
  }

  const removeFile = useCallback((idx: number) => {
    setUploadedFiles((prev) => {
      const file = prev[idx];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  async function handleSubmit() {
    const evidenceKeys = uploadedFiles.filter((f) => f.done).map((f) => f.key);
    setSubmitting(true);
    try {
      await disputeApi.raiseDispute({
        order_id: id,
        reason,
        description,
        evidence_keys: evidenceKeys,
      });
      toast.success('Dispute raised. Escrow frozen.');
      router.push(`/orders/${id}`);
    } catch {
      toast.error('Failed to raise dispute. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ['Reason', 'Description', 'Evidence', 'Review'];

  function canGoNext(): boolean {
    if (step === 1) return !!reason;
    if (step === 2) return descValid;
    return true;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/orders/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Raise a Dispute</h1>
        {order && (
          <p className="text-sm text-gray-500 mb-6">
            Order #{order.order_number ?? id.slice(0, 8).toUpperCase()} · {order.listing_title}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center gap-0">
            {steps.map((label, idx) => {
              const stepNum = idx + 1;
              const done = step > stepNum;
              const current = step === stepNum;
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        done
                          ? 'bg-primary-600 text-white'
                          : current
                            ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {done ? <CheckCircle className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${current ? 'text-primary-600' : done ? 'text-primary-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 ${step > stepNum ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1 — Reason */}
        {step === 1 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">What is the issue?</h2>
            <div className="space-y-3">
              {REASONS.map((r) => (
                <label
                  key={r.key}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    reason === r.key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.key}
                    checked={reason === r.key}
                    onChange={() => setReason(r.key)}
                    className="accent-indigo-600"
                  />
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Description */}
        {step === 2 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Describe the issue</h2>
            <p className="text-sm text-gray-500 mb-4">Be specific — this helps us resolve your case faster</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              rows={7}
              placeholder="Describe what happened in detail..."
              className="input-field resize-none text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              {!descValid && descLen > 0 && (
                <p className="text-xs text-red-500">Minimum {MIN_DESC} characters required</p>
              )}
              {!descValid && descLen === 0 && <div />}
              {descValid && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Good description
                </p>
              )}
              <p className={`text-xs ml-auto ${descLen > MAX_DESC * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                {descLen} / {MAX_DESC}
              </p>
            </div>
          </div>
        )}

        {/* Step 3 — Evidence */}
        {step === 3 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Upload Evidence</h2>
            <p className="text-sm text-gray-500 mb-4">
              Photos, videos, or PDFs. Max {MAX_FILES} files, 5MB each.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">Drag & drop files here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Images (JPG, PNG, WebP) or PDF</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((uf, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                    {/* Preview / icon */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      {uf.preview ? (
                        <img src={uf.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Name + progress */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{uf.file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(uf.file.size / 1024).toFixed(0)} KB
                      </p>
                      {uf.uploading && (
                        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 transition-all duration-300"
                            style={{ width: `${uf.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {uf.uploading && <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}
                      {uf.done && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {uf.error && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">
              {uploadedFiles.length} / {MAX_FILES} files uploaded
            </p>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Review Your Dispute</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 border-b border-gray-100 pb-3">
                  <span className="text-gray-500 w-24 flex-shrink-0">Order</span>
                  <span className="font-medium text-gray-800">
                    #{order?.order_number ?? id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-start gap-2 border-b border-gray-100 pb-3">
                  <span className="text-gray-500 w-24 flex-shrink-0">Reason</span>
                  <span className="font-medium text-gray-800">
                    {REASONS.find((r) => r.key === reason)?.label ?? reason}
                  </span>
                </div>
                <div className="flex items-start gap-2 border-b border-gray-100 pb-3">
                  <span className="text-gray-500 w-24 flex-shrink-0">Description</span>
                  <span className="text-gray-700 line-clamp-3">{description}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">Evidence</span>
                  <span className="font-medium text-gray-800">
                    {uploadedFiles.filter((f) => f.done).length} file{uploadedFiles.filter((f) => f.done).length !== 1 ? 's' : ''} attached
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 mb-0.5">Escrow will be frozen</p>
                <p className="text-amber-700">
                  Submitting this dispute will freeze the escrow for this order. Funds cannot be released until the dispute is resolved (up to 72 hours).
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
              Submit Dispute
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
