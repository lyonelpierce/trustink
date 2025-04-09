/**
 * Application Configuration
 * 
 * This file centralizes configuration settings for the application.
 * Values can be overridden through environment variables.
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment,
  isTest,
  isProduction,
  
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    timeout: Number(process.env.API_TIMEOUT || 10000),
    retries: Number(process.env.API_RETRIES || 3),
    useAuthHeader: process.env.USE_AUTH_HEADER !== 'false',
  },
  
  // Demo mode settings
  demo: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true' || isDevelopment,
    demoDocuments: ['doc-123', 'sample', 'contract-example'],
    useMockDataByDefault: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || isDevelopment,
  },
  
  // AI integration
  ai: {
    useRealAi: process.env.USE_REAL_AI === 'true' || isProduction,
    provider: process.env.AI_PROVIDER || 'openai',
    modelName: process.env.AI_MODEL_NAME || 'gpt-4-turbo',
    maxTokens: Number(process.env.AI_MAX_TOKENS || 4096),
    temperature: Number(process.env.AI_TEMPERATURE || 0.7),
  },
  
  // Document settings
  documents: {
    maxUploadSizeMB: Number(process.env.MAX_UPLOAD_SIZE_MB || 10),
    allowedTypes: ['application/pdf'],
    storagePrefix: process.env.STORAGE_PREFIX || 'documents/',
  },
  
  // UI settings
  ui: {
    defaultTheme: process.env.DEFAULT_THEME || 'light',
    animationEnabled: process.env.DISABLE_ANIMATIONS !== 'true',
    toastDurationMs: Number(process.env.TOAST_DURATION_MS || 4000),
  },
  
  // Feature flags
  features: {
    voiceAssistant: process.env.FEATURE_VOICE_ASSISTANT !== 'false',
    realTimeCollaboration: process.env.FEATURE_REALTIME_COLLAB === 'true',
    documentComments: process.env.FEATURE_DOCUMENT_COMMENTS !== 'false',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    prefix: '[TrustInk]',
  }
};

export default config; 