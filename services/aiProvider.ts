import { GoogleGenAI } from '@google/genai';
import type { AIProvider, AIConfig } from '../types';

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProviderClient {
  generate(prompt: string, config: AIConfig, options?: GenerateOptions): Promise<AIResponse>;
}

const getApiKey = (provider: AIProvider): string => {
  switch (provider) {
    case 'gemini':
      return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
    case 'openrouter':
      return import.meta.env.VITE_OPENROUTER_API_KEY || '';
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY || '';
  }
};

const generateWithGemini = async (
  prompt: string,
  config: AIConfig,
  options?: GenerateOptions
): Promise<AIResponse> => {
  const apiKey = getApiKey('gemini');
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: options?.systemInstruction,
      temperature: options?.temperature,
      maxOutputTokens: options?.maxTokens,
    },
  });

  return { text: response.text ?? '' };
};

const generateWithOpenRouter = async (
  prompt: string,
  config: AIConfig,
  options?: GenerateOptions
): Promise<AIResponse> => {
  const apiKey = getApiKey('openrouter');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        ...(options?.systemInstruction
          ? [{ role: 'system', content: options.systemInstruction }]
          : []),
        { role: 'user', content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    usage: {
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  };
};

const generateWithOpenAI = async (
  prompt: string,
  config: AIConfig,
  options?: GenerateOptions
): Promise<AIResponse> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        ...(options?.systemInstruction
          ? [{ role: 'system', content: options.systemInstruction }]
          : []),
        { role: 'user', content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    usage: {
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  };
};

export const aiClient: AIProviderClient = {
  generate: async (
    prompt: string,
    config: AIConfig,
    options?: GenerateOptions
  ): Promise<AIResponse> => {
    switch (config.provider) {
      case 'gemini':
        return generateWithGemini(prompt, config, options);
      case 'openrouter':
        return generateWithOpenRouter(prompt, config, options);
      case 'openai':
        return generateWithOpenAI(prompt, config, options);
    }
  },
};

export function getDefaultModel(provider: AIProvider): string {
  const defaults: Record<AIProvider, string> = {
    gemini: 'gemini-2.5-flash',
    openrouter: 'openai/gpt-4o',
    openai: 'gpt-4o',
  };
  return defaults[provider];
}

export function isApiKeyConfigured(provider: AIProvider): boolean {
  return !!getApiKey(provider);
}