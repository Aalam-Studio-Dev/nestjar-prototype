/**
 * Errors crossing the service boundary carry a stable code. The UI maps codes
 * to copy (see src/lib/errorMessages.ts) and never parses error messages.
 */

export type ServiceErrorCode =
  | 'not-found'
  | 'already-exists'
  | 'month-not-active'
  | 'month-already-active'
  | 'exceeds-available'
  | 'invalid-input'
  | 'not-implemented'
  | 'unknown';

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

export function isServiceError(value: unknown): value is ServiceError {
  return value instanceof ServiceError;
}
