import { Option, Some, None } from "../mod";

describe("Option helper", () => {
  const O = Option<number>();

  it("Some unwraps; isSome/isNone flags", () => {
    const val = O.Some(42);
    expect(val.isSome()).toBe(true);
    expect(val.isNone()).toBe(false);
    expect(val.unwrap()).toBe(42);
  });

  it("None unwrap throws, unwrap_or works", () => {
    const val = O.None();
    expect(val.isSome()).toBe(false);
    expect(val.isNone()).toBe(true);
    expect(() => val.unwrap()).toThrow(/Option.None/);
    expect(val.unwrap_or(99)).toBe(99);
  });

  it("ok_or / ok_or_else convert to Result", () => {
    const err = new Error("bad");

    const okRes = O.Some(1).ok_or(err);
    expect(okRes.isOk()).toBe(true);
    expect(okRes.unwrap()).toBe(1);

    const errRes = O.None().ok_or_else(() => err);
    expect(errRes.isErr()).toBe(true);
    expect(() => errRes.unwrap()).toThrow(/bad/);
  });

  it("top-level Some / None convenience fns", () => {
    expect(Some("x").unwrap()).toBe("x");
    expect(() => None().unwrap()).toThrow();
  });
});
