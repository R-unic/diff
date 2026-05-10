import { Assert, Fact } from "@rbxts/runit";
import { applyDiff, type Diff } from "@rbxts/diff";

class ApplyDiffTest {
  @Fact
  public "non-table objects error"(): void {
    Assert.throws(() => applyDiff(1 as never, {}), "attempt to apply diff to non-table object");
  }

  @Fact
  public "empty"(): void {
    const base = { foo: 123 };
    const diff = {};
    const patched = applyDiff(base, diff);
    Assert.equal(123, patched.foo);
  }

  @Fact
  public "shallow array starting from undefined"(): void {
    const base: number[] = [];
    const diff = { changed: [69] };
    const patched = applyDiff(base, diff);
    Assert.equal(69, patched[0]);
  }

  @Fact
  public "shallow array changes"(): void {
    const base = [123];
    const diff = { changed: [69] };
    const patched = applyDiff(base, diff);
    Assert.equal(69, patched[0]);
  }

  @Fact
  public "shallow array removals"(): void {
    const base = [123];
    const diff: Diff<typeof base> = { removed: [true] };
    const patched = applyDiff(base, diff);
    Assert.undefined(patched[0]);
  }

  @Fact
  public "deep array starting from undefined"(): void {
    type T = [number, [[number, number[]]]];
    const base: T = [69, [[1000, []]]]
    const diff: Diff<T> = { changed: [undefined, [[undefined, [69]]]] };
    const patched = applyDiff(base, diff);
    Assert.equal(69, patched[0]);
    Assert.equal(1000, patched[1][0][0]);
    Assert.equal(69, patched[1][0][1][0]);
  }

  @Fact
  public "deep array changes"(): void {
    type T = [number, [[number, number[]]]];
    const base: T = [69, [[1000, [420]]]]
    const diff: Diff<T> = { changed: [undefined, [[undefined, [69]]]] };
    const patched = applyDiff(base, diff);
    Assert.equal(69, patched[0]);
    Assert.equal(1000, patched[1][0][0]);
    Assert.equal(69, patched[1][0][1][0]);
  }

  @Fact
  public "deep array removals"(): void {
    type T = [number, [[number, number[]]]];
    const base: T = [69, [[1000, [420]]]]
    const diff: Diff<T> = { removed: [undefined, [[undefined, [true]]]] };
    const patched = applyDiff(base, diff);
    Assert.equal(69, patched[0]);
    Assert.equal(1000, patched[1][0][0]);
    Assert.empty(patched[1][0][1]);
  }

  @Fact
  public "shallow object starting from undefined"(): void {
    const base: { foo?: number } = {};
    const diff = { changed: { foo: 69 } };
    const patched = applyDiff(base, diff);
    Assert.equal(69, patched.foo);
  }

  @Fact
  public "shallow object changes"(): void {
    const base = { foo: 123 };
    const diff = { changed: { foo: 69 } };
    const patched = applyDiff(base, diff);
    Assert.equal(69, patched.foo);
  }

  @Fact
  public "shallow object removals"(): void {
    const base = { foo: 123 };
    const diff = { removed: { foo: true } } as const;
    const patched = applyDiff(base, diff);
    Assert.undefined(patched.foo);
  }

  @Fact
  public "deep object starting from undefined"(): void {
    const base: { foo: number, bar: { baz: { n?: number } } } = { foo: 123, bar: { baz: {} } };
    const diff: Diff<typeof base> = { changed: { bar: { baz: { n: 69 } } } };
    const patched = applyDiff(base, diff);
    Assert.equal(123, patched.foo);
    Assert.equal(69, patched.bar.baz.n);
  }

  @Fact
  public "deep object changes"(): void {
    const base = { foo: 123, bar: { baz: { n: 420 } } };
    const diff: Diff<typeof base> = { changed: { bar: { baz: { n: 69 } } } };
    const patched = applyDiff(base, diff);
    Assert.equal(123, patched.foo);
    Assert.equal(69, patched.bar.baz.n);
  }

  @Fact
  public "deep object removals"(): void {
    const base = { foo: 123, bar: { baz: { n: 420 } } };
    const diff: Diff<typeof base> = { removed: { bar: { baz: { n: true } } } };
    const patched = applyDiff(base, diff);
    Assert.equal(123, patched.foo);
    Assert.undefined(patched.bar.baz.n);
  }
}

export = ApplyDiffTest;