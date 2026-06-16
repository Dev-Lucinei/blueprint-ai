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

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= maxRetries) break;
      const isRateLimit = /429/.test(lastError.message);
      const effectiveRetries = isRateLimit ? maxRetries : Math.min(maxRetries, 2);
      if (attempt >= effectiveRetries) break;
      const delay = isRateLimit
        ? Math.pow(2, attempt + 1) * 1000
        : baseDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const getApiKey = (provider: AIProvider): string => {
  switch (provider) {
    case 'gemini':
      return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
    case 'openrouter':
      return import.meta.env.VITE_OPENROUTER_API_KEY || '';
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY || '';
    case 'ollama':
      return 'local';
  }
};

const generateWithGemini = async (
  prompt: string,
  config: AIConfig,
  options?: GenerateOptions
): Promise<AIResponse> => {
  const apiKey = getApiKey('gemini');
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  return withRetry(async () => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timed out after 60s')), 60000)
    );

    const requestPromise = (async () => {
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
    })();

    return Promise.race([requestPromise, timeoutPromise]);
  }, 5, 2000);
};

const generateWithOpenRouter = async (
  prompt: string,
  config: AIConfig,
  options?: GenerateOptions
): Promise<AIResponse> => {
  const apiKey = getApiKey('openrouter');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada');

  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
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
        signal: controller.signal,
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
    } finally {
      clearTimeout(timeoutId);
    }
  }, 5, 2000);
};

const generateWithOpenAI = async (
  prompt: string,
  config: AIConfig,
  options?: GenerateOptions
): Promise<AIResponse> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');

  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
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
        signal: controller.signal,
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
    } finally {
      clearTimeout(timeoutId);
    }
  }, 5, 2000);
};

const generateWithOllama = async (
  prompt: string,
  config: AIConfig,
  options?: GenerateOptions
): Promise<AIResponse> => {
  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Ollama demorou mais de 10 minutos para responder (Timeout).')), 600000); // 10 min timeout
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'qwen2.5:16K',
          messages: [
            ...(options?.systemInstruction
              ? [{ role: 'system', content: options.systemInstruction }]
              : []),
            { role: 'user', content: prompt },
          ],
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 8192,
          }
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama error ${response.status}: ${err}`);
      }

      const data = await response.json();
      return {
        text: data.message?.content ?? '',
        usage: {
          inputTokens: data.prompt_eval_count,
          outputTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }, 2, 2000); // 2 tentativas locais
};

export const aiClient: AIProviderClient = {
  generate: async (
    prompt: string,
    config: AIConfig,
    options?: GenerateOptions
  ): Promise<AIResponse> => {
    try {
      switch (config.provider) {
        case 'gemini':
          return await generateWithGemini(prompt, config, options);
        case 'openrouter':
          return await generateWithOpenRouter(prompt, config, options);
        case 'openai':
          return await generateWithOpenAI(prompt, config, options);
        case 'ollama':
          return await generateWithOllama(prompt, config, options);
      }
    } catch (error) {
      if (config.provider !== 'ollama') {
        console.warn(`[Fallback] Provider ${config.provider} falhou. Tentando Ollama...`);
        try {
          return await generateWithOllama(prompt, { provider: 'ollama', model: 'qwen2.5:16K' }, options);
        } catch (fallbackError) {
          const originalMsg = error instanceof Error ? error.message : String(error);
          const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          throw new Error(`Erro original (${config.provider}): ${originalMsg} \nErro Fallback (Ollama): ${fallbackMsg}`);
        }
      }
      throw error;
    }
  },
};

export function getDefaultModel(provider: AIProvider): string {
  const defaults: Record<AIProvider, string> = {
    gemini: 'gemini-2.5-flash',
    openrouter: 'openai/gpt-4o',
    openai: 'gpt-4o',
    ollama: 'qwen2.5:16K',
  };
  return defaults[provider];
}

export function isApiKeyConfigured(provider: AIProvider): boolean {
  return !!getApiKey(provider);
}