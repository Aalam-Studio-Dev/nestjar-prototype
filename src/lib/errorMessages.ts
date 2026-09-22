import { isServiceError, type ServiceErrorCode } from '@/services';

const MESSAGES: Record<ServiceErrorCode, string> = {
  'not-found': 'We could not find that. It may have been removed.',
  'already-exists': 'That already exists.',
  'month-not-active': 'Plan this month first, then you can seed jars and log spending.',
  'month-already-active': 'This month has already been planned.',
  'exceeds-available': 'That is more than is left in the jar.',
  'invalid-input': 'Some details need another look.',
  'not-implemented': 'This part is not connected yet.',
  unknown: 'Something went wrong. Please try again.',
};

/** Turns any thrown value into copy that is safe to show a person. */
export function errorMessage(error: unknown): string {
  if (isServiceError(error)) return MESSAGES[error.code];
  return MESSAGES.unknown;
}
