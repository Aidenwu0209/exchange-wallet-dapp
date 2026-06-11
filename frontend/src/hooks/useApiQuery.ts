"use client";

import { useCallback, useEffect, useState } from "react";

type UseApiQueryOptions = {
  enabled?: boolean;
};

export function useApiQuery<T>(loader: () => Promise<T>, deps: unknown[] = [], options: UseApiQueryOptions = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("请求失败"));
    } finally {
      setLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
