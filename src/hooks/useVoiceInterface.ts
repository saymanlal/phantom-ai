'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export type VoiceLanguage = 'hi-IN' | 'en-IN' | 'en-US';

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  supported: boolean;
  transcript: string;    // live interim transcript
  audioLevel: number;    // 0–100
  language: VoiceLanguage;
  setLanguage: (lang: VoiceLanguage) => void;
  toggleListening: () => void;
  speak: (text: string, priority?: boolean) => void;
  stopSpeaking: () => void;
}

export function useVoiceInterface(
  onCommandDetected?: (command: string) => void,
): VoiceState {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const [language, setLanguage] = useState<VoiceLanguage>('en-IN');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isMutedRef = useRef(false);
  const onCommandRef = useRef(onCommandDetected);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldBeRunningRef = useRef(true); // tracks intent to listen
  const languageRef = useRef(language);
  const lastFinalTextRef = useRef(''); // prevent duplicate command dispatch
  const isStartingRef = useRef(false);

  useEffect(() => { onCommandRef.current = onCommandDetected; }, [onCommandDetected]);
  useEffect(() => { languageRef.current = language; }, [language]);

  // ─── TTS ──────────────────────────────────────────────────────────────────
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, priority = false) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isMutedRef.current && !priority) return;

    const cleanText = text
      .replace(/[*#•—_`>~]/g, ' ')
      .replace(/→/g, '')
      .replace(/[\(\)\[\]\{\}]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 350);

    if (!cleanText) return;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Anchor utterance to prevent browser garbage collection
    currentUtteranceRef.current = utterance;
    if (typeof window !== 'undefined') {
      (window as unknown as { __activeUtterance?: SpeechSynthesisUtterance }).__activeUtterance = utterance;
    }

    const setVoiceAndSpeak = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        const lang = languageRef.current;

        let selectedVoice: SpeechSynthesisVoice | undefined;
        if (lang === 'hi-IN' || /[\u0900-\u097F]/.test(cleanText)) {
          selectedVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
        }
        
        if (!selectedVoice && (lang === 'en-IN' || lang === 'hi-IN')) {
          selectedVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('ravi') || v.name.toLowerCase().includes('heera'));
        }

        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en'));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
        };
        utterance.onerror = (e) => {
          console.warn('[PHANTOM Voice] TTS error:', e);
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
        };

        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[PHANTOM Voice] speak execution error:', err);
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        setVoiceAndSpeak();
      };
      setTimeout(setVoiceAndSpeak, 150);
    }
  }, []);

  // ─── RECOGNITION ENGINE ───────────────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isStartingRef.current) return;
    if (!shouldBeRunningRef.current) return;
    if (isMutedRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    isStartingRef.current = true;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }

      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = languageRef.current;

      rec.onstart = () => {
        setIsListening(true);
        setSupported(true);
        isStartingRef.current = false;
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        if (isMutedRef.current) return;

        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (!r[0]) continue;
          const t = r[0].transcript.trim();
          if (r.isFinal) {
            finalText += (finalText ? ' ' : '') + t;
          } else {
            interimText += (interimText ? ' ' : '') + t;
          }
        }

        // Show live interim
        if (interimText) {
          setTranscript(interimText);
          setAudioLevel(Math.min(100, interimText.length * 6));
        }

        if (finalText) {
          setTranscript('');
          setAudioLevel(0);

          // Prevent duplicate dispatch (same final text within 1s)
          if (finalText === lastFinalTextRef.current) return;
          lastFinalTextRef.current = finalText;
          setTimeout(() => { lastFinalTextRef.current = ''; }, 1200);

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          // Interrupt TTS if new command comes in
          if (window.speechSynthesis?.speaking) {
            stopSpeaking();
          }

          // Voice control commands handled here (before forwarding)
          const lf = finalText.toLowerCase();
          if (/\b(phantom stop|chup ho jao|mute|stop listening|voice band|awaz band)\b/i.test(lf)) {
            isMutedRef.current = true;
            setIsMuted(true);
            shouldBeRunningRef.current = false;
            try { rec.abort(); } catch {}
            setIsListening(false);
            setTranscript('');
            speak("Voice muted.", true);
            return;
          }
          if (/\b(phantom wake up|phantom suno|unmute|start listening|awaz chalu|phantom bolo)\b/i.test(lf)) {
            isMutedRef.current = false;
            setIsMuted(false);
            shouldBeRunningRef.current = true;
            speak("Voice active.", true);
            // Will auto-restart via onend
            return;
          }

          // Ambient speech filter
          if (/^(bhai sun|mummy|are yaar|ek minute ruko|wait guys|phone pe hu|hold on)/i.test(finalText)) return;

          onCommandRef.current?.(finalText);
        } else if (interimText) {
          // Debounce interim to catch natural pauses
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const t = interimText.trim();
            if (!t || isMutedRef.current) return;
            if (t === lastFinalTextRef.current) return;
            lastFinalTextRef.current = t;
            setTimeout(() => { lastFinalTextRef.current = ''; }, 1200);
            setTranscript('');
            setAudioLevel(0);
            if (window.speechSynthesis?.speaking) stopSpeaking();
            onCommandRef.current?.(t);
          }, 1100);
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        isStartingRef.current = false;
        if (event.error === 'aborted' || event.error === 'not-allowed') return;
        // Auto-restart on transient errors
        if (shouldBeRunningRef.current && !isMutedRef.current) {
          restartTimerRef.current = setTimeout(() => startRecognition(), 400);
        }
      };

      rec.onend = () => {
        isStartingRef.current = false;
        setIsListening(false);
        // Self-healing restart loop
        if (shouldBeRunningRef.current && !isMutedRef.current) {
          restartTimerRef.current = setTimeout(() => startRecognition(), 250);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch {
      isStartingRef.current = false;
    }
  }, [speak, stopSpeaking]);

  // Initial boot
  useEffect(() => {
    const SR = typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setSupported(false); return; }
    setSupported(true);
    shouldBeRunningRef.current = true;
    startRecognition();

    return () => {
      shouldBeRunningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognitionRef.current?.abort(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global user gesture unlock for SpeechSynthesis (required by modern browsers)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const unlockAudio = () => {
      try {
        window.speechSynthesis.resume();
      } catch {}
    };
    window.addEventListener('click', unlockAudio, { once: false });
    window.addEventListener('keydown', unlockAudio, { once: false });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Restart when language changes
  useEffect(() => {
    if (!supported) return;
    try { recognitionRef.current?.abort(); } catch {}
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => startRecognition(), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const toggleListening = useCallback(() => {
    if (isMutedRef.current) {
      // UNMUTE
      isMutedRef.current = false;
      setIsMuted(false);
      shouldBeRunningRef.current = true;
      startRecognition();
      speak("Voice unmuted. Sun raha hu.", true);
    } else {
      // MUTE
      isMutedRef.current = true;
      setIsMuted(true);
      shouldBeRunningRef.current = false;
      stopSpeaking();
      try { recognitionRef.current?.abort(); } catch {}
      setIsListening(false);
      setTranscript('');
      setAudioLevel(0);
    }
  }, [startRecognition, speak, stopSpeaking]);

  return {
    isListening: isListening && !isMuted,
    isSpeaking,
    isMuted,
    supported,
    transcript,
    audioLevel,
    language,
    setLanguage,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
