'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type SpeakerRole = 'CLIENT' | 'FREELANCER';

export interface VoiceTranscriptionTurn {
  speakerRole: SpeakerRole;
  speakerLabel: string;
  text: string;
  formattedLine: string;
  model: string;
  durationSec: number | null;
  clipSha256: string;
  transcriptTimestamp: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultItem>;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface UseVoiceNegotiationOptions {
  proposalId: string;
  currentUserId: string;
  onTranscribed: (turn: VoiceTranscriptionTurn) => void;
  onError: (message: string) => void;
}

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
] as const;

function pickSupportedAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  for (const mime of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export function useVoiceNegotiation({
  proposalId,
  currentUserId,
  onTranscribed,
  onError,
}: UseVoiceNegotiationOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveCaptions, setLiveCaptions] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>([12, 18, 22, 16, 10]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const speechRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeSpeakerRef = useRef<{ role: SpeakerRole; name?: string }>({ role: 'CLIENT' });

  const cleanupMediaResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (speechRef.current) {
      try {
        speechRef.current.stop();
      } catch {
        // Ignore stop errors if already ended
      }
      speechRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    recorderRef.current = null;
    setIsRecording(false);
    setAudioLevels([12, 18, 22, 16, 10]);
  }, []);

  useEffect(() => {
    return () => {
      cleanupMediaResources();
    };
  }, [cleanupMediaResources]);

  const uploadAudioForTranscription = useCallback(
    async (audioBlob: Blob, fileName: string, speakerRole: SpeakerRole, speakerName?: string) => {
      if (audioBlob.size <= 0) {
        onError('No audio captured. Please speak for at least 1 second and try again.');
        return;
      }

      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, fileName);
        formData.append('proposalId', proposalId);
        formData.append('speakerRole', speakerRole);
        if (speakerName) {
          formData.append('speakerName', speakerName);
        }

        const res = await fetch('/api/contracts/transcribe', {
          method: 'POST',
          headers: {
            'x-user-id': currentUserId,
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || 'Groq Whisper could not transcribe the audio clip.');
        }

        onTranscribed(data.data as VoiceTranscriptionTurn);
        setLiveCaptions('');
      } catch (err: unknown) {
        onError(err instanceof Error ? err.message : 'Failed to transcribe recorded audio.');
      } finally {
        setIsTranscribing(false);
      }
    },
    [proposalId, currentUserId, onTranscribed, onError]
  );

  const startRecording = useCallback(
    async (speakerRole: SpeakerRole, speakerName?: string) => {
      if (isRecording || isTranscribing) return;
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        onError('Microphone capture requires a modern browser on localhost/HTTPS. You can upload an audio file instead.');
        return;
      }
      if (typeof MediaRecorder === 'undefined') {
        onError('MediaRecorder is unavailable in this browser. Try uploading a recorded audio file instead.');
        return;
      }

      activeSpeakerRef.current = { role: speakerRole, name: speakerName };
      chunksRef.current = [];
      setLiveCaptions('');
      setRecordingSeconds(0);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const chosenMime = pickSupportedAudioMime();
        const recorder = chosenMime
          ? new MediaRecorder(stream, { mimeType: chosenMime })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const mimeType = recorder.mimeType || chosenMime || 'audio/webm';
          const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const capturedSpeaker = activeSpeakerRef.current;
          cleanupMediaResources();
          void uploadAudioForTranscription(
            blob,
            `voice-agreement-${Date.now()}.${ext}`,
            capturedSpeaker.role,
            capturedSpeaker.name
          );
        };

        recorder.start(250);
        recorderRef.current = recorder;
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        // Optional lightweight 5-band audio meter via Web Audio API
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioCtxRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 32;
            source.connect(analyser);
            const bins = new Uint8Array(analyser.frequencyBinCount);
            let lastMeterUpdate = 0;

            const sampleLevels = (now: number) => {
              rafRef.current = requestAnimationFrame(sampleLevels);
              if (now - lastMeterUpdate < 70) return;
              lastMeterUpdate = now;
              analyser.getByteFrequencyData(bins);
              const nextBars = [0, 1, 2, 3, 4].map((idx) => {
                const val = bins[idx] ?? 0;
                return Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
              });
              setAudioLevels(nextBars);
            };
            rafRef.current = requestAnimationFrame(sampleLevels);
          }
        } catch {
          // Audio level visualization is optional
        }

        // Optional instant browser SpeechRecognition caption preview (Groq Whisper remains authoritative)
        try {
          const w = window as unknown as {
            SpeechRecognition?: new () => SpeechRecognitionInstance;
            webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
          };
          const RecCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
          if (RecCtor) {
            const rec = new RecCtor();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-IN';
            rec.onresult = (evt) => {
              const parts: string[] = [];
              for (let i = 0; i < evt.results.length; i++) {
                parts.push(evt.results[i][0]?.transcript || '');
              }
              setLiveCaptions(parts.join(' ').trim());
            };
            rec.onerror = () => {};
            rec.start();
            speechRef.current = rec;
          }
        } catch {
          // SpeechRecognition preview optional
        }
      } catch (err: unknown) {
        cleanupMediaResources();
        const msg =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Microphone permission denied. Allow mic access in browser settings or upload an audio clip below.'
            : err instanceof Error
              ? err.message
              : 'Unable to access microphone.';
        onError(msg);
      }
    },
    [isRecording, isTranscribing, cleanupMediaResources, uploadAudioForTranscription, onError]
  );

  const stopAndTranscribe = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      cleanupMediaResources();
    }
  }, [cleanupMediaResources]);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }
    chunksRef.current = [];
    setLiveCaptions('');
    cleanupMediaResources();
  }, [cleanupMediaResources]);

  const transcribeUploadedFile = useCallback(
    async (file: File, speakerRole: SpeakerRole, speakerName?: string) => {
      if (isRecording || isTranscribing) return;
      await uploadAudioForTranscription(file, file.name, speakerRole, speakerName);
    },
    [isRecording, isTranscribing, uploadAudioForTranscription]
  );

  return {
    isRecording,
    isTranscribing,
    recordingSeconds,
    liveCaptions,
    audioLevels,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    transcribeUploadedFile,
  };
}
