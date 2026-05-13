import { Assert, Fact } from "@rbxts/runit";
import { createDiff, type Diff } from "@rbxts/diff";

class CreateDiffTest {
  @Fact
  public "non-table objects error"(): void {
    Assert.throws(() => createDiff(undefined!, {}), "attempt to create diff of non-table objects");
    Assert.throws(() => createDiff({}, undefined!), "attempt to create diff of non-table objects");
  }

  @Fact
  public "empty"(): void {
    const diff = createDiff({}, {});
    Assert.undefined(diff.removed);
    Assert.undefined(diff.changed);

    const a = 1 as never;
    const diff2 = createDiff(a, a);
    Assert.undefined(diff2.removed);
    Assert.undefined(diff2.changed);
  }

  @Fact
  public "shallow array starting from undefined"(): void {
    const a: number[] = [];
    const b = [1];
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.defined(diff.changed[0]);
    Assert.equal(1, diff.changed[0]);
  }

  @Fact
  public "shallow array changes"(): void {
    const a = [69];
    const b = [420];
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.defined(diff.changed[0]);
    Assert.equal(420, diff.changed[0]);
  }

  @Fact
  public "shallow array removals"(): void {
    const a = [69];
    const b: number[] = [];
    const diff = createDiff(a, b);
    Assert.undefined(diff.changed);
    Assert.defined(diff.removed);
    Assert.defined(diff.removed[0]);
    Assert.true(diff.removed[0]);
  }

  @Fact
  public "deep array starting from undefined"(): void {
    type T = [number, [[number, number[]]]];
    const a: T = [69, [[1000, []]]];
    const b: T = [69, [[1000, [1337]]]];
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.undefined(diff.changed[0]);

    const shallowArrayChange = diff.changed[1] as Diff<T[1]>["changed"];
    Assert.defined(shallowArrayChange);

    const nestedArrayChange1 = shallowArrayChange[0] as Diff<T[1][0]>["changed"];
    Assert.defined(nestedArrayChange1);
    Assert.undefined(nestedArrayChange1[0]);

    const nestedArrayChange2 = nestedArrayChange1[1] as Diff<T[1][0][1]>["changed"];
    Assert.defined(nestedArrayChange2);
    Assert.defined(nestedArrayChange2[0]);
    Assert.equal(1337, nestedArrayChange2[0]);
  }

  @Fact
  public "deep array changes"(): void {
    type T = [number, [[number, number[]]]];
    const a: T = [69, [[1000, [420]]]];
    const b: T = [69, [[1000, [1337]]]];
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.undefined(diff.changed[0]);

    const shallowArrayChange = diff.changed[1] as Diff<T[1]>["changed"];
    Assert.defined(shallowArrayChange);

    const nestedArrayChange1 = shallowArrayChange[0] as Diff<T[1][0]>["changed"];
    Assert.defined(nestedArrayChange1);
    Assert.undefined(nestedArrayChange1[0]);

    const nestedArrayChange2 = nestedArrayChange1[1] as Diff<T[1][0][1]>["changed"];
    Assert.defined(nestedArrayChange2);
    Assert.defined(nestedArrayChange2[0]);
    Assert.equal(1337, nestedArrayChange2[0]);
  }

  @Fact
  public "deep array removals"(): void {
    type T = [number, [[number, number[]]]];
    const a: T = [69, [[1000, [420]]]];
    const b: T = [69, [[1000, []]]];
    const diff = createDiff(a, b);
    Assert.undefined(diff.changed);
    Assert.defined(diff.removed);
    Assert.undefined(diff.removed[0]);
    Assert.defined(diff.removed[1]);

    const shallowArrayChange = diff.removed[1] as Diff<T[1]>["removed"];
    Assert.notEqual(true, shallowArrayChange);
    Assert.defined(shallowArrayChange);

    const nestedArrayChange1 = shallowArrayChange[0] as Diff<T[1][0]>["removed"];
    Assert.notEqual(true, nestedArrayChange1);
    Assert.defined(nestedArrayChange1);
    Assert.undefined(nestedArrayChange1[0]);

    const nestedArrayChange2 = nestedArrayChange1[1] as Diff<T[1][0][1]>["removed"];
    Assert.notEqual(true, nestedArrayChange1);
    Assert.defined(nestedArrayChange2);
    Assert.defined(nestedArrayChange2[0]);
    Assert.true(nestedArrayChange2[0]);
  }

  @Fact
  public "shallow object starting from undefined"(): void {
    const a: Partial<typeof b> = {};
    const b = { foo: 69 };
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.defined(diff.changed.foo);
    Assert.equal(69, diff.changed.foo);
  }

  @Fact
  public "shallow object changes"(): void {
    const a = { foo: 123 };
    const b = { foo: 69 };
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.defined(diff.changed.foo);
    Assert.equal(69, diff.changed.foo);
  }

  @Fact
  public "shallow object removals"(): void {
    const a = { foo: 123 };
    const b = {};
    const diff = createDiff(a, b as typeof a);
    Assert.undefined(diff.changed);
    Assert.defined(diff.removed);
    Assert.defined(diff.removed.foo);
    Assert.true(diff.removed.foo);
  }

  @Fact
  public "deep object starting from undefined"(): void {
    const a: { foo: number, bar: { baz: { n?: number; }; }; } = { foo: 123, bar: { baz: {} } };
    const b = { foo: 123, bar: { baz: { n: 42 } } };
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.undefined(diff.changed.foo);
    Assert.defined(diff.changed.bar);
    Assert.defined(diff.changed.bar.baz);
    Assert.defined(diff.changed.bar.baz);
    Assert.defined(diff.changed.bar.baz.n);
    Assert.equal(42, diff.changed.bar.baz.n);
  }

  @Fact
  public "object removal & change"(): void {
    type T = { foo?: number, bar: { baz: { n: number, sigma?: string; }; }; };
    const a: T = { foo: 123, bar: { baz: { n: 69, sigma: "yas" } } };
    const b: T = { bar: { baz: { n: 42 } } };
    const diff = createDiff(a, b);
    Assert.defined(diff.removed);
    Assert.defined(diff.changed);
    Assert.defined(diff.removed.bar);
    Assert.true(diff.removed.foo);
    Assert.notEqual(true, diff.removed.bar);

    const bar = diff.removed.bar as NonNullable<Diff<typeof a.bar>["removed"]>;
    Assert.defined(bar.baz);
    Assert.notEqual(true, bar.baz);

    const baz = bar.baz as NonNullable<Diff<typeof a.bar.baz>["removed"]>;
    Assert.defined(baz.sigma);
    Assert.true(baz.sigma);
    Assert.undefined(diff.changed.foo);
    Assert.defined(diff.changed.bar);
    Assert.defined(diff.changed.bar.baz);
    Assert.defined(diff.changed.bar.baz);
    Assert.defined(diff.changed.bar.baz.n);
    Assert.equal(42, diff.changed.bar.baz.n);
  }

  @Fact
  public "deep object changes"(): void {
    const a = { foo: 123, bar: { baz: { n: 69 } } };
    const b = { foo: 123, bar: { baz: { n: 42 } } };
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.undefined(diff.changed.foo);
    Assert.defined(diff.changed.bar);
    Assert.defined(diff.changed.bar.baz);
    Assert.defined(diff.changed.bar.baz);
    Assert.defined(diff.changed.bar.baz.n);
    Assert.equal(42, diff.changed.bar.baz.n);
  }

  @Fact
  public "deep object removals"(): void {
    const a = { foo: 123, bar: { baz: { n: 69 } } };
    const b = { foo: 123, bar: { baz: {} } };
    const diff = createDiff(a, b as typeof a);
    Assert.undefined(diff.changed);
    Assert.defined(diff.removed);
    Assert.undefined(diff.removed.foo);
    Assert.defined(diff.removed.bar);
    Assert.notEqual(true, diff.removed.bar);

    const bar = diff.removed.bar as NonNullable<Diff<typeof a.bar>["removed"]>;
    Assert.defined(bar.baz);
    Assert.notEqual(true, bar.baz);

    const baz = bar.baz as NonNullable<Diff<typeof a.bar.baz>["removed"]>;
    Assert.defined(baz.n);
    Assert.true(baz.n);
  }

  @Fact
  public "same object field different other field"(): void {
    const a = { foo: 123, bar: { baz: { n: 69 } } };
    const b = { foo: 69, bar: { baz: { n: 69 } } };
    const diff = createDiff(a, b);
    Assert.defined(diff.changed);
    Assert.undefined(diff.removed);
    Assert.undefined(diff.changed.bar);
    Assert.equal(69, diff.changed.foo);
  }
}

export = CreateDiffTest;