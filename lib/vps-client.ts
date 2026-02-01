/**
 * VPS API Client
 * 
 * This client is used by Vercel to communicate with the VPS API Server.
 * The VPS API Server acts as a bridge between Vercel and the MT5 EA Bot.
 */

const VPS_API_URL = process.env.NEXT_PUBLIC_VPS_API_URL || 'http://localhost:4000';
const API_KEY = process.env.MT5_API_KEY;

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch data from VPS API Server
 */
export async function fetchFromVPS(endpoint: string, options: FetchOptions = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  const url = `${VPS_API_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY || '',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VPS API error (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('VPS API request timeout');
    }
    
    throw error;
  }
}

/**
 * GET request to VPS
 */
export async function getFromVPS(endpoint: string, options?: FetchOptions) {
  return fetchFromVPS(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request to VPS
 */
export async function postToVPS(endpoint: string, data: any, options?: FetchOptions) {
  return fetchFromVPS(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Health check - Test VPS connection
 */
export async function checkVPSHealth() {
  try {
    const response = await fetchFromVPS('/health', { timeout: 5000 });
    return { ok: true, data: response };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
