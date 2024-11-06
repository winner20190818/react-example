import { useCallback, useRef, useState } from "react";

// @ts-ignore
type PromiseFunction<T> = (...args: Parameters<T>) => ReturnType<T>;

function useLoadingCallback<T extends PromiseFunction<T>>(
  callback: T,
  dependencyList: readonly unknown[] = [],
): [T, boolean] {
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef<boolean>(false);

  const run = useCallback(async (...params: Parameters<T>) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const res = await callback(...params);
    loadingRef.current = false;
    setLoading(false);
    return res;
  }, dependencyList) as T;

  return [run, loading];
}

export default useLoadingCallback;
