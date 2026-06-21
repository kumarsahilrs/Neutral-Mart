'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { ordersApi, type VoiceMessage } from '@/lib/api';

interface Props {
  orderId: string;
}

function AudioPlayer({ url, durationSec, transcription }: { url: string; durationSec: number; transcription: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.ontimeupdate = () => {
        const a = audioRef.current!;
        setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      };
      audioRef.current.onended = () => { setPlaying(false); setProgress(0); };
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button onClick={toggle}
          className="w-8 h-8 rounded-full bg-nm-primary flex items-center justify-center text-white flex-shrink-0 hover:bg-nm-primary-dark transition-colors">
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
        <div className="flex-1">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-nm-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-[11px] text-nm-text-muted dark:text-nm-text-dark-muted flex-shrink-0">{fmt(durationSec)}</span>
      </div>
      {transcription && (
        <p className="text-[11px] text-nm-text-muted dark:text-nm-text-dark-muted italic px-1 leading-relaxed">
          "{transcription}"
        </p>
      )}
    </div>
  );
}

export default function VoiceMessageThread({ orderId }: Props) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await ordersApi.getVoiceMessages(orderId);
      const msgs = (res.data as { data: VoiceMessage[] }).data ?? [];
      setMessages(msgs);
    } catch {
      // silence — voice messages are optional
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function startRecording() {
    if (!navigator.mediaDevices) { toast.error('Microphone not available'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await send(blob);
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch {
      toast.error('Microphone permission denied');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  }

  async function send(blob: Blob) {
    setSending(true);
    try {
      await ordersApi.sendVoiceMessage(orderId, blob);
      await load();
      toast.success('Voice message sent');
    } catch {
      toast.error('Failed to send voice message');
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-6 text-nm-text-muted dark:text-nm-text-dark-muted">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  return (
    <div className="nm-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-nm-primary" />
        <h3 className="text-sm font-bold text-nm-text dark:text-nm-text-dark">Voice Messages</h3>
        <span className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted">({messages.length})</span>
      </div>

      {messages.length === 0 ? (
        <p className="text-xs text-nm-text-muted dark:text-nm-text-dark-muted text-center py-4">
          No voice messages yet. Hold the mic to record one.
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.is_mine ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2.5 space-y-1 ${
                m.is_mine
                  ? 'bg-nm-primary/10 border border-nm-primary/20'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <p className="text-[10px] font-semibold text-nm-text-muted dark:text-nm-text-dark-muted">
                  {m.is_mine ? 'You' : m.sender_name}
                  <span className="font-normal ml-1.5">
                    {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
                <AudioPlayer url={m.audio_url} durationSec={m.duration_sec} transcription={m.transcription} />
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Record button */}
      <div className="flex items-center gap-3 pt-2 border-t border-nm-border dark:border-nm-border-dark">
        {sending ? (
          <div className="flex items-center gap-2 text-xs text-nm-text-muted dark:text-nm-text-dark-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Transcribing & sending...
          </div>
        ) : (
          <>
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all select-none ${
                recording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'nm-btn-secondary'
              }`}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {recording ? 'Release to send' : 'Hold to record'}
            </button>
            {recording && (
              <span className="text-xs text-red-500 font-medium animate-pulse">Recording...</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
