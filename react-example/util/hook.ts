import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Response } from "../request";
import { useSearchParams, URLSearchParamsInit } from "react-router-dom";

/**
 * @author Gongben
 * @description 這是一個自定義的 React Hook，用於當需要在組件中使用 async function 時，可以使用這個 Hook 來簡化代碼。
 */
export function useAsyncMemo<T>(fn: () => Promise<T>, initialValue: T, deps?: any[]): T {
  const [value, setValue] = useState<T>(initialValue);
  useEffect(() => {
    fn().then(setValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);
  return value;
}

/**
 * @author Gongben
 * @description 這是一個自定義的 React Hook，傳入的參數改變時，會重新設定 state 的值，頻繁用於當父組件傳入的 props 改變時，需要重新設定 state 的值。
 */
export function useStateEffectedBy<S>(initialState: S | (() => S)) {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    setState(initialState);
  }, [initialState]);
  return [state, setState] as const;
}

/**
 * @author Gongben
 * @description 這是一個自定義的 React Hook，用於在組件中使用 localStorage，必須滿足 SSR 的要求。
 */
export function useLocalStorage<D>(key: string, defaultValue: D) {
  const [value, setValue] = useState<D>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}
/**
 * @author Gongben
 * @description 這是一個自定義的 React Hook，連接外部狀態和組件內部狀態，當外部狀態改變時，會自動更新組件內部狀態。
 */
export function useStateConnect<S>(connectState: S, connector: (state: S) => void) {
  const [state, setState] = useState(connectState);
  useEffect(() => {
    connector(state);
  }, [connector, state]);
  return [connectState, setState] as const;
}

type Service<Query, PathVal, Res> =
  | ((params: Query) => Promise<Response<Res>>)
  | ((params: Query, pathVariables: PathVal) => Promise<Response<Res>>)
  | (() => Promise<Response<Res>>);

type RequestParams<Query, PathVal> = Parameters<Service<Query, PathVal, any>>;

type Options<Query, PathVal, Res> = {
  initialParams?: RequestParams<Query, PathVal>;
  manual?: true;
  onRan?: (res: Response<Res>) => void;
};

type State<Query, PathVal, Res> = {
  loading: boolean;
  params?: RequestParams<Query, PathVal>;
  result?: Response<Res>;
};

/**
 * @author Lucas
 * @description 查詢類的api 管理loading狀態和查詢參數
 */
export function useQueryApi<Q, P, R>(service: Service<Q, P, R>, options?: Options<Q, P, R>) {
  const [state, setState] = useState<State<Q, P, R>>({
    loading: false,
    params: options?.initialParams,
  });
  const loadingRef = useRef<boolean>(false);
  const run = async (...params: RequestParams<Q, P>) => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setState((s) => ({ ...s, params, loading: true }));
    // @ts-ignore
    const result = params ? await service(...params) : await service();
    loadingRef.current = false;
    setState({ params, loading: false, result });
    options?.onRan?.(result);
    return result;
  };
  useEffect(() => {
    if (!options?.manual) {
      run(options?.initialParams as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ...state, run };
}

function makeURLSearchParamsInitToObj<T extends URLSearchParamsInit>(init?: T) {
  if (!init) {
    return {};
  }
  return Object.fromEntries(Object.entries(init.valueOf()));
}

/**
 * @author Gongben
 * @description 這是一個自定義的 React Hook，用於在組件中使用 URLSearchParams，並且可以在 URLSearchParams 中添加新的參數。
 */
export function useAppendableSearchParams<T extends URLSearchParamsInit>(
  baseParams?: T,
  replace = false,
) {
  const [searchParams, _setSearchParams] = useSearchParams();
  const prevParams = Object.fromEntries(searchParams.entries());
  const baseParamsObject = useMemo(() => {
    return baseParams && makeURLSearchParamsInitToObj(baseParams);
  }, [baseParams]);

  const setSearchParams = useCallback(
    (...args: Parameters<typeof _setSearchParams>) => {
      const argsNext: typeof args = args;
      if (typeof args[0] === "function") {
        const arg0 = args[0] as (prev: URLSearchParams) => URLSearchParamsInit;
        const next = (prev: URLSearchParams): URLSearchParamsInit => {
          const _append = arg0(prev) as object;
          if (replace) {
            return { ...baseParamsObject, ..._append };
          }
          return {
            ...baseParamsObject,
            ...baseParamsObject,
            ..._append,
          };
        };
        argsNext[0] = next;
      }
      if (typeof args[0] === "object") {
        const arg0 = makeURLSearchParamsInitToObj(args[0]);
        if (replace) {
          argsNext[0] = { ...baseParamsObject, ...arg0 };
        }
        argsNext[0] = { ...prevParams, ...baseParamsObject, ...arg0 };
      }
      _setSearchParams(...argsNext);
    },
    [_setSearchParams, baseParams, prevParams, replace],
  );
  return [searchParams, setSearchParams] as const;
}
