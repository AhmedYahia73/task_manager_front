import { useState, useRef, useCallback } from 'react';

/**
 * useSpeechRecognition
 * Wraps the Web Speech API for live voice-to-text.
 * Returns the transcript into a controlled input value.
 *
 * @param {function} onResult  - called with the interim/final transcript string
 * @param {function} onError   - called with an error string
 */
export function useSpeechRecognition({ onResult, onError } = {}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG'; // primary Arabic; browser often auto-detects
    recognition.interimResults = true;
    recognition.continuous = false; // one-shot: stops after pause
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResult?.(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'no-speech') {
        onError?.(event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, onResult, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, start, stop };
}
