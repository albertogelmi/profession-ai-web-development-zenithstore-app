/**
 * API Client for making type-safe requests to backend via Next.js API Routes
 */

import { logger } from './logger';

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Generic API client for all backend requests
 * All requests go through Next.js API Routes (/api/backend/*)
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = buildURL(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    return handleResponse<T>(response);
  },
  
  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const url = buildURL(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return handleResponse<T>(response);
  },
  
  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const url = buildURL(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return handleResponse<T>(response);
  },
  
  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const url = buildURL(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return handleResponse<T>(response);
  },
  
  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = buildURL(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    return handleResponse<T>(response);
  },
};

/**
 * Build URL with query parameters
 */
function buildURL(endpoint: string, params?: Record<string, any>): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const baseURL = `/api/backend`;
  let url = `${baseURL}${path}`;
  
  logger.debug('[API Client] Building URL:', { endpoint, baseURL, finalURL: url });
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Check if response is ok
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorData;
    
    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Response is not JSON
      errorMessage = await response.text() || errorMessage;
    }
    
    // Handle 401 Unauthorized - Session expired or invalid JWT
    if (response.status === 401) {
      logger.warn('[API Client] 401 Unauthorized received - triggering logout');
      
      // Check if we're in browser context
      if (typeof window !== 'undefined') {
        // Dynamically import to avoid server-side issues
        import('./logout').then(({ logout }) => {
          logout().catch(err => {
            logger.error('[API Client] Logout failed:', err);
          });
        });
      }
      
      throw new APIError(
        response.status,
        response.statusText,
        'La tua sessione è scaduta. Verrai reindirizzato alla pagina di login.',
        errorData
      );
    }
    
    throw new APIError(
      response.status,
      response.statusText,
      errorMessage,
      errorData
    );
  }
  
  // Parse JSON response
  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Response is not JSON (e.g., 204 No Content)
    return undefined as T;
  }
}

/**
 * Public API client (no authentication required)
 * For public endpoints that don't go through /api/backend
 */
export const publicApiClient = {
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = buildPublicURL(endpoint, options?.params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    return handleResponse<T>(response);
  },
};

function buildPublicURL(endpoint: string, params?: Record<string, any>): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = path;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
}
