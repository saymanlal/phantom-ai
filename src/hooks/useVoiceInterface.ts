'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API interface declarations for TypeScript
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

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  supported: boolean;
  transcript: string;
  language: 'hi-IN' | 'en-IN' | 'en-US';
}

export function useVoiceInterface(onCommandDetected?: (command: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN' | 'en-US'>('en-IN');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isMutedRef = useRef(isMuted);
  const onCommandRef = useRef(onCommandDetected);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    onCommandRef.current = onCommandDetected;
  }, [onCommandDetected]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            }
          }
        }

        const currentText = event.results[event.results.length - 1]?.[0]?.transcript || '';
        setTranscript(currentText);

        // Check if there is a complete sentence/utterance
        if (finalTranscript.trim() && !isMutedRef.current) {
          const cleanCmd = finalTranscript.trim();
          setTranscript('');
          
          // Allow in-between command execution by stopping active speech if speaking
          if (window.speechSynthesis?.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }

          onCommandRef.current?.(cleanCmd);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Auto-restart on benign network / no-speech timeouts
        if (event.error !== 'aborted' && !isMutedRef.current) {
          try {
            recognition.stop();
          } catch {}
        }
      };

      recognition.onend = () => {
        // Persistent always-on listener (unless explicitly muted)
        if (!isMutedRef.current && recognitionRef.current) {
          try {
            recognition.start();
            setIsListening(true);
          } catch {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const startListening = useCallback(() => {
    setIsMuted(false);
    isMutedRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsMuted(true);
    isMutedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Text-To-Speech with Hindi & English voice selection
  const speak = useCallback((text: string) => {
    if (isMutedRef.current || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Interrupt any previous speech
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate pitch and rate for professional operator feel
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('hindi'));
    const englishVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));

    if (/[\u0900-\u097F]/.test(text) && hindiVoice) {
      utterance.voice = hindiVoice;
    } else if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    isListening,
    isSpeaking,
    isMuted,
    supported,
    transcript,
    language,
    setLanguage,
    startListening,
    stopListening,
    toggleListening,
    speak,
  };
}
