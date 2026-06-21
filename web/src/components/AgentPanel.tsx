'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Send, Mic, MicOff, Volume2, VolumeX, Loader2,
  Bot, ChevronRight, Wrench,
} from 'lucide-react';
import { agentApi, type AgentMessage, type AgentToolCall } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import { executeToolCalls, formatToolResult, type ToolResult } from '@/lib/agent-tools';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface DisplayMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolResults?: ToolResult[];
  isVoice?: boolean;
  isLoading?: boolean;
}

const WELCOME = 'नमस्ते! मैं आपका NirmalMandi assistant हूँ। मैं deals ढूंढने, orders track करने, और listings manage करने में help कर सकता हूँ।';

export default function AgentPanel({ open, onClose }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: 'assistant', content: WELCOME },
  ]);
  const [history, setHistory] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'hi'>('hi');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = isAuthenticated() ? getUser() : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  function speakText(text: string) {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.slice(0, 300));
    utt.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: DisplayMessage = { role: 'user', content: text };
    const loadingMsg: DisplayMessage = { role: 'assistant', content: '', isLoading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await agentApi.sendMessage({
        message: text,
        conversation_history: history,
        user_id: user?.id ?? 'guest',
        user_name: user?.phone ?? 'Guest',
        user_role: (user?.role as 'buyer' | 'seller' | 'admin') ?? 'buyer',
        user_language: language,
        current_route: window.location.pathname,
      });

      const d = (res.data as { data: typeof res.data['data'] }).data;
      const assistantText = d.response;
      const toolCalls: AgentToolCall[] = d.tool_calls ?? [];
      const newHistory = d.conversation_history as AgentMessage[];

      let toolResults: ToolResult[] = [];
      if (toolCalls.length) {
        toolResults = await executeToolCalls(toolCalls);
        // Handle navigation tool calls
        for (const tr of toolResults) {
          if (tr.navigate_to) {
            router.push(tr.navigate_to);
          }
        }
      }

      const assistantMsg: DisplayMessage = {
        role: 'assistant',
        content: assistantText,
        toolResults: toolResults.length ? toolResults : undefined,
      };

      setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
      setHistory(newHistory);
      if (assistantText) speakText(assistantText);
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, language, loading, user]);

  async function startRecording() {
    if (!navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendVoiceBlob(blob);
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch {
      // mic permission denied — ignore
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  }

  async function sendVoiceBlob(blob: Blob) {
    setLoading(true);
    const loadingMsg: DisplayMessage = { role: 'user', content: '🎙️ …', isVoice: true, isLoading: true };
    setMessages(prev => [...prev, loadingMsg]);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      formData.append('user_id', user?.id ?? 'guest');
      formData.append('user_name', user?.phone ?? 'Guest');
      formData.append('user_role', user?.role ?? 'buyer');
      formData.append('user_language', language);
      formData.append('current_route', window.location.pathname);

      const res = await fetch('/api/ai/agent/voice', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem('nm_token') ?? ''}` },
      });
      const json = await res.json() as {
        data: { transcription: string; response: string; tool_calls?: AgentToolCall[] };
      };

      const { transcription, response: assistantText, tool_calls: toolCalls = [] } = json.data;
      let toolResults: ToolResult[] = [];
      if (toolCalls.length) {
        toolResults = await executeToolCalls(toolCalls);
        for (const tr of toolResults) { if (tr.navigate_to) router.push(tr.navigate_to); }
      }

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'user', content: transcription, isVoice: true },
        { role: 'assistant', content: assistantText, toolResults: toolResults.length ? toolResults : undefined },
      ]);
      setHistory(h => [
        ...h,
        { role: 'user', content: transcription },
        { role: 'assistant', content: assistantText },
      ]);
      if (assistantText) speakText(assistantText);
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Voice processing failed. Please try typing.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className="fixed inset-0 z-40 bg-black/40 sm:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] z-50 flex flex-col bg-nm-surface dark:bg-nm-surface-dark border-l border-nm-border dark:border-nm-border-dark shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-nm-border dark:border-nm-border-dark bg-nm-primary flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">NirmalMandi AI</p>
              <p className="text-[10px] text-white/70">
                {language === 'hi' ? 'हिन्दी · English · Hinglish' : 'English · Hindi'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLanguage(l => l === 'hi' ? 'en' : 'hi')}
              className="px-2 py-1 rounded text-xs font-semibold bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              {language === 'hi' ? 'EN' : 'HI'}
            </button>
            <button
              onClick={() => setTtsEnabled(t => !t)}
              className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
              title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20 text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-nm-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-nm-primary text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-nm-text dark:text-nm-text-dark rounded-tl-sm'
                }`}>
                  {msg.isLoading ? (
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : (
                    <span className="whitespace-pre-line">
                      {msg.isVoice && <span className="mr-1">🎙️</span>}
                      {msg.content}
                    </span>
                  )}
                </div>

                {/* Tool call results */}
                {msg.toolResults?.map((tr, ti) => (
                  <div key={ti} className="w-full rounded-xl border border-nm-border dark:border-nm-border-dark bg-nm-surface dark:bg-nm-surface-dark overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-nm-border dark:border-nm-border-dark">
                      <Wrench className="w-3 h-3 text-nm-text-muted" />
                      <span className="text-[11px] font-semibold text-nm-text-muted dark:text-nm-text-dark-muted">
                        {tr.tool.replace(/_/g, ' ')}
                      </span>
                      {tr.navigate_to && (
                        <span className="ml-auto text-[10px] text-nm-primary flex items-center gap-0.5">
                          Navigating <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="px-3 py-2 text-xs text-nm-text dark:text-nm-text-dark whitespace-pre-line leading-relaxed">
                      {formatToolResult(tr.tool, tr.result)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts (shown when no conversation yet) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-nm-text-muted dark:text-nm-text-dark-muted uppercase tracking-wider">Quick actions</p>
            {[
              'आज के best deals दिखाओ',
              'Mera latest order kahan hai?',
              'Clothing sector में deals',
            ].map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-left text-xs px-3 py-2 rounded-xl border border-nm-border dark:border-nm-border-dark hover:border-nm-primary hover:bg-nm-primary-pale text-nm-text dark:text-nm-text-dark transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-nm-border dark:border-nm-border-dark flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={language === 'hi' ? 'कुछ पूछें...' : 'Ask anything...'}
              disabled={loading || recording}
              className="flex-1 bg-transparent text-sm text-nm-text dark:text-nm-text-dark placeholder-nm-text-muted dark:placeholder-nm-text-dark-muted outline-none min-w-0"
            />
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={loading}
              className={`p-1.5 rounded-full flex-shrink-0 transition-colors ${
                recording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-nm-text-muted dark:text-nm-text-dark-muted hover:text-nm-primary'
              }`}
              title="Hold to record"
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-full bg-nm-primary text-white disabled:opacity-40 transition-opacity flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-nm-text-muted dark:text-nm-text-dark-muted text-center mt-2">
            Hold mic to speak · Powered by GPT-4o
          </p>
        </div>
      </div>
    </>
  );
}
