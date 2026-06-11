import type { ApiResponse } from "@/src/types/api";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export class ApiClientError extends Error {
  code: string;
  details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success || !body.data) {
    throw new ApiClientError(body.error?.code ?? "INTERNAL_ERROR", body.error?.message ?? "请求失败", body.error?.details);
  }
  return body.data;
}

export const apiClient = {
  get<T>(path: string) {
    return request<T>(path);
  },
  post<T>(path: string, body: unknown = {}) {
    return request<T>(path, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
};
