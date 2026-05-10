import { Assert, Fact } from "@rbxts/runit";
import { createDiff, applyDiff, Diff } from "@rbxts/diff";

class DiffTest {
  @Fact
  public "diffing non-table objects errors"(): void {
    Assert.throws(() => createDiff(1 as never, 2 as never), "attempt to create diff of non-table objects");
  }

  @Fact
  public "applying diffs to non-table objects errors"(): void {
    Assert.throws(() => applyDiff(1 as never, {}), "attempt to apply diff to non-table object");
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
  public "deep object changes"(): void {
    const a = { foo: 123, bar: { baz: { n: 69 } } };
    const b = { foo: 123, bar: { baz: { n: 42 } } };
    const diff = createDiff(a, b);
    Assert.undefined(diff.removed);
    Assert.defined(diff.changed);
    Assert.undefined(diff.changed.foo);
    Assert.defined(diff.changed.bar)
    Assert.defined(diff.changed.bar.baz)
    Assert.defined(diff.changed.bar.baz)
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
}

export = DiffTest;