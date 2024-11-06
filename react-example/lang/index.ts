import { getDefaultStore, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useMemo } from "react";
import task from "../task";
import { generateAtomStorageKey } from "../util/jotai";

const storageKey = generateAtomStorageKey("config_lang");

let defaultLocale: Locale = "en-US";

const langStore = getDefaultStore();

const localeAtom = atomWithStorage<Locale>(storageKey, defaultLocale);

export function getLocale() {
  return langStore.get(localeAtom);
}

export function setDefaultLocale(locale: Locale) {
  defaultLocale = locale;
}

export function setLocale(locale: Locale) {
  const current = langStore.get(localeAtom);
  if (locale === current) {
    return;
  }
  langStore.set(localeAtom, locale);
  task.exec("changeLocale");
}

// A type define for the translator book
export type Mapper<T extends string> = Partial<Record<Locale, Record<T, string>>>;

export class LangBook<T extends string> {
  private mapper: Mapper<T>;
  constructor(mapper: Mapper<T>) {
    this.mapper = mapper;
  }
  t = (text: T, variables?: Record<string, any>, locale?: Locale) => {
    const translation =
      this.currentBook(locale)?.[text] ??
      this.currentBook(defaultLocale)?.[text] ??
      this.currentBook("en-US")?.[text] ??
      text;
    return this.replaceVariables(translation, variables);
  };
  currentBook = (locale?: Locale) => {
    if (!locale) locale = getLocale();
    return this.mapper[locale];
  };
  private replaceVariables = (text: string, variables?: Record<string, any>) => {
    if (!variables) return text;
    return text.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? `{${key}}`);
  };
}

export function useLocale() {
  return useAtomValue(localeAtom);
}

// A Hook that uses the translator
export function useLangBook<T extends string>(book: LangBook<T>) {
  const locale = useLocale();
  return useMemo(() => {
    const currentBook = book.currentBook(locale);
    const t = (text: T, variables?: Record<string, any>) => book.t(text, variables, locale);
    return { currentBook, t };
  }, [locale, book]);
}

export type LangBookKeys<T> = T extends LangBook<infer U> ? U : never;
