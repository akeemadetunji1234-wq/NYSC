interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Bulletproof API Client
 * - 10s default timeout
 * - Automatic retry logic (default 3 retries for GET/safe requests)
 * - Environment variable base URL
 * - Type-safe Response Data
 */
export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeoutMs = 10000,
    retries = 3,
    ...fetchOptions
  } = options;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const url = `${baseUrl}${endpoint}`;

  // Only retry on GET, HEAD, OPTIONS
  const method = fetchOptions.method || "GET";
  const isRetryable = ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  const maxAttempts = isRetryable ? retries + 1 : 1;

  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });

      clearTimeout(id);

      // Parse JSON safely
      const contentType = response.headers.get("content-type");
      let data = null;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message || `API Error: ${response.status} ${response.statusText}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(id);
      
      const isAbort = error.name === "AbortError";
      const isRetryableError = isAbort || (error instanceof ApiError && error.status >= 500);

      if (attempt >= maxAttempts || !isRetryableError) {
        throw error;
      }

      // Exponential backoff before retry (e.g., 500ms, 1000ms, 2000ms)
      await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
    }
  }

  throw new Error("API Client failed to complete request");
}
