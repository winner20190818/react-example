type NestedKeys<
  T,
  Depth extends number = 4,
  CurrentDepth extends any[] = [],
> = CurrentDepth["length"] extends Depth
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? T[K] extends (infer U)[]
            ? K | [K, number] | [K, number, NestedKeys<U, Depth, [any, ...CurrentDepth]>]
            : T[K] extends object | undefined
              ? K | [K, NestedKeys<NonNullable<T[K]>, Depth, [any, ...CurrentDepth]>]
              : K
          : never;
      }[keyof T]
    : never;

// NestedValue<T, K> 根据嵌套键路径提取嵌套对象的值。
type NestedValue<T, K> = K extends keyof T
  ? T[K]
  : K extends [infer First, ...infer Rest]
    ? First extends keyof T
      ? Rest extends []
        ? T[First]
        : NestedValue<T[First], Rest>
      : never
    : never;
