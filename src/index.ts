declare function pairs<K extends string | number, V>(
  object: Readonly<Record<K, V> | V[]>,
): IterableFunction<LuaTuple<[Exclude<K, undefined>, Exclude<V, undefined>]>>;

type GenericRecord = Record<string | number, unknown>;
type Primitive =
  | string
  | number
  | boolean
  | undefined;

type Length<T> = T extends { length: infer N extends number } ? N : never;
type IsTuple<T> = T extends readonly unknown[]
  ? Length<T> extends never
  ? false
  : true
  : false;


type NonSymbolKeys<T> = Exclude<keyof T, symbol>;
type DeepPartial<T> =
  T extends Primitive
  ? T
  : T extends readonly (infer U)[]
  ? IsTuple<T> extends true
  ? { readonly [K in keyof T]?: DeepPartial<T[K]> }
  : readonly DeepPartial<U>[]
  : T extends object
  ? { readonly [K in NonSymbolKeys<T>]?: DeepPartial<T[K]> }
  : T;

type RemovalTag<T> = true | (T extends object ? DeepKeys<T> : never);

type DeepKeys<T> = T extends readonly (infer U)[]
  ? readonly (RemovalTag<U> | undefined)[]
  : {
    readonly [K in NonSymbolKeys<T>]?: RemovalTag<T[K]>;
  }

export interface Diff<T> {
  readonly changed?: DeepPartial<T>;
  readonly removed?: DeepKeys<T>;
}

export function createDiff<T extends GenericRecord | unknown[]>(oldData: T, newData: T): Diff<T> {
  if (oldData === newData)
    return {};

  assert(typeIs(oldData, "table"), "attempt to create diff of non-table objects");
  assert(typeIs(newData, "table"), "attempt to create diff of non-table objects");

  let changed: GenericRecord | undefined;
  let removed: GenericRecord | undefined;
  for (const [key] of pairs(oldData)) {
    if (newData[key as never] !== undefined) continue;

    removed ??= {};
    removed[key] = true;
  }

  for (const [key, newValue] of pairs(newData)) {
    const oldValue = oldData[key as never] as GenericRecord;
    if (oldValue === undefined) {
      changed ??= {} as never;
      changed[key] = newValue;
      continue;
    }

    if ((!typeIs(oldValue, "table") || !typeIs(newValue, "table")) && oldValue !== newValue) {
      changed ??= {} as never;
      changed[key] = newValue;
      continue;
    }

    const childDiff = createDiff(oldValue!, newValue as GenericRecord);
    if ("changed" in childDiff) {
      changed ??= {} as never;
      changed[key] = childDiff.changed ?? newValue;
    }
    if ("removed" in childDiff) {
      removed ??= {};
      removed[key] = childDiff.removed;
    }
  }

  return { changed: changed as never, removed: removed as never };
}

export function applyDiff<T extends {}>(base: T, diff: Diff<T>): T {
  assert(typeIs(base, "table"), "attempt to apply diff to non-table object");
  const result = table.clone<GenericRecord>(base);

  if (diff.removed !== undefined) {
    for (const [key, value] of pairs(diff.removed as Record<keyof T, true | DeepKeys<T>>)) {
      if (value === true) {
        result[key] = undefined!;
        continue;
      }

      result[key] = applyDiff(base[key as never], {
        changed: diff.changed?.[key as never],
        removed: diff.removed?.[key as never]
      });
    }
  }

  if (diff.changed !== undefined) {
    for (const [key, value] of pairs(diff.changed as Record<keyof T, DeepPartial<T>>)) {
      const baseValue = base[key as keyof T];
      if (!typeIs(value, "table") || !typeIs(baseValue, "table")) {
        result[key] = value;
        continue;
      }

      result[key] = applyDiff(baseValue, {
        changed: value,
        removed: diff.removed?.[key as never]
      });
    }
  }

  return result as T;
}