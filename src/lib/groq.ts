export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface GroqChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const DEFAULT_GROQ_WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';

export interface GroqTranscriptionOptions {
  audioBuffer: Buffer | Uint8Array;
  fileName: string;
  mimeType: string;
  prompt?: string;
  language?: string;
  model?: string;
  apiKey?: string;
}

export interface GroqTranscriptionResponse {
  text: string;
  model: string;
  durationSec?: number;
}

export async function callGroqChat(
  messages: GroqChatMessage[],
  options: GroqChatOptions = {}
): Promise<GroqChatResponse> {
  const apiKey = options.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in the environment.');
  }

  const model = options.model || DEFAULT_GROQ_MODEL;
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? 2048;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq API request failed with status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice || !choice.message?.content) {
    throw new Error('Groq API returned an empty completion response.');
  }

  return {
    content: choice.message.content.trim(),
    model: data.model || model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Transcribes spoken audio using Groq's Whisper Audio Transcriptions API.
 */
export async function transcribeAudioWithGroq(
  options: GroqTranscriptionOptions
): Promise<GroqTranscriptionResponse> {
  const apiKey = options.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in the environment.');
  }

  const model = options.model || DEFAULT_GROQ_WHISPER_MODEL;
  const bytes = new Uint8Array(options.audioBuffer);
  const audioBlob = new Blob([bytes], { type: options.mimeType || 'audio/webm' });

  const formData = new FormData();
  formData.append('file', audioBlob, options.fileName || 'negotiation-clip.webm');
  formData.append('model', model);
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0');

  if (options.language) {
    formData.append('language', options.language);
  }
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq Whisper transcription failed with status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = typeof data.text === 'string' ? data.text.trim() : '';

  return {
    text,
    model,
    durationSec: typeof data.duration === 'number' ? data.duration : undefined,
  };
}
