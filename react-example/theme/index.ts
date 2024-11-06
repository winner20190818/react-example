import { getDefaultStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { AliasToken } from "antd/es/theme/interface";
import task from "../task";
import { generateAtomStorageKey } from "../util/jotai";

export type ThemeTokenType = Partial<AliasToken>;

const storageKey = generateAtomStorageKey("config_theme");

const defaultTheme: ThemeTokenType = {};

const themeStore = getDefaultStore();

const themeAtom = atomWithStorage<ThemeTokenType>(storageKey, defaultTheme);

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);

  const setAndPersistTheme = (newTheme: ThemeTokenType) => {
    const updatedTheme = Object.assign({}, theme, newTheme);
    themeStore.set(themeAtom, updatedTheme);
    setTheme(updatedTheme);
    task.exec("changeTheme");
  };

  const resetTheme = () => {
    themeStore.set(themeAtom, defaultTheme);
    setTheme(defaultTheme);
    task.exec("changeTheme");
  };

  return [theme, setAndPersistTheme, resetTheme] as const;
}
