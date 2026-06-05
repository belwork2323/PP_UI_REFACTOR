export class ApiError {
  status: number;
  data: unknown;

  constructor({ status, data }: { status: number; data: unknown }) {
    this.status = status;
    this.data = data;
  }
}
