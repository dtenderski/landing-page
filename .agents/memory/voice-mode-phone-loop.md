---
name: Voice "Mode Telpon" mic/TTS feedback guard
description: Web Speech API phone-call mode (STT+TTS) in chat UIs needs explicit mic/TTS handoff or it risks self-triggering reply loops.
---

When adding a phone/call-mode voice loop (mic dictation auto-sends → AI replies → TTS reads it aloud → mic reopens), always:
- Explicitly `recognition.stop()` right before `speechSynthesis.speak()`, even if the mic should already be idle by the time TTS starts.
- Track an `aiSpeaking` ref and have the recognition `onresult` handler ignore any captured audio while it's true.

**Why:** a code-review pass flagged this as the exact class of bug where speaker output picked up by the mic could self-trigger an infinite AI-talks-to-itself loop; the browser's own turn-taking timing isn't a reliable enough guarantee on its own.

**How to apply:** any new page/component that owns its own SpeechRecognition + SpeechSynthesis pairing (not routed through `client/src/hooks/use-voice-mode.ts` or `client/src/components/chat-input-bar.tsx`, which already implement this guard) must replicate both safeguards.
