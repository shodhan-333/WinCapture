export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Carries a safe display message plus transport metadata through API and query layers.
export class ApiError extends Error {
  public readonly code: string;

  // Preserve HTTP and correlation metadata alongside the displayable API message.
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
    public readonly correlationId?: string,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code ?? (status === 0 ? "NETWORK_ERROR" : `HTTP_${status}`);
  }
}
