import { useState, useRef, useEffect, useCallback } from "react";
import { stripMarkdownForSpeech } from "@/components/chat-input-bar";

/**
 * Shared voice-input + "Mode Telpon" (phone-call loop) hook for chat surfaces
 * that don't use <ChatInputBar/>. Wraps the Web Speech API (free, browser-native):
 *  - speech-to-text: dictate a message, auto-submits on silence
 *  - text-to-speech: reads the AI's reply aloud, then re-opens the mic automatically
 *
 * No API key / server cost — everything runs in the user's browser. Buttons/behavior
 * silently no-op when the browser doesn't support the Web Speech API.
 */
export function useVoiceMode(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const phoneModeRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => { phoneModeRef.current = phoneMode; }, [phoneMode]);
  useEffect(() => { aiSpeakingRef.current = aiSpeaking; }, [aiSpeaking]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSpeechSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      if (aiSpeakingRef.current) return; // ignore anything captured while the AI is speaking
      const transcript = Array.from(event.results as any)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onTranscriptRef.current(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch { /* noop */ } };
  }, []);

  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try { recognitionRef.current.start(); } catch { /* already started */ }
    }
  }, [isListening]);

  /** Call with the AI's latest reply to have it spoken aloud (only while phone mode is on). */
  const speak = useCallback((text: string) => {
    const synth = (window as any).speechSynthesis;
    if (!phoneModeRef.current || !synth || !text) return;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* noop */ } }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utter.lang = "id-ID";
    utter.onstart = () => setAiSpeaking(true);
    utter.onend = () => {
      setAiSpeaking(false);
      if (phoneModeRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already started */ }
      }
    };
    utter.onerror = () => setAiSpeaking(false);
    synth.speak(utter);
  }, []);

  const togglePhoneMode = useCallback(() => {
    const synth = (window as any).speechSynthesis;
    setPhoneMode(prev => {
      const next = !prev;
      if (!next) {
        synth?.cancel();
        setAiSpeaking(false);
        if (recognitionRef.current && isListening) recognitionRef.current.stop();
      } else if (recognitionRef.current && !isListening) {
        try { recognitionRef.current.start(); } catch { /* noop */ }
      }
      return next;
    });
  }, [isListening]);

  return { isListening, speechSupported, phoneMode, aiSpeaking, toggleMic, togglePhoneMode, speak };
}
