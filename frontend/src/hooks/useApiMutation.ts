"use client";

import { useState } from "react";

export function useApiMutation<TInput, TOutput>(mutateFn: (input: TInput) => Promise<TOutput>) {
  const [data, setData] = useState<TOutput | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  async function mutate(input: TInput) {
    setLoading(true);
    setError(null);
    try {
      const result = await mutateFn(input);
      setData(result);
      return result;
    } catch (err) {
      const errorValue = err instanceof Error ? err : new Error("请求失败");
      setError(errorValue);
      throw errorValue;
    } finally {
      setLoading(false);
    }
  }

  return { mutate, data, error, loading, reset: () => setData(null) };
}
