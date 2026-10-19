export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const body: unknown = error.error;
    if (typeof body === "object" && body !== null) {
      const message = getStringProperty(body, "message");
      const upperMessage = getStringProperty(body, "Message");
      const errorMessage = getStringProperty(body, "error");
      if (message || upperMessage || errorMessage) {
        return message ?? upperMessage ?? errorMessage ?? fallback;
      }
    }
  }
  if (error instanceof Error) {
    if ("errorCode" in error && error.errorCode === "interaction_in_progress") {
      return "Microsoft sign-in is already in progress. Finish or close that sign-in window and retry.";
    }
    return error.message;
  }
  return fallback;
}

function getStringProperty(value: object, key: string): string | undefined {
  if (!(key in value)) return undefined;
  const property: unknown = Reflect.get(value, key);
  return typeof property === "string" ? property : undefined;
}
