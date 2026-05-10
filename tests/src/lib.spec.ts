import { Assert, Fact } from "@rbxts/runit";
import { hello } from "@rbxts/my-package";

class MyPackageTest {
  @Fact
  public hello(): void {
    Assert.equal("Hello, Runic!", hello("Runic"));
  }
}

export = MyPackageTest;