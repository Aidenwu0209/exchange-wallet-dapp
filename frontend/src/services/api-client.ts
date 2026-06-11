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
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(`HTTP_${response.status}`, `接口未返回 API JSON：${response.status} ${response.statusText}`, { path });
  }
  if (!response.ok || !body.success || body.data == null) {
    throw new ApiClientError(body.error?.code ?? `HTTP_${response.status}`, body.error?.message ?? "请求失败", body.error?.details ?? { path });
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
