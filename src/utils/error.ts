export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '未知错误';
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class APIError extends AppError {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = '网络错误，请检查网络连接') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = '请求超时，请稍后重试') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}
