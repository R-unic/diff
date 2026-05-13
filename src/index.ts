declare function pairs<K extends string | number, V>(
  object: Readonly<Record<K, V> | V[]>,
): IterableFunction<LuaTuple<[Exclude<K, undefined>, Exclude<V, undefined>]>>;

type GenericRecord = Record<string | number, unknown>;
type Primitive =
  | string
  | number
  | boolean
  | undefined;

type Length<T> = T extends { length: infer N extends number; } ? N : never;
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
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<DeepPartial<K>, DeepPartial<V>>
  : T extends object
  ? { readonly [K in NonSymbolKeys<T>]?: DeepPartial<T[K]> }
  : T;

type RemovalTag<T> = true | (T extends object ? DeepKeys<T> : never);

type DeepKeys<T> =
  T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<K, RemovalTag<V> | undefined>
  : T extends readonly (infer U)[]
  ? readonly (RemovalTag<U> | undefined)[]
  : {
    readonly [K in NonSymbolKeys<T>]?: RemovalTag<T[K]>;
  };

export interface Diff<T> {
  readonly changed?: DeepPartial<T>;
  readonly removed?: DeepKeys<T>;
}

export interface DiffOptions<K> {
  readonly equals?: (a: unknown, b: unknown) => boolean;
  readonly ignoreKeys?: K[];
}

function isEmpty(record: GenericRecord): boolean {
  for (const _ of pairs(record)) return false;
  return true;
}

/**
 * Creates a diff object by comparing two data structures.
 *
 * @param oldData - The original data object
 * @param newData - The new data object to compare against
 * @param options - Configuration options for diff generation
 * @param options.equals - Custom equality function for comparing values (default: `===`)
 * @param options.ignoreKeys - Array of keys to exclude from diff comparison (shallow, root level only)
 * @returns A Diff object containing changed and removed keys, or an empty object if no differences
 *
 * @example
 * const diff = createDiff(
 *   { a: 1, b: 2 },
 *   { a: 1, b: 3, c: 4 }
 * );
 * // Returns: { changed: { b: 3, c: 4 } }
 */
export function createDiff<T extends {}>(
  oldData: T,
  newData: T,
  {
    equals = (a, b) => a === b,
    ignoreKeys = []
  }: DiffOptions<T extends GenericRecord ? keyof T : unknown> = {}
): Diff<T> {
  if (oldData === newData)
    return {};

  const keyIgnoreSet = new Set(ignoreKeys);
  assert(typeIs(oldData, "table"), "attempt to create diff of non-table objects");
  assert(typeIs(newData, "table"), "attempt to create diff of non-table objects");

  let changed: GenericRecord = {};
  let removed: GenericRecord = {};
  for (const [key] of oldData as unknown as Map<string, unknown>) {
    if (keyIgnoreSet.has(key as never)) continue;
    if (key in newData) continue;
    removed[key] = true;
  }

  for (const [key, newValue] of newData as unknown as Map<string, unknown>) {
    if (keyIgnoreSet.has(key as never)) continue;

    const oldValue = (oldData as GenericRecord)[key];
    if (typeIs(oldValue, "table") && typeIs(newValue, "table")) {
      const childDiff = createDiff(oldValue, newValue, { equals });
      if ("changed" in childDiff) {
        changed[key] = childDiff.changed;
      }
      if ("removed" in childDiff) {
        removed[key] = childDiff.removed;
      }
      continue;
    }

    if (equals(oldValue, newValue)) continue;
    changed[key] = newValue;
  }

  return {
    changed: isEmpty(changed) ? undefined : changed as never,
    removed: isEmpty(removed) ? undefined : removed as never
  };
}

/**
 * Applies a diff to a base object and returns the modified result.
 *
 * @param base - The base object to apply the diff to
 * @param diff - The diff object containing changes and removals
 * @returns A new object with the diff applied to the base
 *
 * @example
 * const result = applyDiff(
 *   { a: 1, b: 2, c: 3 },
 *   { changed: { b: 5 }, removed: { c: true } }
 * );
 * // Returns: { a: 1, b: 5 }
 */
export function applyDiff<T extends {}>(base: T, diff: Diff<T>): T {
  assert(typeIs(base, "table"), "attempt to apply diff to non-table object");
  const result = table.clone<GenericRecord>(base);

  if (diff.removed !== undefined) {
    for (const [key, value] of pairs(diff.removed as Record<keyof T, true | DeepKeys<T>>)) {
      if (value === true) {
        delete result[key];
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

      const removed = diff.removed?.[key as never];
      result[key] = applyDiff(baseValue, { changed: value, removed });
    }
  }

  return result as T;
}