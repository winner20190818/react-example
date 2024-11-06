import { useEffect, useMemo, useRef, useState } from "react";
import { Response } from "../request";

type BasicCursorResult = Response<{
  nextCursor?: string;
  list?: any[];
}>;

type BasicQueryParams = [
  {
    startCursor?: string;
    limit: number;
  },
  ...any[],
];

type UseCursorQueryApiReturn<R, Q extends BasicQueryParams> = {
  loadMore: () => Promise<void>;
  reload: (...args: Q) => Promise<void>;
  data?: R;
  hasMore: boolean;
  loading: boolean;
};

type Options<Q> = {
  args: Q;
  depends?: any[];
};

const defaultState = { hasMore: false, loading: false };

export function useCursorQueryApi<
  S extends (...args: BasicQueryParams) => Promise<BasicCursorResult>,
  R extends BasicCursorResult = Awaited<ReturnType<S>>,
  Q extends BasicQueryParams = Parameters<S>,
>(service: S, options?: Options<Q>): UseCursorQueryApiReturn<R["data"], Q> {
  const [loading, setLoading] = useState(false);
  type State = {
    args?: Q;
    data?: R["data"];
    loading: boolean;
    hasMore: boolean;
  };
  const stateRef = useRef<State>(defaultState);
  const methods = useMemo(
    () => ({
      loadMore: async () => {
        let state = stateRef.current;
        if (state.args === undefined) {
          console.warn("never load");
          return;
        }
        if (state.loading) {
          console.warn("loading");
          return;
        }
        if (!state.hasMore) {
          console.warn("no more");
          return;
        }
        const startCursor = state.data?.nextCursor;
        if (!startCursor) {
          console.warn("no next cursor");
          return;
        }

        stateRef.current.loading = true;
        setLoading(true);

        const newArgs: Q = [...state.args];
        newArgs[0] = { ...newArgs[0], startCursor };

        const beforeList = state.data?.list ?? [];
        // @ts-ignore
        const res = await service(...newArgs);
        state = { ...state, loading: false };
        if (res.success) {
          state.hasMore = res.data.nextCursor !== undefined;

          state.data = { ...res.data, list: [...beforeList, ...(res.data?.list ?? [])] };
          state.args = newArgs;
        }
        stateRef.current = state;
        setLoading(false);
      },
      reload: async (...args: Q) => {
        if (stateRef.current.loading) {
          return;
        }
        let newState: State = { ...defaultState, loading: true, args };
        stateRef.current = newState;
        setLoading(true);
        // @ts-ignore
        const res = await service(...args);
        newState = { ...newState, loading: false };
        if (res.success) {
          newState.hasMore = res.data.nextCursor !== undefined;
          newState.data = res.data;
        }
        stateRef.current = newState;
        setLoading(false);
      },
    }),
    [service],
  );

  useEffect(
    () => {
      if (options) {
        methods.reload(...options.args);
      }
    },
    options?.depends ? options?.depends : [],
  );
  const { data, hasMore } = stateRef.current;
  return { data, hasMore, loading, ...methods };
}
