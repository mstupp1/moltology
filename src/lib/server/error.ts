export interface ServerErrorResponse {
  success: false
  error: {
    message: string
    code: string
    status: number
    details?: unknown
  }
}

export class ServerError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly details?: unknown

  constructor(message: string, code: string = 'INTERNAL_ERROR', status: number = 500, details?: unknown) {
    super(message)
    this.name = 'ServerError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function formatServerError(error: unknown): ServerErrorResponse {
  if (error instanceof ServerError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
      },
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    }
  }

  return {
    success: false,
    error: {
      message: typeof error === 'string' ? error : 'An unexpected server error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
    },
  }
}
