export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = (error as { error?: { message?: string; Message?: string; error?: string } }).error;
    if (body?.message || body?.Message || body?.error) {
      return body.message ?? body.Message ?? body.error ?? fallback;
    }
  }
  if (error instanceof Error) {
    if ('errorCode' in error && error.errorCode === 'interaction_in_progress') {
      return 'Microsoft sign-in is already in progress. Finish or close that sign-in window and retry.';
    }
    return error.message;
  }
  return fallback;
}
