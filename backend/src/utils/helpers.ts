import { ServiceResponse, DepositBackendError } from '@/types';

/**
 * Format service response
 */
export function formatSuccessResponse<T>(data: T): ServiceResponse<T> {
  return {
    success: true,
    data
  };
}

/**
 * Format error response
 */
export function formatErrorResponse<T = null>(
  error: Error | string,
  statusCode: number = 500,
  errorCode: string = 'INTERNAL_ERROR'
): ServiceResponse<T> {
  const message = error instanceof Error ? error.message : error;
  return {
    success: false,
    error: message,
    errorCode
  } as any;
}

/**
 * Convert wei to standard units
 */
export function formatWeiToToken(wei: string, decimals: number = 18): string {
  const divisor = Math.pow(10, decimals);
  const num = parseFloat(wei) / divisor;
  return num.toFixed(decimals);
}

/**
 * Convert token to wei
 */
export function formatTokenToWei(token: string, decimals: number = 18): string {
  const multiplier = Math.pow(10, decimals);
  const wei = Math.floor(parseFloat(token) * multiplier);
  return wei.toString();
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate array of networks
 */
export function validateNetworks(networks: any[]): boolean {
  const validNetworks = ['ethereum', 'bsc', 'polygon', 'tron'];
  return (
    Array.isArray(networks) &&
    networks.length > 0 &&
    networks.every(n => validNetworks.includes(n))
  );
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(backoffMultiplier, i);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Parse environment variable as number
 */
export function parseEnvNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable as boolean
 */
export function parseEnvBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
