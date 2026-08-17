'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
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
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useVoiceInterface(onCommandDetected?: (command: string) => void) {
  const [isListening, setIsListening] = useState(true); // Default always-on
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN' | 'en-US'>('en-IN');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isMutedRef = useRef(false);
  const onCommandRef = useRef(onCommandDetected);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenTextRef = useRef('');

  useEffect(() => {
    onCommandRef.current = onCommandDetected;
  }, [onCommandDetected]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Self-healing continuous listener
  const startRecognitionEngine = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            if (res.isFinal) {
              final += res[0].transcript + ' ';
            } else {
              interim += res[0].transcript;
            }
          }
        }

        const heardText = (final || interim).trim();
        if (heardText) {
          setTranscript(heardText);
          setAudioLevel(Math.min(100, heardText.length * 6));

          // 1. VOICE WAKE-WORDS & VOICE SHUTDOWN DETECTOR
          if (/\b(phantom stop|chup ho jao|mute ho jao|stop listening|shant raho|mute voice|awaz band)\b/i.test(heardText)) {
            setIsMuted(true);
            isMutedRef.current = true;
            window.speechSynthesis?.cancel();
            speak("Voice muted. Say 'Phantom wake up' or 'Phantom suno' anytime to activate me.");
            setTranscript('');
            return;
          }

          if (/\b(phantom wake up|phantom suno|start listening|unmute|phantom bolo|activate)\b/i.test(heardText)) {
            setIsMuted(false);
            isMutedRef.current = false;
            speak("Voice engine fully active. Main sun raha hu.");
            setTranscript('');
            return;
          }

          // If currently muted, ignore everything else
          if (isMutedRef.current) return;

          // 2. AMBIENT BACKGROUND SPEECH FILTER
          if (/^(bhai sun|mummy|are yaar|ek minute ruko|wait guys|phone pe hu|calling you later|hold on|bro shut up)/i.test(heardText)) {
            return; // Ignore ambient noise
          }

          // Debounced speech dispatch: Wait 900ms after user pauses speaking
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (heardText && heardText !== lastSpokenTextRef.current && !isMutedRef.current) {
              lastSpokenTextRef.current = heardText;
              setTranscript('');
              setAudioLevel(0);

              // Cancel active TTS output for in-between interruption
              if (window.speechSynthesis?.speaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }

              onCommandRef.current?.(heardText);
            }
          }, 900);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== 'aborted' && !isMutedRef.current) {
          setTimeout(() => {
            try { recognition.start(); } catch {}
          }, 300);
        }
      };

      recognition.onend = () => {
        // ALWAYS RESTART automatically for continuous non-glitchy listening
        if (!isMutedRef.current) {
          setTimeout(() => {
            try { recognition.start(); } catch {}
          }, 200);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setSupported(true);
    } catch {}
  }, [language]);

  useEffect(() => {
    startRecognitionEngine();
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, [startRecognitionEngine]);

  const speak = useCallback((text: string) => {
    if (isMutedRef.current || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('hindi'));
    const englishVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));

    if (/[\u0900-\u097F]/.test(text) && hindiVoice) {
      utterance.voice = hindiVoice;
    } else if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleListening = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      startRecognitionEngine();
      speak("Voice unmuted. I am listening.");
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    isListening: !isMuted,
    isSpeaking,
    isMuted,
    supported,
    transcript,
    audioLevel,
    language,
    setLanguage,
    toggleListening,
    speak,
  };
}
