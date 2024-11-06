import { useEffect, useRef, useState } from "react";
import { Response } from "../request";

type Service<Query, PathVal, Res> =
  | ((params: Query) => Promise<Response<Res>>)
  | ((params: Query, pathVariables: PathVal) => Promise<Response<Res>>)
  | (() => Promise<Response<Res>>);

type RequestParams<Q, P> = Q extends object
  ? P extends object
    ? [Q, P]
    : [Q]
  : P extends object
  ? [P]
  : [];

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
      //@ts-ignore
      run(...(options?.initialParams ?? []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ...state, run };
}
