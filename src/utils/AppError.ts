export class AppError extends Error {
  status: number;
  details: unknown;
  timestamp: string;

  constructor({
    status,
    message,
    details = null,
  }: {
    status: number;
    message: string;
    details?: unknown;
  }) {
    super(message);
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}
