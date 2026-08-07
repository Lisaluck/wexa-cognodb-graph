import type { ApiErrorBody } from "./types";

export class ApiClientError extends Error {
  code: ApiErrorBody["code"];
  status: number;

  constructor(message: string, code: ApiErrorBody["code"], status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const data = (await response.json()) as T | ApiErrorBody;

  if (!response.ok) {
    const body = data as ApiErrorBody;
    throw new ApiClientError(
      body.error ?? "Request failed",
      body.code ?? "INTERNAL",
      response.status,
    );
  }

  return data as T;
}
