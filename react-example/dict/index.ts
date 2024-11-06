import { atom, getDefaultStore, useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useLocale } from "../lang";
import { Response } from "../request";

export type DictItem<T extends string | number> = {
  value: T;
  label: string;
  tip?: string;
};

export class Dict<T extends string | number = string> {
  readonly items: DictItem<T>[];
  private readonly map: Partial<Record<T, DictItem<T>>>;
  constructor(...items: DictItem<T>[]) {
    this.items = items;
    this.map = itemsToMap(...items);
  }
  l = (value: T) => {
    return this.map[value]?.label ?? value;
  };
}

function itemsToMap<T extends string | number>(...items: DictItem<T>[]): Record<T, DictItem<T>> {
  const m = {} as Record<T, DictItem<T>>;
  items.forEach((d) => (m[d.value] = d));
  return m;
}

type DataType = Record<string, DictItem<string | number>[]>;
/**
 * 用於定義dict hook
 * @param fetchData
 * @returns useDict
 * @example const useDict = defineDictHook(getDictMap)
 */
export function defineDictHook(fetchData: (locale: Locale) => Promise<Response<DataType>>) {
  type DictsAtomType = Partial<Record<string, Dict<any>>>;
  const dictsAtom = atom<DictsAtomType>({});
  const store = getDefaultStore();

  let fetchedLocale: Locale | undefined;

  async function fetch(locale: Locale) {
    if (fetchedLocale === locale) {
      return;
    }
    fetchedLocale = locale;
    const state: DictsAtomType = {};
    try {
      const res = await fetchData(locale);
      if (!res.success) {
        throw new Error(res.errorMessage);
      }
      Object.entries(res.data).forEach(([key, value]) => {
        state[key] = new Dict<string | number>(...value);
      });
    } catch (error) {
      fetchedLocale = undefined;
    }
    store.set(dictsAtom, state);
  }
  function useDict<T extends string>(key: string) {
    const locale = useLocale();
    useEffect(() => {
      fetch(locale);
    }, [locale]);
    const [dicts] = useAtom(dictsAtom);
    if (dicts[key]) {
      return dicts[key] as Dict<T>;
    }
    return new Dict<T>();
  }
  return useDict;
}

type Getter<T> = (item: T) => string;

export function useDictFromList<T>(
  list: T[] | undefined,
  valueGetter: Getter<T>,
  labelGetter: Getter<T>,
  tipGatter?: Getter<T>,
) {
  return useMemo(() => {
    if (!list) {
      return undefined;
    }
    const dict = new Dict(
      ...list.map((item) => {
        const res: DictItem<any> = {
          value: valueGetter(item),
          label: labelGetter(item),
        };
        if (tipGatter) {
          res.tip = tipGatter(item);
        }
        return res;
      }),
    );
    return dict;
  }, [list]);
}
