// ============================================================
//  lib/errors.ts - Typed error classes for API routes
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

// -- Error codes -----------------------------------------------
export const ERROR_CODES = {
  UNAUTHORIZED:     'UNAUTHORIZED',
  FORBIDDEN:        'FORBIDDEN',
  NOT_FOUND:        'NOT_FOUND',
  BAD_REQUEST:      'BAD_REQUEST',
  RATE_LIMITED:     'RATE_LIMITED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  INTERNAL:         'INTERNAL',
  VALIDATION:       'VALIDATION',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// -- Base app error --------------------------------------------
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly status: number,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AppError'
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      { error: this.message, code: this.code, ...this.extra },
      { status: this.status },
    )
  }
}

// -- Convenience subclasses ------------------------------------
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, ERROR_CODES.UNAUTHORIZED, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, ERROR_CODES.FORBIDDEN, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, ERROR_CODES.NOT_FOUND, 404)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, ERROR_CODES.BAD_REQUEST, 400)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, extra?: Record<string, unknown>) {
    super(message, ERROR_CODES.RATE_LIMITED, 429, extra)
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required') {
    super(message, ERROR_CODES.PAYMENT_REQUIRED, 402)
  }
}

// -- Route error wrapper ---------------------------------------
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req)
    } catch (err) {
      if (err instanceof AppError) {
        return err.toResponse()
      }
      console.error('[API Error]', req.url, err)
      return NextResponse.json(
        { error: 'Internal server error', code: ERROR_CODES.INTERNAL },
        { status: 500 },
      )
    }
  }
}
