import { atom, getDefaultStore, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { Response } from "../request";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { createSyncStorage, generateAtomStorageKey } from "./jotai";
import { WritableAtom } from "jotai";
import _ from "lodash";
import task from "../task";
import { commonConstant } from "./constant";

type State<T> = {
  loading: boolean;
  data?: T;
};

const defaultState = { loading: false };
const store = getDefaultStore();
const firstLoadAtomMap = new Map<string, ReturnType<typeof atom<boolean>>>();
const firstLoadedAtomFamily = atomFamily((key: string) => {
  if (!firstLoadAtomMap.has(key)) {
    firstLoadAtomMap.set(key, atom(false));
  }
  return firstLoadAtomMap.get(key)!;
});
let indexAnonymous = 0;

export function createGlobalApiData<T>(
  service: () => Promise<Response<T>>,
  _authRequired: boolean = false,
) {
  const storageName = generateAtomStorageKey(
    `createGlobalApiData-${
      service.displayName?.trim() || service.name?.trim() || indexAnonymous++
    }`,
  );
  function log(...args: Parameters<typeof console.log>) {
    commonConstant.isDevMode && console.log(`${storageName}`, ...args);
  }

  const firstLoadedAtom = firstLoadedAtomFamily(storageName);

  const stateAtom = atomWithStorage<State<T>>(storageName, defaultState, createSyncStorage(), {
    getOnInit: true,
  });

  async function _reload() {
    store.set(firstLoadedAtom, true);
    store.set(stateAtom, (s) => ({ ...s, loading: true }));
    try {
      const res = await service();
      if (res.success) {
        store.set(stateAtom, { data: res.data, loading: false });
        log("reloaded");
      } else {
        throw new Error(res.errorMessage);
      }
    } catch (error) {
      store.set(firstLoadedAtom, false);
      store.set(stateAtom, (s) => ({ ...s, loading: false }));
    }
  }

  const reload = _.debounce(_reload, 3000, {
    leading: true,
    trailing: false,
  });
  reload.displayName = `reload-${storageName}`;

  function useGlobalState() {
    const isFirstLoaded = useAtomValue(firstLoadedAtom);
    const state = useAtomValue(stateAtom);
    useEffect(() => {
      if (!isFirstLoaded) {
        reload();
      }
    }, [isFirstLoaded]);

    return { ...state, reload };
  }

  type SetStateArgs = typeof stateAtom extends WritableAtom<infer _, infer Args, void>
    ? Args
    : never;

  if (_authRequired) {
    task.on("login", reload, 1);
    task.on("logout", async function () {
      store.set(firstLoadedAtom, false);
      store.set(stateAtom, { loading: false });
    });
  }
  task.on("start", reload, 1);
  return [
    useGlobalState,
    stateAtom,
    reload,
    (...args: SetStateArgs) => {
      store.set(stateAtom, ...args);
    },
  ] as const;
}
