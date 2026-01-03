// Map models to their API key providers
export const modelToProvider: Record<string, string> = {
  // Groq models
  "gemma-7b-it": "groq",
  "groq/compound": "groq",
  "groq/compound-mini": "groq",
  "llama-3.1-8b-instant": "groq",
  "llama-3.3-70b-versatile": "groq",
  "llama3-70b-8192": "groq",
  "llama3-8b-8192": "groq",
  "meta-llama/llama-4-scout-17b-16e-instruct": "groq",
  
  // OpenAI models
  "gpt-4": "openai",
  "gpt-4-turbo": "openai",
  "gpt-3.5-turbo": "openai",
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  
  // Anthropic models
  "claude-3-opus": "anthropic",
  "claude-3-sonnet": "anthropic",
  "claude-3-haiku": "anthropic",
  "claude-3.5-sonnet": "anthropic",
  
  // Google models
  "gemini-pro": "google",
  "gemini-pro-vision": "google",
  "gemini-1.5-pro": "google",
  "gemini-1.5-flash": "google",
}

// Get provider for a given model
export function getProviderForModel(model: string): string {
  return modelToProvider[model] || "groq" // Default to groq
}

// Get API key for a model from saved keys
export function getApiKeyForModel(
  model: string, 
  savedKeys: Array<{ provider: string; apiKey: string }>
): string {
  const provider = getProviderForModel(model)
  const keyObj = savedKeys.find(k => k.provider === provider)
  return keyObj?.apiKey || ""
}
