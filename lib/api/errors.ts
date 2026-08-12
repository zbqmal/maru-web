export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === "object" && error !== null && "message" in error;

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (isErrorWithMessage(error) && typeof error.message === "string") {
    return error.message;
  }

  return "알 수 없는 오류가 발생했어요.";
};
