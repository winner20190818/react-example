import { Atom, atom, WritableAtom } from "jotai";
import { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { commonConstant } from "./constant";

export type RefreshableAtom<T> = WritableAtom<T | null, [] | [T], void | Promise<void>>;

export function atomWithRefreshWithoutSuspense<T>(
  read: (get: Parameters<Atom<T>["read"]>[0]) => Promise<T>,
  init?: T,
) {
  const refreshAtom = atom(false);
  let data: T | undefined = init;
  const _atom = atom(
    (get) => {
      get(refreshAtom);
      return data;
    },
    async (get, set) => {
      // @ts-ignore
      data = await read(get);
      set(refreshAtom, (v) => !v);
    },
  );
  if (!init) {
    _atom.onMount = (setAtom) => {
      setAtom();
    };
  }
  return _atom as RefreshableAtom<T>;
}

export function atomWithRefreshWithoutSuspenseLoadable<T>(
  read: (get: Parameters<Atom<T>["read"]>[0]) => Promise<T>,
  init?: T,
) {
  const refreshAtom = atom(false);
  const statusAtom = atom<"loading" | "success" | "error">("loading");
  const errorAtom = atom<unknown | undefined>(undefined);
  let data: T | undefined = init;
  const _atom = atom(
    (get) => {
      get(refreshAtom);
      return { data, status: get(statusAtom) };
    },
    async (get, set) => {
      set(errorAtom, undefined);
      set(statusAtom, "loading");
      try {
        // @ts-ignore
        data = await read(get);
        set(statusAtom, "success");
        set(refreshAtom, (v) => !v);
      } catch (error) {
        set(statusAtom, "error");
        set(errorAtom, error);
        throw error;
      }
    },
  );
  if (!init) {
    _atom.onMount = (setAtom) => {
      setAtom();
    };
  }
  return _atom as RefreshableAtom<{
    data: T | undefined;
    status: "loading" | "success" | "error";
    error?: unknown;
  }>;
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateAtomStorageKey = (key: string) => {
  const _key = `atom:${key}`;
  return commonConstant.isDevMode ? _key : btoa(_key);
};

function encryptData(data: object) {
  return commonConstant.isDevMode ? JSON.stringify(data) : btoa(JSON.stringify(data));
}
function decryptData(data: string) {
  return commonConstant.isDevMode ? JSON.parse(data) : JSON.parse(atob(data));
}

export function createSyncStorage<Value>(storage: Storage = localStorage) {
  const _storage = storage;
  const output: SyncStorage<Value> = {
    getItem(key, initialValue) {
      const value = _storage.getItem(key);
      if (value) {
        try {
          return decryptData(value);
        } catch (error) {
          console.error(error);
          return initialValue;
        }
      }
      return initialValue;
    },
    setItem(key: string, newValue: Value) {
      if (newValue === null || newValue === undefined) {
        return this.removeItem(key);
      }
      const encryption = encryptData(newValue);
      _storage.setItem(key, encryption);
    },
    removeItem(key) {
      _storage.removeItem(key);
    },
  };

  return output;
}
