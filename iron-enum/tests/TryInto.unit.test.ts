import { TryInto } from "../mod";

describe("TryInto helper", () => {
  it("sync wrapper captures exceptions", () => {
    const safeParseInt = TryInto.sync((s: string) => {
      const n = parseInt(s, 10);
      if (isNaN(n)) throw new Error("NaN");
      return n;
    });

    expect(safeParseInt("42").unwrap()).toBe(42);
    const res = safeParseInt("x");
    expect(res.isErr()).toBe(true);
  });

  it("async wrapper captures rejections", async () => {
    const safeFetch = TryInto.async(async (ok: boolean) => {
      if (!ok) throw new Error("fail");
      return "data";
    });

    expect((await safeFetch(true)).unwrap()).toBe("data");
    const bad = await safeFetch(false);
    expect(bad.isErr()).toBe(true);
  });
});
