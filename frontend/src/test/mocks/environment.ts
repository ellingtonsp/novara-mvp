// Mock environment for tests
export const environmentConfig = {
  environment: 'test',
  apiUrl: 'http://localhost:9002',
  isDevelopment: false,
  isStaging: false,
  isPreview: false,
  isProduction: false,
  isPWA: false,
  debugMode: false
};

export const API_BASE_URL = environmentConfig.apiUrl;
export const IS_DEVELOPMENT = environmentConfig.isDevelopment;
export const IS_STAGING = environmentConfig.isStaging;
export const IS_PREVIEW = environmentConfig.isPreview;
export const IS_PRODUCTION = environmentConfig.isProduction;

export function getEnvironment() {
  return 'test';
}

export function getApiUrl() {
  return 'http://localhost:9002';
}